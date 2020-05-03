(ns celebrity.commands
  (:require [taoensso.timbre :as log]
            [clojure.core.async :as a]))

(def initial-screen "pick-team")

(defn player-by
  [key players needle]
  (first (filter #(= (get % key) needle) players)))

(defn player-by-name
  [name players]
  (player-by :name players name))

(defn player-by-id
  [id players]
  (player-by :id players id))

(defn add-player
  [players {:keys [id] :as player}]
  (if (player-by-id id players)
    players
    (conj players player)))

(defn has-control
  [client-id {:keys [players]}]
  (= client-id (:id (first players))))

(defn broadcast-state
  [{:keys [clients player-seq players round-words screens teams config] :as state}]
  (a/go
    (doseq [[client-id {:keys [name output]}] clients]
      (if (nil? output)
        (log/error "Nil output for client " client-id ", name:" name)
        (a/>! output {:client-id       client-id
                      :players         players
                      :event           "broadcast"
                      :teams           teams
                      :current-player  (first player-seq)
                      :next-player     (fnext player-seq)
                      :screen          (get screens client-id)
                      :has-control     (has-control client-id state)
                      :remaining-words (count round-words)
                      :word-counts     (:word-counts state)
                      :words           (get-in state [:words client-id])
                      :config          config}))))
  state)

(defn add-player-to-team
  [{:keys [players] :as team}  id name]
  (assoc team :players (add-player players {:id id :name name})))

(defn remove-player-from-team
  [{:keys [players] :as team} id]
  (assoc team :players
          (remove #(= id (:id %)) players)))

(defn move-player-to-team
  [team id name team-name]
  (if (= (:name team) team-name)
    (add-player-to-team team id name)
    (remove-player-from-team team id)))

(defn get-output
  [state client-id]
  (get-in state [:clients client-id :output]))

(defn get-name
  [state client-id]
  (get-in state [:clients client-id :name]))

(defn randomize-words
  "Given a map of client id -> word lists, flatten and return a sequence."
  [words]
  (shuffle (flatten (vals words))))

(defn randomize-players
  [{:keys [name players]}]
  (shuffle (map #(assoc % :team name) players)))

(defn make-player-seq
  "Given the set of teams (name and players), generate a lazy seq that
  will cycle through the teams.

  It will return the players in the same order after it cycles through them."
  [teams]
  (->> (map randomize-players teams)
       (filter not-empty)
       (map cycle)
       (apply interleave)))

(defn start-game
  [{:keys [screens teams words] :as state}]
  (let [player-seq   (make-player-seq teams)
        round-words  (randomize-words words)]
    (-> state
        (assoc :started true)
        (assoc :round 1)
        (assoc :player-seq player-seq)
        (assoc :round-words round-words)
        (assoc :screens (zipmap (keys screens) (repeat "round"))))))

(defn handle-start-game
  [client-id _ state]
  (if (has-control client-id state)
    (broadcast-state (start-game state))
    (do (a/>!!
         (get-output state client-id)
         {:error "You are not allowed to start the game"
          :event "command-error"})
        state)))

(defn handle-join-team
  [client-id msg {:keys [teams] :as state}]
  (let [client-name (get-name state client-id)
        team-name   (get-in msg [:team :name])
        new-teams   (map #(move-player-to-team % client-id client-name team-name) teams)]
    (broadcast-state
     (-> state
         (assoc-in [:screens client-id] "select-words")
         (assoc :teams new-teams)))))

(defn handle-set-words
  [client-id {:keys [words]} state]
  (broadcast-state
   (-> state
       (assoc-in [:words client-id] words)
       (assoc-in [:word-counts client-id] (count words)))))

(defn handle-ping
  [client-id _ state]
  (a/>!!
   (get-output state client-id)
   {:event     "pong"
    :pong      true
    :client-id client-id})
  state)

(def command-handlers
  {"join-team"  handle-join-team
   "set-words"  handle-set-words
   "start-game" handle-start-game
   "ping"       handle-ping})

(defn handle-client-message
  [{:keys [id command] :as msg} state]
  (let [name (get-name state id)]
    (log/info "Responding to command" command "for client" id ": " name " for message " msg)
    (if-let [handler (get command-handlers command)]
      (handler id msg state)
      (let [output (get-output state id)]
          (log/error "Unknown command " command )
          (a/>!! output {:error (str "Unknown command: " command)
                         :event "command-error"})
          state))))

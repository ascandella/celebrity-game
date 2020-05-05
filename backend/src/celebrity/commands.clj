(ns celebrity.commands
  (:require [taoensso.timbre :as log]
            [clojure.core.async :as a])
  (:import (java.time Duration Instant)))

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
  [{:keys [clients player-seq players round-words screens teams scores turn-ends config] :as state}]
  (a/go
    (doseq [[client-id {:keys [name output]}] clients]
      (if (nil? output)
        (log/error "Nil output for client " client-id ", name:" name)
        (let [is-active-player (= client-id (:id (first player-seq)))]
          (a/>! output {:client-id       client-id
                        :can-guess       false ; TODO, this should tell the player whether their team is up
                        :current-player  (first player-seq)
                        :current-word    (when (and turn-ends is-active-player) (first round-words))
                        :event           "broadcast"
                        :has-control     (has-control client-id state)
                        :next-player     (fnext player-seq)
                        :players         players
                        :remaining-words (- (count round-words) 1)
                        :scores          scores
                        :screen          (get screens client-id)
                        :teams           teams
                        :turn-ends       (when turn-ends (.toEpochMilli turn-ends))
                        :word-counts     (:word-counts state)
                        :words           (get-in state [:words client-id])
                        :your-turn       is-active-player
                        :config          config})))))
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
        (assoc :scores (zipmap (map :name teams) (repeat 0)))
        (assoc :round-words round-words)
        (assoc :screens (zipmap (keys screens) (repeat "round"))))))

(defn message-client
  [client-id state message]
  (when-let [output (get-output state client-id)]
    (a/>!! output message))
  state)

(defn handle-start-game
  [client-id _ state]
  (if (has-control client-id state)
    (broadcast-state (start-game state))
    (message-client client-id state {:error "You are not allowed to start the game"
                                     :event "command-error"})))

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

(defn handle-start-turn
  "Starts the turn."
  [_ _ {:keys [turn-time events-ch] :as state}]
  (a/go
    (a/<! (a/timeout turn-time))
    (a/>! events-ch :turn-end))
  (broadcast-state
   (assoc state :turn-ends (.plus (Instant/now) (Duration/ofMillis turn-time)))))

(defn ensure-active-player
  "Wrap a handler and ensure the sender is the active player."
  [thunk]
  (fn [client-id msg {:keys [player-seq] :as state}]
    (if (= client-id (:id (first player-seq)))
      (thunk client-id msg state)
      (message-client client-id state {:error "You are not the active player"
                                       :event "command-error"}))))

(defn handle-ping
  [client-id _ state]
  (message-client client-id state {:event     "pong"
                                   :pong      true
                                   :client-id client-id}))

(defn next-word-or-round
  "Advance to the next round if no words are left"
  [{:keys [round-words] :as state}]
  (log/infof "Next word or round: %s" (:scores state))
  (if-let [words (next round-words)]
    (assoc state :round-words words)
    (do
      (log/info "Out of words, moving to next round")
      ;;TODO
      state)))

(defn handle-skip-word
  [_ _ state]
  ;; TODO have a max number of skips per turn
  (broadcast-state (next-word-or-round state)))

(defn handle-count-guess
  [_ _ state]
  ;; TODO send a message to the chat
  (broadcast-state
   (next-word-or-round
    (update-in state [:scores (:team (first (:player-seq state)))] inc))))

(def command-handlers
  {"join-team"   handle-join-team
   "set-words"   handle-set-words
   "start-game"  handle-start-game
   "start-turn"  (ensure-active-player handle-start-turn)
   "skip-word"   (ensure-active-player handle-skip-word)
   "count-guess" (ensure-active-player handle-count-guess)
   "ping"        handle-ping})

(defn handle-client-message
  [{:keys [id command] :as msg} state]
  (let [name (get-name state id)]
    (log/info "Responding to command" command "for client" id ": " name " for message " msg)
    (if-let [handler (get command-handlers command)]
      (handler id msg state)
      (do
        (log/error "Unknown command " command )
        (message-client id state {:error (str "Unknown command: " command)
                                  :event "command-error"})))))

(defn handle-turn-end
  [{:keys [words] :as state}]
  (log/info "Turn finished")
  ;; TODO send a message to chat saying how many the player scored
  (broadcast-state
   (-> state
       (assoc :round-words (randomize-words words))
       (dissoc :turn-ends)
       (update :player-seq next)
       (update :round inc))))

(def events-map
  {:turn-end handle-turn-end})

(defn handle-event
  [event state]
  (log/infof "Handle event: %s" event)
  (if-let [handler (get events-map event)]
    (handler state)
    (do
      (log/errorf "No event handler for %s" event)
      state)))

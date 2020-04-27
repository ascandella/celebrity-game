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

(defn broadcast-state
  [{:keys [clients room-code players screens teams] :as state}]
  (a/go
    (doseq [[client-id {:keys [name output]}] clients]
      (a/>! output {:client-id client-id
                    :players   players
                    :event     "broadcast"
                    :name      name
                    :teams     teams
                    :screen    (get screens client-id)
                    :room-code room-code})))
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

(defn handle-team-join
  [client-id msg {:keys [teams] :as state}]
  (let [client-name (get-name state client-id)
        team-name   (get-in msg [:team :name])
        new-teams   (map #(move-player-to-team % client-id client-name team-name) teams)]
    (broadcast-state
     (-> state
         (assoc-in [:screens client-id] "select-words")
         (assoc :teams new-teams)))))

(defn handle-ping
  [client-id msg state]
  (a/>!!
   (get-output state client-id)
   {:event     "pong"
    :pong      true
    :client-id client-id}))

(def command-handlers
  {"join-team" handle-team-join
   "ping"      handle-ping})

(defn handle-client-message
  [{:keys [id command] :as msg} state]
  (let [name (get-name state id)]
    (log/info "Responding to command" command "for client" id ": " name " for message " msg)
    (if-let [handler (get command-handlers command)]
      (handler id msg state)
      (let [output (get-output state id)]
          (log/error "Unknown command " command )
          (a/>!! output {:error (str "Unknown command: " command)
                         :event "command-error"})))))

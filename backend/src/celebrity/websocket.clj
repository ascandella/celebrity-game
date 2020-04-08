(ns celebrity.websocket
  (:require [clojure.tools.logging :as log]
            [manifold.stream :as s]
            [manifold.deferred :as d]
            [celebrity.game :as game]
            [celebrity.protocol :as proto]))


(defn handle-ping
  [stream message]
  (log/info (str "Handle ping: " message))
  (proto/respond-json stream {:pong true}))

(defn handle-join
  [stream message]
  (log/info (str "Handling join: " message))
  (if-let [join-data (:join message)]
    (let [response (game/join stream join-data)]
      ;; TODO refactor this
      (if-let [error (:error response)]
        (proto/respond-error stream error)
        (proto/respond-json stream response)))
    (proto/respond-error stream "Invalid join request")))

(defn handle-create
  [stream message]
  (log/info (str "Handle create: " message))
  ;; TODO pass game params
  (if-let [code (game/create-game stream)]
    (proto/respond-json stream {:roomCode code})
    (proto/respond-error stream "Unable to create game")))

(def command-map
  {"join" handle-join
   "ping" handle-ping
   "create" handle-create})

(defn handle-first-message
  "When a client connects, route them to the right place"
  [stream message]
  (log/info (str "Handle JSON: " message))
  (if-let [command (:command message)]
    (if-let [handler (get command-map command)]
      (handler stream message)
      (proto/respond-error stream (str "Invalid command " command)))
    (proto/respond-error stream "No command sent"))
  nil)

(defn handle-connect
  "Handle a new websocket stream connection."
  [stream]
  (d/let-flow
   [raw-message (s/take! stream)]
   (s/on-closed stream #(log/info "Stream closed"))
   (if-let [message (proto/parse-json raw-message)]
     (handle-first-message stream message)
     (do
       (proto/respond-error stream "Invalid message")
       (log/warn (str "Dropping message: " raw-message))))))

(ns celebrity.websocket
  (:require [taoensso.timbre :as log]
            [manifold.stream :as s]
            [manifold.deferred :as d]
            [celebrity.game :as game]
            [celebrity.protocol :as proto]))

(defn handle-join
  [stream message]
  (log/info (str "Handling join: " message))
  (if-let [join-data (:join message)]
    (let [response (game/join stream join-data)]
      (proto/respond-json stream response))
    (proto/respond-error stream "Invalid join request")))

(defn handle-create
  [stream message]
  (log/info (str "Handle create: " message))
  (if-let [params (:create message)]
    (if-let [response (game/create-game params stream)]
      (proto/respond-json stream response)
      (proto/respond-error stream "Unable to create game"))
    (proto/respond-error "Invalid creation request")))

(def command-map
  {"join" handle-join
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
   (s/on-closed stream #(log/debug "Stream closed"))
   (if-let [message (proto/parse-json raw-message)]
     (handle-first-message stream message)
     (do
       (proto/respond-error stream "Invalid message")
       (log/warn (str "Dropping message: " raw-message))))))

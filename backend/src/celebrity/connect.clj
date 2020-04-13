(ns celebrity.connect
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
      (when-not (identical? :pending response)
        (proto/respond-message stream response)))
    (proto/respond-error stream "Invalid request")))

(defn handle-create
  [stream message]
  (log/info (str "Handle create: " message))
  (if-let [params (:create message)]
    (if-let [response (game/create-game params stream)]
      (when-not (identical? :pending response)
        ;; the creation had some sort of immediate error
        (proto/respond-message stream response))
      (proto/respond-error stream "Unable to create game"))
    (proto/respond-error stream "Invalid request")))

(def command-map
  {"join"   handle-join
   "create" handle-create})

(defn handle-first-message
  "When a client connects, route them to the right place"
  [stream message]
  (log/info (str "Handle first websocket message: " message))
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
   (if-let [message (proto/parse-message raw-message)]
     (handle-first-message stream message)
     (do
       (proto/respond-error stream "Invalid message")
       (log/warn (str "Dropping message: " raw-message))))))

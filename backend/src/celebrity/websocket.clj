(ns celebrity.websocket
  (:require [clojure.data.json :as json]
            [clojure.tools.logging :as log]
            [manifold.stream :as s]
            [manifold.deferred :as d]))

(defn parse-json
  [message]
  (try
    (json/read-str message
                   :key-fn keyword)
    (catch Exception e
        (log/warn (str "Unable to parse JSON: " (.getMessage e) ": " message)
          nil))))

(defn respond-json
  [stream data]
  (let [data-json (json/write-str data)]
    (s/put! stream data-json)))

(defn respond-error
  [stream error-message]
  (respond-json stream {:error error-message}))

(defn handle-join
  [stream message]
  (log/info (str "Handling join: " message))
  (if-let [join-data (:join message)]
    (if-let [room-code (:roomCode join-data)]
      ;; TODO check if valid room
      (respond-error stream "Room does not exist")
      (respond-error stream "Missing room code"))
    (respond-error stream "Invalid join request")))

(defn handle-ping
  [stream message]
  (log/info (str "Handle ping: " message))
  (respond-json stream {:pong true}))

(def command-map
  {"join" handle-join
   "ping" handle-ping})

(defn handle-first-message
  "When a client connects, route them to the right place"
  [stream message]
  (log/info (str "Handle JSON: " message))
  (if-let [command (:command message)]
    (if-let [handler (get command-map command)]
      (handler stream message)
      (respond-error stream (str "Invalid command " command)))
    (respond-error stream "No command sent")))

(defn handle-connect
  "Handle a new websocket stream connection."
  [stream]
  (d/let-flow
   [raw-message (s/take! stream)]
   (if-let [message (parse-json raw-message)]
     (do
       (handle-first-message stream message)
       ;; remember to send a nil response for compojure
        nil)
     (do
       (respond-error stream "Invalid message")
       (log/warn (str "Dropping message: " raw-message))
       nil))))

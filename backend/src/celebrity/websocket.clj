(ns celebrity.websocket
  (:require [clojure.data.json :as json]
            [clojure.tools.logging :as log]
            [clojure.string :as string]
            [manifold.stream :as s]
            [manifold.deferred :as d]
            [celebrity.game :as game]))

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
    (log/info (str "Responding: " data-json))
    (s/put! stream data-json)))

(defn respond-error
  [stream error-message]
  (respond-json stream {:error error-message})
  (s/close! stream))

(defn handle-ping
  [stream message]
  (log/info (str "Handle ping: " message))
  (respond-json stream {:pong true}))

(defn handle-join
  [stream message]
  (log/info (str "Handling join: " message))
  (if-let [join-data (:join message)]
    (if-let [room-code (:roomCode join-data)]
      (let [upper-code (string/upper-case room-code)]
        (if-let [response (game/join stream join-data upper-code)]
          (do
            @(respond-json stream response)
            (log/info "Starting loop")
            ;; TODO this is not right
            (s/consume (partial handle-ping stream) stream))
          (respond-error stream "Room does not exist")))
      (respond-error stream "Missing room code"))
    (respond-error stream "Invalid join request")))

(defn handle-create
  [stream message]
  (log/info (str "Handle create: " message))
  ;; TODO pass game params
  (if-let [code (game/create-game stream)]
    (respond-json stream {:roomCode code})
    (respond-error stream "Unable to create game")))

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
      (respond-error stream (str "Invalid command " command)))
    (respond-error stream "No command sent")))

(defn handle-connect
  "Handle a new websocket stream connection."
  [stream]
  (d/let-flow
   [raw-message (s/take! stream)]
   (s/on-closed stream #(log/info "Stream closed"))
   (if-let [message (parse-json raw-message)]
     (handle-first-message stream message)
     (do
       (respond-error stream "Invalid message")
       (log/warn (str "Dropping message: " raw-message))))))

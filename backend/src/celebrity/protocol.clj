(ns celebrity.protocol
  (:require [taoensso.timbre :as log]
            [clojure.data.json :as json]
            [camel-snake-kebab.core :as csk]
            [manifold.stream :as s]))

(defn parse-message
  ([message] (parse-message message nil))
  ([message default-val]
    (try
      (json/read-str message :key-fn csk/->kebab-case-keyword)
      (catch Exception e
        (log/warn (str "Unable to parse JSON: " (.getMessage e) ": " message))
                  default-val))))

(defn encode-message
  [msg]
  (json/write-str msg :key-fn csk/->camelCaseString))

(defn respond-json
  [stream data]
  (let [data-json (encode-message data)]
    (log/info "Responding: " data-json)
    (s/put! stream data-json)))

(defn close-stream
  [stream]
  (log/debug "Closing stream due to error" stream)
  (s/close! stream))

(defn respond-message
  [stream data]
  (respond-json stream data)
  (when (:error data)
    (close-stream stream)))

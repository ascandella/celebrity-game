(ns celebrity.protocol
  (:require [taoensso.timbre :as log]
            [clojure.data.json :as json]
            [camel-snake-kebab.core :as csk]
            [manifold.stream :as s]))

(defn parse-json
  ([message] (parse-json message nil))
  ([message default-val]
    (try
      (json/read-str message :key-fn csk/->kebab-case-keyword)
      (catch Exception e
        (log/warn (str "Unable to parse JSON: " (.getMessage e) ": " message))
                  default-val))))

(defn respond-json
  [stream data]
  (let [data-json (json/write-str data :key-fn csk/->camelCaseString)]
    (log/info "Responding: " data-json)
    (s/put! stream data-json)))

(defn respond-error
  [stream error-message]
  (respond-json stream {:error error-message})
  (log/debug "Closing stream due to error" stream)
  (s/close! stream))

(defn respond-message
  [stream data]
  (if-let [error (:error data)]
    (respond-error stream error)
    (respond-json stream data)))

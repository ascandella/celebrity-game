(ns celebrity.protocol
  (:require [taoensso.timbre :as log]
            [clojure.data.json :as json]
            [manifold.stream :as s]))

(defn parse-json
  ([message] (parse-json message nil))
  ([message default-val]
    (try
      (json/read-str message
                     :key-fn keyword)
      (catch Exception e
        (log/warn (str "Unable to parse JSON: " (.getMessage e) ": " message))
                  default-val))))

(defn respond-json
  [stream data]
  (let [data-json (json/write-str data)]
    (log/info (str "Responding: " data-json))
    (s/put! stream data-json)))

(defn respond-error
  [stream error-message]
  (respond-json stream {:error error-message})
  (s/close! stream))

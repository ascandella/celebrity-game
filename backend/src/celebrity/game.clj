(ns celebrity.game
  (:require [clojure.tools.logging :as log]))

(def room-code-length 4)

(defn generate-room-code
  "Generates an alphabet-only code"
  ([] (generate-room-code room-code-length))
  ([len]
    (apply str (take len (repeatedly #(char (+ (rand 26) 65)))))))

(def games
  (atom
   {"TEST" {:clients (atom [])}}))

(defn join
  "Join player on websocket 'stream' with join-data to the room identified by room-code"
  ([stream join-data room-code] (join games stream join-data room-code))
  ([registry stream join-data room-code]
   (when-let [game (get @registry room-code)]
     (swap! (:clients game) conj stream)
     {:roomCode room-code
      :success  true
      name      (:name join-data)})))

(def max-retries 10)

(defn create-game
  "Creates a new game, returns a game code"
  ([stream] (create-game stream games))
  ([stream registry] (create-game stream registry generate-room-code))
  ([stream registry code-generator]
   (loop [count 0]
     (if (> count max-retries)
       ;; return nil if we can't get it in 10 tries to avoid an infinite loop
       ;; maybe there's a bug
       (log/error "Giving up generating code")
       (let [clients (atom [stream])
             code    (code-generator)
             games'  @registry]
         (if (contains? games' code)
           (recur (inc count))
           (if-not
               (compare-and-set!
                registry games'
                (assoc games' code {:clients clients}))
             (recur (inc count))
             ;; TODO launch a goroutine/deferred to handle clients connecting
             code)))))))

(ns celebrity.game
  (:require [clojure.tools.logging :as log]
            [manifold.deferred :as d]
            [manifold.bus :as b]
            [manifold.stream :as s]))

(def room-code-length 4)

(defn generate-room-code
  "Generates an alphabet-only code"
  ([] (generate-room-code room-code-length))
  ([len]
    (apply str (take len (repeatedly #(char (+ (rand 26) 65)))))))

(def games
  (atom
   {"TEST" {:joinable? true}}))

;; event bus per-room, where we can publish to te topic named by room code
;; and all clients will receive the exact message over websockets
(def roombus (b/event-bus))

(defn connect-client-to-game
  [broadcast topic client]
  ;; send all messages from the broadcast topic to the client
  (s/connect
   (b/subscribe broadcast topic)
   client
   {:timeout 10000})
  ;; read all messages from the client, route them appropriately
  (s/consume
   ;; TODO: for now this just publishes them to the broadcast
   ;; really, we're going to need to parse and handle them
   #(b/publish! broadcast topic %)
   (->> client
        (s/buffer 30)))
  topic)

(defn join
  "Join player on websocket 'stream' with join-data to the room identified by room-code"
  ([stream join-data room-code] (join stream join-data room-code games roombus))
  ([stream join-data room-code registry] (join stream join-data room-code registry roombus))
  ([stream join-data room-code registry broadcast-bus]
   (when-let [game (get @registry room-code)]
     (if (:joinable? game)
       (do
         (connect-client-to-game broadcast-bus room-code stream)
         {:roomCode room-code
          :success  true
          :name     (:name join-data)})
       {:error "Room is not joinable"}))))

(def max-create-retries 10)

(defn new-game-state []
  {:joinable? true})

(defn create-game
  "Creates a new game, returns a game code"
  ([stream]
   (create-game stream games))

  ([stream registry]
   (create-game stream registry roombus))

  ([stream registry broadcast-bus]
   (create-game stream registry broadcast-bus generate-room-code))

  ([stream registry broadcast-bus code-generator]
   (loop [count 0]
     (if (> count max-create-retries)
       ;; return nil if we can't get it in 10 tries to avoid an infinite loop
       ;; maybe there's a bug
       (log/error "Giving up generating code")
       (let [code   (code-generator)
             games' @registry]
         (if (contains? games' code)
           ;; we managed to generate a code that already exists, what are the chances??
           (recur (inc count))
           (if (compare-and-set!
                registry games'
                ;; TODO if i don't end up needing a map, convert this to a vector
                (assoc games' code (new-game-state)))
             ;; connect the client to the broadcast bus
             (connect-client-to-game broadcast-bus code stream)
             (recur (inc count)))))))))

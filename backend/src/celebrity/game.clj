(ns celebrity.game
  (:require [clojure.tools.logging :as log]
            [celebrity.protocol :as proto]
            ;;[manifold.deferred :as d]
            [manifold.bus :as b]
            [manifold.stream :as s]))

(def room-code-length 4)

(defn generate-room-code
  "Generates an alphabet-only code"
  ([] (generate-room-code room-code-length))
  ([len]
    (apply str (take len (repeatedly #(char (+ (rand 26) 65)))))))

(def games
  (atom {"TEST" {:joinable? true :player-count 0}}))

;; event bus per-room, where we can publish to te topic named by room code
;; and all clients will receive the exact message over websockets
(def roombus (b/event-bus))

(defn on-client-disconnect
  [registry code]
  (log/info (str "Client disconnected from game: " code))
  (let [updated-registry (swap! registry update-in [code :player-count] dec)
        player-count (get-in updated-registry [code :player-count])]
    (log/info (str "Player count for code: " code ", count: " player-count))
    (when (< player-count 1)
     (log/info (str "All clients disconnected from: " code ", deregistering game"))
     ;; TODO make sure we clean up anything else going on with the game
     (swap! registry dissoc code))
    updated-registry))

(defn connect-client-to-game
  [broadcast join-data client registry]
  (let [topic (:roomCode join-data)
        uuid (.toString (java.util.UUID/randomUUID))]
    (s/on-closed
     client
     #(on-client-disconnect registry topic))
    (swap! registry update-in [topic :player-count] inc)
    ;; send all messages from the broadcast topic to the client
    (s/connect
     (b/subscribe broadcast topic)
     client
     ;; TODO: is this an appropriate timeout?
     {:timeout 500})
    ;; read all messages from the client, route them appropriately
    (s/consume
     ;; TODO: for now this just publishes them to the broadcast
     ;; really, we're going to need to parse and handle them
     #(b/publish! broadcast topic %)
     (->> client
          (s/map #(proto/parse-json % {}))
          (s/map #(assoc % :id uuid))
          (s/buffer 30)))
    {:roomCode topic
     :success  true
     :clientID uuid
     :name     (:name join-data)}))

(defn join
  "Join player on websocket 'stream' with join-data to the room identified by room-code"
  ([stream join-data]
   (join stream join-data games roombus))

  ([stream join-data registry]
   (join stream join-data registry roombus))

  ([stream join-data registry broadcast-bus]
   (if-let [room-code (:roomCode join-data)]
     (if-let [game (get @registry room-code)]
       (if (:joinable? game)
         (connect-client-to-game broadcast-bus join-data stream registry)
         {:error "Room is full"})
       {:error "Room not found"})
    {:error "No room code provided"})))

(def max-create-retries 10)

(defn new-game-state []
  {:joinable?    true
   :player-count 0})

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
                (assoc games' code (new-game-state)))
             ;; connect the client to the broadcast bus
             (connect-client-to-game
              broadcast-bus
              {:roomCode code}
              stream registry)
             (recur (inc count)))))))))

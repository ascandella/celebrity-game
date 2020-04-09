(ns celebrity.game
  (:require [taoensso.timbre :as log]
            [celebrity.protocol :as proto]
            [manifold.deferred :as d]
            [manifold.bus :as b]
            [manifold.stream :as s]))

(def room-code-length 4)

(defn generate-room-code
  "Generates an alphabet-only code"
  ([] (generate-room-code room-code-length))
  ([len]
    (apply str (take len (repeatedly #(char (+ (rand 26) 65)))))))

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
     (when-let [server-conn (get-in updated-registry [code :bus])]
       (log/info (str "Closing server connection: " server-conn))
       (s/close! server-conn))
     (swap! registry dissoc code))
    updated-registry))

(defn connect-client-to-game
  [broadcast join-data client registry]
  (let [topic (:room-code join-data)
        uuid (.toString (java.util.UUID/randomUUID))
        registry' (swap! registry update-in [topic :player-count] inc)
        game-bus (get-in registry' [topic :bus])]
    (log/info (str "Connecting client to game: " topic ": " uuid ", " join-data))
    (s/on-closed
     client
     #(on-client-disconnect registry topic))
    ;; send all messages from the broadcast topic to the client
    (s/connect
     (b/subscribe broadcast topic)
     ;; we only want to send messages to the clients through this
     (s/sink-only client)
     ;; TODO: is this an appropriate timeout?
     {:timeout 500})
    ;; read all messages from the client, route them appropriately
    (s/consume
     #(s/put! game-bus %)
     (->> client
          (s/map #(proto/parse-json % {}))
          (s/map #(assoc % :id uuid :conn client))))
    {:room-code topic
     :success   true
     :client-id uuid
     :name      (:name join-data)}))

(defn new-game-state [params]
  {:joinable?    true
   :player-count 0
   :bus          (s/stream)
   :config       (:config params)})

(def games (atom {}))

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

(defn spawn-game-handler
  [code client-in broadcast]
  (log/with-context {:code code}
    (d/loop [state {}]
      (d/chain
       (s/take! client-in ::drained)
       (fn [msg]
         (log/debug (str "Received message from: " (:id msg) ", " (dissoc msg :conn)))
         (if (identical? ::drained msg)
           (log/info "Client disconnected")
           (do
             (when-let [{client-id :id
                         conn      :conn} msg]
               ;; TODO real handler, not just pong responses
               (proto/respond-json conn {:pong true :client-id client-id}))
             ;; TODO update state before recurring
             (d/recur state))))))))

(defn validate-params
  [params]
  ;; TODO
  nil)

(defn create-game
  "Creates a new game, returns a game code"
  ([params stream]
   (create-game params stream games))

  ([params stream registry]
   (create-game params stream registry roombus))

  ([params stream registry broadcast-bus]
   (create-game params stream registry broadcast-bus generate-room-code))

  ([params stream registry broadcast-bus code-generator]
   (if-let [error (validate-params params)]
     (do
       (log/info (str "Param validation failed on " params " : " error))
       error)
     (loop [count 0]
        (if (> count max-create-retries)
          ;; return nil if we can't get it in 10 tries to avoid an infinite loop
          ;; maybe there's a bug
          (log/error "Giving up generating code")
          (let [code   (code-generator)
                registry' @registry]
            (if (contains? registry' code)
              ;; we managed to generate a code that already exists, what are the chances??
              (recur (inc count))
              (if (compare-and-set!
                   registry registry'
                   (assoc registry' code (new-game-state params)))
                (do
                  (spawn-game-handler code (get-in @registry [code :bus]) broadcast-bus)
                  ;; connect the client to the broadcast bus
                  (connect-client-to-game
                   broadcast-bus
                   (assoc params :room-code code)
                   stream registry))
                (recur (inc count))))))))))

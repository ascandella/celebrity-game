(ns celebrity.game
  (:require [taoensso.timbre :as log]
            [celebrity.protocol :as proto]
            [clojure.core.async :as a]
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
  (log/info "Client disconnected from game: " code)
  (let [updated-registry (swap! registry update-in [code :player-count] dec)
        player-count (get-in updated-registry [code :player-count])]
    (log/info "Player count for code: " code ", count: " player-count)
    (when (< player-count 1)
     (log/info "All clients disconnected from: " code ", deregistering game")
     ;; TODO make sure we clean up anything else going on with the game
     (when-let [server-conn (get-in updated-registry [code :bus])]
       (log/info "Closing server connection: " server-conn)
       (a/close! server-conn))
     (swap! registry dissoc code))
    updated-registry))

(defn connect-client-to-game
  [broadcast join-data client registry]
  (let [topic (:room-code join-data)
        uuid (.toString (java.util.UUID/randomUUID))
        registry' (swap! registry update-in [topic :player-count] inc)
        game-bus (get-in registry' [topic :bus])]
    (log/info "Connecting client to game: " topic ": " uuid ", " join-data)
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
     ;; buffered channel, so we should be OK
     #(a/>!! game-bus %)
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
   :bus          (a/chan 10)
   :config       (:config params)})

(def games (atom {}))

(defn join
  "Join player on websocket 'stream' with join-data to the room identified by room-code"
  [stream join-data & [{:keys [registry broadcast]
                        :or   {registry  games
                               broadcast roombus}}]]
   (if-let [room-code (:room-code join-data)]
     (if-let [game (get @registry room-code)]
       (if (:joinable? game)
         (connect-client-to-game broadcast join-data stream registry)
         {:error "Room is full"})
       {:error "Room not found"})
    {:error "No room code provided"}))

(def max-create-retries 10)

(defn game-state-machine
  [code client-in broadcast]
  (a/go
    (loop [state {}]
      (let [msg (a/<! client-in)]
        (if (nil? msg)
          (log/info "Control channel closed, done processing " code)
          (do
            (log/debug "Received message from: " (:id msg) ", " (dissoc msg :conn))
            (when-let [{client-id :id
                        conn      :conn} msg]
              ;; TODO real handler, not just pong responses
              (proto/respond-json conn {:pong true :client-id client-id}))
            ;; TODO update state before recurring
            (recur state)))))))

(defn validate-params
  [params]
  ;; TODO
  nil)

(defn create-game
  "Creates a new game, returns a game code"
  [params stream & [{:keys [registry broadcast code-generator]
                     :or   {registry       games
                            broadcast      roombus
                            code-generator generate-room-code}}]]
   (if-let [error (validate-params params)]
     (do
       (log/info "Param validation failed on " params " : " error)
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
              ;; otherwise, try to add it to the registry
              (if (compare-and-set!
                   registry registry'
                   (assoc registry' code (new-game-state params)))
                ;; it was added, now create the game
                (do
                  (game-state-machine code (get-in @registry [code :bus]) broadcast)
                  ;; connect the client to the broadcast bus
                  (connect-client-to-game
                   broadcast
                   (assoc params :room-code code)
                   stream registry))
                (recur (inc count)))))))))

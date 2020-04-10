(ns celebrity.game
  (:require [taoensso.timbre :as log]
            [celebrity.protocol :as proto]
            [clojure.core.async :as a]
            [manifold.stream :as s]))

(def room-code-length 4)

(defn generate-room-code
  "Generates an alphabet-only code"
  ([] (generate-room-code room-code-length))
  ([len]
    (apply str (take len (repeatedly #(char (+ (rand 26) 65)))))))

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
  [join-data client registry]
  (let [topic (:room-code join-data)
        uuid (.toString (java.util.UUID/randomUUID))
        ;; TODO Move this side effect to the state machine loop
        registry' (swap! registry update-in [topic :player-count] inc)
        game-bus (get-in registry' [topic :bus])]
    (s/on-closed
     client
     ;; TODO let the server loop handle this
     #(on-client-disconnect registry topic))
    ;; send a message to the server handler that a new client has connected
    (log/info "Connecting client to game: " topic uuid join-data)
    (a/>!! game-bus {:id uuid :ch client :join join-data})
    ;; NOTE: we don't return a response, the game handler does
    :pending))

(defn new-game-state [params]
  {:joinable?    true
   :player-count 0
   :bus          (a/chan 10)
   :config       (:config params)})

(def games (atom {}))

(defn join
  "Join player on websocket 'stream' with join-data to the room identified by room-code"
  [stream join-data & [{:keys [registry]
                        :or   {registry games}}]]
  (if-let [room-code (:room-code join-data)]
    (if-let [game (get @registry room-code)]
      (if (:joinable? game)
        (connect-client-to-game join-data stream registry)
        {:error "Room is full"})
      {:error "Room not found"})
    {:error "No room code provided"}))

(def max-create-retries 10)

(defn create-client-channel
  "Connect the TCP stream to channels, encoding and decoding along the way"
  [conn]
  (let [in-ch (a/chan)
        out-ch (a/chan)]
    (s/connect
     (s/map proto/parse-message (s/source-only conn))
     in-ch)
    (s/connect
     (s/map proto/encode-message (s/->source out-ch))
     (s/sink-only conn))
    [in-ch out-ch]))

(defn game-state-machine
  [code client-in]
  (a/go
    (loop [inputs {} outputs {} state {}]
      (let [[msg channel] (a/alts! (conj (keys inputs) client-in))]
        (if (nil? msg)
          (log/info "All channels closed, done processing" code)
          (if (identical? channel client-in)
            (do
              (log/info "Received client connection: " msg)
              (let [client-id      (:id msg)
                    [input output] (create-client-channel (:ch msg))]
                ;; TODO validate whether the client can connect
                (a/>! output {:room-code code
                              :success true
                              :client-id client-id
                              :name (get-in msg [:join :name])})
                (recur
                 (assoc inputs input client-id)
                 (assoc outputs input output)
                 state)))
            (let [out-ch (get outputs channel)
                  client-id (get inputs channel)]
              (log/info "Received client message: " msg)
              (a/>! out-ch {:pong true :client-id client-id})
              (recur inputs outputs state))))))))

(defn validate-params
  [params]
  ;; TODO
  nil)

(defn create-game
  "Creates a new game, returns a game code"
  [params stream & [{:keys [registry code-generator]
                     :or   {registry       games
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
        (let [code      (code-generator)
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
                (game-state-machine code (get-in @registry [code :bus]))
                ;; connect the client to the server handler
                (connect-client-to-game
                 (assoc params :room-code code)
                 stream registry))
                (recur (inc count)))))))))

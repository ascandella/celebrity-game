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

(defn connect-client-to-game
  [join-data client game-bus]
  (let [uuid (or (:client-id join-data) (.toString (java.util.UUID/randomUUID)))]
    ;; send a message to the server handler that a new client has connected
    (log/info "Connecting client to game: " join-data)
    (a/>!! game-bus {:id uuid :ch client :join join-data})
    ;; NOTE: we don't return a response, the game handler does
    :pending))

;; global mapping of code:string -> a/chan (connection channel)
(def games (atom {}))

(defn join
  "Join player on websocket 'stream' with join-data to the room identified by room-code"
  [stream join-data & [{:keys [registry]
                        :or   {registry games}}]]
  (if-let [room-code (:room-code join-data)]
    (if-let [game (get @registry room-code)]
      (connect-client-to-game join-data stream game)
      {:error "Room not found" :event "join-error"})
    {:error "No room code provided" :event "join-error"}))

(def max-create-retries 10)

(defn create-client-channel
  "Connect the TCP stream to channels, encoding and decoding JSON along the way"
  [conn client-id]
  (let [in-ch (a/chan)
        out-ch (a/chan)]
    (s/connect
     (->>
       (s/source-only conn)
         (s/map proto/parse-message)
         (s/map #(assoc % :id client-id)))
     in-ch)
    (s/connect
     (s/map proto/encode-message (s/->source out-ch))
     (s/sink-only conn))
    [in-ch out-ch]))

(defn player-by
  [key players needle]
  (first (filter #(= (get % key) needle) players)))

(defn player-by-name
  [name players]
  (player-by :name players name))

(defn player-by-id
  [id players]
  (player-by :id players id))

(defn add-player
  [state client-id name]
  (update state :players conj {:id client-id :name name}))

(defn try-rejoin
  [client-id name {players :players :as state}]
  ;; is there a player here with that name already
  (if-let [existing-player (player-by-name name players)]
    (if (= client-id (:id existing-player))
      (do
        (log/info "Reconnecting client by id: " client-id "name: " name)
        [state nil])
      (do
        (log/warn "Name " name " client ID " client-id "tried to connect but name already taken:" (:id existing-player))
        [state {:error (str "Name '" name "' already taken")
                :code  "name-taken"}]))
    (if (player-by-id client-id players)
      [state {:error "Client already exists with that ID"
              :code "id-conflict"}]
      [(add-player state client-id name) nil])))

(defn try-join
  "If the client with join message `msg` can join, return updated state a"
  [state {client-id    :id
          ch           :ch
          {code :room-code
           name :name} :join}]
  (let [[input output] (create-client-channel ch client-id)
        [state' join-error] (try-rejoin client-id name state)]
    (if join-error
      (do
        (a/>!! output (assoc join-error :event "join-error"))
        (a/close! input)
        (a/close! output)
        state)
      (do
        (a/>!! output {:room-code code
                       :event     "joined"
                       :success   true
                       :client-id client-id
                       :players   (:players state')
                       :name      name})

        (-> state'
              (assoc-in [:clients client-id] output)
              (update :inputs conj input))))))

(defn deregister-server
  [code registry]
  (log/info "All channels closed, done processing" code)
  (swap! registry dissoc code))

(defn disconnect-from-server
  [in-ch state]
  (log/info "Disconnecting client from server")
  (-> state
      (update-in [:inputs] disj in-ch)))

;; TODO increase this, maybe 5 minutes?
(def server-timeout-after 60000)

(defn game-state-machine
  [code client-in game-config registry]
  (a/go-loop [state {:inputs #{}
                     :players []
                     :config game-config}]
    ;; wait for messages from clients connecting, clients sending message, or a
    ;; timeout indicating nobody is here anymore
    (let [timeout-ch    (a/timeout server-timeout-after)
          [msg channel] (a/alts! (vec (conj (:inputs state) timeout-ch client-in)))
          is-client-in  (identical? channel client-in)]
      (if (nil? msg)
        ;; one of the channels was closed, see if it was a client that disconnected
        (let [new-state (disconnect-from-server channel state)]
          (if (empty? (:inputs new-state))
            (do
              (log/info "Last client disconnected from: " code)
              (deregister-server code registry)
              (a/close! client-in))
            (recur new-state)))
        ;; we received a message on one of the channels
        (if is-client-in
          (do
            (log/info "Received client connection: " (dissoc msg :ch))
            (recur (try-join state msg)))
          (let [client-id (:id msg)
                out-ch    (get-in state [:clients client-id])]
            (log/info "Responding pong to " client-id "for message " msg)
            (a/>! out-ch {:event "pong" :pong true :client-id client-id})
            (recur state)))))))

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
            (let [server-chan (a/chan 1)]
              (if (compare-and-set!
                   registry registry'
                   (assoc registry' code server-chan))
                ;; it was added, now create the game
                (do
                  (log/info "Game code created with code: " code "config: " params)
                  (game-state-machine code server-chan params registry)
                  ;; connect the client to the server handler
                  (connect-client-to-game (assoc params :room-code code) stream server-chan))
                (recur (inc count))))))))))

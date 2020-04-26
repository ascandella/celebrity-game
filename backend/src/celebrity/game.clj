(ns celebrity.game
  (:require [taoensso.timbre :as log]
            [celebrity.protocol :as proto]
            [clojure.core.async :as a]
            [clojure.string]
            [manifold.stream :as s]))

(def room-code-length 4)

(defn generate-room-code
  "Generates an alphabet-only code"
  ([] (generate-room-code room-code-length))
  ([len]
    (clojure.string/join (repeatedly len #(char (+ (rand 26) 65))))))

(defn generate-uuid []
  (str (java.util.UUID/randomUUID)))

(defn connect-client-to-game
  [join-data client game-bus]
  (let [uuid (or (:client-id join-data) (generate-uuid))]
    ;; send a message to the server handler that a new client has connected
    (log/info "Connecting client to game: " join-data)
    (a/>!! game-bus {:id uuid :ch client :join join-data})
    ;; NOTE: we don't return a response, the game handler does
    :pending))

;; global mapping of code:string -> a/chan (connection channel)
(defonce games (atom {}))

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
  [players {:keys [id] :as player}]
  (if (player-by-id id players)
    players
    (conj players player)))

(defn try-rejoin
  [client-id name players]
  ;; is there a player here with that name already
  (if-let [existing-player (player-by-name name players)]
    (if (= client-id (:id existing-player))
      (do
        (log/info "Reconnecting client by id: " client-id "name: " name)
        [client-id nil])
      (do
        (log/warn "Name " name " client ID " client-id "tried to connect but name already taken:" (:id existing-player))
        [client-id {:error (str "Name '" name "' already taken")
                    :code  "name-taken"}]))
    (if (player-by-id client-id players)
      [(generate-uuid) nil]
      [client-id nil])))

(defn try-join
  "If the client with join message `msg` can join, return updated state a"
  [{:keys [players] :as state} {client-id    :id
                                ch           :ch
                                {code :room-code
                                 name :name} :join}]
  (let [[client-id' join-error] (try-rejoin client-id name players)]
    (if join-error
      (proto/respond-message ch (assoc join-error :event "join-error"))
      (let [[input output] (create-client-channel ch client-id')
            players'       (add-player players {:id client-id' :name name})]
        (proto/respond-message ch {:room-code code
                                   :event     "joined"
                                   :success   true
                                   :client-id client-id'
                                   :players   players'
                                   :name      name})
        (-> state
            (assoc :players players')
            (assoc-in [:screens client-id'] "pick-team")
            (assoc-in [:clients client-id'] {:output output
                                             :name   name})
            (update :inputs conj input))))))

(defn deregister-server
  [code registry]
  (log/info "All channels closed, done processing" code)
  (swap! registry dissoc code))

(defn disconnect-from-server
  [in-ch state]
  (log/info "Disconnecting client from server")
  (update-in state [:inputs] disj in-ch))

(defn broadcast-state
  [{:keys [clients room-code players screens teams] :as state}]
  (a/go
    (doseq [[client-id {:keys [name output]}] clients]
      (a/>! output {:client-id client-id
                    :players   players
                    :event     "broadcast"
                    :name      name
                    :teams     teams
                    :screen    (get screens client-id)
                    :room-code room-code})))
  state)

;; TODO increase this, maybe 5 minutes?
(def server-timeout-after 60000)

(defn create-teams
  [team-names]
  (map (fn [name] {:name name :players []}) team-names))

(defn add-player-to-team
  [{:keys [players] :as team}  id name]
  (if (some #{id} (map #(:id %) players))
    team
    (update team :players conj {:id id :name name})))

(defn remove-player-from-team
  [{:keys [players] :as team} id]
  (assoc team :players
          (remove #(= id (:id %)) players)))

(defn move-player-to-team
  [team id name team-name]
  (if (= (:name team) team-name)
    (add-player-to-team team id name)
    (remove-player-from-team team id)))

(defn handle-team-join
  [client-id client-name team-name {:keys [teams] :as state}]
  (let [new-teams (map #(move-player-to-team % client-id client-name team-name) teams)]
    (broadcast-state
     (-> state
         (assoc-in [:screens client-id] "select-words")
         (assoc :teams new-teams)))))

(defn handle-client-message
  [{:keys [id command] :as msg} state]
  (let [{:keys [name output]} (get-in state [:clients id])]
    (log/info "Responding to command" command "for client" id ": " name " for message " msg)
    (if (= command "ping")
      (do
        (a/>!! output {:event     "pong"
                       :pong      true
                       :client-id id})
        state)
      (if (= command "join-team")
        (handle-team-join id name (get-in msg [:team :name]) state)
        (do
          (log/error "Unknown command " command )
          (a/>!! output {:error (str "Unknown command: " command)
                         :event "command-error"})
          state)))))

(defn game-state-machine
  [code client-in game-config deregister]
  (a/go-loop [state {:inputs    #{}
                     :players   []
                     :room-code code
                     :teams     (create-teams (:teams game-config))
                     :config    game-config}]
    ;; wait for messages from clients connecting, clients sending message, or a
    ;; timeout indicating nobody is here anymore
    (let [timeout-ch    (a/timeout server-timeout-after)
          [msg channel] (a/alts! (vec (conj (:inputs state) timeout-ch client-in)))]
      (if (identical? channel timeout-ch)
        (do
          (log/info "Cancelling event loop for " code " due to no activity in " (/ server-timeout-after 1000))
          (deregister)
          (a/close! client-in))
        (if (nil? msg)
          ;; one of the channels was closed, remove from :inputs if it's ac lient
          (recur (disconnect-from-server channel state))
          ;; we received a message on one of the channels
          (if (identical? channel client-in)
            (let [new-state (try-join state msg)]
              (log/info "Received client connection: " (dissoc msg :ch))
              ;; let clients know a new player has joined
              (broadcast-state new-state)
              (recur new-state))
            (recur (handle-client-message msg state))))))))

(defn validate-params
  [{:keys [teams] :as params}]
  (if (< (count teams) 2)
    {:error "Need at least two teams"}
    (when-not (= (count teams) (count (distinct teams)))
      {:error "Duplicate team names"})))

(defn create-game
  "Creates a new game, returns a game code"
  [params stream & [{:keys [registry code-generator]
                     :or   {registry       games
                            code-generator generate-room-code}}]]
  (if-let [error (validate-params params)]
    (do
      (log/info "Param validation failed on " params " : " error)
      (assoc error :event "create-error"))
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
                (let [deregister #(deregister-server code registry)]
                  (log/info "Game code created with code: " code "config: " params)
                  (game-state-machine code server-chan params deregister)
                  ;; connect the client to the server handler
                  (connect-client-to-game (assoc params :room-code code) stream server-chan))
                (recur (inc count))))))))))

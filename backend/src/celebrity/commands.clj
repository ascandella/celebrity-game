(ns celebrity.commands
  (:require [taoensso.timbre :as log]
            [clojure.core.async :as a]
            [celebrity.stemming :as stem])
  (:import (java.time Duration Instant)))

(def initial-screen "pick-team")

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

(defn has-control
  [client-id {:keys [players]}]
  (= client-id (:id (first players))))

(defn active-team
  [{:keys [player-seq]}]
  (:team (first player-seq)))

;; FIXME this smells like the data is laid out poorly
(defn player-on-active-team
  [player-id {:keys [teams] :as state}]
  (if-let [team (first (filter #(= (active-team state) (:name %)) teams))]
    (contains? (:player-ids team) player-id)
    false))

(defn client-channels
  "Return all the out channels for clients"
  [{:keys [clients]}]
  (map :output (vals clients)))

(defn broadcast-message
  [message state]
  (a/go
    (doseq [client-ch (client-channels state)]
      (a/>! client-ch {:event   "message"
                       :message message}))))

(defn broadcast-state
  [{:keys [clients player-seq players round-words screens teams scores turn-ends config] :as state}]
  (a/go
    (doseq [[client-id {:keys [name output]}] clients]
      (if (nil? output)
        (log/error "Nil output for client " client-id ", name:" name)
        (let [is-active-player (= client-id (:id (first player-seq)))
              current-player   (first player-seq)
              on-active-team   (player-on-active-team client-id state)
              can-guess        (and (not is-active-player) on-active-team)]
          (a/>! output {:client-id       client-id
                        :can-guess       can-guess
                        :current-player  current-player
                        :current-word    (when (and turn-ends is-active-player) (first round-words))
                        :event           "broadcast"
                        :has-control     (has-control client-id state)
                        :next-player     (fnext player-seq)
                        :players         players
                        :remaining-words (- (count round-words) 1)
                        :remaining-skips (:remaining-skips state)
                        :round           (:round state)
                        :scores          scores
                        :screen          (get screens client-id)
                        :teams           teams
                        :turn-ends       (when turn-ends (.toEpochMilli turn-ends))
                        :word-counts     (:word-counts state)
                        :words           (get-in state [:words client-id])
                        :your-turn       is-active-player
                        :config          config})))))
  state)

(defn add-player-to-team
  [{:keys [players] :as team}  id name]
  (-> team
      (update :player-ids conj id)
      (assoc :players (add-player players {:id id :name name}))))

(defn remove-player-from-team
  [{:keys [players] :as team} id]
  (-> team
      (update :player-ids disj id)
      (assoc :players (remove #(= id (:id %)) players))))

(defn move-player-to-team
  [team id name team-name]
  (if (= (:name team) team-name)
    (add-player-to-team team id name)
    (remove-player-from-team team id)))

(defn get-output
  [state client-id]
  (get-in state [:clients client-id :output]))

(defn get-name
  [state client-id]
  (get-in state [:clients client-id :name]))

(defn randomize-words
  "Given a map of client id -> word lists, flatten and return a sequence."
  [words]
  (shuffle (flatten (vals words))))

(defn randomize-players
  [{:keys [name players]}]
  (shuffle (map #(assoc % :team name) players)))

(defn make-player-seq
  "Given the set of teams (name and players), generate a lazy seq that
  will cycle through the teams.

  It will return the players in the same order after it cycles through them."
  [teams]
  (->> (map randomize-players teams)
       (filter not-empty)
       (map cycle)
       (apply interleave)))

(defn start-game
  [{:keys [screens teams words] :as state}]
  (let [player-seq  (make-player-seq teams)
        round-words (randomize-words words)]
    (-> state
        (assoc :round 1)
        (assoc :player-seq player-seq)
        (assoc :scores (zipmap (map :name teams) (repeat 0)))
        (assoc :round-words round-words)
        (assoc :screens (zipmap (keys screens) (repeat "round"))))))

(defn message-client
  [client-id state message]
  (when-let [output (get-output state client-id)]
    (a/>!! output message))
  state)

(defn handle-start-game
  [client-id _ state]
  (if (has-control client-id state)
    (broadcast-state (start-game state))
    (message-client client-id state {:error "You are not allowed to start the game"
                                     :event "command-error"})))

(defn handle-join-team
  [client-id msg {:keys [teams] :as state}]
  (let [client-name (get-name state client-id)
        team-name   (get-in msg [:team :name])
        new-teams   (map #(move-player-to-team % client-id client-name team-name) teams)]
    (broadcast-state
      (-> state
          (assoc-in [:screens client-id] "select-words")
          (assoc :teams new-teams)))))

(defn handle-set-words
  [client-id {:keys [words]} state]
  (broadcast-state
    (-> state
        (assoc-in [:words client-id] words)
        (assoc-in [:word-counts client-id] (count words)))))

(defn active-player-name
  [{:keys [player-seq]}]
  (:name (first player-seq)))

(defn handle-start-turn
  "Starts the turn."
  [_ _ {:keys [turn-time events-ch turn-id round leftover-clock] :as state}]
  (let [turn-id      (str (java.util.UUID/randomUUID))
        turn-ends-in (or leftover-clock turn-time)]
    (a/go
      (a/<! (a/timeout turn-ends-in))
      (a/>! events-ch {:type    ::turn-end
                       :turn-id turn-id}))
    (broadcast-message {:system true
                        :text   (format "%s started their turn" (active-player-name state))}
                       state)
    (let []
      (broadcast-state
        (-> state
            ;; you start with as many skips as the round number
            (assoc :remaining-skips round)
            (assoc :turn-id turn-id)
            (assoc :turn-ends (.plus (Instant/now) (Duration/ofMillis turn-ends-in))))))))

(defn ensure-active-player
  "Wrap a handler and ensure the sender is the active player."
  [thunk]
  (fn [client-id msg {:keys [player-seq] :as state}]
    (if (= client-id (:id (first player-seq)))
      (thunk client-id msg state)
      (message-client client-id state {:error "You are not the active player"
                                       :event "command-error"}))))

(defn ensure-active-team
  "Wrap a handler and ensure the sender is on the team that's up."
  [thunk]
  (fn [client-id msg state]
    (if (player-on-active-team client-id state)
      (thunk client-id msg state)
      (message-client client-id state {:error "You are not allowed to guess"
                                       :event "command-error"}))))

(defn handle-ping
  [client-id _ state]
  (message-client client-id state {:event     "pong"
                                   :pong      true
                                   :client-id client-id}))

(defn maybe-end-game
  [{:keys [rounds round screens] :as state}]
  (cond-> state
    (> round rounds) (assoc :screens
                            (zipmap (keys screens) (repeat "game-over")))))

(defn next-round
  "Advance to the rext round"
  [{:keys [words] :as state}]
  (maybe-end-game
    (-> state
        (assoc :round-words (randomize-words words))
        (dissoc :turn-id)
        (dissoc :turn-ends)
        (update :round inc))))

(defn next-player
  [state]
  (-> state
      (assoc  :turn-score 0)
      (dissoc :turn-id)
      (dissoc :leftover-clock)
      (dissoc :turn-ends)
      (update :player-seq next)))

(defn next-word-or-round
  "Advance to the next round if no words are left"
  [{:keys [round-words turn-ends] :as state}]
  (if-let [words (next round-words)]
    (assoc state :round-words words)
    (do
      (log/info "Out of words, moving to next round")
      (broadcast-message {:system    true
                          :round-end true
                          :text      "Out of words, on to the next round"} state)
      (next-round
        (assoc state :leftover-clock (->> turn-ends
                                          (Duration/between (Instant/now))
                                          .toMillis))))))

(defn handle-skip-word
  [_ _ {:keys [remaining-skips] :as state}]
  (broadcast-state
    (if (< remaining-skips 1)
      (do
        (log/error "Can't skip with remaining: " remaining-skips)
        state)
      (do
        (broadcast-message {:system true
                            :text   (format "%s skipped a word" (active-player-name state))} state)
        (next-word-or-round (update state :remaining-skips dec))))))

(defn count-guess-and-advance
  [state]
  (broadcast-state
    (next-word-or-round
      (-> state
          (update :turn-score inc)
          (update-in [:scores (active-team state)] inc)))))

(defn handle-count-guess
  [_ _ {:keys [round-words] :as state}]
  (broadcast-message {:system true
                      :text   (format "\"%s\" was right" (first round-words))}
                     state)
  (count-guess-and-advance state))

(defn handle-send-message
  [client-id {:keys [message]} {:keys [round-words players] :as state}]
  (let [player (player-by-id client-id players)
        word   (first round-words)]
    (if (= (stem/stem message) (stem/stem word))
      (do
        (log/info "Correct guess: " word message)
        (broadcast-message {:player  player
                            :correct true
                            :text    message} state)
        (count-guess-and-advance state))
      (do
        (log/info "Incorrect guess: " word message)
        (broadcast-message {:player player
                            :text   message} state)
        ;; no need to broadcast state here, but return it just in case
        state))))

(def command-handlers
  {"join-team"    handle-join-team
   "set-words"    handle-set-words
   "start-game"   handle-start-game
   "send-message" (ensure-active-team handle-send-message)
   "start-turn"   (ensure-active-player handle-start-turn)
   "skip-word"    (ensure-active-player handle-skip-word)
   "count-guess"  (ensure-active-player handle-count-guess)
   "ping"         handle-ping})

(defn handle-client-message
  [{:keys [id command] :as msg} state]
  (let [name (get-name state id)]
    (log/info "Responding to command" command "for client" id ": " name " for message " msg)
    (if-let [handler (get command-handlers command)]
      (handler id msg state)
      (do
        (log/error "Unknown command " command)
        (message-client id state {:error (str "Unknown command: " command)
                                  :event "command-error"})))))

(defn handle-turn-end
  [event {:keys [words turn-id turn-score] :as state}]
  (log/info "Turn finished")
  (if (= (:turn-id event) turn-id)
    (do
      (broadcast-message
        {:system true
         :text   (format "Time's up! %s scored %s points" (active-player-name state) turn-score)}
        state)
      (broadcast-state (next-player state)))
    (do
      (log/info "Ignoring turn end for inactive ID: " (:turn-id event) turn-id)
      state)))

(def events-map
  {::turn-end handle-turn-end})

(defn handle-event
  [{:keys [type] :as event}state]
  (log/infof "Handle event: %s" event)
  (if-let [handler (get events-map type)]
    (handler event state)
    (do
      (log/errorf "No event handler for %s" event)
      state)))

(ns celebrity.commands-test
  (:require [celebrity.commands :refer :all]
            [clojure.test :refer :all]
            [clojure.core.async :as a]
            [clojure.set :as set])
  (:import (java.time Duration Instant)))


(deftest handle-join-team-empty
  (testing "Handle team join with no players yet"
    (let [teams         [{:name "ghosts" :players []}
                         {:name "ghouls" :players []}]
          msg           {:team {:name "ghosts"}}
          start-state   {:teams   teams
                         :clients {"id" {:name "name"}}}
          state         (handle-join-team "id" msg start-state)
          ghost-players (:players (nth (:teams state) 0))]
      (is (= 1 (count ghost-players)))
      (is (= {:id "id" :name "name"} (nth ghost-players 0))))))

(deftest handle-join-team-switch
  (testing "Handle team join with switching teams"
    (let [teams         [{:name "ghosts" :players []}
                         {:name "ghouls" :players [{:id "id" :name "name-diff"}]}]
          msg           {:team {:name "ghosts"}}
          start-state   {:teams teams
                         :clients {"id" {:name "name"}}}
          state         (handle-join-team "id" msg start-state)
          ghost-players (:players (nth (:teams state) 0))
          ghoul-players (:players (nth (:teams state) 1))]
      (is (= 1 (count ghost-players)))
      (is (zero? (count ghoul-players)))
      (is (= {:id "id" :name "name"} (nth ghost-players 0))))))

(deftest handle-join-team-same-team
  (testing "Handle team join with the same team"
    (let [teams         [{:name "ghosts" :players []}
                         {:name "ghouls" :players [{:id "id" :name "old-name"}]}]
          msg           {:team {:name "ghouls"}}
          start-state   {:teams   teams
                         :clients {"id" {:name "new-name"}}}
          state         (handle-join-team "id" msg start-state)
          ghost-players (:players (nth (:teams state) 0))
          ghoul-players (:players (nth (:teams state) 1))]
      (is (zero? (count ghost-players)))
      (is (= 1 (count ghoul-players)))
      (is (= {:id "id" :name "old-name"} (nth ghoul-players 0))))))

(deftest handle-client-message-unknown
  (testing "Handle client message rejects unknown"
    (let [client (a/chan)
          id                  "fake-id"
          state               {:clients {id {:output client}}}
          state'              (a/go (handle-client-message {:id id :command "bar"} state))
          client-response     (a/<!! client)]
      (is (= "command-error" (:event client-response)))
      (a/close! client))))

(deftest handle-set-words-ok
  (testing "Setting words works"
    (let [state (handle-set-words "client-id" {:words ["foo" "bar"]} {})]
      (is (= 2 (get-in state [:word-counts "client-id"]))))))

(deftest has-control-tests
  (let [start-player-id "abcd"
        state           {:players [{:id start-player-id}]}]
    (testing "Is valid for the first player"
      (is (has-control start-player-id state)))
    (testing "Is invalid for others"
      (is (not (has-control "random-id" state))))))

(def bears-team
  {:name    "bears"
   :players [{:id "one" :name "player one"}
             {:id "two" :name "player two"}
             {:id "three" :name "player three"}]})

(def beats-team
  {:name "beats"
   :players [{:id "four" :name "Dwight Shrute"}
             {:id "jim"  :name "Jim Halpert"}]})

(def solo-team
  {:neam "solo"
   :players [{:id "lonely" :name "Loner"}]})

(def empty-team
  {:name "empty"})

(deftest start-game-tests
  (let [state      {:screens {"client-a" "bar"}
                    :teams   [beats-team bears-team]
                    :words   {"client-a" ["bears" "beats"]}}
        game-state (start-game state)]
    (testing "Is started"
      (is (not (:joinable? game-state))))
    (testing "Is round 1"
      (is (= 1 (:round game-state))))
    (testing "Current player team is different than next player"
      (is (not= (:team (first (:player-seq game-state)))
                (:team (fnext (:player-seq game-state))))))
    (testing "Updates screens"
      (is (= "round" (get-in game-state [:screens "client-a"]))))))

(deftest randomize-words-tests
  (let [word-map {"hello" ["cow" "banana" "orange"]
                  "there" ["bears"]}
        words (randomize-words word-map)]
    (testing "Returns the right count"
      (is (= 4 (count words))))
    (testing "Contains the correct words"
      (is (some #(= "cow" %) words))
      (is (some #(= "bears" %) words)))))

(deftest randomize-players-test
  (let [shuffled-players (randomize-players bears-team)]
    (testing "Has correct length"
      (is (= 3 (count shuffled-players))))
    (testing "Associates team name"
      (is (= "bears" (:team (first shuffled-players))))
      (is (= "bears" (:team (last shuffled-players)))))
    (testing "Contains player one"
      (is (some #(= "one" (:id %)) shuffled-players))
      (is (some #(= "player one" (:name %)) shuffled-players)))))

(deftest make-player-seq-test
  (let [player-seq (make-player-seq [beats-team bears-team])
        players    (take 8 player-seq)
        team-names (map :team players)]
    (testing "Has enough elements"
      (is (= 8 (count players))))
    (testing "Has four of each team"
      (is (= 4 (count (filter #(= "bears" %) team-names))))
      (is (= 4 (count (filter #(= "beats" %) team-names)))))
    (testing "Has all the bears players"
      (let [bear-players (set (map :name (:players bears-team)))
            all-names    (set (map :name players))]
        (is (set/subset? bear-players all-names))))
    (testing "Has beats players in the same order"
      (let [beats-players (filter #(= "beats" (:team %)) players)]
        (is (= (take 2 beats-players) (drop 2 beats-players)))))
    (testing "With an empty team"
      (let [with-empty-seq (make-player-seq [bears-team beats-team empty-team])
            empty-players  (take 4 with-empty-seq)]
        (is (= 4 (count empty-players)))))))

(deftest ensure-active-player-tests
  (let [thunk (fn [& args] ::thunk)
        state {:player-seq [{:id "bar"}]}
        wrapped (ensure-active-player thunk)]
    (testing "With active player it calls thunk"
      (is (= ::thunk (wrapped "bar" {} state))))
    (testing "With other players it returns state"
      (is (= state (wrapped "no-bar" {} state))))))

(deftest handle-start-turn-tests
  (let [events-ch (a/chan)
        state     {:events-ch   events-ch
                   :turn-time   10
                   :round-words ["first" "second"]}
        new-state (handle-start-turn nil nil state)
        now       (Instant/now)
        turn-ends (:turn-ends new-state)]

    (testing "Has the turn ending"
      (is (.isAfter turn-ends now)))

    (testing "Turn ends is less than 90 seconds from now"
      (is (.isBefore turn-ends (.plus now (Duration/ofSeconds 90)))))

    (testing "With remaining clock"
      (let [turn-ends-with-clock (assoc state :leftover-clock (Duration/ofMillis 1000))
            new-round            (handle-start-turn nil nil turn-ends-with-clock)]
        (is (.isBefore (:turn-ends new-round) (.plus now (Duration/ofSeconds 2))))))

    (testing "Gives a turn end event"
      (is (= "turn-end" (name (:type (a/<!! events-ch))))))))

(deftest handle-event-tests
  (let [state {}]
    (testing "Handle unknown event"
      (is (= state (handle-event :unknown state))))))

(deftest handle-count-guess-tests
  (let [state  {:round-words ["foo" "bar"]
                :scores      {"bears" 2
                              "beats" 3}
                :round       3
                :turn-score  1
                :rounds      3
                :player-seq  [{:team "beats"}]}
        result (handle-count-guess nil nil state)]
    (testing "Updates the score"
      (is (= 2 (:turn-score result)))
      (is (= 4 (get-in result [:scores "beats"]))))
    (testing "Updates round words"
      (is (= ["bar"] (:round-words result))))))

(deftest maybe-end-game-tests
  (testing "When the game isn't over"
    (let [state {:screens {:foo "round"}
                 :rounds  3
                 :round   3}]
      (is (= "round" (get-in (maybe-end-game state) [:screens :foo])))))
  (testing "When the game isn't over"
    (let [state {:screens {:foo "round"}
                 :rounds  3
                 :round   4}]
      (is (= "game-over" (get-in (maybe-end-game state) [:screens :foo]))))))

(deftest next-word-or-round-tests
  (testing "On the last word"
    (let [state     {:round-words ["foo"]
                     :words       {:player-1 ["a" "b" "c"]}
                     :rounds      2
                     :turn-ends   (.plus (Instant/now) (Duration/ofSeconds 3))
                     :round       1}
          new-state (next-word-or-round state)]
      (is (< (.toMillis (:leftover-clock new-state)) 4000))
      (is (> (.toMillis (:leftover-clock new-state)) 1000))
      (is (= 3 (count (:round-words new-state))))
      (is (= 2 (:round new-state)))))
  (testing "With words left over"
    (let [state {:round-words ["foo" "bar"]
                 :round       1}]
      (is (= ["bar"] (:round-words (next-word-or-round state)))))))

(deftest broadcast-message-tests
  (let [client-one (a/chan)
        client-two (a/chan)
        state      {:clients {:client-one {:output client-one}
                              :client-two {:output client-two}}}]
    (testing "All clients receive the message"
      (broadcast-message {:hello "world"} state)
      (is (= "world" (get-in (a/<!! client-one) [:message :hello])))
      (is (= "world" (get-in (a/<!! client-two) [:message :hello]))) )))

(deftest active-player-name-tests
  (testing "It works"
    (is (= "aiden" (active-player-name {:player-seq [{:name "aiden"}]})))))

(deftest player-on-active-team-tests
  (let [bob     {:id "abc" :name "bob loblaw"}
        fred    {:id "def" :name "fred flinstone"}
        players [bob fred]
        state   {:player-seq [(assoc bob :team "outlaws") (assoc fred :team "rebels")]
                 :teams      [{:name "outlaws" :players [bob] :player-ids (set ["abc"])}
                              {:name "rebels" :players [fred] :player-ids (set ["def"])}]}]
    (testing "On team"
      (is (player-on-active-team "abc" state)))

    (testing "Not on team"
      (is (not (player-on-active-team "def" state))))))

(deftest handle-send-message-tests
  (let [player (a/chan)
        phrase "a catch phrase"
        state  {:round-words [phrase]
                :clients     {"clueless-id" {:output player} }
                :player-seq  [{:team "fake-team"}]
                :scores      {"fake-team" 1}
                :turn-ends   (Instant/now)
                :turn-score  0
                :round       2
                :rounds      5
                :screens     {}
                :players     [{:name "clueless"
                               :id   "clueless-id"}]}]

    (testing "A correct guess"
      (let [new-state (handle-send-message "clueless-id" {:message "catch PHRASE"} state)]
        (is (get-in (a/<!! player) [:message :correct]))
        (is (= 1 (:turn-score new-state)))
        (is (= 3 (:round new-state)))
        (is (= 2 (get-in new-state [:scores "fake-team"])))))

    (testing "An incorrect guess"
      (handle-send-message "clueless-id" {:message "something"} state)
      (is (nil? (:correct (a/<!! player)))))))

(deftest handle-turn-end-tests
  (testing "With an inactive ID"
    (let [state    {:turn-id "fake"}
          response (handle-turn-end {:turn-id "not-fake"} state)]
      (is (= state response))))

  (testing "With an active ID"
    (let [state    {:turn-id    "my-turn"
                    :player-seq ["1" "2"]}
          response (handle-turn-end {:turn-id "my-turn"}
                                    state)]
      (is (= "2" (first (:player-seq response)))))))

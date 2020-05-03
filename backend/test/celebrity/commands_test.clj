(ns celebrity.commands-test
  (:require [celebrity.commands :refer :all]
            [clojure.test :refer :all]
            [clojure.core.async :as a]))


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
          start-state   {:teams teams
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

(def bear-team
  {:name    "bears"
   :players [{:id "one" :name "player one"}
             {:id "two" :name "player two"}
             {:id "three" :name "player three"}]})

(def beats-team
  {:name "beats"
   :players [{:id "four" :name "Dwight Shrute"}
             {:id "jim"  :name "Jim Halpert"}]})

(deftest start-game-tests
  (let [state      {:screens {"client-a" "bar"}
                    :teams   [beats-team bear-team]
                    :words   {"client-a" ["bears" "beats"]}}
        game-state (start-game state)]
    (testing "Is started"
      (is (:started game-state)))
    (testing "Is round 1"
      (is (= 1 (:round game-state))))
    (testing "Current player team is different than next player"
      (is (not= (:team (:current-player game-state))
                (:team (:next-player game-state)))))
    (testing "Updates screens"
      (is (= "round" (get-in game-state [:screens "client-a"]))))))

(deftest randomize-words-tests
  (let [word-map {"hello" ["cow" "banana" "orange"]
                  "there" ["bears"]}
        words (randomize-words word-map)]
    (testing "Returns the right count"
      (is (= 4 (count words))))
    (testing "Contains the correct words"
      (is (some #(= "cow" %) words)
      (is (some #(= "bears" %) words))))))
(deftest randomize-players-test
  (let [shuffled-players (randomize-players bear-team)]
    (testing "Has correct length"
      (is (= 3 (count shuffled-players))))
    (testing "Associates team name"
      (is (= "bears" (:team (first shuffled-players))))
      (is (= "bears" (:team (last shuffled-players)))))
    (testing "Contains player one"
      (is (some #(= "one" (:id %)) shuffled-players))
      (is (some #(= "player one" (:name %)) shuffled-players)))))

(deftest make-player-seq-test
  (let [player-seq (make-player-seq [beats-team bear-team])
        players    (take 8 player-seq)
        team-names (map #(:team %) players)]
    (testing "Has enough elements"
      (is (= 8 (count players))))
    (testing "Has four of each team"
      (is (= 4 (count (filter #(= "bears" %) team-names))))
      (is (= 4 (count (filter #(= "beats" %) team-names)))))
    (testing "Has beats players in the same order"
      (let [beats-players (filter #(= "beats" (:team %)) players)]
        (is (= (take 2 beats-players) (drop 2 beats-players)))))))

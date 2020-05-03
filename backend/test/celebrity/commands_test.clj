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

(deftest start-game-tests
  (testing "Updates screens"
    (let [state {:screens {"foo" "bar"}}]
      (is (= "round-1" (get-in (start-game state) [:screens "foo"]))))))

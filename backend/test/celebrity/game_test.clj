(ns celebrity.game-test
  (:require [celebrity.game :refer :all]
            [clojure.test :refer :all]
            [manifold.bus :as b]
            [manifold.deferred :as d]
            [manifold.stream :as s]))

(deftest generate-code-no-args
  (testing "generate room code with no arguments"
    (is (=
         (count (generate-room-code))
         room-code-length))))

(deftest generate-code-with-len
  (testing "generate room code with length"
    (is (=
         (count (generate-room-code 10))
         10))))

(deftest create-game-gives-up
  (testing "no infinite loop if codes never change"
    (let [registry (atom {"KEY" true})
          broadcast (b/event-bus)
          code (create-game "value" registry broadcast #(str "KEY"))]
      (is (nil? code)))))

(deftest create-game-connects-client
  (testing "we can create a new game"
    (let [client (s/buffered-stream 100)
          registry (atom {})
          broadcast (b/event-bus)
          code (create-game client registry broadcast)]
      (is (not (nil? code)))
      (is (b/active? broadcast code))
      (is (:joinable? (get @registry code)))
      @(d/let-flow
        [result (s/try-take! client 500)
         _ (b/publish! broadcast code "test")]
        (is (= result "test"))))))

(deftest join-game-does-not-exist
  (testing "try to join a game that doesn't exist"
    (let [client (s/stream)
          registry (atom {})
          response (join client {} "TEST" registry)]
      (is (nil? response)))))

(deftest join-game-not-joinable
  (testing "we test a game is joinable"
    (let [client (s/stream)
          registry (atom {"TEST" {:joinable? false}})
          response (join client {} "TEST" registry)]
      (is (=
           (:error response)
           "Room is not joinable")))))

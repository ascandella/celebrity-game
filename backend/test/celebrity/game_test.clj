(ns celebrity.game-test
  (:require [celebrity.game :refer :all]
            [celebrity.protocol :as proto]
            [clojure.test :refer :all]
            [clojure.core.async :as a]
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
          params {}
          game-data (create-game params "sentinel-stream" {:registry registry
                                                           :code-generator #(str "KEY")})]
      (is (nil? game-data)))))

(deftest create-game-connects-client
  (testing "we can create a new game"
    (let [client   (s/stream)
          params   {:name   "aiden"
                    :config {:foo "bar"}}
          registry (atom {})
          val      (create-game params client {:registry registry})]
      (is (= val :pending))
      ;; this should succeed because the server is listening
      (let [create-response @(s/try-take! client 500)
            json-response   (proto/parse-message create-response)
            code            (:room-code json-response)]
        (is (not (nil? code)))
        (is (= (:name json-response) "aiden"))
        (is (:joinable? (get @registry code)))
        (is (= (get-in @registry [code :config :foo]) "bar"))
        (is @(s/try-put! client "{\"ping\" true}" 500))

        (let [ping-response @(s/try-take! client 500)
              result-parsed (proto/parse-message ping-response)]
          (is (:pong result-parsed))
          (is (> (count (:client-id result-parsed)) 20)))))))

(deftest join-game-does-not-exist
  (testing "try to join a game that doesn't exist"
    (let [client (s/stream)
          registry (atom {})
          response (join client {} {:registry registry})]
      (is (=
           (:error response)
           "No room code provided")))))

(deftest join-game-not-joinable
  (testing "we test a game is joinable"
    (let [client (s/stream)
          code "TEST"
          join-data {:room-code code}
          registry (atom {code  {:joinable? false}})
          response (join client join-data {:registry registry})]
      (is (=
           (:error response)
           "Room is full"))
      (s/close! client))))

(deftest client-last-player
  (testing "We cull old games when the last client disconnects"
    (let [client   (s/stream)
          params   {}
          registry (atom {})
          created  (create-game params client {:registry registry})
          response @(s/try-take! client 500)
          parsed   (proto/parse-message response)]
      (is (= :pending created))
      (s/close! client)
      (Thread/sleep 50)
      ;; either the game is deregistered, or the server conn should be closed
      (when-let [game-state (get @registry (:room-code parsed))]
        (let [bus (:bus game-state)]
          ;; NOTE: this will block
          (is (false? (a/>!! bus "test message"))))))))

(deftest created-game-can-be-joined
  (testing "After creating a game, another client can join"
    (let [creator  (s/stream)
          joiner   (s/stream)
          params   {:name "creator"}
          registry (atom {})
          _        (create-game params creator {:registry registry})
          response @(s/try-take! creator 500)
          parsed   (proto/parse-message response)
          code     (:room-code parsed)]
      (is (= :pending
             (join joiner {:room-code code
                           :name "joiner"}
                   {:registry registry})))
      (let [join-response @(s/try-take! joiner 1000)
            parsed-join   (proto/parse-message join-response)
            players       (:players parsed-join)]
        (is (:success parsed-join))
        (is (= "joiner" (:name parsed-join)))
        (is (= code (:room-code parsed-join)))
        (is (= 2 (count players)))
        (is (= "joiner" (:name (nth players 1)))))
      (s/close! creator)
      (s/close! joiner))))

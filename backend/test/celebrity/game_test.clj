(ns celebrity.game-test
  (:require [celebrity.game :refer :all]
            [celebrity.protocol :as proto]
            [clojure.test :refer :all]
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
          params   {:create {:name "aiden"}
                    :config {:foo "bar"}}
          registry (atom {})
          val        (create-game params client {:registry registry})]
      (is (= val :created))
      ;; this should succeed because the server is listening
      @(d/let-flow
        [create-response (s/try-take! client 500)]
        (let [json-response (proto/parse-message create-response)
              code (:room-code json-response)]
          (is (not (nil? code)))
          (is (= (:name json-response) "aiden"))
          (is (:joinable? (get @registry code)))
          (is (= (get-in @registry [code :config :foo]) "bar"))
          (is @(s/try-put! client "{\"ping\" true}" 500))
          (d/let-flow [ping-response (s/try-take! client 500)]
                      (let [result-parsed (proto/parse-message ping-response)]
                        (is (:pong result-parsed))
                        (is (> (count (:client-id result-parsed)) 20)))))))))

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
           "Room is full")))))

(deftest client-disconnect-with-active-players
  (testing "We decrement player count on disconnect"
    (let [code "test"
          registry (atom {code {:player-count 2}})
          new-registry (on-client-disconnect registry code)]
      (is (= 1
             (get-in new-registry [code :player-count]))))))

(deftest client-last-player
  (testing "We cull old games when the last client disconnects"
    (let [code "test"
          registry (atom {code {:player-count 1}})
          new-registry (on-client-disconnect registry code)]
      (is (nil? (get code new-registry))))))

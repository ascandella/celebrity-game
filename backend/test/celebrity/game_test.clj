(ns celebrity.game-test
  (:require [celebrity.game :refer :all]
            [celebrity.protocol :as proto]
            [clojure.test :refer :all]
            [clojure.core.async :as a]
            [clojure.string :as string]
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
      (let [create-response @(s/take! client)
            json-response   (proto/parse-message create-response)
            code            (:room-code json-response)]
        (is (not (nil? code)))
        (is (= (:name json-response) "aiden"))
        (is (contains? @registry code))
        (is @(s/put! client "{\"ping\" true}"))

        (let [ping-response @(s/take! client)
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

(deftest try-rejoin-name-taken
  (testing "trying to rejoin with a taken name fails"
    (let [client-id "test-id"
          name "tester-taken"
          players [{:id "foo" :name name}]
          [_ join-error] (try-rejoin client-id name players)]
      (is (string/includes? join-error "already taken"))
      (is (string/includes? join-error name)))))

(deftest try-rejoin-name-empty
  (testing "trying to rejoin with a new player succeeds"
    (let [client-id "test-id"
          name "not-taken"
          players []
          [accepted-uuid join-error] (try-rejoin client-id name players)]
      (is (nil? join-error))
      (is (= client-id accepted-uuid)))))

(deftest try-rejoin-overlapping-id
  (testing "overlapping IDs are regenerated"
    (let [client-id "test-id"
          new-name "new-name"
          players [{:id client-id :name "old-name"}]
          [accepted-uuid join-error] (try-rejoin client-id name players)]
      (is (nil? join-error))
      (is (not (= client-id accepted-uuid))))))

(deftest try-rejoin-same-id
  (testing "rejoining with the same name and ID works"
    (let [client-id "test-id"
          name "not-taken"
          players [{:id client-id :name name}]
          [join-uuid join-error] (try-rejoin client-id name players)]
      (is (nil? join-error))
      (is (= join-uuid client-id)))))

(deftest client-last-player
  (testing "We cull old games when the last client disconnects"
    (let [client   (s/stream)
          params   {}
          registry (atom {})
          created  (create-game params client {:registry registry})
          response @(s/take! client)
          parsed   (proto/parse-message response)]
      (is (= :pending created))
      (s/close! client)
      (Thread/sleep 50)
      ;; either the game is deregistered, or the server conn should be closed
      (when-let [game-state (get @registry (:room-code parsed))]
        (let [bus (:bus game-state)]
          ;; NOTE: this will block
          (is (false? (a/>!! bus "test message"))))))))

(defn two-sided-stream
  []
  (let [client-to-server (s/stream)
        server-to-client (s/stream)]

    [(s/splice (s/sink-only server-to-client) (s/source-only client-to-server))
     (s/splice (s/sink-only client-to-server) (s/source-only server-to-client))]))

(deftest two-sided-stream-is-ok
  (testing "Two sided stream won't read your own writes"
    (let [[client server] (two-sided-stream)]
      (s/put! client "hello")
      (is (nil? @(s/try-take! client 100)))
      (is (= "hello" @(s/try-take! server 100)))
      (s/put! server "response")
      (is (nil? @(s/try-take! server 100)))
      (is (= "response" @(s/try-take! client 100))))))

(deftest created-game-can-be-joined
  (testing "After creating a game, another client can join"
    (let [[creator-c creator-s] (two-sided-stream)
          [joiner-c joiner-s]   (two-sided-stream)
          params                {:name "creator"}
          registry              (atom {})
          _                     (create-game params creator-s {:registry registry})
          response              @(s/take! creator-c)
          parsed                (proto/parse-message response)
          code                  (:room-code parsed)]
      (is (= "joined" (:event parsed)))
      (when (= "joined" (:event parsed))
        (is (= :pending
               (join joiner-s {:room-code code
                               :name      "joiner"}
                     {:registry registry})))
        (let [join-response @(s/take! joiner-c)
              parsed-join   (proto/parse-message join-response)
              players       (:players parsed-join)]
          (is (= "joined" (:event parsed-join)))
          (is (= "joiner" (:name parsed-join)))
          (is (= code (:room-code parsed-join)))
          (is (= 2 (count players)))
          (is (= "joiner" (:name (nth players 1)))))
        (s/close! creator-s)
        (s/close! joiner-s)))))

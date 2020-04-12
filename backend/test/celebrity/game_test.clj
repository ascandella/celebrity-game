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
        (is @(proto/respond-json client {:ping true}))

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

(deftest client-disconnect-reconnect
  (testing "We can reconnect if we disconnect"
    (let [client   (s/stream)
          name     "spotty-connection"
          params   {:name name}
          registry (atom {})
          created  (create-game params client {:registry registry})
          response @(s/take! client)
          parsed   (proto/parse-message response)]
      (is (= :pending created))
      (s/close! client)
      (let [new-conn (s/stream)
            rejoin (join new-conn {:name name
                                   :client-id (:client-id parsed)
                                   :room-code (:room-code parsed)}
                         {:registry registry})
            rejoin-response @(s/take! new-conn)
            rejoin-json (proto/parse-message rejoin-response)]
        (is (= :pending rejoin))
        (is (nil? (:error rejoin-json)))
        (is (= "joined" (:event rejoin-json)))
        (is (= 1 (count (:players rejoin-json))))))))

(deftest created-game-can-be-joined
  (testing "After creating a game, another client can join"
    (let [creator  (s/stream)
          joiner   (s/stream)
          params   {:name "creator"}
          registry (atom {})
          _        (create-game params creator {:registry registry})
          response @(s/take! creator)
          parsed   (proto/parse-message response)
          code     (:room-code parsed)]
      (is (= "joined" (:event parsed)))
      (when (= "joined" (:event parsed))
        (is (= :pending
               (join joiner {:room-code code
                             :name      "joiner"}
                     {:registry registry})))
        (let [join-response @(s/take! joiner)
              parsed-join   (proto/parse-message join-response)
              players       (:players parsed-join)]
          (is (= "joined" (:event parsed-join)))
          (is (= "joiner" (:name parsed-join)))
          (is (= code (:room-code parsed-join)))
          (is (= 2 (count players)))
          (is (= "joiner" (:name (nth players 1)))))
        (s/close! creator)
        (s/close! joiner)))))

(ns celebrity.game-test
  (:require [celebrity.game :refer :all]
            [celebrity.protocol :as proto]
            [clojure.data.json :as json]
            [clojure.test :refer :all]
            [clojure.string :as string]
            [clojure.core.async :as a]
            [manifold.stream :as s]
            [me.raynes.fs :as fs]
            [clojure.data.json :as json]))

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


(def default-game-params
  {:teams ["guys" "girls"]
   :name  "my-name"})

(defn make-create-params
  [params]
  (merge default-game-params params))

(deftest create-game-gives-up
  (testing "no infinite loop if codes never change"
    (let [registry  (atom {"KEY" true})
          params    default-game-params
          game-data (create-game params "sentinel-stream" {:registry       registry
                                                           :code-generator #(str "KEY")})]
      (is (nil? game-data)))))

(deftest create-game-validates-params
  (testing "we return validation errors from create"
    (let [registry  (atom {"KEY" true})
          params    {:teams [] :name "my-name"}
          game-data (create-game params "sentinel-stream" {:registry registry})]
      (is (= (:event game-data) "create-error")))))

(deftest create-game-connects-client
  (testing "we can create a new game"
    (let [[client server] (two-sided-stream)
          params   (make-create-params {:name   "aiden"
                                        :config {:foo "bar"}})
          registry (atom {})
          val      (create-game params server {:registry registry})]
      (is (= val :pending))
      ;; this should succeed because the server is listening
      (let [create-response @(s/take! client)
            json-response   (proto/parse-message create-response)
            code            (:room-code json-response)]
        (is (not (nil? code)))
        (is (= (:name json-response) "aiden"))
        (is (contains? @registry code))

        (let [broadcast-response @(s/take! client)
              result-parsed (proto/parse-message broadcast-response)
              pong-success @(proto/respond-json client {:command "ping"})
              ping-response @(s/take! client)
              ping-parsed (proto/parse-message ping-response)]
          (is pong-success)
          (is (= "broadcast" (:event result-parsed)))
          (is (> (count (:client-id result-parsed)) 20))
          (is (= "pick-team" (:screen result-parsed)))
          (is (= "pong" (:event ping-parsed))))))))

(deftest join-game-does-not-exist
  (testing "try to join a game that doesn't exist"
    (let [client   (s/stream)
          registry (atom {})
          response (join client {} {:registry registry})]
      (is (=
            (:error response)
            "No room code provided")))))

(deftest try-rejoin-name-empty
  (testing "trying to rejoin with a new player succeeds"
    (let [client-id     "test-id"
          name          "not-taken"
          players       []
          accepted-uuid (try-rejoin client-id name players)]
      (is (= client-id accepted-uuid)))))

(deftest try-rejoin-overlapping-id
  (testing "overlapping IDs are regenerated"
    (let [client-id       "test-id"
          new-name        "new-name"
          players         [{:id client-id :name "old-name"}]
          [accepted-uuid] (try-rejoin client-id name players)]
      (is (not= client-id accepted-uuid)))))

(deftest try-rejoin-same-id
  (testing "rejoining with the same name and ID works"
    (let [client-id "test-id"
          name      "not-taken"
          players   [{:id client-id :name name}]
          join-uuid (try-rejoin client-id name players)]
      (is (= join-uuid client-id)))))


(deftest try-rejoin-different-id
  (testing "rejoining with the same name and different ID works"
    (let [client-id "test-id"
          name      "not-taken"
          players   [{:id "different-id" :name name}]
          join-uuid (try-rejoin client-id name players)]
      (is (= join-uuid "different-id")))))

(deftest client-disconnect-reconnect
  (testing "We can reconnect if we disconnect"
    (let [[client server] (two-sided-stream)
          name            "spotty-connection"
          params          (make-create-params {:name name})
          registry        (atom {})
          created         (create-game params server {:registry registry})
          response        @(s/take! client)
          parsed          (proto/parse-message response)]
      (is (= :pending created))
      (s/close! client)
      (let [[new-client new-server] (two-sided-stream)
            rejoin                  (join new-server {:name      name
                                                      :client-id (:client-id parsed)
                                                      :room-code (:room-code parsed)}
                                          {:registry registry})
            rejoin-response         @(s/take! new-client)
            rejoin-json             (proto/parse-message rejoin-response)]
        (is (= :pending rejoin))
        (is (nil? (:error rejoin-json)))
        (is (= "joined" (:event rejoin-json)))
        (is (= 1 (count (:players rejoin-json))))))))

(deftest created-game-can-be-joined
  (testing "After creating a game, another client can join"
    (let [[creator-c creator-s] (two-sided-stream)
          [joiner-c joiner-s]   (two-sided-stream)
          params                (make-create-params {:name "creator"})
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

(deftest validate-params-detects-duplicates
  (testing "Validate game params detects duplicates"
    (let [error (validate-params {:teams ["dup" "dup"]})]
      (is (= (:error error) "Duplicate team names")))))

(deftest validate-params-ok
  (testing "Validate game params with OK params"
    (let [params {:teams ["a" "b"]}]
      (is (nil? (validate-params params))))))

(deftest validate-params-one-team
  (testing "Validate game params with 1 team fails"
    (let [params {:teams ["a"]}]
      (is (not (nil? (validate-params params)))))))

(deftest write-registry-to-disk-tests
  (let [[client server] (two-sided-stream)
        params          (make-create-params {:name   "persisted"
                                             :config {:foo "bar"}})
        registry        (atom {})
        val             (create-game params server {:registry registry})
        tmp-dir         (fs/temp-dir "test-games")]
    (write-registry-to-disk registry tmp-dir)
    (Thread/sleep 500)
    (testing "There is a JSON file"
      (let [files (fs/list-dir tmp-dir)]
        (is (= 1 (count files)))
        (let [game-data (json/read-str (slurp (first files))
                                       :key-fn keyword)]
          (is (string? (:room-code game-data)))
          (is (= 2 (count (:teams game-data))))
          (is (= "persisted" (get-in game-data [:config :name]))))))
    (fs/delete-dir tmp-dir)))

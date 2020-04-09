(ns celebrity.connect-test
  (:require [celebrity.connect :refer :all]
            [celebrity.protocol :as proto]
            [clojure.string :refer [includes?]]
            [manifold.stream :as s]
            [manifold.deferred :as d]
            [clojure.test :refer :all]))

(defmacro test-stream
  [stream-name response-name setup & assertions]
  `(let [~stream-name (s/stream)]
     ~setup
     (d/let-flow
      [response# (s/take! ~stream-name)]
      (let [~response-name (proto/parse-json response#)]
        ~@assertions))))

(deftest handle-connect-missing-message
  (testing "Handle connect with invalid JSON"
    (test-stream
     stream response
     (do
       (s/put! stream "not JSON")
       (handle-connect stream))
     (is (= response
            {:error "Invalid message"})))))

(deftest handle-connect-missing-command
  (testing "Handle connect missing 'command' key"
    (test-stream
     stream response
     (do
       (proto/respond-json stream {:missing "join keyword"})
       (handle-connect stream))
     (is (= response
            {:error "No command sent"})))))

(deftest handle-connect-invalid-command
  (testing "Handle connect with frobulate is rejected"
    (test-stream
     stream response
     (do
       (proto/respond-json stream {:command "frobulate"})
       (handle-connect stream))
     (is (includes? (:error response) "Invalid command"))
     (is (includes? (:error response) "frobulate")))))

(deftest handle-join-no-such-room
  (testing "Handle connect when room code is wrong"
    (test-stream
     stream response
     (do
       (proto/respond-json stream {:command "join"
                                   :join    {:room-code "test-room-code"}})
       (handle-connect stream))
     (is (includes? (:error response) "Room not found")))))

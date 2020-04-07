(ns celebrity.websocket-test
  (:require [celebrity.websocket :refer :all]
            [manifold.stream :as s]
            [manifold.deferred :as d]
            [clojure.test :refer :all]))

(deftest parse-json-valid
  (testing "Valid JSON parsing"
    (is (=
         (parse-json "{\"key\": \"value\"}")
         {:key "value"}))))

(deftest parse-json-invalid
  (testing "Invalid JSON parsing"
    (is (nil? (parse-json "{")))))

(deftest respond-error-valid
  (testing "Respond error sends JSON to stream"
    (let [stream (s/stream)]
      (respond-error stream "message")
      (d/let-flow
       [response (s/take! stream)]
       (is (=
            (parse-json response)
            {:error "message"}))))))

(defmacro test-stream
  [stream-name response-name setup assertions]
  `(let [~stream-name (s/stream)]
     ~setup
     (d/let-flow
      [response# (s/take! ~stream-name)]
      (let [~response-name (parse-json response#)]
        ~assertions))))

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
       (respond-json stream {:missing "join keyword"})
       (handle-connect stream))
     (is (= response
            {:error "No command sent"})))))

(deftest handle-connect-ping-command
  (testing "Handle connect with ping"
    (test-stream
     stream response
     (do
       (respond-json stream {:command "ping"})
       (handle-connect stream))
     (is (= response
            {:pong true})))))

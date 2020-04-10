(ns celebrity.protocol-test
  (:require [celebrity.protocol :refer :all]
            [clojure.test :refer :all]
            [manifold.stream :as s]
            [manifold.deferred :as d]))

(deftest parse-message-valid
  (testing "Valid JSON parsing"
    (is (=
         (parse-message "{\"key\": \"value\"}")
         {:key "value"}))))

(deftest parse-message-invalid
  (testing "Invalid JSON parsing"
    (is (nil? (parse-message "{")))))

(deftest parse-message-return-default
  (testing "Invalid JSON parsing returning a default"
    (is (= (parse-message "foo" {})
           {}))))

(deftest respond-error-valid
  (testing "Respond error sends JSON to stream"
    (let [stream (s/stream)]
      (respond-error stream "message")
      (d/let-flow
       [response (s/take! stream)]
       (is (=
            (parse-message response)
            {:error "message"}))))))

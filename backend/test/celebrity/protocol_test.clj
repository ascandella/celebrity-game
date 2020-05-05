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

(deftest maybe-camelcase-tests
  (testing "UUID is return as-is"
    (let [uuid "a2579c28-5475-4bd4-9179-a0475f7c92c7"]
      (is (= uuid (maybe-camelcase uuid)))))
  (testing "Returns uppercased keys as-is"
    (is (= "Foo" (maybe-camelcase "Foo"))))
  (testing "Returns camelCase otherwise"
    (is (= "fooBar" (maybe-camelcase :foo-bar)))))

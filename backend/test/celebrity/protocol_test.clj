(ns celebrity.protocol-test
  (:require [celebrity.protocol :refer :all]
            [clojure.test :refer :all]
            [manifold.stream :as s]
            [manifold.deferred :as d]))

(deftest parse-json-valid
  (testing "Valid JSON parsing"
    (is (=
         (parse-json "{\"key\": \"value\"}")
         {:key "value"}))))

(deftest parse-json-invalid
  (testing "Invalid JSON parsing"
    (is (nil? (parse-json "{")))))

(deftest parse-json-return-default
  (testing "Invalid JSON parsing returning a default"
    (is (= (parse-json "foo" {})
           {}))))

(deftest respond-error-valid
  (testing "Respond error sends JSON to stream"
    (let [stream (s/stream)]
      (respond-error stream "message")
      (d/let-flow
       [response (s/take! stream)]
       (is (=
            (parse-json response)
            {:error "message"}))))))

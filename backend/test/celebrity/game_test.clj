(ns celebrity.game-test
  (:require [celebrity.game :refer :all]
            [clojure.test :refer :all]))


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
          code (create-game "value" registry #(str "KEY"))]
      (is (nil? code)))))

(deftest create-game-associates-value
  (testing "we can create a new game"
    (let [registry (atom {})
          code (create-game "sentinel" registry)]
       (is (not (nil? code)))
       (is (=
            @(:clients (get @registry code))
            ["sentinel"])))))

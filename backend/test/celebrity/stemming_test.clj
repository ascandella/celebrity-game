(ns celebrity.stemming-test
  (:require [celebrity.stemming :refer :all]
            [clojure.test :refer :all]))

;; This is sort of just testing the underlying library,
;; but I'm writing these to have a reference what the stemming
;; does to input phrases
(def test-pairs
  ["a Phrase" "phrase"
   "cooling off" "cool off"
   "Helping My Neighbors" "help neighbor"
   ;; removes particle (article?)
   "see ya later!" "see later"
   "Cool Hand Luke" "cool hand luke"
   ;; one L on the end
   "BASKETBALL" "basketbal"])

(deftest stem-test
  (doseq [[original expected] (partition 2 test-pairs)]
    (testing (format "Stem %s -> %s" original expected)
      (is (= expected (stem original))))))

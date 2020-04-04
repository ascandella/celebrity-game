(ns celebrity-game.core-test
  (:require [clojure.test :refer :all]
            [celebrity-game.core :refer :all]
            [ring.mock.request :as mock]))

(deftest a-test
  (testing "Home page is 200"
    (is (= (:status (handler (mock/request :get "/")))
           200))))

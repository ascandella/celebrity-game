(ns celebrity.core-test
  (:require [clojure.test :refer :all]
            [celebrity.core :refer :all]
            [ring.mock.request :as mock]))

(deftest health-test
  (testing "Health page is 200"
    (let [response (handler (mock/request :get "/health"))]
      (is (= (:body response) "OK"))
      (is (= (:status response) 200)))))

(deftest not-found
  (testing "Any random page is 404"
    (is (= (:status (handler (mock/request :get "/non-existent")))
           404))))

(deftest non-websocket-game
  (testing "Non-websocket connection to game fails"
    (let [response (handler (mock/request :get "/game"))]
      (is (= (:status response) 400)))))

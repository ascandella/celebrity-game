(ns celebrity.core
  (:require [compojure.core :as compojure :refer [GET]]
            [compojure.route :as route]
            [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.params :as params]
            [aleph.http :as http]
            [manifold.deferred :as d]
            [celebrity.connect :as connect]
            [taoensso.timbre :as log])
  (:gen-class))

(def non-websocket-request
  {:status  400
   :headers {"Content-type" "text/plain"}
   :body    "Expected a websocket request."})

(defn game-handler
  [req]
  (d/catch
      (d/let-flow
        [conn (http/websocket-connection req)]
        (connect/handle-connect conn))
      (fn [_] non-websocket-request)))

(defn health-handler
  [req]
  {:status  200
   :headers {"Content-type" "text/plain"}
   :body    "OK"})

(def handler
  (params/wrap-params
    (compojure/routes
      (GET "/game" [] game-handler)
      (GET "/health" [] health-handler)
      (route/not-found "No such page."))))

(def wrapped-handler
  (if (= (System/getenv "CELEBRITY_ENVIRONMENT") "development")
    (wrap-reload handler)
    handler))

(defn get-port
  ([] (get-port "PORT"))
  ([key] (Integer/valueOf (or (System/getenv key) "3030"))))

(defn -main
  [& args]
  (http/start-server wrapped-handler {:port (get-port)}))

(defonce devserver (atom nil))

(defn dev []
  (reset! devserver
          (http/start-server wrapped-handler {:port  3030
                                              :join? false})))

(defn halt []
  (when-let [ds @devserver]
    (.close ds)
    (reset! devserver nil)))

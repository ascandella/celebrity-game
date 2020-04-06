(ns celebrity.core
  (:require [compojure.core :as compojure :refer [GET]]
            [compojure.route :as route]
            [ring.middleware.reload :refer [wrap-reload]]
            [ring.middleware.params :as params]
            [aleph.http :as http]
            [manifold.stream :as s]
            [manifold.deferred :as d]
            ;;[manifold.bus :as bus]
            [clojure.core.async :as a])
  (:gen-class))

(def non-websocket-request
  {:status  400
   :headers {"Content-type" "text/plain"}
   :body    "Expected a websocket request."})

(defn game-handler
  [req]
  (->
   (d/let-flow
    [conn (http/websocket-connection req)]
    ;; TODO this
    (s/connect conn conn))
   (d/catch
       (fn [_]
         non-websocket-request))))

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

(ns celebrity.core
  (:require [compojure.core :as compojure :refer [GET]]
            [ring.middleware.params :as params]
            [compojure.route :as route]
            [aleph.http :as http]
            [byte-streams :as bs]
            [manifold.stream :as s]
            [manifold.deferred :as d]
            [manifold.bus :as bus]
            [clojure.core.async :as a])
  (:gen-class))

(def non-websocket-request
  {:status 400
   :headers {"Content-type" "text/plain"}
   :body "Expected a websocket request."})

;; TODO(aiden) remove this
(defn echo-handler
  [req]
  (-> (d/let-flow [socket (http/websocket-connection req)]
         ;; connect the socket to itself
         (s/connect socket socket))
      (d/catch
          (fn [_]
            non-websocket-request))))

(defn game-handler
  [req]
  (->
   (d/let-flow [conn (http/websocket-connection req)]
        ;; TODO this
               nil)
   (d/catch
       (fn [_]
         non-websocket-request))))

(defn health-handler
  [req]
  {:status 200
   :headers {"Content-type" "text/plain"}
   :body "OK"})

(def handler
  (params/wrap-params
   (compojure/routes
    (GET "/game" [] game-handler)
    (GET "/echo" [] echo-handler)
    (GET "/health" [] health-handler)
    (route/not-found "No such page."))))

(defn get-port
  ([] (get-port "PORT"))
  ([key] (Integer/valueOf (or (System/getenv key) "3030"))))

(defn -main
  [& args]
  (http/start-server handler {:port (get-port)}))

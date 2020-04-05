(ns celebrity.core
  (:require [ring.adapter.jetty :refer [run-jetty]])
  (:gen-class))


(defn handler [request]
  {:status 200
   :headers {"Content-Type" "text/html"}
   :body "Hello, World"})

(defn -main
  [& args]
  (run-jetty handler {:port (Integer/valueOf (or (System/getenv "PORT") "3000"))}))

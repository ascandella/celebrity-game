(defproject celebrity "0.1.0-SNAPSHOT"
  :description "Celebrity Game backend"
  :url "https://github.com/ascandella/celebrity-game"
  :license {:name "MIT"
            :url "https://opensource.org/licenses/MIT"}

  :dependencies [[org.clojure/clojure "1.10.1"]
                 [org.clojure/core.async "0.4.474"]
                 [ring/ring-core "1.6.3"]
                 [aleph "0.4.6"]
                 [compojure "1.6.1"]]

  :main ^:skip-aot celebrity.core

  :target-path "target/%s"

  :profiles
  {:uberjar {:aot :all}
   :test {:dependencies [[ring/ring-mock "0.4.0"]]}}

  :ring
  {:handler celebrity.core/handler
   ;; keep ring from trying to import test things
   :reload-paths ["src"]
   ;; for running in docker
   :open-browser? false}
  ;; provides "lein ring server"
  :plugins [[lein-ring "0.12.5"]])

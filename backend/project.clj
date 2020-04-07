(defproject celebrity "0.1.0-SNAPSHOT"
  :description "Celebrity Game backend"
  :url "https://github.com/ascandella/celebrity-game"
  :license {:name "MIT"
            :url "https://opensource.org/licenses/MIT"}

  :dependencies [[org.clojure/clojure "1.10.1"]
                 [org.clojure/core.async "0.4.474"]
                 [org.clojure/data.json "1.0.0"]
                 [org.clojure/tools.logging "1.0.0"]
                 [ring "1.7.0"]
                 [aleph "0.4.6"]
                 [compojure "1.6.1"]]

  :main ^:skip-aot celebrity.core

  :target-path "target/%s"

  :profiles
  {:uberjar {:aot :all}
   :test {:dependencies [[ring/ring-mock "0.4.0"]]}})

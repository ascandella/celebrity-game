(defproject celebrity-game "0.1.0-SNAPSHOT"
  :description "Celebrity Game backend"
  :url "https://github.com/ascandella/celebrity-game"
  :license {:name "MIT"
            :url "https://opensource.org/licenses/MIT"}
  :dependencies [[org.clojure/clojure "1.10.1"]
                 [ring/ring-core "1.6.3"]
                 [ring/ring-jetty-adapter "1.6.3"]]
  :main ^:skip-aot celebrity-game.core
  :target-path "target/%s"
  :profiles {:uberjar {:aot :all}}

  :ring
  {:handler celebrity-game.core/handler
   :open-browser? false}
  :plugins [[lein-ring "0.12.5"]])

(defproject celebrity "0.1.0-SNAPSHOT"
  :description "Celebrity Game backend"
  :url "https://github.com/ascandella/celebrity-game"
  :license {:name "MIT"
            :url  "https://opensource.org/licenses/MIT"}

  :dependencies [[org.clojure/clojure "1.10.1"]
                 [org.clojure/core.async "0.4.474"]
                 [org.clojure/data.json "1.0.0"]
                 [com.taoensso/timbre "4.10.0"]
                 [me.raynes/fs "1.4.6"]
                 [spootnik/signal "0.2.4"]
                 [camel-snake-kebab "0.4.1"]
                 [ring "1.7.0"]
                 [stemmers "0.2.2"]
                 [aleph "0.4.6"]
                 [compojure "1.6.1"]]

  :main ^:skip-aot celebrity.core

  :target-path "target/%s"

  :plugins [[jonase/eastwood "0.3.11"]
            [lein-kibit "0.1.5"]]

  ;; necessary for :else in cond expression
  :eastwood {:exclude-linters [:constant-test]}

  :profiles
  {:uberjar {:aot :all}
   :test    {:dependencies [[ring/ring-mock "0.4.0"]]}})

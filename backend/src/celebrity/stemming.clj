(ns celebrity.stemming
  (:require [stemmers.core :as stemmers]
            [clojure.string :as str]))

(defn stem
  [phrase]
  (str/join " " (stemmers/stems phrase)))

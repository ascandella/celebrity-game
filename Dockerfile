FROM circleci/clojure:openjdk-14-lein-buster

ENV PORT 3030

WORKDIR /game

COPY . .

RUN lein ring server

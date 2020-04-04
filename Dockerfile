FROM circleci/clojure:openjdk-14-lein-buster

# Override circleci user in base image
USER root
ENV PORT 3030

WORKDIR /game
COPY project.clj .
RUN lein deps
RUN lein with-profile test deps

COPY . /game

CMD lein ring server

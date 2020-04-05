FROM node:13-stretch

ENV PORT 3040
ARG NODE_ENV=development
WORKDIR /frontend

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

CMD yarn run next -p "${PORT}"

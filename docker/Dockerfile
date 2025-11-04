FROM node:lts-alpine3.20 AS build-stage

WORKDIR /app

COPY package*.json ./
RUN yarn install
RUN yarn cache clean

COPY . .

RUN yarn run build

FROM nginx:stable-alpine AS production-stage
COPY ./docker/nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx"]
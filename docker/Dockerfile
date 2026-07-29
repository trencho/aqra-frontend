FROM node:24-alpine AS build-stage

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# corepack provisions the yarn version pinned in package.json's packageManager
# field. .yarnrc.yml must be copied with it -- it carries nodeLinker:
# node-modules, without which yarn 4 falls back to Plug'n'Play and the Vue CLI
# build cannot resolve its modules.
RUN corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable
RUN yarn cache clean

COPY . .

RUN yarn run build

FROM nginx:stable-alpine AS production-stage
COPY ./docker/nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx"]

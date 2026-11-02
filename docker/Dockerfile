# Pinned to an explicit Alpine release rather than the floating `26-alpine`,
# so a base-image change is a reviewable commit instead of a silent rebuild.
# Dependabot's docker ecosystem raises the bumps.
FROM node:26-alpine3.24 AS build-stage

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

# corepack provisions the yarn version pinned in package.json's packageManager
# field. .yarnrc.yml must be copied with it -- it carries nodeLinker:
# node-modules, without which yarn 4 falls back to Plug'n'Play and the Vue CLI
# build cannot resolve its modules. Node 25+ no longer bundles corepack, so it is
# installed first, pinned like everything else.
RUN npm install -g corepack@0.36.0 && corepack enable

COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable
RUN yarn cache clean

COPY . .

RUN yarn run build

FROM nginx:stable-alpine3.24 AS production-stage
COPY ./docker/nginx.conf /etc/nginx/nginx.conf

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build-stage /app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx"]

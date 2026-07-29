# AQRA — air quality monitoring for North Macedonia

A single-page app for exploring air-quality data across North Macedonia. It
renders a Leaflet map with pollutant heatmaps and a 24-hour time slider,
historical statistics as Chart.js line charts, and an embedded view of the AQRA
REST API documentation.

It ships two ways: as an nginx container on Kubernetes, and as a Capacitor
mobile app for Android and iOS.

## Requirements

- **Node 24** (the current LTS)
- **Yarn 4.18.0** — provisioned automatically by corepack from the
  `packageManager` field. No global install needed; run `corepack enable` once.

## Getting started

```bash
yarn install     # corepack fetches the pinned yarn, then installs
yarn dev         # Vite dev server on http://localhost:8080
```

Other scripts:

| Command | What it does |
|---|---|
| `yarn build` | Production build into `dist/` |
| `yarn preview` | Serve the built `dist/` locally |
| `yarn test` | Run the test suite |
| `yarn test:watch` | Run the tests in watch mode |
| `yarn test:coverage` | Run with coverage; fails below the configured thresholds |
| `yarn lint` | ESLint over the project |
| `yarn format` | Prettier over the project |

## Configuration

None is required. The app defaults to the public AQRA API at
`https://aqra.feit.ukim.edu.mk/api/v1`.

To point it elsewhere, copy `.env.example` to `.env.local` and set
`VITE_AQRA_API_URL`. Only variables prefixed `VITE_` reach the browser bundle.

## Project layout

```
src/
  classes/      domain models, each with a fromApi mapper
  components/   17 single-file components across four feature areas
  constants/    pollutants, map defaults, navigation tabs, en/mk translations
  services/     api, axios instance, i18n, pinia, vuetify
  stores/       Pinia stores (airPollution, locale)
  utils/        Leaflet map construction, chart series, concurrency helper
```

## Stack

Vue 3 · Vite · Vuetify 4 · Pinia · vue-i18n 11 · Leaflet · Chart.js · Vitest

## Docker

```bash
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d   # http://localhost:8080
```

The image is a multi-stage build: Node compiles the bundle, nginx serves it.
`docker/nginx.conf` carries the SPA fallback so deep links survive a refresh.
See [docker/README.md](docker/README.md) for more.

## Kubernetes

Manifests live in `kubernetes/`, targeting the `aqra` namespace:

```bash
kubectl kustomize kubernetes/ | kubectl apply -f -
```

The Deployment uses `imagePullPolicy: Never`, so the image must be built on the
node itself rather than pulled from a registry. See
[kubernetes/README.md](kubernetes/README.md).

## Mobile

```bash
yarn build
npx cap sync
npx cap open android   # or: npx cap open ios
```

## Continuous integration

- **CI** — lint, test with coverage, and build on every push and pull request.
- **Security scan** — OSV scan of the lockfile plus `yarn npm audit`, on every
  change and weekly, so a newly published advisory is caught even against an
  unchanged lockfile.
- **Deploy** — runs only after CI succeeds on `master`.

## Contributing

`yarn lint` and `yarn test` must pass. Dependencies are pinned to exact
versions — no `^` or `~` ranges — and `yarn.lock` is committed, so
`yarn install --immutable` must succeed.

## Licence

[MIT](LICENSE)

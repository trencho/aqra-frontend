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
| `yarn mock-api` | Fixture-backed stand-in for the AQRA API on `:8081` (no dependencies) |
| `yarn dev:mock` | Dev server pointed at `yarn mock-api` instead of production |
| `yarn test` | Run the test suite |
| `yarn test:watch` | Run the tests in watch mode |
| `yarn test:coverage` | Run with coverage; fails below the configured thresholds |
| `yarn lint` | ESLint over the project |
| `yarn typecheck` | `vue-tsc --noEmit` over `src/` — not `tsc`, which cannot read `.vue` |
| `yarn format` | Prettier over the project |

## Configuration

None is required to start. The app defaults to the public AQRA API at
`https://aqra.feit.ukim.edu.mk/api/v1`.

To point it elsewhere, copy `.env.example` to `.env.local` and set
`VITE_AQRA_API_URL`. Only variables prefixed `VITE_` reach the browser bundle.

### Working without the API

**The public API is failing** (`5xx` on every data route; it answered 503 in July
and 500 when last checked on 2026-08-18), so a plain `yarn dev` gives you a
working app shell with empty Map and Statistics tabs: the API returns no data.

For local work, run the fixture-backed stand-in instead. It has no dependencies
and serves the six endpoints the app calls, with a deterministic 24 hours of
readings:

```bash
yarn mock-api    # terminal 1 — API stub on http://localhost:8081
yarn dev:mock    # terminal 2 — dev server pointed at it
```

`yarn dev:mock` runs Vite in `mock` mode, which loads `.env.mock`. That file is
committed on purpose: it holds no secrets, and the alternative is every
contributor reconstructing it by hand.

## Project layout

```
src/
  classes/      domain models, each with a fromApi mapper
  components/   17 single-file components across four feature areas
  constants/    pollutants, map defaults, navigation tabs, en/mk translations
  router/       vue-router config, derived from the Tabs constant
  services/     api, axios instance, i18n, pinia, vuetify
  stores/       Pinia stores (airPollution, locale)
  types/        ambient declarations and shared domain/API types
  utils/        Leaflet map construction, chart series, concurrency helper
```

Routes (`/`, `/map`, `/statistics`, `/api-docs`) are derived from a single
`Tabs` constant, so the tab bar, the drawer and the routing table cannot
disagree. The route is the source of truth and the store mirrors it via
`router.afterEach`, not the other way round.

## Stack

Vue 3 · Vite · Vuetify 4 · Pinia · vue-router · vue-i18n 11 · Leaflet ·
Chart.js · Vitest

## Docker

```bash
docker compose -f docker/docker-compose.yml build
docker compose -f docker/docker-compose.yml up -d   # http://localhost:8080
```

The image is a multi-stage build: Node compiles the bundle, nginx serves it.
`docker/nginx.conf` carries the SPA fallback so deep links survive a refresh.
See [docker/README.md](docker/README.md) for more.

These commands are for running locally. Deployments use the image CI publishes
to GHCR, not a locally-built one.

## Kubernetes

Manifests live in `kubernetes/`, targeting the `aqra` namespace:

```bash
kubectl kustomize kubernetes/ | kubectl apply -f -
```

The Deployment pulls `ghcr.io/trencho/aqra-frontend:latest`, built and pushed by
CI — nothing is built on the node. See
[kubernetes/README.md](kubernetes/README.md).

## Mobile

```bash
yarn build
npx cap sync
npx cap open android   # or: npx cap open ios
```

## Continuous integration

- **CI** — lint, typecheck, test with coverage, and build on every push and pull request.
- **Security scan** — OSV scan of the lockfile plus `yarn npm audit`, on every
  change and weekly, so a newly published advisory is caught even against an
  unchanged lockfile.
- **Deploy** — runs only after CI succeeds on `master`.

## Contributing

`yarn lint`, `yarn typecheck` and `yarn test` must pass. Dependencies are pinned
to exact versions — no `^` or `~` ranges — and `yarn.lock` is committed, so
`yarn install --immutable` must succeed.

The app is TypeScript under `strict`, plus `noUncheckedIndexedAccess` and
`exactOptionalPropertyTypes`. `allowJs` is off, so a new `.js` file under `src/`
is a compile error rather than an untyped island.

## Licence

[MIT](LICENSE)

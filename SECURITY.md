# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

Use GitHub's [private vulnerability
reporting](https://github.com/trencho/aqra-frontend/security/advisories/new) —
it opens a draft advisory visible only to the maintainers. If you would rather
use email, write to `trenche` at `feit.ukim.edu.mk`.

Please include what you were doing, what happened, and enough detail to
reproduce it. You will get an acknowledgement; this is a small academic project
maintained in spare time, so please allow a reasonable window before disclosing
publicly.

## Scope

This repository is the **frontend only** — a static single-page app served by
nginx. It holds no user accounts, no database and no server-side logic of its
own.

The AQRA REST API it reads from (`aqra.feit.ukim.edu.mk`) is a **separate
system** and is not in scope here. Report API issues to the same address, but
say clearly that they concern the API.

The app ships no secrets. Only `VITE_`-prefixed variables reach the browser
bundle, and the sole one is the public API base URL (see `.env.example`).
`kubernetes/vue-sealed-secret.yml` is a bitnami SealedSecret — ciphertext that
only the cluster's controller can decrypt — and is safe to read.

## Supported versions

Only `master` is supported. There are no release branches and no backports;
fixes land on `master` and go out with the next deploy.

## What already runs

Every push and pull request runs an [OSV
scan](.github/workflows/security-scan.yml) of `yarn.lock` plus
`yarn npm audit --severity moderate`, and the scan also runs weekly so a newly
published advisory against an unchanged lockfile is still caught. Dependabot
watches npm, GitHub Actions, Gradle and the Docker base images.

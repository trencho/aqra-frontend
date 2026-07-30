#!/bin/bash
set -e  # Stop on error

kubectl rollout restart deployment aqra-frontend -n aqra

echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/aqra-frontend -n aqra --watch=true

# This script used to end with `docker system prune -a --volumes --force`, and
# it ran on every deploy. That command is host-wide, not scoped to this app: on
# a single-node cluster shared with other workloads it removes their images and,
# with --volumes, their data. Reclaiming disk is a deliberate maintenance
# action, not a deploy side effect -- and if it is wanted, the scoped
# `docker image prune -f` (dangling images only) is the safe form.

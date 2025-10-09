#!/bin/bash
set -e  # Stop on error

kubectl rollout restart deployment vue -n aqra

echo "Waiting for deployments to be ready..."
kubectl rollout status deployment/vue -n aqra --watch=true

echo "Cleaning up unused Docker resources..."
docker system prune -a --volumes --force

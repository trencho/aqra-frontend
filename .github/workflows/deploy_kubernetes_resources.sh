#!/bin/bash
set -e  # Stop on error

KUBERNETES_DIR="${GIT_REPO_PATH}/kubernetes"

# Apply through kustomize rather than naming manifests one by one.
# kustomization.yml is the single source of truth for which objects make up
# this workload, and it deliberately excludes the old kompose dump that
# declared a second, differently-named copy of the Service and Ingress.
# Applying files individually is what let that dump back into the cluster.
echo "Applying Kubernetes resources..."
kubectl apply -k "${KUBERNETES_DIR}"

echo "Waiting for the deployment to become ready..."
kubectl rollout status deployment/aqra-frontend -n aqra --watch=true

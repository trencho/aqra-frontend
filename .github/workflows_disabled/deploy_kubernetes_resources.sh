#!/bin/bash
set -e  # Stop on error

KUBERNETES_DIR="${GIT_REPO_PATH}/kubernetes"

echo "Applying base resources..."
kubectl apply -f "${KUBERNETES_DIR}/resources.yml"

echo "Deploying Vue application..."
kubectl apply -f "${KUBERNETES_DIR}/deployment/vue-deployment.yml"
kubectl rollout status deployment/vue -n aqra --watch=true

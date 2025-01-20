#!/bin/bash

kubectl get pods -n aqra | grep -E 'vue[a-z0-9\-]*' -iwo | tr -d '\n' | xargs kubectl delete pod -n aqra
echo Sleeping for 30 seconds for the deployments to pull the new images
sleep 30
docker system prune -a --volumes --force

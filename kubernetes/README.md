# Single node kubernetes cluster

> **Why the secret is still called `vue-secret`.** The Deployment, Service and
> Ingress were renamed `vue` → `aqra-frontend`, but the SealedSecret was not.
> It carries no scope annotation, so it uses bitnami's default *strict* scope
> and is encrypted against its `namespace/name` pair (`aqra/vue-secret`).
> Renaming it makes it undecryptable and the pod never starts. Renaming it
> properly means re-sealing from the plaintext with the cluster's public key —
> see "Retrieve sealed secrets from the cluster" below.
>
> Separately, every key it holds is dead config: none is `VITE_`-prefixed, so
> none of it reaches the browser bundle.

###### Apply sealed secrets controller and generate sealed secrets from existing secrets

```
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/latest/download/controller.yaml

kubeseal < kubernetes/vue-secret.yml -o yaml > kubernetes/vue-sealed-secret.yml
```
```
kubectl apply -f kubernetes/vue-sealed-secret.yml
```

###### Generate single yml files for applying all necessary kubernetes resources

```
kubectl kustomize kubernetes > kubernetes/resources.yml
```

###### Apply all system resources

```
kubectl apply -f kubernetes/resources.yml
kubectl apply -f kubernetes/aqra-frontend-deployment.yml
```

###### Get deployed pods in namespace aqra

```
kubectl get pods -n aqra
```

###### Describe deployed pods

```
kubectl describe pod [pod-name] -n aqra
```

```
kubectl get pods -n aqra | grep -E 'vue[a-z0-9\-]*' -iwo | tr -d '\n' | xargs kubectl describe pod -n aqra
```

###### Follow logs of deployed pod

```
kubectl logs -f [pod-name] -n aqra
```

```
kubectl get pods -n aqra | grep -E 'vue[a-z0-9\-]*' -iwo | tr -d '\n' | xargs kubectl logs -f -n aqra
```

###### Enter bash of deployed pod

```
kubectl exec -n aqra --stdin --tty [pod-name] -- /bin/bash
```

###### Delete and reapply deployments if changes are made to the Docker images

```
kubectl delete -f kubernetes/aqra-frontend-deployment.yml
```

```
kubectl apply -f kubernetes/aqra-frontend-deployment.yml
```

###### Retrieve sealed secrets from the cluster

```
kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key -o yaml > kubernetes/master.key
```

```
kubeseal --recovery-unseal < kubernetes/vue-sealed-secret.yml --recovery-private-key kubernetes/master.key -o yaml > \
kubernetes/vue-secret.yml
```

###### Cleanup resources by deleting persistent volumes and used namespaces

```
kubectl delete namespace aqra
kubectl delete namespace cert-manager
kubectl delete namespace ingress-nginx
kubectl delete namespace metallb-system
kubectl delete pv flaskdata-pv mongodata-pv
```

###### Reset kubernetes cluster

```
kubeadm reset
```

###### Upgrade the kubernetes cluster

```
kubeadm upgrade plan
kubeadm upgrade apply latest
```
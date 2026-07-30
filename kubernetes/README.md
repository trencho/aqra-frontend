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

## One-off cutover: `vue` → `aqra-frontend`

The Deployment, Service and Ingress were renamed. The cluster still runs the
old `vue`-named objects, and **nothing in the deploy pipeline removes them** —
a Deployment's `selector` is immutable, so this is a delete-and-recreate, not a
rolling update. Do this once, by hand, in a window where someone can watch.

1. **Make sure the image has been published.** The Deployment pulls
   `ghcr.io/trencho/aqra-frontend:latest`, built and pushed by the
   `build-and-push` job in `.github/workflows/build-deploy.yml`. Nothing is
   built on the node any more.

   Confirm the package exists and is **public** — a private GHCR package makes
   the node's pull fail with `401 Unauthorized`, and the pod never starts:

   ```
   docker pull ghcr.io/trencho/aqra-frontend:latest    # from anywhere, unauthenticated
   ```

   If that fails, either flip the package to public under
   *Packages → aqra-frontend → Package settings → Change visibility*, or add an
   `imagePullSecret` (see below).

2. **Remove the old objects.** The old Service selects
   `io.kompose.service: vue`, which the new pods do not carry, so leaving it in
   place means an Ingress pointing at a Service with zero endpoints.

   ```
   kubectl delete deployment vue -n aqra
   kubectl delete service vue -n aqra
   kubectl delete ingress vue-ingress -n aqra
   ```

3. **Apply the new set.**

   ```
   kubectl apply -k kubernetes/
   kubectl rollout status deployment/aqra-frontend -n aqra
   ```

The SealedSecret is *not* part of this rename — see the note above.

### If the GHCR package must stay private

Public is simpler and appropriate here — the image is a static Vue build plus
nginx, and the repository is already public. If it is kept private, the node
needs credentials:

```
kubectl create secret docker-registry ghcr \
  --docker-server=ghcr.io \
  --docker-username=<github-username> \
  --docker-password=<PAT with read:packages> \
  -n aqra
```

and the Deployment's pod spec needs `imagePullSecrets: [{name: ghcr}]`. That is
a credential to rotate and a manifest change, which is why public is preferred.

### Why the image is pulled rather than built on the node

The node runs **containerd**, not Docker. `docker build` writes to Docker's
image store; kubelet reads containerd's. They are separate, so an image built
on the node with `docker compose build` is invisible to the cluster —
`docker images` lists it while the pod sits in `ErrImageNeverPull`. Every
workload in this namespace was stranded that way for months.

Pulling from a registry removes the failure mode entirely: there is no
node-local store to go stale, and neither a prune, an image GC, nor another
runtime switch can strand the deployment again. Do not reintroduce
`imagePullPolicy: Never`.

###### Apply sealed secrets controller and generate sealed secrets from existing secrets

```
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/latest/download/controller.yaml

kubeseal < kubernetes/vue-secret.yml -o yaml > kubernetes/vue-sealed-secret.yml
```
```
kubectl apply -f kubernetes/vue-sealed-secret.yml
```

###### Apply all system resources

`kustomization.yml` lists every object that makes up this workload, so one
command applies the lot. This is also what `deploy_kubernetes_resources.sh`
runs — there is no second, hand-maintained list to drift out of sync.

```
kubectl apply -k kubernetes/
```

To see what that resolves to without touching the cluster:

```
kubectl kustomize kubernetes/
```

> A generated `resources.yml` used to be committed here and applied *alongside*
> the individual manifests. It was a kompose dump that redeclared the Service
> and Ingress under their old `vue` names, so applying it recreated objects
> whose selectors no longer matched the pods. It has been deleted; do not
> regenerate it.

###### Get deployed pods in namespace aqra

```
kubectl get pods -n aqra
```

###### Describe deployed pods

```
kubectl describe pod [pod-name] -n aqra
```

```
kubectl get pods -n aqra | grep -E 'aqra-frontend[a-z0-9\-]*' -iwo | tr -d '\n' | xargs kubectl describe pod -n aqra
```

###### Follow logs of deployed pod

```
kubectl logs -f [pod-name] -n aqra
```

```
kubectl get pods -n aqra | grep -E 'aqra-frontend[a-z0-9\-]*' -iwo | tr -d '\n' | xargs kubectl logs -f -n aqra
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
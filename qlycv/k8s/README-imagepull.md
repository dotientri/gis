# Image pull secret

If your Docker images are private on Docker Hub, Kubernetes needs credentials to pull them. Create a Docker registry secret named `regcred` in the `myapp` namespace and attach it to the default ServiceAccount (or add `imagePullSecrets` to your Deployment as done here).

1. Create secret (replace values):

```bash
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=hiiamgay \
  --docker-password='YOUR_DOCKERHUB_TOKEN' \
  --docker-email=you@example.com \
  -n myapp
```

2. Patch default ServiceAccount so all pods use it automatically:

```bash
kubectl patch serviceaccount default -n myapp \
  -p '{"imagePullSecrets": [{"name": "regcred"}]}'
```

3. (Optional) If you prefer to reference the secret only on specific Deployments, the `backend-deployment.yaml` and `frontend-deployment.yaml` in this repo already contain:

```yaml
imagePullSecrets:
- name: regcred
```

4. Restart deployments to retry pulling images:

```bash
kubectl rollout restart deployment/backend -n myapp
kubectl rollout restart deployment/frontend -n myapp
kubectl get pods -n myapp -w
```

Notes:
- Use your Docker Hub username and a personal access token (or password) as the `--docker-password` value.
- If you prefer to make the repositories public, you can mark them public in Docker Hub and no secret is needed.

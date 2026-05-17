Dưới đây là một file Markdown duy nhất, siêu chi tiết, bằng tiếng Việt — hướng dẫn CI/CD triển khai backend, frontend và DB sử dụng: Jenkins (local), k3s (local Kubernetes), Docker Hub và GitHub. Ở đầu tôi liệt kê các bước hành động rõ ràng, sau đó là nội dung chi tiết, cấu hình mẫu và ví dụ `Jenkinsfile` + manifests + Dockerfile. Bạn đã cài k3s và đã có trong Jenkins hai credentials: `github-token` và `dockerhub-creds` — hướng dẫn dưới đây giả định những credential đó đã tồn tại trong Jenkins.

Các bước hành động (tóm tắt)
1. Chuẩn bị môi trường local: Docker, k3s, kubectl, Jenkins (đã cài k3s và Jenkins theo bạn).
2. Tạo Dockerfile cho `backend` và `frontend`.
3. Tạo manifests Kubernetes cho `namespace`, `postgres` (Secret/PVC/Deployment/Service), `backend` và `frontend`.
4. Thêm credential kubeconfig vào Jenkins (nếu chưa có) và kiểm tra `github-token`, `dockerhub-creds`.
5. Viết `Jenkinsfile` (Declarative Pipeline): checkout → build images → push Docker Hub → deploy lên k3s → migration optional.
6. Cấu hình webhook GitHub → Jenkins để tự động trigger.
7. Kiểm tra, debug, rollback, và best practices bảo mật.

---  
File MD (toàn bộ nội dung bạn có thể lưu thành `ci-cd-k3s-jenkins-dockerhub.md`)

# Hướng dẫn CI/CD đầy đủ: Jenkins (local) + k3s + Docker Hub + GitHub

## Mục tiêu
- Thiết lập pipeline CI/CD để build và deploy:
  - Backend (ví dụ Django/Python)
  - Frontend (ví dụ Vite/React)
  - Database (Postgres) chạy trên k3s
- Công cụ: Jenkins local, k3s (local Kubernetes), Docker Hub, GitHub.
- Giả định: bạn đã cài k3s; Jenkins đã có credentials `github-token` và `dockerhub-creds`.

---

**Giải thích nhanh cho người mới**
- **Jenkins**: CI server chạy pipeline (một file `Jenkinsfile`) gồm nhiều stage (Build → Test → Push → Deploy).
- **k3s**: Kubernetes nhẹ phù hợp để chạy local; dùng `kubectl` để quản lý resources.
- **Docker Hub**: registry để lưu image; Jenkins sẽ push image lên đây.
- **GitHub**: source repository; thiết lập webhook để Jenkins tự chạy khi có push/PR.

---

## Phần 1 — Chuẩn bị môi trường (tóm tắt lệnh)

- Kiểm tra Docker:
```bash
docker --version
```
- Kiểm tra k3s (nếu cài bằng script):
```bash
kubectl get nodes
kubectl get pods -A
```
- Kiểm tra Jenkins (local):
Truy cập `http://<JENKINS_HOST>:8080` và đăng nhập admin.

- Cài `kubectl` nếu cần:
```bash
# Linux example
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

---

## Phần 2 — Kiến trúc file mẫu trong repo
- `Jenkinsfile`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `k8s/namespace.yaml`
- `k8s/postgres.yaml`
- `k8s/backend-deployment.yaml`
- `k8s/frontend-deployment.yaml`
- (tuỳ chọn) `k8s/ingress.yaml` hoặc `k8s/service.yaml`

Bạn nên tạo thư mục `k8s/` trong repo để chứa manifests.

---

## Phần 3 — Dockerfile mẫu

- Backend (Django / Python) — `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

- Frontend (Vite/React) — `frontend/Dockerfile`
```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Phần 4 — Manifests Kubernetes mẫu

- Namespace — `k8s/namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myapp
```

- Postgres (Secret + PVC + Deployment + Service) — `k8s/postgres.yaml`
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: pg-credentials
  namespace: myapp
type: Opaque
stringData:
  POSTGRES_DB: mydb
  POSTGRES_USER: myuser
  POSTGRES_PASSWORD: mypassword
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pg-pvc
  namespace: myapp
spec:
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 5Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: myapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          valueFrom:
            secretKeyRef:
              name: pg-credentials
              key: POSTGRES_DB
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: pg-credentials
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: pg-credentials
              key: POSTGRES_PASSWORD
        ports:
        - containerPort: 5432
        volumeMounts:
        - mountPath: /var/lib/postgresql/data
          name: pgdata
      volumes:
      - name: pgdata
        persistentVolumeClaim:
          claimName: pg-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: myapp
spec:
  ports:
  - port: 5432
    targetPort: 5432
  selector:
    app: postgres
```

- Backend Deployment + Service — `k8s/backend-deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: myapp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: DOCKERHUB_USERNAME/backend:TAG
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          value: postgres://myuser:mypassword@postgres:5432/mydb
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: myapp
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
```

- Frontend Deployment + Service — `k8s/frontend-deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: myapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: DOCKERHUB_USERNAME/frontend:TAG
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: myapp
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

Ghi chú: thay `DOCKERHUB_USERNAME` và `TAG` bằng giá trị runtime (sẽ thay trong pipeline).

---

## Phần 5 — Jenkins: credential và plugin cần thiết

- Plugins khuyến nghị:
  - `git`, `pipeline`, `workflow-aggregator`, `credentials-binding`, `docker-plugin` (nếu dùng Docker on Jenkins), `kubernetes-cli` hoặc `Kubernetes CLI Plugin`, `github` / `github-branch-source` (nếu muốn multibranch).
- Credentials đã có:
  - `github-token` (ID): dùng để checkout private repo hoặc gọi GitHub API.
  - `dockerhub-creds` (ID): kiểu Username with password — dùng để docker login.
- Nếu Jenkins agent cần quyền apply k8s, upload file kubeconfig vào Jenkins credentials:
  - Kind: `Secret file`, ID ví dụ: `kubeconfig` — chứa file kubeconfig của cluster k3s.
- Biến môi trường global (optional): `DOCKERHUB_USERNAME`, `REPO_PREFIX`, `NAMESPACE=myapp`, `KUBE_CONTEXT` — có thể set trong Jenkins -> Configure System hoặc trong Pipeline environment.

---

## Phần 6 — `Jenkinsfile` mẫu (Declarative) — lưu tại gốc repo

Lưu ý: đoạn này dùng `withCredentials` để truy cập `dockerhub-creds` (username,password) và `file` cho `kubeconfig` nếu bạn lưu như Secret file. `github-token` có thể được dùng bởi plugin Git. `GIT_COMMIT` tự động có sẵn nếu Jenkins lấy từ Git plugin; nếu không, bạn có thể lấy bằng `sh "git rev-parse --short HEAD"`.

```groovy
pipeline {
  agent any
  environment {
    DOCKERHUB = "${DOCKERHUB_USERNAME}"         // set trong Jenkins global env hoặc job parameters
    REPO_PREFIX = "${REPO_PREFIX}"             // ví dụ myorg/myrepoprefix
    NAMESPACE = "myapp"
    KUBECONFIG_CRED = 'kubeconfig'             // ID secret file trong Jenkins (nếu có)
    DOCKERHUB_CRED = 'dockerhub-creds'         // đã có trong Jenkins của bạn
  }
  stages {
    stage('Checkout') {
      steps {
        checkout([$class: 'GitSCM', branches: [[name: '*/main']],
                  userRemoteConfigs: [[url: 'https://github.com/YOUR_ORG/YOUR_REPO.git',
                                        credentialsId: 'github-token']]])
      }
    }
    stage('Get Commit') {
      steps {
        script {
          COMMIT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
          env.IMG_TAG = COMMIT
          echo "Image tag: ${env.IMG_TAG}"
        }
      }
    }
    stage('Build & Push Backend') {
      steps {
        dir('backend') {
          withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CRED}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
            sh "docker build -t ${DOCKERHUB}/${REPO_PREFIX}-backend:${IMG_TAG} ."
            sh "echo $DH_PASS | docker login -u $DH_USER --password-stdin"
            sh "docker push ${DOCKERHUB}/${REPO_PREFIX}-backend:${IMG_TAG}"
          }
        }
      }
    }
    stage('Build & Push Frontend') {
      steps {
        dir('frontend') {
          withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CRED}", usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
            sh "docker build -t ${DOCKERHUB}/${REPO_PREFIX}-frontend:${IMG_TAG} ."
            sh "echo $DH_PASS | docker login -u $DH_USER --password-stdin"
            sh "docker push ${DOCKERHUB}/${REPO_PREFIX}-frontend:${IMG_TAG}"
          }
        }
      }
    }
    stage('Deploy to k3s') {
      steps {
        withCredentials([file(credentialsId: "${KUBECONFIG_CRED}", variable: 'KUBECONFIG_FILE')]) {
          sh '''
            export KUBECONFIG=$KUBECONFIG_FILE
            kubectl apply -f k8s/namespace.yaml
            sed "s|DOCKERHUB_USERNAME|${DOCKERHUB}|g; s|TAG|${IMG_TAG}|g" k8s/backend-deployment.yaml | kubectl -n ${NAMESPACE} apply -f -
            sed "s|DOCKERHUB_USERNAME|${DOCKERHUB}|g; s|TAG|${IMG_TAG}|g" k8s/frontend-deployment.yaml | kubectl -n ${NAMESPACE} apply -f -
            kubectl -n ${NAMESPACE} apply -f k8s/postgres.yaml || true
          '''
        }
      }
    }
    stage('Post-Deploy: Migrate DB (optional)') {
      steps {
        withCredentials([file(credentialsId: "${KUBECONFIG_CRED}", variable: 'KUBECONFIG_FILE')]) {
          sh '''
            export KUBECONFIG=$KUBECONFIG_FILE
            # Wait backend ready, then migrate (example Django)
            kubectl -n ${NAMESPACE} rollout status deployment/backend --timeout=120s || true
            kubectl -n ${NAMESPACE} exec deploy/backend -- python manage.py migrate || true
          '''
        }
      }
    }
  }
  post {
    success { echo "Pipeline succeeded: ${env.BUILD_TAG}" }
    failure { echo "Pipeline failed" }
  }
}
```

Ghi chú:
- Thay `YOUR_ORG/YOUR_REPO.git` bằng repo GitHub của bạn.
- `credentialsId: 'github-token'` dùng để checkout nếu repo private.
- Nếu Jenkins agent không có Docker daemon (ví dụ Kubernetes agents), dùng Docker-in-Docker hoặc build image bằng `kaniko`/`buildah`/`skaffold` phù hợp.

---

## Phần 7 — Thiết lập webhook GitHub → Jenkins
- Vào repo GitHub → Settings → Webhooks → Add webhook:
  - Payload URL: `http://<JENKINS_HOST>:8080/github-webhook/`
  - Content type: `application/json`
  - Secret: (tuỳ chọn)
  - Events: `Just the push event` (hoặc PRs)
- Trong Jenkins: cài plugin GitHub và cấu hình “GitHub Server” nếu dùng multibranch pipelines.

---

## Phần 8 — Quy trình vận hành & rollback

- Kiểm tra rollout:
```bash
kubectl -n myapp rollout status deployment/backend
kubectl -n myapp get pods -l app=backend
```
- Xem logs:
```bash
kubectl -n myapp logs -l app=backend -c backend --tail=200
```
- Rollback nhanh:
```bash
kubectl -n myapp rollout undo deployment/backend
kubectl -n myapp rollout undo deployment/frontend
```
- Nếu cần migrate an toàn: dùng job riêng hoặc `kubectl run --rm` để chạy migrate container tách biệt.

---

## Phần 9 — Debugging thường gặp
- `ImagePullBackOff`: kiểm tra image name + tag trên Docker Hub; credentials.
- `CrashLoopBackOff`: `kubectl logs <pod>` / `kubectl describe pod <pod>` để xem lỗi.
- Jenkins không push được image: kiểm tra `docker login` step và credentials ID.
- Jenkins không apply k8s: kiểm tra `KUBECONFIG` file trong credentials và quyền trên cluster.

---

## Phần 10 — Bảo mật & best practices
- Không lưu secrets plaintext trong manifests; dùng `kubectl create secret` hoặc External Secret Manager.
- Không dùng tag `latest` trong production; dùng commit hash hoặc semver.
- Dùng liveness/readiness probes cho pods.
- Tách CI (build/test) và CD (deploy/approve) — thêm manual approval stage cho production.
- Scan images (trivy) trong pipeline trước khi push.

---

## Phần 11 — Checklist triển khai (Quick)
- [ ] Dockerfile backend và frontend có sẵn.
- [ ] `k8s/` manifests đã commit.
- [ ] Jenkins credentials:
  - `github-token` (exists)
  - `dockerhub-creds` (exists)
  - `kubeconfig` (Secret file) — nếu chưa, thêm vào Jenkins.
- [ ] `Jenkinsfile` commit to repo.
- [ ] GitHub webhook configured.
- [ ] Test push: xem Jenkins bắt và pipeline chạy, image push, manifests applied, app reachable.

---

## Phần 12 — Ví dụ lệnh hữu dụng khi tự chạy (local/debug)

- Kết nối kubeconfig (nếu Jenkins sử dụng file):
```bash
export KUBECONFIG=/path/to/k3s/k3s.yaml
kubectl get nodes
kubectl get pods -n myapp
```

- Build image manual:
```bash
docker build -t yourdockerhub/user-backend:tag ./backend
docker push yourdockerhub/user-backend:tag
```

- Áp manifest sau khi thay tag:
```bash
sed "s|DOCKERHUB_USERNAME|yourdockerhub|g; s|TAG|tag|g" k8s/backend-deployment.yaml | kubectl -n myapp apply -f -
```

---

## Phần 13 — Hướng dẫn nhanh cho người mới về Jenkins và k3s (tổng quan học nhanh)

- Jenkins cơ bản:
  - Jobs/Pipelines: pipeline (Jenkinsfile) đặt trong repo => Jenkins chạy.
  - Agents: nơi jobs chạy; agent có thể là máy local hoặc container.
  - Credentials: lưu secrets an toàn; truy cập bằng `withCredentials`.
  - Plugins: mở rộng chức năng (git/docker/k8s).
- k3s cơ bản:
  - `kubectl` thao tác cluster.
  - Resource cơ bản: Pod, Deployment, Service, Ingress, Secret, PVC.
  - `kubectl apply -f` để tạo/update resources.
  - `kubectl rollout` để quản lý versions và rollback.

---

## Phần 14 — Mẹo tối ưu cho local development
- Dùng `kind` hoặc `k3d` nếu muốn dễ tạo cluster ephemeral.
- Dùng `skaffold` hoặc `tilt` cho workflow dev loop: auto-build + deploy khi code thay đổi.
- Dùng `minikube tunnel` hoặc `k3d` để test LoadBalancer/Ingress nếu cần.

---

## Phần 15 — Nếu bạn muốn, tôi có thể:
- Sinh sẵn `Jenkinsfile` và chỉnh manifests dựa trên cấu trúc repo cụ thể của bạn (ví dụ `qlycv/backend`, `qlycv/frontend`).
- Hướng dẫn chi tiết cách upload `kubeconfig` vào Jenkins và cấu hình webhook step-by-step với screenshots (mô tả).
- Viết script migration an toàn cho Django/Postgres.

---

Kết thúc: nếu bạn muốn tôi xuất ra file Markdown hoàn chỉnh để bạn lưu (ví dụ `ci-cd-k3s-jenkins-dockerhub.md`) hoặc tự động điều chỉnh `Jenkinsfile`/manifests dựa trên cấu trúc repo trong workspace (`qlycv/backend`, `qlycv/frontend`), cho tôi biết bạn muốn target path nào (ví dụ `qlycv/backend`), và tôi sẽ tạo nội dung tương ứng.
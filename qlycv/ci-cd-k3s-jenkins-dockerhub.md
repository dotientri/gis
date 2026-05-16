# Hướng dẫn CI/CD triển khai backend + frontend + DB với Jenkins (local) + k3s + Docker Hub + GitHub

## Mục tiêu
Hướng dẫn chi tiết bằng tiếng Việt, chỉ trong một file Markdown, để bạn thiết lập CI/CD cho:
- Backend
- Frontend
- Database (Postgres)

Sử dụng:
- Jenkins local
- k3s local (Kubernetes nhẹ)
- Docker Hub
- GitHub

Giả định bạn đã có:
- k3s đã cài
- Jenkins đã cài
- Jenkins có 2 credentials: `github-token` và `dockerhub-creds`

---

## 1. Giải thích nhanh cho người mới

### Jenkins là gì?
- Jenkins là công cụ CI/CD server.
- Jenkins chạy pipeline tự động theo nội dung `Jenkinsfile` trong repo.
- Pipeline gồm nhiều stage như: `checkout`, `build`, `test`, `push`, `deploy`.
- Jenkins lưu secrets an toàn bằng `Credentials`.

### k3s là gì?
- k3s là Kubernetes nhẹ, phù hợp chạy trên máy local.
- Ta dùng `kubectl` để quản lý cluster k3s.
- Trong k3s, ứng dụng được chạy dưới dạng `Deployment`, `Service`, `Secret`, `PersistentVolumeClaim`.

### Docker Hub là gì?
- Docker Hub là nơi lưu image Docker.
- Jenkins build image backend/frontend và push lên Docker Hub.

### GitHub là gì?
- Nơi lưu source code.
- GitHub sẽ gửi webhook đến Jenkins khi có push, Jenkins tự động chạy pipeline.

---

## 2. Kiến trúc repo chuẩn

Bạn nên có cấu trúc sau trong repo của mình:

```
Jenkinsfile
backend/
  Dockerfile
  requirements.txt
  ...
frontend/
  Dockerfile
  package.json
  ...
k8s/
  namespace.yaml
  postgres.yaml
  backend-deployment.yaml
  frontend-deployment.yaml
```

---

## 3. Dockerfile mẫu

### backend/Dockerfile (Django/Python ví dụ)

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

### frontend/Dockerfile (Vite/React ví dụ)

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

## 4. Manifests Kubernetes mẫu

### k8s/namespace.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: myapp
```

### k8s/postgres.yaml

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
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### k8s/backend-deployment.yaml

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

### k8s/frontend-deployment.yaml

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

> Ghi chú: `DOCKERHUB_USERNAME` và `TAG` sẽ được Jenkins pipeline thay thế khi deploy.

---

## 5. Cấu hình Jenkins cần thiết

### 5.1 Plugin Jenkins nên cài
- `git`
- `pipeline`
- `workflow-aggregator`
- `credentials-binding`
- `docker-plugin` (nếu Jenkins chạy Docker build)
- `kubernetes-cli` hoặc `Kubernetes CLI Plugin`
- `github` / `github-branch-source` nếu dùng GitHub webhook hoặc multibranch

### 5.2 Credentials trong Jenkins
Bạn đã có:
- `github-token` — token GitHub
- `dockerhub-creds` — credentials Docker Hub

Nếu chưa có, thêm thêm:
- `kubeconfig` — Secret file chứa kubeconfig của k3s

### 5.3 Cách thêm kubeconfig vào Jenkins
1. Lấy kubeconfig của k3s:
```bash
sudo cat /etc/rancher/k3s/k3s.yaml > ~/k3s.yaml
```
2. Vào Jenkins UI → Credentials → System → Global → Add Credentials
3. Chọn `Secret file`, upload `~/k3s.yaml`, đặt ID là `kubeconfig`

---

## 6. Jenkinsfile mẫu

Đặt file này ở gốc repo của bạn.

```groovy
pipeline {
  agent any
  environment {
    DOCKERHUB = "${DOCKERHUB_USERNAME}" // set trong Jenkins global env hoặc job param
    REPO_PREFIX = "${REPO_PREFIX}"      // ví dụ myrepo hoặc myorg/myrepo
    NAMESPACE = "myapp"
    KUBECONFIG_CRED = 'kubeconfig'
    DOCKERHUB_CRED = 'dockerhub-creds'
  }
  stages {
    stage('Checkout') {
      steps {
        checkout([$class: 'GitSCM', branches: [[name: '*/main']],
                  userRemoteConfigs: [[url: 'https://github.com/YOUR_ORG/YOUR_REPO.git', credentialsId: 'github-token']]])
      }
    }
    stage('Get Commit ID') {
      steps {
        script {
          COMMIT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
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
    stage('Post-Deploy: DB migrate (optional)') {
      steps {
        withCredentials([file(credentialsId: "${KUBECONFIG_CRED}", variable: 'KUBECONFIG_FILE')]) {
          sh '''
            export KUBECONFIG=$KUBECONFIG_FILE
            kubectl -n ${NAMESPACE} rollout status deployment/backend --timeout=120s || true
            kubectl -n ${NAMESPACE} exec deploy/backend -- python manage.py migrate || true
          '''
        }
      }
    }
  }
  post {
    success {
      echo "Pipeline succeeded: ${env.BUILD_TAG}"
    }
    failure {
      echo "Pipeline failed"
    }
  }
}
```

> Lưu ý: Thay `YOUR_ORG/YOUR_REPO.git` bằng địa chỉ repo GitHub của bạn.

---

## 7. Cấu hình webhook GitHub → Jenkins

1. Vào GitHub repo của bạn → Settings → Webhooks → Add webhook
2. Payload URL: `http://<JENKINS_HOST>:8080/github-webhook/`
3. Content type: `application/json`
4. Events: chọn `Just the push event`
5. Save

Nếu Jenkins có plugin GitHub, webhook này sẽ kích hoạt job khi có push.

---

## 8. Cách kiểm tra và debug

### Kiểm tra k3s
```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl get nodes
kubectl get pods -n myapp
```

### Kiểm tra logs
```bash
kubectl -n myapp logs -l app=backend -c backend --tail=200
kubectl -n myapp describe pod <pod-name>
```

### Kiểm tra rollout
```bash
kubectl -n myapp rollout status deployment/backend
kubectl -n myapp get svc -n myapp
```

### Rollback
```bash
kubectl -n myapp rollout undo deployment/backend
kubectl -n myapp rollout undo deployment/frontend
```

---

## 9. Một số lỗi thường gặp và cách xử lý

- `ImagePullBackOff`:
  - Kiểm tra image name/tag đúng trên Docker Hub.
  - Kiểm tra Docker Hub credentials Jenkins.
- `CrashLoopBackOff`:
  - Xem log pod.
  - Kiểm tra biến môi trường backend như `DATABASE_URL`.
- Jenkins không push image:
  - Kiểm tra step `docker login`.
  - Kiểm tra credential ID `dockerhub-creds`.
- Jenkins không chạy `kubectl`:
  - Kiểm tra `kubeconfig` đã upload vào Jenkins và agent có quyền đọc file.

---

## 10. Best practices

- Không commit secrets vào repo.
- Dùng `image tag` cố định như `commit hash` hoặc version, không dùng `latest`.
- Dùng Kubernetes Secrets cho mật khẩu database.
- Tách CI (build/test) và CD (deploy) nếu cần quy trình phê duyệt.
- Cài probes (`liveness`, `readiness`) cho backend/frontend khi triển khai thật.
- Scan image bằng `trivy` hoặc công cụ tương tự trước khi push.

---

## 11. Checklist nhanh trước khi chạy lần đầu

- [ ] Jenkins có `github-token`
- [ ] Jenkins có `dockerhub-creds`
- [ ] Jenkins có `kubeconfig` (nếu dùng)
- [ ] `Jenkinsfile` đã commit vào repo
- [ ] `backend/Dockerfile` và `frontend/Dockerfile` đã tồn tại
- [ ] `k8s/` folder chứa manifests
- [ ] Webhook GitHub đã cấu hình
- [ ] Jenkins agent có quyền chạy Docker và `kubectl`

---

## 12. Nếu bạn cần đơn giản hơn

Nếu bạn muốn, chỉ cần copy file này vào repo và chỉnh các giá trị sau:
- `YOUR_ORG/YOUR_REPO.git`
- `DOCKERHUB_USERNAME`
- `REPO_PREFIX`
- `myapp` nếu muốn namespace khác
- `postgres` password/user/db phù hợp

---

## 13. Kết luận

File này là hướng dẫn đầy đủ bằng tiếng Việt cho người chưa biết Jenkins và k3s.
Nó giải thích từ kiến trúc, cấu trúc repo, Dockerfile, manifests, Jenkinsfile, webhook, debug và best practices.

Chúc bạn triển khai thành công!

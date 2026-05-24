# Tổng hợp Kubernetes (K8s) — Hướng dẫn chi tiết cho dự án GIS

Tài liệu này gộp và mở rộng hai file `hoc-k8s.md` và `k8s-giai-thich-yaml.md`. Mục tiêu: cung cấp một hướng dẫn thực tế, dễ hiểu và đầy đủ hơn về các khái niệm K8s, cấu trúc YAML thường dùng trong dự án GIS, ví dụ mẫu, lệnh `kubectl` thiết yếu, và các best practices để vận hành an toàn, ổn định.

---

**Tóm tắt nhanh**: Kubernetes là hệ thống điều phối container. Bạn viết các file YAML để mô tả trạng thái mong muốn (Deployment, Service, Ingress, Secret, PVC, v.v.). K8s đảm bảo thực tế khớp với mô tả đó (self-healing, scaling, load balancing).

## 1. Kiến thức nền tảng (Mental model)

- **Node**: máy chủ vật lý/VM (chạy Pod).
- **Pod**: đơn vị chạy thấp nhất, chứa 1 hoặc nhiều container.
- **Deployment**: quản lý Pod, khai báo `replicas`, cập nhật (rolling update), rollback.
- **Service**: tạo endpoint ổn định (ClusterIP, NodePort, LoadBalancer).
- **Ingress**: định tuyến HTTP(S) từ bên ngoài vào Service theo hostname/path.
- **ConfigMap**: lưu cấu hình không nhạy cảm.
- **Secret**: lưu dữ liệu nhạy cảm (Base64 encoded), dùng để mount vào Pod hoặc làm biến môi trường.
- **PVC (PersistentVolumeClaim)**: yêu cầu lưu trữ bền vững cho Database/ứng dụng cần dữ liệu không mất khi Pod chết.
- **Namespace**: phân vùng logic trong cluster (dev/prod/test).

## 2. Các file YAML thường thấy trong dự án GIS (giải thích + ví dụ)

Lưu ý: toàn bộ ví dụ có thể áp dụng trong namespace `myapp` hoặc `default` nếu không chỉ định.

### 2.1 `deployment.yaml` — triển khai ứng dụng

Vai trò: mô tả số bản sao, image, biến môi trường, tài nguyên, probes.

Ví dụ (Django backend nâng cấp với readiness/liveness probes):

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
        image: DOCKERHUB_USERNAME/gis-project-backend:TAG
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /healthz
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

Ghi chú:
- Luôn thêm `readinessProbe` để Ingress chỉ chuyển traffic khi Pod sẵn sàng.
- `resources.requests` giúp scheduler chọn Node phù hợp; `limits` tránh Pod tiêu thụ quá nhiều.

### 2.2 `service.yaml` — nội bộ (ClusterIP)

Ví dụ:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: myapp
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
```

Ghi chú: `ClusterIP` là mặc định cho giao tiếp nội bộ. Nếu cần truy cập trực tiếp từ ngoài (ít dùng vì bảo mật), cân nhắc `LoadBalancer` hoặc `NodePort`.

### 2.3 `ingress.yaml` — đưa dịch vụ ra ngoài

Ví dụ (traefik hoặc ingress-nginx):

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: myapp
  annotations:
    kubernetes.io/ingress.class: "traefik"
spec:
  rules:
  - host: api.congty.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8000
  - host: congty.local
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

Ghi chú: cấu hình TLS thường thêm `tls:` block và secret chứa certs (sử dụng cert-manager cho tự động cấp).

### 2.4 `pvc.yaml` — lưu trữ bền vững

Ví dụ:

```yaml
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
  storageClassName: standard
```

Ghi chú: `storageClassName` tùy vào cluster (minikube, cloud provider có tên khác). Với Postgres, dùng `ReadWriteOnce`.

### 2.5 `secret.yaml` — mật khẩu và kết nối

Ví dụ:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: myapp
type: Opaque
data:
  DATABASE_URL: WW91clBhc3N3b3JkMTIz
```

Ghi chú: Base64 không phải bảo mật xuất sắc — dùng KMS/secret manager (Vault, cloud KMS) nếu cần bảo mật cao hơn.

## 3. Best practices vận hành (ngắn gọn nhưng thiết thực)

- Thêm `readiness` và `liveness` probes cho mọi ứng dụng HTTP.
- Cấu hình `resources.requests` và `limits` phù hợp với tải thực tế.
- Sử dụng `HorizontalPodAutoscaler` (HPA) cho autoscaling theo CPU hoặc metrics tùy chỉnh.
- Tránh lưu secrets trực tiếp trong repo; dùng `kubectl create secret` hoặc kết nối tới Vault.
- Backup PVC/Database định kỳ (cronjob + dump hoặc snapshot của cloud provider).
- Dùng `rolling update` (mặc định của Deployment) và test rollout với `kubectl rollout status`.
- Thiết lập logging/monitoring: Prometheus + Grafana, Fluentd/ELK cho logs.
- Sử dụng `NetworkPolicy` để giới hạn luồng mạng giữa Pod, tăng an ninh.

## 4. Cheat sheet `kubectl` (thường dùng)

Các lệnh hay dùng trong namespace `myapp`:

```bash
kubectl get all -n myapp
kubectl get pods -n myapp -o wide
kubectl logs <pod> -n myapp
kubectl exec -it <pod> -n myapp -- /bin/sh
kubectl apply -f k8s/deployment.yaml -n myapp
kubectl apply -f k8s/
kubectl describe pod <pod> -n myapp
kubectl rollout status deploy/backend -n myapp
kubectl scale deploy backend --replicas=5 -n myapp
kubectl port-forward svc/backend 8000:8000 -n myapp
```

## 5. Debugging common issues

- ImagePullBackOff: kiểm tra image name/tag, registry credentials (Secret loại `docker-registry`).
- CrashLoopBackOff: `kubectl logs --previous <pod>` để xem log lần trước, kiểm tra liveness probe quá ngắn.
- NotReady pod: kiểm tra `readinessProbe`, cấu hình env vars, secret missing.
- Service không kết nối: kiểm tra label selector, `kubectl get endpoints <svc>`.

## 6. CI/CD & triển khai (gợi ý cho Jenkinsfile trong repo `qlycv/`)

- Pipeline nên build image, push registry, cập nhật tag (immutable tags), sau đó `kubectl set image` hoặc `kubectl apply` manifest đã cập nhật.
- Nên tách config (ConfigMap/Secret) ra khỏi manifest build-time; Jenkins có thể template manifest bằng `envsubst` hoặc `kustomize`.

## 7. Mẫu nhỏ: Deployment + Service + Ingress (tập hợp)

Thường khi deploy, bạn có 3 file hoặc gom vào 1 thư mục `k8s/` và `kubectl apply -f k8s/`.

## 8. Tài liệu tham khảo & bước tiếp theo

- Nếu bạn muốn, tôi có thể:
  - Chuyển toàn bộ `k8s/` hiện có thành templates (kustomize/helm).
  - Thêm ví dụ `Jenkinsfile` để deploy tự động.
  - Viết hướng dẫn backup/restore cho Postgres (dumps & restores).

---

Tài liệu đã được tổng hợp từ [hoc-k8s.md](hoc-k8s.md) và [k8s-giai-thich-yaml.md](k8s-giai-thich-yaml.md).

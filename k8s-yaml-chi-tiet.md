# K8s YAML — Giải thích chi tiết (line-by-line)

Tài liệu này giải thích chi tiết từng trường (field) thường xuất hiện trong các file YAML của Kubernetes: `Deployment`, `Service`, `Ingress`, `PersistentVolumeClaim`, `Secret` và các khái niệm liên quan (probes, resources, volumes, envFrom, imagePullSecrets, v.v.). Mỗi phần gồm: một ví dụ YAML mẫu, rồi phần giải thích dòng‑theo‑dòng (line-by-line) để bạn hiểu vai trò và tác dụng của từng trường.

> Ghi chú: ký hiệu `#` trong các block YAML mẫu chỉ để chú thích, không có trong file thật khi apply.

---

## A. `Deployment` (mẫu đầy đủ có chú giải)

Ví dụ mẫu:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend                     # Tên resource (unique trong namespace)
  namespace: myapp                  # Namespace; nếu không có, sẽ dùng `default`
  labels:                           # Metadata labels — không bắt buộc nhưng hữu ích
    app: backend
spec:
  replicas: 2                       # Số bản sao Pod mong muốn
  selector:
    matchLabels:
      app: backend                  # Selector để Deployment quản lý đúng Pod (phải khớp template.metadata.labels)
  strategy:
    type: RollingUpdate             # Chiến lược cập nhật (RollingUpdate hoặc Recreate)
    rollingUpdate:
      maxSurge: 1                   # Số Pod tối đa được tạo vượt quá replicas trong lúc update
      maxUnavailable: 1             # Số Pod tối đa có thể không sẵn sàng trong lúc update
  template:
    metadata:
      labels:
        app: backend                # Labels gắn vào Pod template — phải khớp selector
    spec:
      imagePullSecrets:             # Nếu pull từ private registry, tham chiếu secret ở đây
      - name: regcred
      containers:
      - name: backend
        image: DOCKERHUB_USERNAME/gis-project-backend:TAG
        ports:
        - containerPort: 8000       # Port mà container lắng nghe
        env:                        # Biến môi trường cụ thể
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
        resources:                  # Resource requests/limits
          requests:
            cpu: "200m"
            memory: "256Mi"
          limits:
            cpu: "500m"
            memory: "512Mi"
        volumeMounts:               # Mount volume vào container
        - mountPath: /data
          name: pg-data
        readinessProbe:             # Kiểm tra sẵn sàng để nhận traffic
          httpGet:
            path: /healthz
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:              # Kiểm tra sống (restart container khi probe fail)
          httpGet:
            path: /healthz
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:                       # Định nghĩa volume ở cấp Pod
      - name: pg-data
        persistentVolumeClaim:
          claimName: pg-pvc
```

Giải thích chi tiết (line-by-line / khối):

- `apiVersion`: chỉ phiên bản API dùng cho object. `apps/v1` là chuẩn cho `Deployment` trên Kubernetes >=1.9.
- `kind`: loại resource, ở đây là `Deployment`.
- `metadata.name`: tên resource — phải tuân thủ quy tắc DNS (lowercase, -).
- `metadata.namespace`: vùng (namespace) chứa resource; nếu không gõ, mặc định `default`.
- `metadata.labels`: metadata dùng để đánh dấu resource, tìm kiếm bằng selectors.
- `spec.replicas`: số pod mục tiêu; Deployment sẽ cố gắng duy trì số lượng này.
- `spec.selector.matchLabels`: bộ điều kiện để chọn Pod mà Deployment quản lý. PHẢI khớp chính xác `template.metadata.labels`.
- `spec.strategy`: cách update Pod khi thay đổi image/config. `RollingUpdate` là mặc định; `maxSurge` và `maxUnavailable` điều chỉnh cadence.
- `spec.template.metadata.labels`: labels sẽ gắn vào Pod được tạo. Khi selector khớp, Pod sẽ được quản lý.
- `spec.template.spec.imagePullSecrets`: dùng để cho phép kubelet pull image từ private registry — tham chiếu tới Secret loại `kubernetes.io/dockerconfigjson`.
- `spec.template.spec.containers[].image`: image container (include tag). Tránh dùng `latest` trong production.
- `ports.containerPort`: miêu tả port container lắng nghe — không tự động expose bên ngoài, chỉ để tài liệu và cho một số controller.
- `env` / `valueFrom.secretKeyRef`: cách lấy biến môi trường từ Secret; key là tên field trong Secret.data.
- `resources.requests` và `resources.limits`: requests là tài nguyên tối thiểu scheduler dùng để quyết định Node; limits là ngưỡng container không vượt quá (cần hợp lý để tránh OOMKill).
- `volumeMounts` và `volumes`: volumeMounts gắn volume vào đường dẫn trong container; volumes định nghĩa nguồn (PVC, emptyDir, hostPath, configMap, secret, v.v.).
- `readinessProbe`: probe báo cho kube-proxy/Ingress biết Pod đã sẵn sàng nhận traffic.
- `livenessProbe`: probe để Kubernetes khởi động lại container khi nó rơi vào trạng thái hỏng.

---

## B. `Service` (chi tiết)

Ví dụ:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: myapp
  labels:
    app: backend
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - name: http
    port: 8000               # Port service bên trong cluster
    targetPort: 8000         # Port trên Pod (có thể là tên hoặc số)
    protocol: TCP
  sessionAffinity: None
```

Giải thích:

- `spec.type`: `ClusterIP` (mặc định, chỉ nội bộ cluster), `NodePort` (mở cổng trên node), `LoadBalancer` (provider cung cấp LB), `ExternalName` (map tới external DNS).
- `spec.selector`: filter chọn Pod dựa trên label; Service sẽ route tới tất cả Pod khớp selector.
- `ports.port`: port dành cho client gọi Service (nội bộ).
- `ports.targetPort`: port thực tế trên Pod (số hoặc tên port được khai báo trong Pod spec).
- `ports.name`: quan trọng khi Service dùng nhiều port hoặc dùng with Ingress/nginx và targetPort là tên.
- `sessionAffinity`: mặc định None; nếu `ClientIP`, giữ session từ cùng IP tới cùng Pod.

Tip debug: `kubectl get endpoints backend -n myapp` để xem Pod IP nào đang được Service cân bằng.

---

## C. `Ingress` (chi tiết, TLS, annotations)

Ví dụ:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: myapp
  annotations:
    kubernetes.io/ingress.class: "traefik"
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  tls:
  - hosts:
    - api.congty.local
    secretName: tls-api-congty-local
  rules:
  - host: api.congty.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 8000
```

Giải thích:

- `apiVersion`: `networking.k8s.io/v1` từ K8s 1.19+. Trước đây `extensions/v1beta1`.
- `metadata.annotations`: nơi gắn cấu hình đặc thù theo ingress controller (traefik/nginx). Mỗi controller chấp nhận tập annotation khác nhau.
- `spec.tls`: danh sách host và secret chứa certificate (TLS). Secret phải có `tls.crt` và `tls.key`.
- `spec.rules`: rule theo host; mỗi rule có danh sách path và backend service.
- `pathType`: `Prefix`, `Exact`, `ImplementationSpecific` — xác định cách so khớp path.
- `backend.service.name` và `port.number`: xác định service đích.

Chú ý: Ingress controller (traefik, nginx, contour, v.v.) phải được cài trong cluster để Ingress resource hoạt động.

---

## D. `PersistentVolumeClaim` (PVC)

Ví dụ:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pg-pvc
  namespace: myapp
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard
```

Giải thích:

- `accessModes`: `ReadWriteOnce` (một node có thể mount RW), `ReadOnlyMany`, `ReadWriteMany` (tùy provider hỗ trợ).
- `resources.requests.storage`: dung lượng yêu cầu.
- `storageClassName`: tên storage class (provider-specific). Nếu không chỉ rõ, cluster default StorageClass sẽ được dùng (nếu có).
- Sau khi tạo PVC, cluster sẽ provision một PV (PersistentVolume) tự động nếu StorageClass hỗ trợ dynamic provisioning.

---

## E. `Secret` (Opaque, docker-registry, tls)

Ví dụ (Opaque):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: myapp
type: Opaque
data:
  DATABASE_URL: WW91clBhc3N3b3JkMTIz   # Base64 của 'YourPassword123'
```

Ví dụ (docker-registry):

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: regcred
  namespace: myapp
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <BASE64_JSON>
```

Giải thích:

- `type: Opaque`: lưu dữ liệu custom. Key-value đều Base64 encoded. Khi dùng `kubectl create secret`, công cụ sẽ mã hóa tự động.
- `kubernetes.io/dockerconfigjson`: dùng cho image pull secrets.
- Truy cập secret trong Pod: `env.valueFrom.secretKeyRef` hoặc `volumes.secret`.
- Không commit secret plaintext vào git.

---

## F. Probes (readiness, liveness, startup)

- `readinessProbe`: xác định Pod đã sẵn sàng nhận traffic; nếu probe fail, Endpoint removed khỏi Service.
- `livenessProbe`: nếu fail, kubelet restart container.
- `startupProbe`: dùng khi ứng dụng khởi động lâu; tách biệt với liveness/readiness.

Probe types:
- `httpGet`: GET tới path/port
- `tcpSocket`: mở socket TCP
- `exec`: chạy lệnh trong container

Key params:
- `initialDelaySeconds`: đợi trước khi probe đầu tiên
- `periodSeconds`: tần suất probe
- `timeoutSeconds`: timeout cho mỗi probe
- `failureThreshold` / `successThreshold`

---

## G. Volumes (common types)

- `emptyDir`: ephemeral storage, tồn tại cùng lifecycle Pod.
- `hostPath`: mount folder trên node (cẩn thận - non-portable).
- `persistentVolumeClaim`: dùng PVC để có storage bền.
- `configMap` / `secret`: mount config/secret như file.

Ví dụ mount ConfigMap như file:

```yaml
volumes:
- name: config
  configMap:
    name: my-config
volumeMounts:
- name: config
  mountPath: /etc/myapp
```

---

## H. Một số tips nâng cao và lỗi hay gặp (quick)

- `Selector mismatch`: nếu `spec.selector` không khớp `template.metadata.labels`, Deployment sẽ không quản lý Pod.
- `ImagePullBackOff`: kiểm tra `image` string, registry credentials, network access.
- `CrashLoopBackOff`: xem `kubectl logs --previous` và `kubectl describe pod` để biết nguyên nhân.
- `PVC pending`: không có PV match hoặc StorageClass không hỗ trợ dynamic provisioning.
- Dùng `kubectl apply -k` cho Kustomize overlays; dùng `helm upgrade --install` cho charts.

---

File này nhằm mục đích làm tài liệu tham khảo chi tiết về syntax YAML của Kubernetes. Nếu bạn muốn, tôi sẽ:

- Thêm phiên bản chú giải trực tiếp vào từng file trong `k8s/` của repo (thêm comment bên cạnh từng trường),
- Hoặc tạo template Helm/ kustomize từ các file hiện có.

Cho tôi biết bạn muốn bước tiếp theo nào.

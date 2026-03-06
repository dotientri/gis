// Constants for the application

export const PARK_STATUSES = {
  QUY_HOACH: 'quy_hoach',
  DANG_XAY_DUNG: 'dang_xay_dung',
  HOAT_DONG: 'hoat_dong',
  CAI_TAO: 'cai_tao',
  TAM_DONG: 'tam_dong',
  NGUNG_HOAT_DONG: 'ngung_hoat_dong',
};

export const PARK_STATUS_LABELS = {
  quy_hoach: 'Quy hoạch',
  dang_xay_dung: 'Đang xây dựng',
  hoat_dong: 'Hoạt động',
  cai_tao: 'Cải tạo',
  tam_dong: 'Tạm đóng',
  ngung_hoat_dong: 'Ngừng hoạt động',
};

export const AMENITY_CONDITIONS = {
  TOT: 'tot',
  KHA: 'kha',
  TRUNG_BINH: 'trung_binh',
  KEM: 'kem',
};

export const AMENITY_CONDITION_LABELS = {
  tot: 'Tốt',
  kha: 'Khá',
  trung_binh: 'Trung bình',
  kem: 'Kém',
};

export const AMENITY_CONDITION_COLORS = {
  tot: '#22c55e',
  kha: '#84cc16',
  trung_binh: '#f59e0b',
  kem: '#ef4444',
};

export const TREE_HEALTH_STATUSES = {
  TOT: 'tot',
  KHA: 'kha',
  TRUNG_BINH: 'trung_binh',
  KEM: 'kem',
  CHET: 'chet',
};

export const TREE_HEALTH_LABELS = {
  tot: 'Tốt',
  kha: 'Khá',
  trung_binh: 'Trung bình',
  kem: 'Kém',
  chet: 'Chết',
};

export const INCIDENT_STATUSES = {
  CHO_XU_LY: 'cho_xu_ly',
  DANG_XU_LY: 'dang_xu_ly',
  DA_XU_LY: 'da_xu_ly',
};

export const INCIDENT_STATUS_LABELS = {
  cho_xu_ly: 'Chờ xử lý',
  dang_xu_ly: 'Đang xử lý',
  da_xu_ly: 'Đã xử lý',
};

export const INCIDENT_PRIORITY_LEVELS = {
  THAP: 'thap',
  TRUNG_BINH: 'trung_binh',
  CAO: 'cao',
  KHAN_CAP: 'khan_cap',
};

export const INCIDENT_PRIORITY_LABELS = {
  thap: 'Thấp',
  trung_binh: 'Trung bình',
  cao: 'Cao',
  khan_cap: 'Khẩn cấp',
};

export const INCIDENT_PRIORITY_COLORS = {
  thap: '#22c55e',
  trung_binh: '#f59e0b',
  cao: '#ef4444',
  khan_cap: '#991b1b',
};

export const EVENT_STATUSES = {
  CHO_DUYET: 'cho_phe_duyet',
  DA_DUYET: 'da_phe_duyet',
  DANG_DIEN_RA: 'dang_dien_ra',
  DA_KET_THUC: 'da_ket_thuc',
  HUY_BO: 'huy_bo',
};

export const EVENT_STATUS_LABELS = {
  cho_phe_duyet: 'Chờ phê duyệt',
  da_phe_duyet: 'Đã phê duyệt',
  dang_dien_ra: 'Đang diễn ra',
  da_ket_thuc: 'Đã kết thúc',
  huy_bo: 'Hủy bỏ',
};

export const PERMISSION_GROUPS = {
  ADMIN: 'QUAN_TRI',
  MANAGER: 'QUAN_LY_CV',
  INSPECTOR: 'KIEM_TRA',
  EDITOR: 'BIEN_TAP_GIS',
  COMMUNITY: 'CONG_DONG',
};

export const PERMISSION_GROUP_LABELS = {
  QUAN_TRI: 'Quản Trị Hệ Thống',
  QUAN_LY_CV: 'Quản Lý Công Viên',
  KIEM_TRA: 'Kiểm Tra',
  BIEN_TAP_GIS: 'Biên Tập GIS',
  CONG_DONG: 'Cộng Đồng',
};

export const RATING_CRITERIA = {
  OVERALL: 'diem_tong_quat',
  CLEANLINESS: 'diem_ve_sinh',
  AMENITIES: 'diem_tien_ich',
  SAFETY: 'diem_an_toan',
  DESIGN: 'diem_tieu_can_thi',
};

export const RATING_LABELS = {
  diem_tong_quat: 'Đánh giá tổng thể',
  diem_ve_sinh: 'Vệ sinh',
  diem_tien_ich: 'Tiện ích',
  diem_an_toan: 'An toàn',
  diem_tieu_can_thi: 'Tiêu chuẩn thiết kế',
};

// Map configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [10.8231, 106.6797],
  DEFAULT_ZOOM: 10,
  TILE_LAYER: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

// API Pagination
export const PAGINATION = {
  PAGE_SIZE: 20,
  DEFAULT_PAGE: 1,
};

// Helper functions
export const getStatusColor = (status, type = 'park') => {
  const colors = {
    park: {
      hoat_dong: '#22c55e',
      quy_hoach: '#3b82f6',
      dang_xay_dung: '#f59e0b',
      cai_tao: '#f59e0b',
      tam_dong: '#ef4444',
      ngung_hoat_dong: '#6b7280',
    },
    incident: INCIDENT_PRIORITY_COLORS,
  };
  return colors[type]?.[status] || '#6b7280';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  return timeString.substring(0, 5);
};

export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  const date = new Date(dateTimeString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const formatRating = (rating) => {
  if (!rating) return '0';
  return parseFloat(rating).toFixed(1);
};

export const getRatingColor = (rating) => {
  if (rating >= 4.5) return '#22c55e';
  if (rating >= 3.5) return '#84cc16';
  if (rating >= 2.5) return '#f59e0b';
  return '#ef4444';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

export const formatArea = (areaM2) => {
  if (!areaM2) return '0';
  const areaKm2 = areaM2 / 1000000;
  if (areaKm2 >= 1) return `${areaKm2.toFixed(2)} km²`;
  return `${areaM2.toFixed(0)} m²`;
};

// Map constants
export const DEFAULT_CENTER = [21.0285, 105.8542]; // Hanoi, Vietnam
export const DEFAULT_ZOOM = 13;

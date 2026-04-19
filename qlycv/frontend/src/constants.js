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

export const INCIDENT_STATUS_LABELS = {
  cho_xu_ly: 'Chờ xử lý',
  dang_xu_ly: 'Đang xử lý',
  da_xu_ly: 'Đã xử lý',
};

export const INCIDENT_PRIORITY_LABELS = {
  thap: 'Thấp',
  trung_binh: 'Trung bình',
  cao: 'Cao',
  khan_cap: 'Khẩn cấp',
};

export const TREE_HEALTH_LABELS = {
  tot: 'Tốt',
  kha: 'Khá',
  trung_binh: 'Trung bình',
  kem: 'Kém',
  chet: 'Chết',
};

export const EVENT_TYPE_LABELS = {
  le_hoi: 'Lễ hội',
  the_thao: 'Thể thao',
  van_hoa: 'Văn hóa',
  am_nhac: 'Âm nhạc',
};

export const EVENT_STATUS_LABELS = {
  sap_dien_ra: 'Sắp diễn ra',
  dang_dien_ra: 'Đang diễn ra',
  da_ket_thuc: 'Đã kết thúc',
  huy_bo: 'Hủy bỏ',
};

export const PERMISSION_GROUPS = {
  ADMIN: 'QUAN_TRI',
  MANAGER: 'QUAN_LY',
  COMMUNITY: 'CONG_DONG',
  GUEST: 'KHACH',
};

export const ROLE_LABELS = {
  QUAN_TRI: 'Quản trị viên',
  QUAN_LY: 'Quản lý công viên',
  CONG_DONG: 'Người dùng',
  KHACH: 'Khách',
};

export const MAP_CONFIG = {
  DEFAULT_CENTER: [10.8231, 106.6297],
  DEFAULT_ZOOM: 11,
  TILE_LAYER: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  ATTRIBUTION: '&copy; OpenStreetMap contributors &copy; CARTO',
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  return new Date(dateTimeString).toLocaleString('vi-VN');
};

export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  return String(timeString).slice(0, 5);
};

export const formatArea = (areaM2) => {
  const area = Number(areaM2 || 0);
  if (!area) return 'N/A';
  if (area >= 1000000) return `${(area / 1000000).toFixed(2)} km²`;
  if (area >= 10000) return `${(area / 10000).toFixed(2)} ha`;
  return `${Math.round(area)} m²`;
};

export const formatRating = (rating) => {
  const value = Number(rating || 0);
  return value ? value.toFixed(1) : '0.0';
};

export const getStatusColor = (status, type = 'park') => {
  const palettes = {
    park: {
      hoat_dong: '#177245',
      dang_xay_dung: '#d97706',
      cai_tao: '#b45309',
      tam_dong: '#c2410c',
      ngung_hoat_dong: '#475569',
      quy_hoach: '#2563eb',
    },
    incident: {
      cho_xu_ly: '#d97706',
      dang_xu_ly: '#2563eb',
      da_xu_ly: '#177245',
    },
    priority: {
      thap: '#177245',
      trung_binh: '#d97706',
      cao: '#c2410c',
      khan_cap: '#991b1b',
    },
    tree: {
      tot: '#177245',
      kha: '#65a30d',
      trung_binh: '#d97706',
      kem: '#c2410c',
      chet: '#7f1d1d',
    },
  };

  return palettes[type]?.[status] || '#475569';
};

export const safeArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  return [];
};

export const resolveRoleCode = (user) => user?.nhom_quyen_code || user?.ma_nhom_quyen?.ten_nhom || PERMISSION_GROUPS.GUEST;

export const getRoleLabel = (roleCode) => ROLE_LABELS[roleCode] || 'Khách';

export const hasRole = (user, role) => resolveRoleCode(user) === role;

export const hasAnyRole = (user, roles = []) => roles.includes(resolveRoleCode(user));

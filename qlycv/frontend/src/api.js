import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (tenDangNhap, matKhau) => {
    if (typeof tenDangNhap === 'object' && tenDangNhap !== null) {
      const data = tenDangNhap;
      const identifier = data.ten_dang_nhap || data.username || data.email;
      return api.post('/auth/login/', {
        ten_dang_nhap: identifier,
        mat_khau: data.mat_khau || data.password,
      });
    }
    return api.post('/auth/login/', { ten_dang_nhap: tenDangNhap, mat_khau: matKhau });
  },
  register: (userData) => api.post('/auth/register/', userData),
  logout: () => {
    localStorage.removeItem('authToken');
    return Promise.resolve();
  },
  getCurrentUser: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  resetPassword: (data) => api.post('/auth/reset-password/', data),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

export const parksAPI = {
  getList: (params) => api.get('/cong-vien/', { params }),
  getDetail: (id) => api.get(`/cong-vien/${id}/`),
  create: (data) => api.post('/cong-vien/', data),
  update: (id, data) => api.put(`/cong-vien/${id}/`, data),
  patch: (id, data) => api.patch(`/cong-vien/${id}/`, data),
  delete: (id) => api.delete(`/cong-vien/${id}/`),
  getNearestParks: (latitude, longitude, radiusKm) =>
    api.post('/cong-vien/tim-gan-nhat/', {
      vi_do: latitude,
      kinh_do: longitude,
      ban_kinh_km: radiusKm,
    }),
  getAllForMap: (params) => api.get('/cong-vien/ban_do/', { params }),
  getParksNeedingInspection: () => api.get('/cong-vien/can-kiem-tra/'),
};

export const parkTypesAPI = {
  getList: () => api.get('/loai-cong-vien/'),
  create: (data) => api.post('/loai-cong-vien/', data),
  update: (id, data) => api.put(`/loai-cong-vien/${id}/`, data),
  delete: (id) => api.delete(`/loai-cong-vien/${id}/`),
};

export const parkStatusAPI = {
  getList: () => api.get('/trang-thai-cong-vien/'),
};

export const districtsAPI = {
  getList: (params) => api.get('/quan-huyen/', { params }),
  getDetail: (id) => api.get(`/quan-huyen/${id}/`),
};

export const amenitiesAPI = {
  getTypes: () => api.get('/loai-tien-ich/'),
  getList: (params) => api.get('/tien-ich-cong-vien/', { params }),
  getDetail: (id) => api.get(`/tien-ich-cong-vien/${id}/`),
  create: (data) =>
    api.post('/tien-ich-cong-vien/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) =>
    api.put(`/tien-ich-cong-vien/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/tien-ich-cong-vien/${id}/`),
};

export const imagesAPI = {
  getList: (params) => api.get('/hinh-anh-cong-vien/', { params }),
  create: (data) =>
    api.post('/hinh-anh-cong-vien/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => api.delete(`/hinh-anh-cong-vien/${id}/`),
};

export const ratingsAPI = {
  getList: (params) => api.get('/danh-gia-cong-vien/', { params }),
  create: (data) => api.post('/danh-gia-cong-vien/', data),
  getUnapproved: () => api.get('/danh-gia-cong-vien/danh-gia-chua-duyet/'),
  approve: (id) => api.patch(`/danh-gia-cong-vien/${id}/`, { da_duyet: true }),
  reject: (id) => api.patch(`/danh-gia-cong-vien/${id}/`, { da_duyet: false }),
};

export const inspectionsAPI = {
  getList: (params) => api.get('/kiem-tra-cong-vien/', { params }),
  create: (data) => api.post('/kiem-tra-cong-vien/', data),
  getTypes: () => api.get('/loai-kiem-tra/'),
};

export const incidentsAPI = {
  getList: (params) => api.get('/bao-cao-su-co/', { params }),
  create: (data) =>
    api.post('/bao-cao-su-co/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getCategories: () => api.get('/danh-muc-su-co/'),
  updateStatus: (id, trangThai) => api.patch(`/bao-cao-su-co/${id}/`, { trang_thai: trangThai }),
  assign: (id, maQuanLy) => api.patch(`/bao-cao-su-co/${id}/`, { ma_nguoi_phu_trach: maQuanLy }),
  exportExcel: (params) =>
    api.get('/bao-cao-su-co/export_excel/', {
      params,
      responseType: 'arraybuffer',
    }),
};

export const eventsAPI = {
  getList: (params) => api.get('/su-kien-cong-vien/', { params }),
  getDetail: (id) => api.get(`/su-kien-cong-vien/${id}/`),
  create: (data) => api.post('/su-kien-cong-vien/', data),
  update: (id, data) => api.patch(`/su-kien-cong-vien/${id}/`, data),
  delete: (id) => api.delete(`/su-kien-cong-vien/${id}/`),
  getUpcoming: () => api.get('/su-kien-cong-vien/su-kien-sap-toi/'),
  approve: (id) => api.patch(`/su-kien-cong-vien/${id}/`, { da_duyet: true }),
};

export const treesAPI = {
  getList: (params) => api.get('/cay-xanh/', { params }),
  create: (data) => api.post('/cay-xanh/', data),
  update: (id, data) => api.put(`/cay-xanh/${id}/`, data),
  getTypes: () => api.get('/loai-cay/'),
  getStatistics: () => api.get('/cay-xanh/thong-ke-tinh-trang/'),
};

export const usersAPI = {
  getList: (params) => api.get('/nguoi-dung/', { params }),
  getDetail: (id) => api.get(`/nguoi-dung/${id}/`),
  create: (data) => api.post('/nguoi-dung/', data),
  update: (id, data) => api.put(`/nguoi-dung/${id}/`, data),
  delete: (id) => api.delete(`/nguoi-dung/${id}/`),
};

export const dashboardAPI = {
  getStatistics: () => api.get('/dashboard/thong-ke/'),
};

export const permissionGroupsAPI = {
  getList: () => api.get('/nhom-quyen/'),
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users/', { params }),
  getUser: (id) => api.get(`/admin/users/${id}/`),
  createUser: (data) => api.post('/admin/users/', data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}/`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}/`),
  enableUser: (id) => api.post(`/admin/users/${id}/enable/`),
  disableUser: (id) => api.post(`/admin/users/${id}/disable/`),
  changeRole: (id, roleId) => api.post(`/admin/users/${id}/change_role/`, { role_id: roleId }),
  getParks: (params) => api.get('/cong-vien/', { params }),
  getRatings: (params) => api.get('/admin/ratings/', { params }),
  getEvents: (params) => api.get('/admin/events/', { params }),
  getIncidents: (params) => api.get('/admin/incidents/', { params }),
  getImages: (params) => api.get('/admin/images/', { params }),
};

export default api;

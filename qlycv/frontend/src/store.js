import { create } from 'zustand';
import { authAPI } from './api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('authToken') || null,
  isLoading: false,
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
    set({ token });
  },

  login: async (tenDangNhap, matKhau) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(tenDangNhap, matKhau);
      const { token, user } = response.data;
      set({ user, token, isLoading: false });
      localStorage.setItem('authToken', token);
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.detail || error.response?.data?.error || 'Đăng nhập thất bại',
        isLoading: false,
      });
      return false;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.register(userData);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.detail || error.response?.data?.error || 'Đăng ký thất bại',
        isLoading: false,
      });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
}));

export const useParksStore = create((set) => ({
  parks: [],
  currentPark: null,
  isLoading: false,
  error: null,

  setPark: (park) => set({ currentPark: park }),
  setParks: (parks) => set({ parks }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

export const useRatingsStore = create((set) => ({
  ratings: [],
  unapprovedRatings: [],
  isLoading: false,
  error: null,

  setRatings: (ratings) => set({ ratings }),
  setUnapprovedRatings: (ratings) => set({ unapprovedRatings: ratings }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export const useIncidentsStore = create((set) => ({
  incidents: [],
  isLoading: false,
  error: null,

  setIncidents: (incidents) => set({ incidents }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export const useEventsStore = create((set) => ({
  events: [],
  upcomingEvents: [],
  isLoading: false,
  error: null,

  setEvents: (events) => set({ events }),
  setUpcomingEvents: (events) => set({ upcomingEvents: events }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export const useFilterStore = create((set) => ({
  filters: {
    maLoai: null,
    maTrangThai: null,
    maQuanHuyen: null,
    search: '',
    page: 1,
  },

  setFilter: (filterKey, value) =>
    set((state) => ({
      filters: { ...state.filters, [filterKey]: value },
    })),

  setFilters: (filters) => set({ filters }),

  resetFilters: () =>
    set({
      filters: {
        maLoai: null,
        maTrangThai: null,
        maQuanHuyen: null,
        search: '',
        page: 1,
      },
    }),
}));

export const useMapStore = create((set) => ({
  centerLat: 10.8231,
  centerLng: 106.6797,
  zoomLevel: 10,
  selectedParkId: null,
  showFilters: true,

  setCenter: (lat, lng) => set({ centerLat: lat, centerLng: lng }),
  setZoom: (zoom) => set({ zoomLevel: zoom }),
  setSelectedPark: (id) => set({ selectedParkId: id }),
  toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),
}));

export const useUIStore = create((set) => ({
  notification: null,
  isModalOpen: false,
  modalContent: null,
  isSidebarOpen: true,

  showNotification: (message, type = 'success') =>
    set({
      notification: { message, type, id: Date.now() },
    }),

  clearNotification: () => set({ notification: null }),

  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

export const useDashboardStore = create((set) => ({
  statistics: null,
  isLoading: false,

  setStatistics: (stats) => set({ statistics: stats }),
  setLoading: (loading) => set({ isLoading: loading }),
}));

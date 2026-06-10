import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor de request - agrega JWT automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sercofun_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response - maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRoute = error.config?.url?.includes('/auth/login');
      if (!isLoginRoute) {
        localStorage.removeItem('sercofun_token');
        localStorage.removeItem('sercofun_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authService = {
  login: async (username, password) => {
    const { data } = await api.post('/auth/login', { username, password });
    if (data.success) {
      localStorage.setItem('sercofun_token', data.data.token);
      localStorage.setItem('sercofun_user', JSON.stringify(data.data.user));
    }
    return data;
  },
  logout: () => {
    localStorage.removeItem('sercofun_token');
    localStorage.removeItem('sercofun_user');
  },
  me: () => api.get('/auth/me').then(r => r.data),
  getCurrentUser: () => {
    const userStr = localStorage.getItem('sercofun_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  isAuthenticated: () => !!localStorage.getItem('sercofun_token')
};

// ============ LOCATIONS ============
export const locationsService = {
  getAll: () => api.get('/locations').then(r => r.data),
  getById: (id) => api.get(`/locations/${id}`).then(r => r.data),
  create: (data) => api.post('/locations', data).then(r => r.data),
  update: (id, data) => api.put(`/locations/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/locations/${id}`).then(r => r.data)
};

// ============ ROOMS ============
export const roomsService = {
  getAll: (params = {}) => api.get('/rooms', { params }).then(r => r.data),
  getById: (id) => api.get(`/rooms/${id}`).then(r => r.data),
  getActiveMemorial: (roomId) => api.get(`/rooms/${roomId}/active-memorial`).then(r => r.data),
  create: (data) => api.post('/rooms', data).then(r => r.data),
  update: (id, data) => api.put(`/rooms/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/rooms/${id}`).then(r => r.data)
};

// ============ MEMORIALS ============
export const memorialsService = {
  getAll: (params = {}) => api.get('/memorials', { params }).then(r => r.data),
  getById: (id) => api.get(`/memorials/${id}`).then(r => r.data),
  create: (data) => api.post('/memorials', data).then(r => r.data),
  update: (id, data) => api.put(`/memorials/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/memorials/${id}`).then(r => r.data),
  uploadPhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post('/memorials/upload-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  }
};

// ============ CONDOLENCES ============
export const condolencesService = {
  submit: (formData) => {
    return api.post('/condolences/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data);
  },
  getAll: (params = {}) => api.get('/condolences', { params }).then(r => r.data),
  getByMemorial: (memorialId) => api.get(`/condolences/memorial/${memorialId}`).then(r => r.data),
  // Endpoint publico (sin auth) que usa la pantalla del display.
  // Devuelve solo campos no sensibles.
  getPublic: (memorialId, limit = 60) =>
    api.get(`/condolences/public/${memorialId}`, { params: { limit } }).then(r => r.data),
  remove: (id) => api.delete(`/condolences/${id}`).then(r => r.data)
};

// ============ USERS (gestion de usuarios - solo superadmin) ============
export const usersService = {
  getAll: (params = {}) => api.get('/users', { params }).then(r => r.data),
  getById: (id) => api.get(`/users/${id}`).then(r => r.data),
  create: (data) => api.post('/users', data).then(r => r.data),
  update: (id, data) => api.put(`/users/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/users/${id}`).then(r => r.data)
};

// ============ CEREMONY VENUES (lugares de exequias y destino final) ============
export const ceremonyVenuesService = {
  // params: { kind?: 'exequias'|'destino_final', location_id?: uuid }
  getAll: (params = {}) => api.get('/ceremony-venues', { params }).then(r => r.data),
  create: (data) => api.post('/ceremony-venues', data).then(r => r.data),
  remove: (id) => api.delete(`/ceremony-venues/${id}`).then(r => r.data)
};

// ============ ANALYTICS ============
export const analyticsService = {
  executive: (params = {}) => api.get('/analytics/executive', { params }).then(r => r.data),
  byLocation: () => api.get('/analytics/by-location').then(r => r.data),
  operations: () => api.get('/analytics/operations').then(r => r.data),
  health: () => api.get('/analytics/health').then(r => r.data)
};

// Helper para construir URL completas de archivos subidos
export const getFileUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
};

export default api;

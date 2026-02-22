import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android emulator uses 10.0.2.2 for localhost, iOS simulator uses localhost
const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_data');
    }
    return Promise.reject(error);
  }
);

// ─── Authentication ─────────────────────────────────────────
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/change-password', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

// ─── Patient Portal APIs ────────────────────────────────────
export const appointmentsAPI = {
  getAll: (params?: any) => api.get('/appointments', { params }),
  getById: (id: string) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  update: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  cancel: (id: string) => api.put(`/appointments/${id}/cancel`),
  getUpcoming: () => api.get('/appointments?status=scheduled&limit=5'),
};

export const medicationsAPI = {
  getAll: (params?: any) => api.get('/medications', { params }),
  getById: (id: string) => api.get(`/medications/${id}`),
  getActive: () => api.get('/medications?status=active'),
  requestRefill: (id: string) => api.post(`/medications/${id}/refill`),
  getReminders: () => api.get('/medications/reminders'),
};

export const vitalSignsAPI = {
  getAll: (params?: any) => api.get('/vitals', { params }),
  getLatest: () => api.get('/vitals/latest'),
  record: (data: any) => api.post('/vitals', data),
  getByType: (type: string, params?: any) =>
    api.get(`/vitals/type/${type}`, { params }),
};

export const healthRecordsAPI = {
  getAll: (params?: any) => api.get('/health-records', { params }),
  getById: (id: string) => api.get(`/health-records/${id}`),
  upload: (data: FormData) =>
    api.post('/health-records', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const symptomsAPI = {
  getAll: (params?: any) => api.get('/symptoms', { params }),
  log: (data: any) => api.post('/symptoms', data),
  getRecent: () => api.get('/symptoms?limit=10&sort=-recorded_at'),
  getAnalysis: () => api.get('/symptoms/analysis'),
};

export const bloodTestsAPI = {
  getAll: (params?: any) => api.get('/blood-tests', { params }),
  getLatest: () => api.get('/blood-tests/latest'),
  getById: (id: string) => api.get(`/blood-tests/${id}`),
};

export const cancerRiskAPI = {
  getAssessments: () => api.get('/cancer-risk/assessments'),
  getLatest: () => api.get('/cancer-risk/latest'),
  requestAssessment: (data: any) => api.post('/cancer-risk/assess', data),
};

export const messagesAPI = {
  getInbox: (params?: any) => api.get('/messages/inbox', { params }),
  getSent: (params?: any) => api.get('/messages/sent', { params }),
  send: (data: any) => api.post('/messages', data),
  markRead: (id: string) => api.put(`/messages/${id}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
};

export const notificationsAPI = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const telehealthAPI = {
  getSessions: (params?: any) => api.get('/telehealth/video-sessions', { params }),
  createSession: (data: any) => api.post('/telehealth/video-sessions', data),
  joinSession: (id: string) => api.put(`/telehealth/video-sessions/${id}/start`),
  getWaitingRoom: () => api.get('/telehealth/waiting-room'),
};

// ─── Hospital Portal APIs ───────────────────────────────────
export const patientsAPI = {
  getAll: (params?: any) => api.get('/patients', { params }),
  getById: (id: string) => api.get(`/patients/${id}`),
  create: (data: any) => api.post('/patients', data),
  update: (id: string, data: any) => api.put(`/patients/${id}`, data),
  discharge: (id: string) => api.put(`/patients/${id}/discharge`),
  getStats: () => api.get('/patients/stats'),
  search: (query: string) => api.get(`/patients/search?q=${query}`),
};

export const doctorsAPI = {
  getAll: (params?: any) => api.get('/doctors', { params }),
  getById: (id: string) => api.get(`/doctors/${id}`),
  create: (data: any) => api.post('/doctors', data),
  update: (id: string, data: any) => api.put(`/doctors/${id}`, data),
  getAvailable: () => api.get('/doctors?status=available'),
};

export const bedsAPI = {
  getAll: (params?: any) => api.get('/beds', { params }),
  getAvailable: () => api.get('/beds?status=available'),
  assign: (id: string, data: any) => api.put(`/beds/${id}/assign`, data),
  release: (id: string) => api.put(`/beds/${id}/release`),
  getStats: () => api.get('/beds/stats'),
};

export const labsAPI = {
  getOrders: (params?: any) => api.get('/lab-orders', { params }),
  createOrder: (data: any) => api.post('/lab-orders', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/lab-orders/${id}/status`, { status }),
  getResults: (id: string) => api.get(`/lab-orders/${id}/results`),
};

export const pharmacyAPI = {
  getInventory: (params?: any) => api.get('/pharmacy/inventory', { params }),
  dispense: (data: any) => api.post('/pharmacy/dispense', data),
  getOrders: (params?: any) => api.get('/pharmacy/orders', { params }),
  getLowStock: () => api.get('/pharmacy/low-stock'),
};

export const emergencyAPI = {
  getActive: () => api.get('/emergency/active'),
  create: (data: any) => api.post('/emergency', data),
  triage: (id: string, data: any) => api.put(`/emergency/${id}/triage`, data),
  getStats: () => api.get('/emergency/stats'),
};

// ─── Admin Portal APIs ──────────────────────────────────────
export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  deactivate: (id: string) => api.put(`/users/${id}/deactivate`),
  getStats: () => api.get('/users/stats'),
};

export const hospitalsAPI = {
  getAll: (params?: any) => api.get('/hospitals', { params }),
  getById: (id: string) => api.get(`/hospitals/${id}`),
  create: (data: any) => api.post('/hospitals', data),
  update: (id: string, data: any) => api.put(`/hospitals/${id}`, data),
  getStats: () => api.get('/hospitals/stats'),
};

export const systemAPI = {
  getHealth: () => api.get('/system/health'),
  getMetrics: () => api.get('/system/metrics'),
  getLogs: (params?: any) => api.get('/system/logs', { params }),
  getConfig: () => api.get('/system/config'),
  updateConfig: (data: any) => api.put('/system/config', data),
};

export const auditAPI = {
  getLogs: (params?: any) => api.get('/audit/logs', { params }),
  getById: (id: string) => api.get(`/audit/logs/${id}`),
  export: (params?: any) => api.get('/audit/export', { params }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getPatientStats: () => api.get('/analytics/patients'),
  getRevenueStats: () => api.get('/analytics/revenue'),
  getUsageStats: () => api.get('/analytics/usage'),
};

export default api;

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refresh_token: refreshToken }),
  getMe: () => api.get('/auth/me'),
  changePassword: (data: any) => api.post('/auth/change-password', data),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  adminUpdate: (id: string, data: any) => api.put(`/users/${id}/admin`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Patients API
export const patientsAPI = {
  getMyProfile: () => api.get('/patients/me'),
  updateMyProfile: (data: any) => api.put('/patients/me', data),
  getHealthSummary: () => api.get('/patients/me/health-summary'),
  getByHealthId: (healthId: string) => api.get(`/patients/health-id/${healthId}`),
  getById: (id: string) => api.get(`/patients/${id}`),
  addAllergy: (data: any) => api.post('/patients/me/allergies', data),
  addFamilyHistory: (data: any) => api.post('/patients/me/family-history', data),
};

// Hospitals API
export const hospitalsAPI = {
  list: (params?: any) => api.get('/hospitals', { params }),
  get: (id: string) => api.get(`/hospitals/${id}`),
  create: (data: any) => api.post('/hospitals', data),
  update: (id: string, data: any) => api.put(`/hospitals/${id}`, data),
  getDashboard: (id: string) => api.get(`/hospitals/${id}/dashboard`),
  getDoctors: (id: string, params?: any) => api.get(`/hospitals/${id}/doctors`, { params }),
};

// Health Records API
export const healthRecordsAPI = {
  getMyRecords: (params?: any) => api.get('/health-records/my', { params }),
  getByHealthId: (healthId: string, params?: any) => api.get(`/health-records/by-health-id/${healthId}`, { params }),
  create: (data: any) => api.post('/health-records', data),
  get: (id: string) => api.get(`/health-records/${id}`),
};

// Blood Samples API
export const bloodSamplesAPI = {
  getMySamples: (params?: any) => api.get('/blood-samples/my', { params }),
  create: (data: any) => api.post('/blood-samples', data),
  addBiomarker: (sampleId: string, data: any) => api.post(`/blood-samples/${sampleId}/biomarkers`, data),
  getBiomarkers: (sampleId: string) => api.get(`/blood-samples/${sampleId}/biomarkers`),
  analyze: (sampleId: string) => api.post(`/blood-samples/${sampleId}/analyze`),
};

// Smartwatch API
export const smartwatchAPI = {
  getDashboard: () => api.get('/smartwatch/dashboard'),
  ingestData: (data: any) => api.post('/smartwatch/data', data),
  getData: (params?: any) => api.get('/smartwatch/data', { params }),
  registerDevice: (params: any) => api.post('/smartwatch/devices/register', null, { params }),
};

// Cancer Detection API
export const cancerDetectionAPI = {
  predictRisk: (patientId: string) => api.post(`/cancer-detection/predict/${patientId}`),
  getRiskHistory: (patientId: string) => api.get(`/cancer-detection/risk-history/${patientId}`),
  createScreening: (data: any) => api.post('/cancer-detection/screenings', data),
};

// Appointments API
export const appointmentsAPI = {
  getMyAppointments: (params?: any) => api.get('/appointments/my', { params }),
  create: (params: any) => api.post('/appointments', null, { params }),
  updateStatus: (id: string, params: any) => api.put(`/appointments/${id}/status`, null, { params }),
};

// Notifications API
export const notificationsAPI = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUserStats: () => api.get('/admin/users/stats'),
  getRiskDistribution: () => api.get('/admin/risk-distribution'),
  seedData: () => api.post('/admin/seed-data'),
  systemHealth: () => api.get('/admin/system-health'),
};

// Reports API
export const reportsAPI = {
  getPatientSummary: (patientId: string) => api.get(`/reports/patient-summary/${patientId}`),
};

// Analytics API
export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getRiskTrends: () => api.get('/analytics/risk-trends'),
};

// Genetic Profile API
export const geneticsAPI = {
  getProfile: () => api.get('/genetics/profile'),
  getMarkers: () => api.get('/genetics/markers'),
  requestTest: (data: any) => api.post('/genetics/test-request', data),
  getPharmacogenomics: () => api.get('/genetics/pharmacogenomics'),
};

// Diet & Nutrition API
export const dietAPI = {
  getPlan: () => api.get('/diet/plan'),
  getNutritionLog: (params?: any) => api.get('/diet/log', { params }),
  logMeal: (data: any) => api.post('/diet/log', data),
  getRecommendations: () => api.get('/diet/recommendations'),
  getAntiCancerFoods: () => api.get('/diet/anti-cancer-foods'),
};

// Mental Health API
export const mentalHealthAPI = {
  getAssessments: () => api.get('/mental-health/assessments'),
  submitAssessment: (data: any) => api.post('/mental-health/assessments', data),
  getSessions: () => api.get('/mental-health/sessions'),
  getResources: () => api.get('/mental-health/resources'),
  getMoodHistory: () => api.get('/mental-health/mood-history'),
};

// Treatment Plans API
export const treatmentAPI = {
  getPlans: () => api.get('/treatment/plans'),
  getPlan: (id: string) => api.get(`/treatment/plans/${id}`),
  getClinicalTrials: (cancerType: string) => api.get(`/treatment/clinical-trials/${cancerType}`),
  requestSecondOpinion: (data: any) => api.post('/treatment/second-opinion', data),
};

// Exercise API
export const exerciseAPI = {
  getSessions: (params?: any) => api.get('/exercise/sessions', { params }),
  logSession: (data: any) => api.post('/exercise/sessions', data),
  getGoals: () => api.get('/exercise/goals'),
  getRecommendations: () => api.get('/exercise/recommendations'),
};

// Screening API
export const screeningAPI = {
  getSchedule: () => api.get('/screening/schedule'),
  updateSchedule: (id: string, data: any) => api.put(`/screening/schedule/${id}`, data),
  getGuidelines: () => api.get('/screening/guidelines'),
  getHistory: () => api.get('/screening/history'),
};

// Family Health API
export const familyHealthAPI = {
  getTree: () => api.get('/family-health/tree'),
  addMember: (data: any) => api.post('/family-health/members', data),
  updateMember: (id: string, data: any) => api.put(`/family-health/members/${id}`, data),
  getRiskAnalysis: () => api.get('/family-health/risk-analysis'),
};

// Second Opinion API
export const secondOpinionAPI = {
  getRequests: () => api.get('/second-opinion/requests'),
  createRequest: (data: any) => api.post('/second-opinion/requests', data),
  getAIAnalysis: (recordId: string) => api.get(`/second-opinion/ai-analysis/${recordId}`),
};

// Surgery API
export const surgeryAPI = {
  list: (params?: any) => api.get('/surgery', { params }),
  get: (id: string) => api.get(`/surgery/${id}`),
  create: (data: any) => api.post('/surgery', data),
  updateStatus: (id: string, status: string) => api.put(`/surgery/${id}/status`, { status }),
  getORSchedule: () => api.get('/surgery/or-schedule'),
};

// Pharmacy API
export const pharmacyAPI = {
  getInventory: (params?: any) => api.get('/pharmacy/inventory', { params }),
  getPrescriptions: (params?: any) => api.get('/pharmacy/prescriptions', { params }),
  dispensePrescription: (id: string) => api.put(`/pharmacy/prescriptions/${id}/dispense`),
  addStock: (data: any) => api.post('/pharmacy/stock', data),
  getAlerts: () => api.get('/pharmacy/alerts'),
};

// Radiology API
export const radiologyAPI = {
  getStudies: (params?: any) => api.get('/radiology/studies', { params }),
  getStudy: (id: string) => api.get(`/radiology/studies/${id}`),
  requestAIAnalysis: (id: string) => api.post(`/radiology/studies/${id}/ai-analyze`),
  getAIResults: (id: string) => api.get(`/radiology/studies/${id}/ai-results`),
};

// Emergency API
export const emergencyAPI = {
  getCases: (params?: any) => api.get('/emergency/cases', { params }),
  triage: (id: string, data: any) => api.put(`/emergency/cases/${id}/triage`, data),
  getDashboard: () => api.get('/emergency/dashboard'),
  updateStatus: (id: string, status: string) => api.put(`/emergency/cases/${id}/status`, { status }),
};

// Clinical Trials API
export const clinicalTrialsAPI = {
  list: (params?: any) => api.get('/clinical-trials', { params }),
  get: (id: string) => api.get(`/clinical-trials/${id}`),
  create: (data: any) => api.post('/clinical-trials', data),
  enrollPatient: (trialId: string, patientId: string) => api.post(`/clinical-trials/${trialId}/enroll/${patientId}`),
};

// Telemedicine API
export const telemedicineAPI = {
  getSessions: (params?: any) => api.get('/telemedicine/sessions', { params }),
  createSession: (data: any) => api.post('/telemedicine/sessions', data),
  getSession: (id: string) => api.get(`/telemedicine/sessions/${id}`),
  endSession: (id: string, data: any) => api.put(`/telemedicine/sessions/${id}/end`, data),
};

// Quality Metrics API
export const qualityAPI = {
  getMetrics: (params?: any) => api.get('/quality/metrics', { params }),
  getPatientSatisfaction: () => api.get('/quality/patient-satisfaction'),
  getOutcomes: () => api.get('/quality/outcomes'),
  getBenchmarks: () => api.get('/quality/benchmarks'),
};

// Compliance API
export const complianceAPI = {
  getRecords: () => api.get('/compliance/records'),
  getAuditSchedule: () => api.get('/compliance/audit-schedule'),
  submitReport: (data: any) => api.post('/compliance/reports', data),
  getHIPAAStatus: () => api.get('/compliance/hipaa'),
};

// Data Management API
export const dataManagementAPI = {
  getBackups: () => api.get('/data/backups'),
  createBackup: (data: any) => api.post('/data/backups', data),
  getStorageStats: () => api.get('/data/storage'),
  getRetentionPolicies: () => api.get('/data/retention-policies'),
  getDataQuality: () => api.get('/data/quality'),
};

// Billing API
export const billingAPI = {
  getSubscriptions: () => api.get('/billing/subscriptions'),
  getInvoices: (params?: any) => api.get('/billing/invoices', { params }),
  getRevenue: () => api.get('/billing/revenue'),
  getUsageStats: () => api.get('/billing/usage'),
};

// Integration API
export const integrationAPI = {
  getIntegrations: () => api.get('/integrations'),
  createIntegration: (data: any) => api.post('/integrations', data),
  testConnection: (id: string) => api.post(`/integrations/${id}/test`),
  syncData: (id: string) => api.post(`/integrations/${id}/sync`),
  getAPIKeys: () => api.get('/integrations/api-keys'),
};

// Training API
export const trainingAPI = {
  getCourses: () => api.get('/training/courses'),
  enrollCourse: (id: string) => api.post(`/training/courses/${id}/enroll`),
  getCertifications: () => api.get('/training/certifications'),
  getProgress: () => api.get('/training/progress'),
};

// Blood Donor API
export const bloodDonorAPI = {
  register: (data: any) => api.post('/blood-donor/register', data),
  getProfile: () => api.get('/blood-donor/profile'),
  updateProfile: (data: any) => api.put('/blood-donor/profile', data),
  toggleStatus: (activate: boolean) => api.put('/blood-donor/toggle', { activate }),
  updateLocation: (data: any) => api.put('/blood-donor/location', data),
  createRequest: (data: any) => api.post('/blood-donor/request', data),
  listRequests: (params?: any) => api.get('/blood-donor/requests', { params }),
  getRequest: (id: string) => api.get(`/blood-donor/requests/${id}`),
  getMyRequests: () => api.get('/blood-donor/my-requests'),
  getIncoming: () => api.get('/blood-donor/incoming'),
  respond: (matchId: string, data: { accept: boolean; message?: string }) => api.put(`/blood-donor/respond/${matchId}`, data),
  getHistory: () => api.get('/blood-donor/history'),
  getStats: () => api.get('/blood-donor/stats'),
  findNearby: (params: { latitude: number; longitude: number; blood_group?: string; radius_km?: number }) => api.get('/blood-donor/nearby', { params }),
};

export default api;

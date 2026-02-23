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

// ============ NEW API MODULES FOR 1000 FEATURES ============

// Clinical Decision Support API
export const clinicalDecisionAPI = {
  getPathways: (params?: any) => api.get('/clinical-decision/pathways', { params }),
  getPathway: (id: string) => api.get(`/clinical-decision/pathways/${id}`),
  createPathway: (data: any) => api.post('/clinical-decision/pathways', data),
  updatePathway: (id: string, data: any) => api.put(`/clinical-decision/pathways/${id}`, data),
  enrollPatient: (data: any) => api.post('/clinical-decision/pathways/enroll', data),
  getEnrollments: (pathwayId: string) => api.get(`/clinical-decision/pathways/${pathwayId}/enrollments`),
  checkDrugInteractions: (data: any) => api.post('/clinical-decision/drug-interactions/check', data),
  getDrugInteractions: (params?: any) => api.get('/clinical-decision/drug-interactions', { params }),
  getGuidelines: (params?: any) => api.get('/clinical-decision/guidelines', { params }),
  createGuideline: (data: any) => api.post('/clinical-decision/guidelines', data),
  getCalculators: () => api.get('/clinical-decision/calculators'),
  runCalculator: (id: string, data: any) => api.post(`/clinical-decision/calculators/${id}/calculate`, data),
  getAlerts: (params?: any) => api.get('/clinical-decision/alerts', { params }),
  acknowledgeAlert: (id: string) => api.put(`/clinical-decision/alerts/${id}/acknowledge`),
  getOrderSets: (params?: any) => api.get('/clinical-decision/order-sets', { params }),
  createOrderSet: (data: any) => api.post('/clinical-decision/order-sets', data),
  getBPAs: (params?: any) => api.get('/clinical-decision/bpas', { params }),
  getDashboardStats: () => api.get('/clinical-decision/dashboard/stats'),
};

// Genomics API
export const genomicsAPI = {
  getSequences: (params?: any) => api.get('/genomics/sequences', { params }),
  createSequence: (data: any) => api.post('/genomics/sequences', data),
  getVariants: (sequenceId: string) => api.get(`/genomics/sequences/${sequenceId}/variants`),
  addVariant: (data: any) => api.post('/genomics/variants', data),
  getGenePanels: () => api.get('/genomics/gene-panels'),
  createGenePanel: (data: any) => api.post('/genomics/gene-panels', data),
  getReports: (params?: any) => api.get('/genomics/reports', { params }),
  createReport: (data: any) => api.post('/genomics/reports', data),
  getLiquidBiopsies: (patientId: string) => api.get(`/genomics/liquid-biopsies/${patientId}`),
  createLiquidBiopsy: (data: any) => api.post('/genomics/liquid-biopsies', data),
  getGeneExpression: (patientId: string) => api.get(`/genomics/gene-expression/${patientId}`),
  getPharmacogenomics: (patientId: string) => api.get(`/genomics/pharmacogenomics/${patientId}`),
  getHereditaryPanels: (patientId: string) => api.get(`/genomics/hereditary-panels/${patientId}`),
  createHereditaryPanel: (data: any) => api.post('/genomics/hereditary-panels', data),
  getDashboardStats: () => api.get('/genomics/dashboard/stats'),
};

// Research API
export const researchAPI = {
  getStudies: (params?: any) => api.get('/research/studies', { params }),
  getStudy: (id: string) => api.get(`/research/studies/${id}`),
  createStudy: (data: any) => api.post('/research/studies', data),
  updateStudy: (id: string, data: any) => api.put(`/research/studies/${id}`, data),
  getCohorts: (studyId: string) => api.get(`/research/studies/${studyId}/cohorts`),
  createCohort: (data: any) => api.post('/research/cohorts', data),
  addCohortPatient: (data: any) => api.post('/research/cohorts/patients', data),
  getPublications: (params?: any) => api.get('/research/publications', { params }),
  createPublication: (data: any) => api.post('/research/publications', data),
  getDatasets: (params?: any) => api.get('/research/datasets', { params }),
  createDataset: (data: any) => api.post('/research/datasets', data),
  submitIRB: (data: any) => api.post('/research/irb-submissions', data),
  getIRBSubmissions: (studyId: string) => api.get(`/research/irb-submissions/${studyId}`),
  createAnalysis: (data: any) => api.post('/research/biostatistics', data),
  getDashboardStats: () => api.get('/research/dashboard/stats'),
};

// Population Health API
export const populationHealthAPI = {
  getRegistries: (params?: any) => api.get('/population-health/registries', { params }),
  createRegistry: (data: any) => api.post('/population-health/registries', data),
  getRegistryEntries: (registryId: string) => api.get(`/population-health/registries/${registryId}/entries`),
  addRegistryEntry: (data: any) => api.post('/population-health/registry-entries', data),
  getChronicPrograms: (params?: any) => api.get('/population-health/chronic-programs', { params }),
  createChronicProgram: (data: any) => api.post('/population-health/chronic-programs', data),
  enrollInProgram: (data: any) => api.post('/population-health/chronic-programs/enroll', data),
  getCareGaps: (params?: any) => api.get('/population-health/care-gaps', { params }),
  closeCareGap: (id: string) => api.put(`/population-health/care-gaps/${id}/close`),
  getEquityMetrics: (params?: any) => api.get('/population-health/equity-metrics', { params }),
  getCommunityResources: (params?: any) => api.get('/population-health/community-resources', { params }),
  createCommunityResource: (data: any) => api.post('/population-health/community-resources', data),
  getPublicHealthAlerts: () => api.get('/population-health/public-health-alerts'),
  getScreeningCampaigns: (params?: any) => api.get('/population-health/screening-campaigns', { params }),
  createScreeningCampaign: (data: any) => api.post('/population-health/screening-campaigns', data),
  getDashboardStats: () => api.get('/population-health/dashboard/stats'),
};

// Patient Engagement API
export const patientEngagementAPI = {
  getGamificationProfile: () => api.get('/patient-engagement/gamification/profile'),
  addPoints: (data: any) => api.post('/patient-engagement/gamification/points', data),
  getLeaderboard: (params?: any) => api.get('/patient-engagement/gamification/leaderboard', { params }),
  getBadges: () => api.get('/patient-engagement/badges'),
  getMyBadges: () => api.get('/patient-engagement/badges/my'),
  awardBadge: (data: any) => api.post('/patient-engagement/badges/award', data),
  getChallenges: (params?: any) => api.get('/patient-engagement/challenges', { params }),
  createChallenge: (data: any) => api.post('/patient-engagement/challenges', data),
  joinChallenge: (id: string) => api.post(`/patient-engagement/challenges/${id}/join`),
  updateChallengeProgress: (id: string, data: any) => api.put(`/patient-engagement/challenges/${id}/progress`, data),
  getStreaks: () => api.get('/patient-engagement/streaks'),
  getSupportGroups: (params?: any) => api.get('/patient-engagement/support-groups', { params }),
  createSupportGroup: (data: any) => api.post('/patient-engagement/support-groups', data),
  joinSupportGroup: (id: string) => api.post(`/patient-engagement/support-groups/${id}/join`),
  getGroupPosts: (groupId: string) => api.get(`/patient-engagement/support-groups/${groupId}/posts`),
  createGroupPost: (groupId: string, data: any) => api.post(`/patient-engagement/support-groups/${groupId}/posts`, data),
  getSurveys: (params?: any) => api.get('/patient-engagement/surveys', { params }),
  createSurvey: (data: any) => api.post('/patient-engagement/surveys', data),
  getRewards: () => api.get('/patient-engagement/rewards'),
  redeemReward: (id: string) => api.post(`/patient-engagement/rewards/${id}/redeem`),
  getDashboardStats: () => api.get('/patient-engagement/dashboard/stats'),
};

// Communication API
export const communicationAPI = {
  getInbox: (params?: any) => api.get('/communication/messages/inbox', { params }),
  getSent: (params?: any) => api.get('/communication/messages/sent', { params }),
  getAllMessages: (params?: any) => api.get('/communication/messages', { params }),
  sendMessage: (data: any) => api.post('/communication/messages', data),
  markAsRead: (id: string) => api.put(`/communication/messages/${id}/read`),
  getUnreadCount: () => api.get('/communication/messages/unread-count'),
  getCareTeams: (params?: any) => api.get('/communication/care-teams', { params }),
  createCareTeam: (data: any) => api.post('/communication/care-teams', data),
  addTeamMember: (data: any) => api.post('/communication/care-teams/members', data),
  getTeamMembers: (teamId: string) => api.get(`/communication/care-teams/${teamId}/members`),
  createReferral: (data: any) => api.post('/communication/referrals', data),
  getReferrals: (params?: any) => api.get('/communication/referrals', { params }),
  acceptReferral: (id: string) => api.put(`/communication/referrals/${id}/accept`),
  createHandoff: (data: any) => api.post('/communication/handoffs', data),
  getHandoffs: (params?: any) => api.get('/communication/handoffs', { params }),
  createConsentForm: (data: any) => api.post('/communication/consent-forms', data),
  signConsentForm: (id: string) => api.put(`/communication/consent-forms/${id}/sign`),
  getConsentForms: (params?: any) => api.get('/communication/consent-forms', { params }),
  getCoordinationTasks: (params?: any) => api.get('/communication/coordination-tasks', { params }),
  createCoordinationTask: (data: any) => api.post('/communication/coordination-tasks', data),
  getPreferences: () => api.get('/communication/preferences'),
  updatePreferences: (data: any) => api.put('/communication/preferences', data),
};

// Billing Enhanced API
export const billingEnhancedAPI = {
  getInvoices: (params?: any) => api.get('/billing-enhanced/invoices', { params }),
  createInvoice: (data: any) => api.post('/billing-enhanced/invoices', data),
  getPayments: (params?: any) => api.get('/billing-enhanced/payments', { params }),
  makePayment: (data: any) => api.post('/billing-enhanced/payments', data),
  getInsurancePlans: (params?: any) => api.get('/billing-enhanced/insurance-plans', { params }),
  createInsurancePlan: (data: any) => api.post('/billing-enhanced/insurance-plans', data),
  verifyInsurance: (data: any) => api.post('/billing-enhanced/insurance/verify', data),
  getVerifications: (params?: any) => api.get('/billing-enhanced/insurance-verifications', { params }),
  submitPriorAuth: (data: any) => api.post('/billing-enhanced/prior-auth', data),
  getPriorAuths: (params?: any) => api.get('/billing-enhanced/prior-auth', { params }),
  getCostEstimate: (data: any) => api.post('/billing-enhanced/cost-estimate', data),
  getCostEstimates: (params?: any) => api.get('/billing-enhanced/cost-estimates', { params }),
  captureCharge: (data: any) => api.post('/billing-enhanced/charge-capture', data),
  getChargeCaptures: (params?: any) => api.get('/billing-enhanced/charge-captures', { params }),
  submitClaim: (data: any) => api.post('/billing-enhanced/claims', data),
  getClaims: (params?: any) => api.get('/billing-enhanced/claims', { params }),
  getDenials: (params?: any) => api.get('/billing-enhanced/denials', { params }),
  appealDenial: (id: string, data: any) => api.post(`/billing-enhanced/denials/${id}/appeal`, data),
  getFinancialCounseling: (params?: any) => api.get('/billing-enhanced/financial-counseling', { params }),
  createFinancialCounseling: (data: any) => api.post('/billing-enhanced/financial-counseling', data),
  getDashboardStats: () => api.get('/billing-enhanced/dashboard/stats'),
};

// Quality & Safety API
export const qualitySafetyAPI = {
  getAdverseEvents: (params?: any) => api.get('/quality-safety/adverse-events', { params }),
  reportAdverseEvent: (data: any) => api.post('/quality-safety/adverse-events', data),
  getIncidentReports: (params?: any) => api.get('/quality-safety/incident-reports', { params }),
  createIncidentReport: (data: any) => api.post('/quality-safety/incident-reports', data),
  investigateIncident: (id: string, data: any) => api.put(`/quality-safety/incident-reports/${id}/investigate`, data),
  getQualityMeasures: (params?: any) => api.get('/quality-safety/quality-measures', { params }),
  createQualityMeasure: (data: any) => api.post('/quality-safety/quality-measures', data),
  getInfectionControl: (params?: any) => api.get('/quality-safety/infection-control', { params }),
  reportInfection: (data: any) => api.post('/quality-safety/infection-control', data),
  getSafetyChecklists: (params?: any) => api.get('/quality-safety/safety-checklists', { params }),
  createChecklist: (data: any) => api.post('/quality-safety/safety-checklists', data),
  completeChecklist: (id: string, data: any) => api.post(`/quality-safety/safety-checklists/${id}/complete`, data),
  getRCAs: (params?: any) => api.get('/quality-safety/rca', { params }),
  createRCA: (data: any) => api.post('/quality-safety/rca', data),
  getFallRiskAssessments: (params?: any) => api.get('/quality-safety/fall-risk', { params }),
  createFallRiskAssessment: (data: any) => api.post('/quality-safety/fall-risk', data),
  getPressureInjury: (params?: any) => api.get('/quality-safety/pressure-injury', { params }),
  createPressureInjury: (data: any) => api.post('/quality-safety/pressure-injury', data),
  getDashboardStats: () => api.get('/quality-safety/dashboard/stats'),
};

// Supply Chain API
export const supplyChainAPI = {
  getInventory: (params?: any) => api.get('/supply-chain/inventory', { params }),
  addInventoryItem: (data: any) => api.post('/supply-chain/inventory', data),
  adjustInventory: (id: string, data: any) => api.put(`/supply-chain/inventory/${id}/adjust`, data),
  getVendors: (params?: any) => api.get('/supply-chain/vendors', { params }),
  createVendor: (data: any) => api.post('/supply-chain/vendors', data),
  getPurchaseOrders: (params?: any) => api.get('/supply-chain/purchase-orders', { params }),
  createPurchaseOrder: (data: any) => api.post('/supply-chain/purchase-orders', data),
  approvePurchaseOrder: (id: string) => api.put(`/supply-chain/purchase-orders/${id}/approve`),
  getEquipment: (params?: any) => api.get('/supply-chain/equipment', { params }),
  addEquipment: (data: any) => api.post('/supply-chain/equipment', data),
  getMaintenanceRequests: (params?: any) => api.get('/supply-chain/maintenance-requests', { params }),
  createMaintenanceRequest: (data: any) => api.post('/supply-chain/maintenance-requests', data),
  getAssetTracking: (params?: any) => api.get('/supply-chain/asset-tracking', { params }),
  getWasteManagement: (params?: any) => api.get('/supply-chain/waste-management', { params }),
  logWaste: (data: any) => api.post('/supply-chain/waste-management', data),
  getDashboardStats: () => api.get('/supply-chain/dashboard/stats'),
};

// Telehealth Enhanced API
export const telehealthEnhancedAPI = {
  getVideoSessions: (params?: any) => api.get('/telehealth/video-sessions', { params }),
  createVideoSession: (data: any) => api.post('/telehealth/video-sessions', data),
  startSession: (id: string) => api.put(`/telehealth/video-sessions/${id}/start`),
  endSession: (id: string, data: any) => api.put(`/telehealth/video-sessions/${id}/end`, data),
  getWaitingRoom: (params?: any) => api.get('/telehealth/waiting-room', { params }),
  joinWaitingRoom: (data: any) => api.post('/telehealth/waiting-room/join', data),
  getMonitoringPlans: (params?: any) => api.get('/telehealth/monitoring-plans', { params }),
  createMonitoringPlan: (data: any) => api.post('/telehealth/monitoring-plans', data),
  getMonitoringData: (planId: string) => api.get(`/telehealth/monitoring-plans/${planId}/data`),
  submitMonitoringData: (data: any) => api.post('/telehealth/monitoring-data', data),
  getEPrescriptions: (params?: any) => api.get('/telehealth/e-prescriptions', { params }),
  createEPrescription: (data: any) => api.post('/telehealth/e-prescriptions', data),
  getChatMessages: (sessionId: string) => api.get(`/telehealth/chat/${sessionId}`),
  sendChatMessage: (data: any) => api.post('/telehealth/chat', data),
  getConsents: (params?: any) => api.get('/telehealth/consents', { params }),
  createConsent: (data: any) => api.post('/telehealth/consents', data),
  getDashboardStats: () => api.get('/telehealth/dashboard/stats'),
};

// Pathology API
export const pathologyAPI = {
  getSpecimens: (params?: any) => api.get('/pathology/specimens', { params }),
  createSpecimen: (data: any) => api.post('/pathology/specimens', data),
  getBlocks: (specimenId: string) => api.get(`/pathology/specimens/${specimenId}/blocks`),
  createBlock: (data: any) => api.post('/pathology/blocks', data),
  getSlides: (blockId: string) => api.get(`/pathology/blocks/${blockId}/slides`),
  createSlide: (data: any) => api.post('/pathology/slides', data),
  getStainingProtocols: () => api.get('/pathology/staining-protocols'),
  createStainingProtocol: (data: any) => api.post('/pathology/staining-protocols', data),
  getReports: (params?: any) => api.get('/pathology/reports', { params }),
  createReport: (data: any) => api.post('/pathology/reports', data),
  finalizeReport: (id: string) => api.put(`/pathology/reports/${id}/finalize`),
  getTumorBoards: (params?: any) => api.get('/pathology/tumor-boards', { params }),
  createTumorBoard: (data: any) => api.post('/pathology/tumor-boards', data),
  concludeTumorBoard: (id: string, data: any) => api.put(`/pathology/tumor-boards/${id}/conclude`, data),
  getCytology: (params?: any) => api.get('/pathology/cytology', { params }),
  createCytology: (data: any) => api.post('/pathology/cytology', data),
  getDashboardStats: () => api.get('/pathology/dashboard/stats'),
};

// Rehabilitation API
export const rehabilitationAPI = {
  getPlans: (params?: any) => api.get('/rehabilitation/plans', { params }),
  createPlan: (data: any) => api.post('/rehabilitation/plans', data),
  getSessions: (params?: any) => api.get('/rehabilitation/sessions', { params }),
  createSession: (data: any) => api.post('/rehabilitation/sessions', data),
  getFunctionalAssessments: (params?: any) => api.get('/rehabilitation/functional-assessments', { params }),
  createFunctionalAssessment: (data: any) => api.post('/rehabilitation/functional-assessments', data),
  getExercises: (planId: string) => api.get(`/rehabilitation/plans/${planId}/exercises`),
  createExercise: (data: any) => api.post('/rehabilitation/exercises', data),
  getMilestones: (planId: string) => api.get(`/rehabilitation/plans/${planId}/milestones`),
  createMilestone: (data: any) => api.post('/rehabilitation/milestones', data),
  completeMilestone: (id: string) => api.put(`/rehabilitation/milestones/${id}/complete`),
  getDisabilityScores: (params?: any) => api.get('/rehabilitation/disability-scores', { params }),
  createDisabilityScore: (data: any) => api.post('/rehabilitation/disability-scores', data),
  getPainManagement: (params?: any) => api.get('/rehabilitation/pain-management', { params }),
  createPainManagement: (data: any) => api.post('/rehabilitation/pain-management', data),
  getDashboardStats: () => api.get('/rehabilitation/dashboard/stats'),
};

// Nutrition Enhanced API
export const nutritionEnhancedAPI = {
  getAssessments: (params?: any) => api.get('/nutrition-enhanced/assessments', { params }),
  createAssessment: (data: any) => api.post('/nutrition-enhanced/assessments', data),
  getMealPlans: (params?: any) => api.get('/nutrition-enhanced/meal-plans', { params }),
  createMealPlan: (data: any) => api.post('/nutrition-enhanced/meal-plans', data),
  getFoodLogs: (params?: any) => api.get('/nutrition-enhanced/food-logs', { params }),
  logFood: (data: any) => api.post('/nutrition-enhanced/food-logs', data),
  getDietaryRestrictions: (params?: any) => api.get('/nutrition-enhanced/dietary-restrictions', { params }),
  addDietaryRestriction: (data: any) => api.post('/nutrition-enhanced/dietary-restrictions', data),
  getSupplements: (params?: any) => api.get('/nutrition-enhanced/supplements', { params }),
  addSupplement: (data: any) => api.post('/nutrition-enhanced/supplements', data),
  getHydrationLogs: (params?: any) => api.get('/nutrition-enhanced/hydration-logs', { params }),
  logHydration: (data: any) => api.post('/nutrition-enhanced/hydration-logs', data),
  getWeightPrograms: (params?: any) => api.get('/nutrition-enhanced/weight-programs', { params }),
  createWeightProgram: (data: any) => api.post('/nutrition-enhanced/weight-programs', data),
  getEnteralNutrition: (params?: any) => api.get('/nutrition-enhanced/enteral-nutrition', { params }),
  createEnteralNutrition: (data: any) => api.post('/nutrition-enhanced/enteral-nutrition', data),
  getDashboardStats: () => api.get('/nutrition-enhanced/dashboard/stats'),
};

// Mental Health Enhanced API
export const mentalHealthEnhancedAPI = {
  getCBTSessions: (params?: any) => api.get('/mental-health-enhanced/cbt-sessions', { params }),
  createCBTSession: (data: any) => api.post('/mental-health-enhanced/cbt-sessions', data),
  getMindfulnessExercises: () => api.get('/mental-health-enhanced/mindfulness-exercises'),
  createMindfulnessExercise: (data: any) => api.post('/mental-health-enhanced/mindfulness-exercises', data),
  logMindfulnessSession: (data: any) => api.post('/mental-health-enhanced/mindfulness-sessions', data),
  getMindfulnessSessions: (params?: any) => api.get('/mental-health-enhanced/mindfulness-sessions', { params }),
  getCrisisInterventions: (params?: any) => api.get('/mental-health-enhanced/crisis-interventions', { params }),
  createCrisisIntervention: (data: any) => api.post('/mental-health-enhanced/crisis-interventions', data),
  getSafetyPlans: (params?: any) => api.get('/mental-health-enhanced/safety-plans', { params }),
  createSafetyPlan: (data: any) => api.post('/mental-health-enhanced/safety-plans', data),
  getSubstanceUseLogs: (params?: any) => api.get('/mental-health-enhanced/substance-use', { params }),
  logSubstanceUse: (data: any) => api.post('/mental-health-enhanced/substance-use', data),
  getBehavioralGoals: (params?: any) => api.get('/mental-health-enhanced/behavioral-goals', { params }),
  createBehavioralGoal: (data: any) => api.post('/mental-health-enhanced/behavioral-goals', data),
  getScreenings: (params?: any) => api.get('/mental-health-enhanced/screenings', { params }),
  submitScreening: (data: any) => api.post('/mental-health-enhanced/screenings', data),
  getGroupTherapy: (params?: any) => api.get('/mental-health-enhanced/group-therapy', { params }),
  createGroupTherapy: (data: any) => api.post('/mental-health-enhanced/group-therapy', data),
  getDashboardStats: () => api.get('/mental-health-enhanced/dashboard/stats'),
};

// Clinical Trials V2 API
export const clinicalTrialsV2API = {
  getProtocols: (params?: any) => api.get('/clinical-trials-v2/protocols', { params }),
  getProtocol: (id: string) => api.get(`/clinical-trials-v2/protocols/${id}`),
  createProtocol: (data: any) => api.post('/clinical-trials-v2/protocols', data),
  updateProtocol: (id: string, data: any) => api.put(`/clinical-trials-v2/protocols/${id}`, data),
  getSites: (protocolId: string) => api.get(`/clinical-trials-v2/protocols/${protocolId}/sites`),
  addSite: (data: any) => api.post('/clinical-trials-v2/sites', data),
  getParticipants: (params?: any) => api.get('/clinical-trials-v2/participants', { params }),
  enrollParticipant: (data: any) => api.post('/clinical-trials-v2/participants', data),
  withdrawParticipant: (id: string, data: any) => api.put(`/clinical-trials-v2/participants/${id}/withdraw`, data),
  getVisits: (participantId: string) => api.get(`/clinical-trials-v2/participants/${participantId}/visits`),
  createVisit: (data: any) => api.post('/clinical-trials-v2/visits', data),
  getTrialAdverseEvents: (params?: any) => api.get('/clinical-trials-v2/adverse-events', { params }),
  reportTrialAdverseEvent: (data: any) => api.post('/clinical-trials-v2/adverse-events', data),
  getConcomitantMeds: (participantId: string) => api.get(`/clinical-trials-v2/participants/${participantId}/concomitant-meds`),
  addConcomitantMed: (data: any) => api.post('/clinical-trials-v2/concomitant-meds', data),
  getDCFs: (params?: any) => api.get('/clinical-trials-v2/dcfs', { params }),
  createDCF: (data: any) => api.post('/clinical-trials-v2/dcfs', data),
  getProtocolDeviations: (params?: any) => api.get('/clinical-trials-v2/protocol-deviations', { params }),
  reportProtocolDeviation: (data: any) => api.post('/clinical-trials-v2/protocol-deviations', data),
  getDashboardStats: () => api.get('/clinical-trials-v2/dashboard/stats'),
};

// Radiology Enhanced API
export const radiologyEnhancedAPI = {
  getAIReadings: (params?: any) => api.get('/radiology-enhanced/ai-readings', { params }),
  createAIReading: (data: any) => api.post('/radiology-enhanced/ai-readings', data),
  getTumorMeasurements: (params?: any) => api.get('/radiology-enhanced/tumor-measurements', { params }),
  addTumorMeasurement: (data: any) => api.post('/radiology-enhanced/tumor-measurements', data),
  getRadiationDoses: (params?: any) => api.get('/radiology-enhanced/radiation-doses', { params }),
  recordRadiationDose: (data: any) => api.post('/radiology-enhanced/radiation-doses', data),
  getStructuredReports: (params?: any) => api.get('/radiology-enhanced/structured-reports', { params }),
  createStructuredReport: (data: any) => api.post('/radiology-enhanced/structured-reports', data),
  getImagingProtocols: () => api.get('/radiology-enhanced/imaging-protocols'),
  createImagingProtocol: (data: any) => api.post('/radiology-enhanced/imaging-protocols', data),
  getContrastReactions: (params?: any) => api.get('/radiology-enhanced/contrast-reactions', { params }),
  reportContrastReaction: (data: any) => api.post('/radiology-enhanced/contrast-reactions', data),
  getOrderTracking: (params?: any) => api.get('/radiology-enhanced/order-tracking', { params }),
  createOrderTracking: (data: any) => api.post('/radiology-enhanced/order-tracking', data),
  getDashboardStats: () => api.get('/radiology-enhanced/dashboard/stats'),
};

// Pharmacy Enhanced API
export const pharmacyEnhancedAPI = {
  getFormulary: (params?: any) => api.get('/pharmacy-enhanced/formulary', { params }),
  addFormularyItem: (data: any) => api.post('/pharmacy-enhanced/formulary', data),
  searchFormulary: (query: string) => api.get('/pharmacy-enhanced/formulary/search', { params: { q: query } }),
  getDURs: (params?: any) => api.get('/pharmacy-enhanced/dur', { params }),
  createDUR: (data: any) => api.post('/pharmacy-enhanced/dur', data),
  getMedicationReconciliations: (params?: any) => api.get('/pharmacy-enhanced/medication-reconciliation', { params }),
  createReconciliation: (data: any) => api.post('/pharmacy-enhanced/medication-reconciliation', data),
  getCompoundedMeds: (params?: any) => api.get('/pharmacy-enhanced/compounded', { params }),
  createCompoundedMed: (data: any) => api.post('/pharmacy-enhanced/compounded', data),
  getControlledSubstanceLogs: (params?: any) => api.get('/pharmacy-enhanced/controlled-substances', { params }),
  logControlledSubstance: (data: any) => api.post('/pharmacy-enhanced/controlled-substances', data),
  getInterventions: (params?: any) => api.get('/pharmacy-enhanced/interventions', { params }),
  createIntervention: (data: any) => api.post('/pharmacy-enhanced/interventions', data),
  getAntibioticStewardship: (params?: any) => api.get('/pharmacy-enhanced/antibiotic-stewardship', { params }),
  createAntibioticReview: (data: any) => api.post('/pharmacy-enhanced/antibiotic-stewardship', data),
  getAdverseReactions: (params?: any) => api.get('/pharmacy-enhanced/adverse-reactions', { params }),
  reportAdverseReaction: (data: any) => api.post('/pharmacy-enhanced/adverse-reactions', data),
  getDashboardStats: () => api.get('/pharmacy-enhanced/dashboard/stats'),
};

// Education API
export const educationAPI = {
  getResources: (params?: any) => api.get('/education/resources', { params }),
  createResource: (data: any) => api.post('/education/resources', data),
  searchResources: (query: string) => api.get('/education/resources/search', { params: { q: query } }),
  incrementViewCount: (id: string) => api.put(`/education/resources/${id}/view`),
  getAssignments: (params?: any) => api.get('/education/assignments', { params }),
  createAssignment: (data: any) => api.post('/education/assignments', data),
  completeAssignment: (id: string, data: any) => api.put(`/education/assignments/${id}/complete`, data),
  getQuizzes: (params?: any) => api.get('/education/quizzes', { params }),
  createQuiz: (data: any) => api.post('/education/quizzes', data),
  attemptQuiz: (id: string, data: any) => api.post(`/education/quizzes/${id}/attempt`, data),
  getHealthLiteracy: (params?: any) => api.get('/education/health-literacy', { params }),
  assessHealthLiteracy: (data: any) => api.post('/education/health-literacy', data),
  getTrainingModules: (params?: any) => api.get('/education/training-modules', { params }),
  createTrainingModule: (data: any) => api.post('/education/training-modules', data),
  completeTrainingModule: (id: string) => api.put(`/education/training-modules/${id}/complete`),
  getCertifications: (params?: any) => api.get('/education/certifications', { params }),
  addCertification: (data: any) => api.post('/education/certifications', data),
  getLearningPaths: () => api.get('/education/learning-paths'),
  createLearningPath: (data: any) => api.post('/education/learning-paths', data),
  getDashboardStats: () => api.get('/education/dashboard/stats'),
};

// Social Determinants API
export const socialDeterminantsAPI = {
  getAssessments: (params?: any) => api.get('/social-determinants/assessments', { params }),
  createAssessment: (data: any) => api.post('/social-determinants/assessments', data),
  getSocialRisks: (params?: any) => api.get('/social-determinants/social-risks', { params }),
  identifyRisk: (data: any) => api.post('/social-determinants/social-risks', data),
  addressRisk: (id: string, data: any) => api.put(`/social-determinants/social-risks/${id}/address`, data),
  getCommunityPrograms: (params?: any) => api.get('/social-determinants/community-programs', { params }),
  createCommunityProgram: (data: any) => api.post('/social-determinants/community-programs', data),
  getReferrals: (params?: any) => api.get('/social-determinants/program-referrals', { params }),
  createReferral: (data: any) => api.post('/social-determinants/program-referrals', data),
  getTransportationNeeds: (params?: any) => api.get('/social-determinants/transportation', { params }),
  requestTransportation: (data: any) => api.post('/social-determinants/transportation', data),
  getFoodInsecurity: (params?: any) => api.get('/social-determinants/food-insecurity', { params }),
  screenFoodInsecurity: (data: any) => api.post('/social-determinants/food-insecurity', data),
  getHousingAssessments: (params?: any) => api.get('/social-determinants/housing', { params }),
  assessHousing: (data: any) => api.post('/social-determinants/housing', data),
  getDashboardStats: () => api.get('/social-determinants/dashboard/stats'),
};

// Wearable Enhanced API
export const wearableEnhancedAPI = {
  getDevices: (params?: any) => api.get('/wearable-enhanced/devices', { params }),
  registerDevice: (data: any) => api.post('/wearable-enhanced/devices', data),
  getGlucoseReadings: (params?: any) => api.get('/wearable-enhanced/glucose-readings', { params }),
  addGlucoseReading: (data: any) => api.post('/wearable-enhanced/glucose-readings', data),
  getGlucoseSummary: (params?: any) => api.get('/wearable-enhanced/glucose-summary', { params }),
  getFallEvents: (params?: any) => api.get('/wearable-enhanced/fall-events', { params }),
  reportFallEvent: (data: any) => api.post('/wearable-enhanced/fall-events', data),
  getMedicationReminders: (params?: any) => api.get('/wearable-enhanced/medication-reminders', { params }),
  createMedicationReminder: (data: any) => api.post('/wearable-enhanced/medication-reminders', data),
  getDoseLogs: (params?: any) => api.get('/wearable-enhanced/dose-logs', { params }),
  logDose: (data: any) => api.post('/wearable-enhanced/dose-logs', data),
  getGaitAnalysis: (params?: any) => api.get('/wearable-enhanced/gait-analysis', { params }),
  submitGaitAnalysis: (data: any) => api.post('/wearable-enhanced/gait-analysis', data),
  getRespiratoryData: (params?: any) => api.get('/wearable-enhanced/respiratory', { params }),
  submitRespiratoryData: (data: any) => api.post('/wearable-enhanced/respiratory', data),
  getPainTracking: (params?: any) => api.get('/wearable-enhanced/pain-tracking', { params }),
  logPain: (data: any) => api.post('/wearable-enhanced/pain-tracking', data),
  getSleepAnalysis: (params?: any) => api.get('/wearable-enhanced/sleep-analysis', { params }),
  submitSleepAnalysis: (data: any) => api.post('/wearable-enhanced/sleep-analysis', data),
  getVitalsStream: (params?: any) => api.get('/wearable-enhanced/vitals-stream', { params }),
  streamVitals: (data: any) => api.post('/wearable-enhanced/vitals-stream', data),
  getDashboardStats: () => api.get('/wearable-enhanced/dashboard/stats'),
};

// Emergency Enhanced API
export const emergencyEnhancedAPI = {
  getTriageAssessments: (params?: any) => api.get('/emergency-enhanced/triage', { params }),
  createTriageAssessment: (data: any) => api.post('/emergency-enhanced/triage', data),
  getSepsisScreenings: (params?: any) => api.get('/emergency-enhanced/sepsis-screenings', { params }),
  createSepsisScreening: (data: any) => api.post('/emergency-enhanced/sepsis-screenings', data),
  getStrokeAssessments: (params?: any) => api.get('/emergency-enhanced/stroke-assessments', { params }),
  createStrokeAssessment: (data: any) => api.post('/emergency-enhanced/stroke-assessments', data),
  getCodeEvents: (params?: any) => api.get('/emergency-enhanced/code-events', { params }),
  createCodeEvent: (data: any) => api.post('/emergency-enhanced/code-events', data),
  resolveCodeEvent: (id: string, data: any) => api.put(`/emergency-enhanced/code-events/${id}/resolve`, data),
  getTraumaAssessments: (params?: any) => api.get('/emergency-enhanced/trauma', { params }),
  createTraumaAssessment: (data: any) => api.post('/emergency-enhanced/trauma', data),
  getRapidResponseTeams: (params?: any) => api.get('/emergency-enhanced/rapid-response', { params }),
  activateRapidResponse: (data: any) => api.post('/emergency-enhanced/rapid-response', data),
  getDashboardStats: () => api.get('/emergency-enhanced/dashboard/stats'),
};

// Workforce API
export const workforceAPI = {
  getStaff: (params?: any) => api.get('/workforce/staff', { params }),
  createStaffProfile: (data: any) => api.post('/workforce/staff', data),
  getShifts: (params?: any) => api.get('/workforce/shifts', { params }),
  createShift: (data: any) => api.post('/workforce/shifts', data),
  swapShift: (id: string, data: any) => api.put(`/workforce/shifts/${id}/swap`, data),
  getLeaveRequests: (params?: any) => api.get('/workforce/leave-requests', { params }),
  createLeaveRequest: (data: any) => api.post('/workforce/leave-requests', data),
  approveLeaveRequest: (id: string) => api.put(`/workforce/leave-requests/${id}/approve`),
  getCredentialing: (params?: any) => api.get('/workforce/credentialing', { params }),
  addCredential: (data: any) => api.post('/workforce/credentialing', data),
  getPerformanceReviews: (params?: any) => api.get('/workforce/performance-reviews', { params }),
  createPerformanceReview: (data: any) => api.post('/workforce/performance-reviews', data),
  getStaffingMetrics: (params?: any) => api.get('/workforce/staffing-metrics', { params }),
  getDashboardStats: () => api.get('/workforce/dashboard/stats'),
};

// Documents & File Upload API
export const documentsAPI = {
  upload: (formData: FormData) => api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMyDocuments: (params?: any) => api.get('/documents/my', { params }),
  getDocument: (id: string) => api.get(`/documents/${id}`),
  updateDocument: (id: string, data: any) => api.put(`/documents/${id}`, data),
  deleteDocument: (id: string) => api.delete(`/documents/${id}`),
  downloadDocument: (id: string) => api.get(`/documents/download/${id}`, { responseType: 'blob' }),
  getStats: () => api.get('/documents/stats/summary'),
};

// Insurance Management API
export const insuranceAPI = {
  getPolicies: () => api.get('/documents/insurance/policies'),
  addPolicy: (data: any) => api.post('/documents/insurance/policies', data),
  updatePolicy: (id: string, data: any) => api.put(`/documents/insurance/policies/${id}`, data),
  deletePolicy: (id: string) => api.delete(`/documents/insurance/policies/${id}`),
  getClaims: (params?: any) => api.get('/documents/insurance/claims', { params }),
  submitClaim: (data: any) => api.post('/documents/insurance/claims', data),
  getSummary: () => api.get('/documents/insurance/summary'),
};

export default api;

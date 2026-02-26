// ============================================================================
// Constants - Application-wide Constants for CancerGuard AI
// ============================================================================

// ============================================================================
// API & ENVIRONMENT
// ============================================================================

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
export const APP_NAME = 'CancerGuard AI';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'Advanced AI-Powered Healthcare & Cancer Detection Platform';

// ============================================================================
// ROUTE CONSTANTS
// ============================================================================

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Patient
  PATIENT: {
    DASHBOARD: '/patient',
    CANCER_RISK: '/patient/cancer-risk',
    RECORDS: '/patient/records',
    BLOOD_TESTS: '/patient/blood-tests',
    APPOINTMENTS: '/patient/appointments',
    MEDICATIONS: '/patient/medications',
    SMARTWATCH: '/patient/smartwatch',
    SYMPTOMS: '/patient/symptoms',
    GOALS: '/patient/goals',
    PROFILE: '/patient/profile',
    SETTINGS: '/patient/settings',
    HOSPITALS: '/patient/hospitals',
    MESSAGES: '/patient/messages',
    VITALS: '/patient/vitals',
    NOTIFICATIONS: '/patient/notifications',
    GENETICS: '/patient/genetics',
    DIET: '/patient/diet',
    MENTAL_HEALTH: '/patient/mental-health',
    TREATMENT: '/patient/treatment',
    EXERCISE: '/patient/exercise',
    SCREENING: '/patient/screening',
    FAMILY_HEALTH: '/patient/family-health',
    BLOOD_DONOR: '/patient/blood-donor',
    CLINICAL_PATHWAYS: '/patient/clinical-pathways',
    GENOMICS: '/patient/genomics',
    ENGAGEMENT: '/patient/engagement',
    REHABILITATION: '/patient/rehabilitation',
    WEARABLES: '/patient/wearables',
    COMMUNICATION: '/patient/communication',
    TELEHEALTH: '/patient/telehealth',
    NUTRITION: '/patient/nutrition',
    MENTAL_HEALTH_ENHANCED: '/patient/mental-health-enhanced',
    EDUCATION: '/patient/education',
    SOCIAL_DETERMINANTS: '/patient/social-determinants',
    BILLING: '/patient/billing',
    DOCUMENTS: '/patient/documents',
    INSURANCE: '/patient/insurance',
    SECOND_OPINION: '/patient/second-opinion',
    CARE_TEAM: '/patient/care-team',
    HEALTH_TIMELINE: '/patient/health-timeline',
    LAB_RESULTS: '/patient/lab-results',
    EMERGENCY_CONTACTS: '/patient/emergency-contacts',
    PHARMACY: '/patient/pharmacy',
    TRAVEL_HEALTH: '/patient/travel-health',
    PREVENTIVE_CARE: '/patient/preventive-care',
    PAIN_MANAGEMENT: '/patient/pain-management',
    FERTILITY: '/patient/fertility',
    DENTAL: '/patient/dental',
    VISION: '/patient/vision',
    ALLERGY: '/patient/allergy',
    VACCINATION: '/patient/vaccination',
  },

  // Hospital
  HOSPITAL: {
    DASHBOARD: '/hospital',
    PATIENTS: '/hospital/patients',
    DOCTORS: '/hospital/doctors',
    STAFF: '/hospital/staff',
    APPOINTMENTS: '/hospital/appointments',
    LAB: '/hospital/lab',
    BEDS: '/hospital/beds',
    AI_ANALYTICS: '/hospital/ai-analytics',
    REPORTS: '/hospital/reports',
    SETTINGS: '/hospital/settings',
    SURGERY: '/hospital/surgery',
    PHARMACY: '/hospital/pharmacy',
    RADIOLOGY: '/hospital/radiology',
    EMERGENCY: '/hospital/emergency',
    TELEMEDICINE: '/hospital/telemedicine',
    CLINICAL_TRIALS: '/hospital/clinical-trials',
    QUALITY: '/hospital/quality',
    BLOOD_BANK: '/hospital/blood-bank',
    PATHOLOGY: '/hospital/pathology',
    SUPPLY_CHAIN: '/hospital/supply-chain',
    QUALITY_SAFETY: '/hospital/quality-safety',
    GENOMICS_LAB: '/hospital/genomics-lab',
    POPULATION_HEALTH: '/hospital/population-health',
    CLINICAL_DECISION: '/hospital/clinical-decision',
    REHABILITATION: '/hospital/rehabilitation',
    NUTRITION: '/hospital/nutrition',
    ICU_MONITORING: '/hospital/icu-monitoring',
    TRANSPLANT: '/hospital/transplant',
    ONCOLOGY: '/hospital/oncology',
    CARDIOLOGY: '/hospital/cardiology',
    NEUROLOGY: '/hospital/neurology',
    PEDIATRICS: '/hospital/pediatrics',
    NICU: '/hospital/nicu',
    OPERATING_ROOMS: '/hospital/operating-rooms',
    STERILIZATION: '/hospital/sterilization',
    MORTUARY: '/hospital/mortuary',
    AMBULANCE: '/hospital/ambulance',
    INFECTION_CONTROL: '/hospital/infection-control',
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    HOSPITALS: '/admin/hospitals',
    SYSTEM: '/admin/system',
    AI_MODELS: '/admin/ai-models',
    SECURITY: '/admin/security',
    ANALYTICS: '/admin/analytics',
    AUDIT_LOGS: '/admin/audit-logs',
    REPORTS: '/admin/reports',
    CONFIG: '/admin/config',
    NOTIFICATIONS: '/admin/notifications',
    COMPLIANCE: '/admin/compliance',
    DATA_MANAGEMENT: '/admin/data-management',
    BILLING: '/admin/billing',
    INTEGRATIONS: '/admin/integrations',
    TRAINING: '/admin/training',
    RESEARCH: '/admin/research',
    WORKFORCE: '/admin/workforce',
    POPULATION_HEALTH: '/admin/population-health',
    QUALITY_DASHBOARD: '/admin/quality-dashboard',
    EDUCATION: '/admin/education',
    SOCIAL_DETERMINANTS: '/admin/social-determinants',
    API_MANAGEMENT: '/admin/api-management',
    FEATURE_FLAGS: '/admin/feature-flags',
    SUPPORT_TICKETS: '/admin/support-tickets',
    DISASTER_RECOVERY: '/admin/disaster-recovery',
    PERFORMANCE: '/admin/performance',
    DEPLOYMENT: '/admin/deployment',
    LOGGING: '/admin/logging',
    DATABASE: '/admin/database',
    CACHE: '/admin/cache',
  },
} as const;

// ============================================================================
// ROLE CONSTANTS
// ============================================================================

export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  SUPER_ADMIN: 'super_admin',
  HOSPITAL_ADMIN: 'hospital_admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  ONCOLOGIST: 'oncologist',
  SURGEON: 'surgeon',
  RADIOLOGIST: 'radiologist',
  PATHOLOGIST: 'pathologist',
  GENERAL_PRACTITIONER: 'general_practitioner',
  SPECIALIST: 'specialist',
  PHARMACIST: 'pharmacist',
  LAB_TECHNICIAN: 'lab_technician',
  RECEPTIONIST: 'receptionist',
  PATIENT: 'patient',
  CAREGIVER: 'caregiver',
  RESEARCHER: 'researcher',
} as const;

export const ADMIN_ROLES = [ROLES.SYSTEM_ADMIN, ROLES.SUPER_ADMIN];
export const HOSPITAL_ROLES = [
  ROLES.HOSPITAL_ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.ONCOLOGIST,
  ROLES.SURGEON, ROLES.RADIOLOGIST, ROLES.PATHOLOGIST,
  ROLES.GENERAL_PRACTITIONER, ROLES.SPECIALIST,
];

// ============================================================================
// MEDICAL CONSTANTS
// ============================================================================

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const CANCER_TYPES = [
  'Breast Cancer', 'Lung Cancer', 'Prostate Cancer', 'Colorectal Cancer',
  'Melanoma', 'Bladder Cancer', 'Non-Hodgkin Lymphoma', 'Kidney Cancer',
  'Endometrial Cancer', 'Leukemia', 'Pancreatic Cancer', 'Thyroid Cancer',
  'Liver Cancer', 'Ovarian Cancer', 'Gastric Cancer', 'Brain Cancer',
  'Cervical Cancer', 'Esophageal Cancer', 'Multiple Myeloma', 'Lymphoma',
  'Testicular Cancer', 'Bone Cancer', 'Head and Neck Cancer', 'Mesothelioma',
  'Sarcoma', 'Gallbladder Cancer', 'Bile Duct Cancer', 'Adrenal Cancer',
] as const;

export const CANCER_STAGES = [
  { value: '0', label: 'Stage 0 - In Situ' },
  { value: 'I', label: 'Stage I - Localized' },
  { value: 'IA', label: 'Stage IA' },
  { value: 'IB', label: 'Stage IB' },
  { value: 'II', label: 'Stage II - Regional' },
  { value: 'IIA', label: 'Stage IIA' },
  { value: 'IIB', label: 'Stage IIB' },
  { value: 'III', label: 'Stage III - Regional' },
  { value: 'IIIA', label: 'Stage IIIA' },
  { value: 'IIIB', label: 'Stage IIIB' },
  { value: 'IIIC', label: 'Stage IIIC' },
  { value: 'IV', label: 'Stage IV - Distant' },
  { value: 'IVA', label: 'Stage IVA' },
  { value: 'IVB', label: 'Stage IVB' },
] as const;

export const VITAL_SIGN_RANGES = {
  heartRate: { min: 60, max: 100, unit: 'bpm', label: 'Heart Rate' },
  bloodPressureSystolic: { min: 90, max: 120, unit: 'mmHg', label: 'Systolic BP' },
  bloodPressureDiastolic: { min: 60, max: 80, unit: 'mmHg', label: 'Diastolic BP' },
  temperature: { min: 97.0, max: 99.0, unit: '°F', label: 'Temperature' },
  respiratoryRate: { min: 12, max: 20, unit: '/min', label: 'Respiratory Rate' },
  oxygenSaturation: { min: 95, max: 100, unit: '%', label: 'SpO2' },
  bloodGlucose: { min: 70, max: 100, unit: 'mg/dL', label: 'Blood Glucose' },
  bmi: { min: 18.5, max: 24.9, unit: 'kg/m²', label: 'BMI' },
} as const;

export const MEDICAL_SPECIALTIES = [
  'Cardiology', 'Dermatology', 'Emergency Medicine', 'Endocrinology',
  'Family Medicine', 'Gastroenterology', 'General Surgery', 'Geriatrics',
  'Hematology', 'Infectious Disease', 'Internal Medicine', 'Nephrology',
  'Neurology', 'Neurosurgery', 'Obstetrics & Gynecology', 'Oncology',
  'Ophthalmology', 'Orthopedics', 'Otolaryngology', 'Pathology',
  'Pediatrics', 'Physical Medicine', 'Plastic Surgery', 'Psychiatry',
  'Pulmonology', 'Radiology', 'Rheumatology', 'Thoracic Surgery',
  'Urology', 'Vascular Surgery', 'Anesthesiology', 'Nuclear Medicine',
  'Pain Medicine', 'Palliative Care', 'Sports Medicine', 'Surgical Oncology',
  'Radiation Oncology', 'Medical Oncology', 'Interventional Radiology',
] as const;

export const APPOINTMENT_TYPES = [
  { value: 'consultation', label: 'General Consultation', duration: 30, color: '#1565c0' },
  { value: 'follow_up', label: 'Follow-up Visit', duration: 15, color: '#00897b' },
  { value: 'screening', label: 'Cancer Screening', duration: 45, color: '#7b1fa2' },
  { value: 'lab_test', label: 'Lab Test', duration: 30, color: '#f57c00' },
  { value: 'imaging', label: 'Imaging/Radiology', duration: 60, color: '#0288d1' },
  { value: 'surgery', label: 'Surgery', duration: 120, color: '#d32f2f' },
  { value: 'therapy', label: 'Therapy Session', duration: 60, color: '#388e3c' },
  { value: 'vaccination', label: 'Vaccination', duration: 15, color: '#4caf50' },
  { value: 'emergency', label: 'Emergency', duration: 0, color: '#c62828' },
  { value: 'telehealth', label: 'Telehealth', duration: 30, color: '#5e92f3' },
  { value: 'physical_exam', label: 'Physical Exam', duration: 45, color: '#006064' },
  { value: 'mental_health', label: 'Mental Health', duration: 60, color: '#6a1b9a' },
  { value: 'dental', label: 'Dental', duration: 45, color: '#33691e' },
  { value: 'prenatal', label: 'Prenatal', duration: 30, color: '#e91e63' },
  { value: 'rehabilitation', label: 'Rehabilitation', duration: 45, color: '#00838f' },
] as const;

export const APPOINTMENT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: '#1565c0', icon: 'EventOutlined' },
  { value: 'confirmed', label: 'Confirmed', color: '#2e7d32', icon: 'CheckCircleOutlined' },
  { value: 'in_progress', label: 'In Progress', color: '#f57c00', icon: 'PlayCircleOutlined' },
  { value: 'completed', label: 'Completed', color: '#388e3c', icon: 'TaskAltOutlined' },
  { value: 'cancelled', label: 'Cancelled', color: '#c62828', icon: 'CancelOutlined' },
  { value: 'no_show', label: 'No Show', color: '#757575', icon: 'PersonOffOutlined' },
  { value: 'rescheduled', label: 'Rescheduled', color: '#7b1fa2', icon: 'UpdateOutlined' },
  { value: 'waiting', label: 'Waiting', color: '#0288d1', icon: 'HourglassEmptyOutlined' },
] as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

export const BREAKPOINTS = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
} as const;

export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const HEADER_HEIGHT = 64;
export const FOOTER_HEIGHT = 56;
export const DRAWER_WIDTH = 400;

export const Z_INDEX = {
  drawer: 1200,
  modal: 1300,
  tooltip: 1400,
  notification: 1500,
  overlay: 1600,
} as const;

export const ANIMATION_DURATION = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
} as const;

export const PAGE_SIZES = [5, 10, 25, 50, 100] as const;

export const CHART_COLORS = [
  '#1565c0', '#00897b', '#7b1fa2', '#f57c00', '#d32f2f',
  '#0288d1', '#388e3c', '#6a1b9a', '#e65100', '#c62828',
  '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#ff5722',
  '#00bcd4', '#8bc34a', '#673ab7', '#ff7043', '#26a69a',
] as const;

export const STATUS_COLORS: Record<string, string> = {
  active: '#4caf50',
  inactive: '#9e9e9e',
  pending: '#ff9800',
  approved: '#2196f3',
  rejected: '#f44336',
  archived: '#607d8b',
  critical: '#d32f2f',
  warning: '#f57c00',
  success: '#388e3c',
  info: '#0288d1',
  error: '#c62828',
};

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  LAB_RESULT_READY: 'lab_result_ready',
  PRESCRIPTION_READY: 'prescription_ready',
  MESSAGE_RECEIVED: 'message_received',
  HEALTH_ALERT: 'health_alert',
  CANCER_SCREENING_DUE: 'cancer_screening_due',
  MEDICATION_REMINDER: 'medication_reminder',
  BILLING_INVOICE: 'billing_invoice',
  SYSTEM_ALERT: 'system_alert',
  EMERGENCY_ALERT: 'emergency_alert',
  TREATMENT_UPDATE: 'treatment_update',
  REPORT_AVAILABLE: 'report_available',
  WEARABLE_ALERT: 'wearable_alert',
} as const;

// ============================================================================
// FILE UPLOAD LIMITS
// ============================================================================

export const UPLOAD_LIMITS = {
  profilePhoto: { maxSize: 5 * 1024 * 1024, types: ['jpg', 'jpeg', 'png', 'webp'] },
  medicalImage: { maxSize: 50 * 1024 * 1024, types: ['jpg', 'jpeg', 'png', 'dcm', 'dicom', 'tiff'] },
  document: { maxSize: 20 * 1024 * 1024, types: ['pdf', 'doc', 'docx', 'txt', 'rtf'] },
  labReport: { maxSize: 10 * 1024 * 1024, types: ['pdf', 'jpg', 'jpeg', 'png'] },
  prescription: { maxSize: 10 * 1024 * 1024, types: ['pdf', 'jpg', 'jpeg', 'png'] },
  bloodReport: { maxSize: 10 * 1024 * 1024, types: ['pdf', 'jpg', 'jpeg', 'png'] },
  xray: { maxSize: 100 * 1024 * 1024, types: ['dcm', 'dicom', 'jpg', 'jpeg', 'png', 'tiff'] },
  genomicData: { maxSize: 500 * 1024 * 1024, types: ['vcf', 'bam', 'fastq', 'fasta', 'csv'] },
} as const;

// ============================================================================
// CACHE KEYS
// ============================================================================

export const CACHE_KEYS = {
  USER: 'user',
  TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
  THEME: 'theme-mode',
  LANGUAGE: 'language',
  SIDEBAR_STATE: 'sidebar-state',
  RECENT_SEARCHES: 'recent-searches',
  NOTIFICATIONS: 'notifications',
  FAVORITES: 'favorites',
  DASHBOARD_LAYOUT: 'dashboard-layout',
  TABLE_PREFERENCES: 'table-preferences',
  CHART_PREFERENCES: 'chart-preferences',
} as const;

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  SEARCH: { key: 'k', ctrlKey: true, label: 'Search', description: 'Open global search' },
  NEW_APPOINTMENT: { key: 'n', ctrlKey: true, shiftKey: true, label: 'New Appointment', description: 'Create new appointment' },
  NOTIFICATIONS: { key: 'b', ctrlKey: true, label: 'Notifications', description: 'Toggle notifications panel' },
  SETTINGS: { key: ',', ctrlKey: true, label: 'Settings', description: 'Open settings' },
  HELP: { key: '/', ctrlKey: true, label: 'Help', description: 'Show keyboard shortcuts' },
  SIDEBAR: { key: 's', ctrlKey: true, shiftKey: true, label: 'Sidebar', description: 'Toggle sidebar' },
  DARK_MODE: { key: 'd', ctrlKey: true, shiftKey: true, label: 'Dark Mode', description: 'Toggle dark mode' },
  DASHBOARD: { key: 'h', ctrlKey: true, label: 'Dashboard', description: 'Go to dashboard' },
  LOGOUT: { key: 'l', ctrlKey: true, shiftKey: true, label: 'Logout', description: 'Logout' },
  ESCAPE: { key: 'Escape', label: 'Close', description: 'Close modals/panels' },
} as const;

// ============================================================================
// LANGUAGES
// ============================================================================

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', direction: 'ltr' },
  { code: 'es', name: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  { code: 'zh', name: '中文', flag: '🇨🇳', direction: 'ltr' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', direction: 'ltr' },
  { code: 'ko', name: '한국어', flag: '🇰🇷', direction: 'ltr' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', direction: 'ltr' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', direction: 'ltr' },
] as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check the form for errors.',
  UPLOAD_ERROR: 'Failed to upload file. Please try again.',
  DOWNLOAD_ERROR: 'Failed to download file. Please try again.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
} as const;

// ============================================================================
// REGEX PATTERNS
// ============================================================================

export const PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^\+?[\d\s\-()]{10,15}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  ZIP_CODE: /^\d{5}(-\d{4})?$/,
  SSN: /^\d{3}-?\d{2}-?\d{4}$/,
  CREDIT_CARD: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  DATE_US: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  TIME_24H: /^([01]\d|2[0-3]):([0-5]\d)$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  HEALTH_ID: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
  MRN: /^[A-Z]{2,3}\d{6,10}$/,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;

export default {
  API_BASE_URL, WS_BASE_URL, APP_NAME, APP_VERSION, APP_DESCRIPTION,
  ROUTES, ROLES, ADMIN_ROLES, HOSPITAL_ROLES,
  BLOOD_TYPES, CANCER_TYPES, CANCER_STAGES, VITAL_SIGN_RANGES,
  MEDICAL_SPECIALTIES, APPOINTMENT_TYPES, APPOINTMENT_STATUSES,
  BREAKPOINTS, SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH,
  HEADER_HEIGHT, FOOTER_HEIGHT, DRAWER_WIDTH, Z_INDEX,
  ANIMATION_DURATION, PAGE_SIZES, CHART_COLORS, STATUS_COLORS,
  NOTIFICATION_TYPES, UPLOAD_LIMITS, CACHE_KEYS,
  KEYBOARD_SHORTCUTS, SUPPORTED_LANGUAGES,
  ERROR_MESSAGES, PATTERNS,
};

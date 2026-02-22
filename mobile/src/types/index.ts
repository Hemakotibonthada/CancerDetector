// ─── Auth Types ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'hospital_admin' | 'admin' | 'super_admin';
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Patient Types ──────────────────────────────────────────
export interface Appointment {
  id: string;
  patient_id: string;
  doctor_name: string;
  department: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in_progress';
  type: string;
  notes?: string;
  hospital_name?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused';
  prescribed_by: string;
  instructions?: string;
  refills_remaining?: number;
}

export interface VitalSign {
  id: string;
  type: string;
  value: number;
  unit: string;
  recorded_at: string;
  status: 'normal' | 'warning' | 'critical';
  notes?: string;
}

export interface HealthRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  provider: string;
  attachments?: string[];
}

export interface Symptom {
  id: string;
  name: string;
  severity: number;
  duration: string;
  recorded_at: string;
  notes?: string;
  body_area?: string;
}

export interface BloodTest {
  id: string;
  test_name: string;
  value: number;
  unit: string;
  reference_range: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  date: string;
}

export interface Message {
  id: string;
  sender_name: string;
  subject: string;
  content: string;
  sent_at: string;
  is_read: boolean;
  is_urgent: boolean;
  sender_role: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  is_read: boolean;
}

export interface CancerRisk {
  id: string;
  cancer_type: string;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  risk_score: number;
  factors: string[];
  recommendations: string[];
  last_assessed: string;
}

// ─── Hospital Types ─────────────────────────────────────────
export interface Patient {
  id: string;
  full_name: string;
  age: number;
  gender: string;
  diagnosis: string;
  status: 'admitted' | 'outpatient' | 'discharged' | 'critical';
  admitted_date?: string;
  doctor_assigned: string;
  room_number?: string;
  blood_type?: string;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialization: string;
  department: string;
  phone: string;
  email: string;
  status: 'available' | 'busy' | 'on_leave';
  patients_count: number;
  experience_years: number;
}

export interface Bed {
  id: string;
  ward: string;
  room_number: string;
  bed_number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  patient_name?: string;
  admission_date?: string;
}

export interface LabOrder {
  id: string;
  patient_name: string;
  test_name: string;
  ordered_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  ordered_at: string;
  completed_at?: string;
  results?: string;
}

// ─── Admin Types ────────────────────────────────────────────
export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  resource: string;
  timestamp: string;
  ip_address: string;
  status: 'success' | 'failure';
}

export interface HospitalInfo {
  id: string;
  name: string;
  location: string;
  beds_total: number;
  beds_available: number;
  departments: number;
  status: 'active' | 'inactive';
  contact: string;
}

// ─── Navigation Types ───────────────────────────────────────
export type RootStackParamList = {
  Auth: undefined;
  PatientPortal: undefined;
  HospitalPortal: undefined;
  AdminPortal: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type PatientTabParamList = {
  Dashboard: undefined;
  Appointments: undefined;
  Health: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type PatientStackParamList = {
  PatientTabs: undefined;
  Medications: undefined;
  VitalSigns: undefined;
  BloodTests: undefined;
  Symptoms: undefined;
  CancerRisk: undefined;
  HealthRecords: undefined;
  Telehealth: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type HospitalTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Staff: undefined;
  Labs: undefined;
  More: undefined;
};

export type HospitalStackParamList = {
  HospitalTabs: undefined;
  BedManagement: undefined;
  Pharmacy: undefined;
  Emergency: undefined;
  Appointments: undefined;
  Reports: undefined;
  Settings: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Hospitals: undefined;
  System: undefined;
  More: undefined;
};

export type AdminStackParamList = {
  AdminTabs: undefined;
  Security: undefined;
  AuditLogs: undefined;
  Analytics: undefined;
  Configuration: undefined;
  Reports: undefined;
};

// ─── API Response Types ─────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface DashboardStats {
  [key: string]: number | string;
}

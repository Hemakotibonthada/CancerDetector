// Extended type definitions for CancerGuard AI - 400+ Feature Platform

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  role: string;
  status: string;
  health_id?: string;
  phone_number?: string;
  profile_photo_url?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  zip_code?: string;
  email_verified: boolean;
  two_factor_enabled: boolean;
  last_login?: string;
  created_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Patient {
  id: string;
  user_id: string;
  health_id: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  blood_type?: string;
  smoking_status?: string;
  alcohol_consumption?: string;
  physical_activity_level?: string;
  overall_cancer_risk?: string;
  cancer_risk_score?: number;
  has_smartwatch: boolean;
  has_diabetes: boolean;
  has_hypertension: boolean;
  has_previous_cancer: boolean;
  created_at?: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  hospital_type: string;
  status: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  total_beds?: number;
  available_beds?: number;
  has_cancer_center: boolean;
  ai_integration_enabled: boolean;
  average_rating?: number;
  total_departments?: number;
  total_doctors?: number;
  total_patients?: number;
  logo_url?: string;
  created_at?: string;
}

export interface HealthRecord {
  id: string;
  patient_id: string;
  health_id: string;
  record_number: string;
  record_type: string;
  category: string;
  status: string;
  encounter_date: string;
  primary_diagnosis?: string;
  secondary_diagnosis?: string;
  symptoms?: string;
  treatment_notes?: string;
  doctor_name?: string;
  hospital_name?: string;
  department?: string;
  is_cancer_related: boolean;
  cancer_type?: string;
  cancer_stage?: string;
  ai_risk_score?: number;
  ai_risk_level?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  created_at?: string;
}

export interface BloodSample {
  id: string;
  patient_id: string;
  health_id: string;
  sample_number: string;
  test_type: string;
  sample_status: string;
  collection_date: string;
  total_tests: number;
  normal_results: number;
  abnormal_results: number;
  critical_results: number;
  ai_analyzed: boolean;
  ai_cancer_risk_score?: number;
  ai_risk_level?: string;
  lab_name?: string;
}

export interface Biomarker {
  id: string;
  blood_sample_id: string;
  marker_name: string;
  value: number;
  unit: string;
  reference_min?: number;
  reference_max?: number;
  is_abnormal: boolean;
  is_critical: boolean;
  category: string;
}

export interface CancerRisk {
  patient_id: string;
  health_id: string;
  assessment_date: string;
  overall_risk_score: number;
  overall_risk_category: string;
  cancer_type_risks: Record<string, number>;
  top_risk_factors: Array<{ name: string; impact: string; score: number }>;
  recommendations: string[];
  model_confidence: number;
  model_version: string;
}

export interface Notification {
  id: string;
  notification_type: string;
  priority: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface DashboardStats {
  total_patients: number;
  total_hospitals: number;
  total_doctors: number;
  total_screenings: number;
  total_predictions: number;
  high_risk_patients: number;
  active_alerts: number;
  pending_reviews: number;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_number: string;
  appointment_type: string;
  status: string;
  scheduled_date: string;
  duration_minutes: number;
  reason?: string;
  notes?: string;
  is_telemedicine: boolean;
  doctor_name?: string;
  patient_name?: string;
  department?: string;
  created_at?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'discontinued' | 'paused';
  prescribing_doctor?: string;
  instructions?: string;
  is_cancer_related: boolean;
}

export interface Allergy {
  id: string;
  allergen: string;
  allergy_type: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  reaction?: string;
  status: 'active' | 'inactive';
}

export interface FamilyHistory {
  id: string;
  relation: string;
  condition: string;
  age_of_onset?: number;
  is_cancer: boolean;
  cancer_type?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
}

export interface VitalSign {
  id: string;
  timestamp: string;
  heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  temperature?: number;
  oxygen_saturation?: number;
  source: 'manual' | 'smartwatch' | 'hospital';
}

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  specialization: string;
  department: string;
  qualification: string;
  experience_years: number;
  hospital_name?: string;
  license_number: string;
  email: string;
  rating?: number;
  status: 'active' | 'inactive' | 'on_leave';
  is_oncologist: boolean;
  consultation_fee?: number;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  head_doctor?: string;
  total_staff?: number;
  total_beds?: number;
  status: 'active' | 'inactive';
}

export interface LabOrder {
  id: string;
  order_number: string;
  patient_name: string;
  health_id: string;
  doctor_name: string;
  test_type: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'collected' | 'processing' | 'completed' | 'cancelled';
  ordered_date: string;
  completed_date?: string;
}

export interface BedInfo {
  id: string;
  bed_number: string;
  ward: string;
  floor: number;
  bed_type: 'general' | 'icu' | 'private' | 'semi_private' | 'isolation';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  patient_name?: string;
  admission_date?: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  timestamp: string;
  status: 'success' | 'failure';
}

export interface SystemHealth {
  api_status: string;
  database_status: string;
  ai_model_status: string;
  uptime_hours: number;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  active_users: number;
  requests_per_minute: number;
  error_rate: number;
}

export interface Symptom {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  body_area: string;
  onset_date: string;
  is_cancer_warning: boolean;
}

export interface HealthGoal {
  id: string;
  title: string;
  category: string;
  target: string;
  current_value: string;
  progress: number;
  status: 'active' | 'completed' | 'abandoned';
}

export interface Message {
  id: string;
  sender_name: string;
  sender_role: string;
  subject: string;
  content: string;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

export interface ScreeningSchedule {
  id: string;
  cancer_type: string;
  test_name: string;
  recommended_date: string;
  frequency: string;
  status: 'upcoming' | 'overdue' | 'completed' | 'scheduled';
  last_done?: string;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  generated_date: string;
  status: 'generating' | 'ready' | 'failed';
  format: 'pdf' | 'csv' | 'excel';
}

export interface ChartDataPoint { name: string; value: number; fill?: string; }
export interface TimeSeriesData { date: string; value: number; label?: string; }

// ============ NEW TYPES FOR 100 FEATURES ============

export interface GeneticProfile {
  id: string;
  patient_id: string;
  test_date: string;
  lab_name: string;
  status: 'pending' | 'processing' | 'completed';
  risk_genes: GeneticMarker[];
  overall_genetic_risk: number;
  ancestry_composition: Record<string, number>;
  pharmacogenomics: PharmacogenomicResult[];
}

export interface GeneticMarker {
  gene: string;
  variant: string;
  risk_level: 'low' | 'moderate' | 'high';
  cancer_type: string;
  description: string;
  prevalence: number;
}

export interface PharmacogenomicResult {
  drug: string;
  gene: string;
  metabolism: 'poor' | 'intermediate' | 'normal' | 'rapid' | 'ultrarapid';
  recommendation: string;
}

export interface DietPlan {
  id: string;
  name: string;
  type: 'anti_cancer' | 'recovery' | 'maintenance' | 'prevention';
  calories_target: number;
  meals: MealPlan[];
  restrictions: string[];
  ai_recommended: boolean;
  cancer_fighting_foods: string[];
  score: number;
}

export interface MealPlan {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: FoodItem[];
  total_calories: number;
  time: string;
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  antioxidant_score: number;
  anti_inflammatory: boolean;
  cancer_fighting: boolean;
  nutrients: Record<string, number>;
}

export interface NutritionLog {
  id: string;
  date: string;
  total_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  antioxidant_score: number;
  water_ml: number;
  compliance_score: number;
}

export interface MentalHealthAssessment {
  id: string;
  assessment_date: string;
  anxiety_score: number;
  depression_score: number;
  stress_level: number;
  sleep_quality: number;
  quality_of_life: number;
  coping_score: number;
  support_network_score: number;
  overall_wellness: number;
  recommendations: string[];
}

export interface TherapySession {
  id: string;
  therapist_name: string;
  session_date: string;
  session_type: 'individual' | 'group' | 'family' | 'online';
  duration_minutes: number;
  notes: string;
  mood_before: number;
  mood_after: number;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  cancer_type: string;
  stage: string;
  plan_type: 'surgery' | 'chemotherapy' | 'radiation' | 'immunotherapy' | 'targeted' | 'combined';
  status: 'proposed' | 'active' | 'completed' | 'modified';
  start_date: string;
  end_date?: string;
  doctor_name: string;
  success_probability: number;
  phases: TreatmentPhase[];
  side_effects: string[];
  clinical_trial_eligible: boolean;
}

export interface TreatmentPhase {
  name: string;
  type: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  notes: string;
}

export interface ExerciseSession {
  id: string;
  date: string;
  exercise_type: string;
  duration_minutes: number;
  intensity: 'light' | 'moderate' | 'vigorous';
  calories_burned: number;
  heart_rate_avg: number;
  heart_rate_max: number;
  notes?: string;
  ai_recommended: boolean;
}

export interface FitnessGoal {
  id: string;
  type: 'steps' | 'calories' | 'exercise_minutes' | 'weight' | 'flexibility';
  target: number;
  current: number;
  unit: string;
  deadline: string;
  status: 'active' | 'completed' | 'abandoned';
}

export interface Surgery {
  id: string;
  surgery_number: string;
  patient_name: string;
  surgeon_name: string;
  surgery_type: string;
  operating_room: string;
  scheduled_date: string;
  duration_hours: number;
  status: 'scheduled' | 'pre_op' | 'in_progress' | 'post_op' | 'completed' | 'cancelled';
  priority: 'elective' | 'urgent' | 'emergency';
  cancer_related: boolean;
  anesthesia_type: string;
  team_members: string[];
  complications?: string;
  outcome?: string;
}

export interface PharmacyItem {
  id: string;
  drug_name: string;
  generic_name: string;
  category: string;
  stock_quantity: number;
  min_stock_level: number;
  unit_price: number;
  supplier: string;
  expiry_date: string;
  batch_number: string;
  is_controlled: boolean;
  is_chemo_drug: boolean;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export interface Prescription {
  id: string;
  prescription_number: string;
  patient_name: string;
  doctor_name: string;
  date: string;
  medications: PrescriptionItem[];
  status: 'pending' | 'dispensing' | 'dispensed' | 'cancelled';
  is_cancer_treatment: boolean;
}

export interface PrescriptionItem {
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

export interface ImagingStudy {
  id: string;
  study_number: string;
  patient_name: string;
  modality: 'xray' | 'ct' | 'mri' | 'ultrasound' | 'pet' | 'mammography';
  body_part: string;
  status: 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'reported';
  ordered_date: string;
  scheduled_date?: string;
  radiologist?: string;
  ai_analysis_status: 'pending' | 'analyzing' | 'completed';
  ai_findings?: string;
  ai_confidence?: number;
  priority: 'routine' | 'urgent' | 'stat';
  cancer_screening: boolean;
}

export interface EmergencyCase {
  id: string;
  triage_code: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  patient_name: string;
  arrival_time: string;
  chief_complaint: string;
  assigned_doctor?: string;
  bed_number?: string;
  status: 'waiting' | 'triaged' | 'in_treatment' | 'observation' | 'admitted' | 'discharged';
  vital_signs: Partial<VitalSign>;
  wait_time_minutes: number;
  cancer_related: boolean;
}

export interface ClinicalTrial {
  id: string;
  trial_id: string;
  title: string;
  phase: 'I' | 'II' | 'III' | 'IV';
  status: 'recruiting' | 'active' | 'completed' | 'suspended';
  cancer_type: string;
  lead_investigator: string;
  enrolled_patients: number;
  target_enrollment: number;
  start_date: string;
  end_date?: string;
  eligibility_criteria: string[];
  primary_endpoint: string;
  sponsor: string;
}

export interface TelemedicineSession {
  id: string;
  session_id: string;
  patient_name: string;
  doctor_name: string;
  scheduled_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'no_show';
  session_type: 'video' | 'audio' | 'chat';
  recording_available: boolean;
  prescription_issued: boolean;
  follow_up_needed: boolean;
  notes?: string;
  rating?: number;
}

export interface QualityMetric {
  id: string;
  metric_name: string;
  category: string;
  current_value: number;
  target_value: number;
  benchmark_value: number;
  trend: 'improving' | 'stable' | 'declining';
  unit: string;
  period: string;
}

export interface ComplianceRecord {
  id: string;
  regulation: string;
  category: 'hipaa' | 'gdpr' | 'fda' | 'joint_commission' | 'state';
  status: 'compliant' | 'non_compliant' | 'in_progress' | 'needs_review';
  last_audit_date: string;
  next_audit_date: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  findings: number;
  resolved: number;
  responsible_person: string;
}

export interface DataBackup {
  id: string;
  backup_name: string;
  type: 'full' | 'incremental' | 'differential';
  size_gb: number;
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  started_at: string;
  completed_at?: string;
  retention_days: number;
  storage_location: string;
  encrypted: boolean;
}

export interface PlatformBilling {
  id: string;
  hospital_name: string;
  plan: 'basic' | 'professional' | 'enterprise';
  monthly_fee: number;
  ai_credits_used: number;
  ai_credits_total: number;
  status: 'active' | 'overdue' | 'suspended';
  billing_date: string;
  payment_method: string;
}

export interface Integration {
  id: string;
  name: string;
  type: 'ehr' | 'lab' | 'imaging' | 'pharmacy' | 'insurance' | 'iot' | 'ai';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  last_sync: string;
  data_synced: number;
  api_calls_today: number;
  version: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  category: string;
  instructor: string;
  duration_hours: number;
  enrolled: number;
  completed: number;
  pass_rate: number;
  mandatory: boolean;
  certification: boolean;
  status: 'active' | 'archived' | 'draft';
  next_session?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age: number;
  is_alive: boolean;
  conditions: string[];
  cancer_history: FamilyCancerRecord[];
  genetic_tested: boolean;
}

export interface FamilyCancerRecord {
  cancer_type: string;
  age_at_diagnosis: number;
  treatment_outcome: 'remission' | 'ongoing' | 'deceased';
}

export interface SecondOpinion {
  id: string;
  request_date: string;
  original_diagnosis: string;
  original_doctor: string;
  reviewing_doctor?: string;
  reviewing_hospital?: string;
  status: 'requested' | 'under_review' | 'completed';
  ai_analysis?: string;
  ai_agreement_score?: number;
  findings?: string;
  recommendation?: string;
  urgency: 'routine' | 'priority' | 'urgent';
}

// Blood Donor Types
export interface BloodDonor {
  id: string;
  user_id: string;
  blood_group: string;
  donor_status: 'active' | 'inactive' | 'temporarily_unavailable' | 'permanently_ineligible' | 'cooldown';
  latitude?: number;
  longitude?: number;
  city?: string;
  state?: string;
  address?: string;
  max_distance_km: number;
  date_of_birth?: string;
  weight_kg?: number;
  health_eligible: boolean;
  last_health_check?: string;
  medical_conditions?: string;
  total_donations: number;
  last_donation_date?: string;
  next_eligible_date?: string;
  notification_enabled: boolean;
  sms_alerts: boolean;
  email_alerts: boolean;
  available_days?: string;
  preferred_time?: string;
  id_verified: boolean;
  blood_type_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BloodRequest {
  id: string;
  requester_id: string;
  hospital_id?: string;
  patient_name?: string;
  blood_group: string;
  units_needed: number;
  units_fulfilled: number;
  urgency: 'routine' | 'urgent' | 'emergency' | 'critical';
  status: 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired';
  latitude?: number;
  longitude?: number;
  hospital_name?: string;
  hospital_address?: string;
  description?: string;
  contact_phone?: string;
  contact_email?: string;
  needed_by?: string;
  expires_at?: string;
  search_radius_km: number;
  donors_notified: number;
  created_at?: string;
}

export interface BloodDonorMatch {
  id: string;
  request_id: string;
  donor_id: string;
  donor_user_id: string;
  status: 'pending' | 'notified' | 'accepted' | 'declined' | 'completed' | 'cancelled' | 'expired';
  distance_km?: number;
  notified_at?: string;
  responded_at?: string;
  response_message?: string;
  scheduled_date?: string;
  scheduled_location?: string;
  donor_name?: string;
  request?: BloodRequest;
  created_at?: string;
}

export interface DonationRecord {
  id: string;
  donor_id: string;
  match_id?: string;
  request_id?: string;
  donation_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'failed';
  blood_group: string;
  units_donated: number;
  donation_date?: string;
  donation_center?: string;
  donation_address?: string;
  hemoglobin_level?: number;
  blood_pressure?: string;
  pulse_rate?: number;
  notes?: string;
  certificate_url?: string;
  created_at?: string;
}

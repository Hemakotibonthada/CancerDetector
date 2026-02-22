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

// ============ CLINICAL DECISION SUPPORT TYPES ============

export interface ClinicalPathway {
  id: string;
  name: string;
  cancer_type: string;
  stage?: string;
  description?: string;
  version: string;
  status: 'draft' | 'active' | 'retired';
  steps_json?: string;
  expected_duration_days?: number;
  evidence_level?: string;
  created_at?: string;
}

export interface PathwayEnrollment {
  id: string;
  pathway_id: string;
  patient_id: string;
  enrolled_by: string;
  status: 'active' | 'completed' | 'discontinued';
  current_step?: string;
  progress_percentage?: number;
  enrolled_at?: string;
}

export interface DrugInteraction {
  id: string;
  drug_a: string;
  drug_b: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  clinical_significance?: string;
  recommendation?: string;
}

export interface ClinicalGuideline {
  id: string;
  title: string;
  category: string;
  specialty?: string;
  source_organization: string;
  evidence_grade?: string;
  summary?: string;
  effective_date?: string;
  status: 'active' | 'draft' | 'retired';
}

export interface ClinicalCalculatorDef {
  id: string;
  name: string;
  category: string;
  description?: string;
  formula_type: string;
  input_fields_json: string;
}

export interface ClinicalAlert {
  id: string;
  patient_id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  created_at?: string;
}

export interface OrderSetDef {
  id: string;
  name: string;
  category: string;
  specialty?: string;
  orders_json: string;
  is_template: boolean;
}

export interface BestPracticeAdvisoryDef {
  id: string;
  title: string;
  category: string;
  trigger_condition: string;
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
  is_active: boolean;
}

// ============ GENOMICS TYPES ============

export interface GenomicSequence {
  id: string;
  patient_id: string;
  sequence_type: string;
  sample_source?: string;
  sequencing_platform?: string;
  quality_score?: number;
  status: 'submitted' | 'sequencing' | 'analyzing' | 'completed' | 'failed';
  created_at?: string;
}

export interface GeneticVariantRecord {
  id: string;
  sequence_id: string;
  gene_name: string;
  chromosome?: string;
  position?: number;
  variant_type: string;
  classification: 'benign' | 'likely_benign' | 'vus' | 'likely_pathogenic' | 'pathogenic';
  clinical_significance?: string;
  allele_frequency?: number;
}

export interface GenePanelDef {
  id: string;
  name: string;
  panel_type: string;
  genes_included: string;
  description?: string;
  turnaround_days?: number;
  cost?: number;
}

export interface GenomicReportRecord {
  id: string;
  patient_id: string;
  sequence_id?: string;
  report_type: string;
  status: 'draft' | 'final' | 'amended';
  findings_summary?: string;
  actionable_variants?: number;
  recommendations?: string;
  created_at?: string;
}

export interface LiquidBiopsyRecord {
  id: string;
  patient_id: string;
  sample_date: string;
  ctdna_detected: boolean;
  ctdna_fraction?: number;
  mutations_detected?: string;
  treatment_implications?: string;
}

export interface GeneExpressionRecord {
  id: string;
  patient_id: string;
  platform: string;
  tissue_type: string;
  gene_count?: number;
  analysis_type?: string;
  results_summary?: string;
}

export interface PharmacogenomicProfileRecord {
  id: string;
  patient_id: string;
  gene: string;
  phenotype: string;
  affected_drugs?: string;
  dosing_recommendation?: string;
}

export interface HereditaryCancerPanelRecord {
  id: string;
  patient_id: string;
  panel_name: string;
  genes_tested: string;
  positive_findings?: string;
  risk_assessment?: string;
  genetic_counseling_recommended: boolean;
}

// ============ RESEARCH TYPES ============

export interface ResearchStudyRecord {
  id: string;
  title: string;
  study_type: string;
  status: 'planning' | 'recruiting' | 'active' | 'completed' | 'published';
  principal_investigator: string;
  cancer_type?: string;
  target_enrollment?: number;
  current_enrollment?: number;
  start_date?: string;
  description?: string;
}

export interface ResearchCohortRecord {
  id: string;
  study_id: string;
  name: string;
  description?: string;
  inclusion_criteria?: string;
  exclusion_criteria?: string;
  target_size?: number;
  current_size?: number;
}

export interface ResearchPublicationRecord {
  id: string;
  study_id?: string;
  title: string;
  journal?: string;
  doi?: string;
  publication_date?: string;
  authors?: string;
  abstract?: string;
  impact_factor?: number;
}

export interface ResearchDatasetRecord {
  id: string;
  study_id?: string;
  name: string;
  data_type: string;
  record_count?: number;
  size_mb?: number;
  description?: string;
  is_anonymized: boolean;
}

export interface IRBSubmissionRecord {
  id: string;
  study_id: string;
  submission_type: string;
  status: 'submitted' | 'under_review' | 'approved' | 'revisions_needed' | 'rejected';
  submitted_date: string;
  review_date?: string;
  comments?: string;
}

export interface BiostatisticsAnalysisRecord {
  id: string;
  study_id: string;
  analysis_type: string;
  methodology?: string;
  results_summary?: string;
  p_value?: number;
  confidence_interval?: string;
  status: 'planned' | 'in_progress' | 'completed';
}

// ============ POPULATION HEALTH TYPES ============

export interface DiseaseRegistryRecord {
  id: string;
  name: string;
  disease_type: string;
  description?: string;
  total_entries?: number;
  status: 'active' | 'archived';
}

export interface RegistryEntryRecord {
  id: string;
  registry_id: string;
  patient_id: string;
  diagnosis_date?: string;
  stage?: string;
  treatment_status?: string;
  outcome?: string;
}

export interface ChronicDiseaseProgramRecord {
  id: string;
  name: string;
  disease_type: string;
  description?: string;
  enrolled_patients?: number;
  status: 'active' | 'inactive';
}

export interface CareGapRecord {
  id: string;
  patient_id: string;
  gap_type: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'closed' | 'deferred';
  due_date?: string;
}

export interface HealthEquityMetricRecord {
  id: string;
  metric_name: string;
  category: string;
  demographic_group: string;
  value: number;
  benchmark?: number;
  measurement_date: string;
}

export interface CommunityResourceRecord {
  id: string;
  name: string;
  resource_type: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  is_free: boolean;
}

export interface PublicHealthAlertRecord {
  id: string;
  title: string;
  alert_type: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  affected_area?: string;
  description: string;
  effective_date: string;
  expiry_date?: string;
  is_active: boolean;
}

export interface ScreeningCampaignRecord {
  id: string;
  name: string;
  cancer_type: string;
  target_population: string;
  start_date: string;
  end_date?: string;
  target_screenings?: number;
  completed_screenings?: number;
  status: 'planning' | 'active' | 'completed';
}

// ============ PATIENT ENGAGEMENT TYPES ============

export interface GamificationProfileRecord {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  current_streak_days: number;
  longest_streak_days: number;
  badges_earned: number;
  challenges_completed: number;
  rank?: number;
}

export interface BadgeRecord {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  category: string;
  points_required?: number;
  criteria?: string;
}

export interface HealthChallengeRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points_reward: number;
  duration_days: number;
  target_value?: number;
  participants_count?: number;
  start_date: string;
  end_date?: string;
  status: 'upcoming' | 'active' | 'completed';
}

export interface HealthStreakRecord {
  id: string;
  user_id: string;
  streak_type: string;
  current_count: number;
  longest_count: number;
  last_activity?: string;
  is_active: boolean;
}

export interface PeerSupportGroupRecord {
  id: string;
  name: string;
  description: string;
  cancer_type?: string;
  group_type: string;
  member_count: number;
  max_members?: number;
  is_private: boolean;
  status: 'active' | 'archived';
}

export interface GroupPostRecord {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  post_type: string;
  likes_count: number;
  replies_count: number;
  is_pinned: boolean;
  created_at: string;
}

export interface PatientSurveyRecord {
  id: string;
  title: string;
  survey_type: string;
  status: 'draft' | 'active' | 'closed';
  questions_json: string;
  responses_count?: number;
  average_score?: number;
}

export interface RewardRecord {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  is_available: boolean;
  quantity_remaining?: number;
}

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  level: number;
  rank: number;
  badges_count: number;
}

// ============ COMMUNICATION TYPES ============

export interface SecureMessageRecord {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string;
  body: string;
  is_read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sender_name?: string;
  recipient_name?: string;
  created_at: string;
}

export interface CareTeamRecord {
  id: string;
  name: string;
  patient_id: string;
  team_lead_id?: string;
  description?: string;
  status: 'active' | 'dissolved';
  member_count?: number;
}

export interface CareTeamMemberRecord {
  id: string;
  care_team_id: string;
  user_id: string;
  role: string;
  name?: string;
  specialty?: string;
}

export interface ReferralRecord {
  id: string;
  referring_doctor_id: string;
  receiving_doctor_id?: string;
  patient_id: string;
  reason: string;
  specialty: string;
  urgency: 'routine' | 'urgent' | 'emergent';
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'declined';
  notes?: string;
  created_at: string;
}

export interface ClinicalHandoffRecord {
  id: string;
  from_provider_id: string;
  to_provider_id: string;
  patient_id: string;
  handoff_type: string;
  summary: string;
  critical_items?: string;
  status: 'pending' | 'acknowledged' | 'completed';
  created_at: string;
}

export interface ConsentFormRecord {
  id: string;
  patient_id: string;
  form_type: string;
  title: string;
  description?: string;
  status: 'pending' | 'signed' | 'declined' | 'expired';
  signed_at?: string;
}

export interface CareCoordinationTaskRecord {
  id: string;
  patient_id: string;
  assigned_to?: string;
  task_type: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date?: string;
}

export interface CommunicationPreferenceRecord {
  id: string;
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  preferred_language?: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

// ============ BILLING ENHANCED TYPES ============

export interface InvoiceRecord {
  id: string;
  patient_id: string;
  invoice_number: string;
  total_amount: number;
  paid_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
  items_json: string;
  created_at: string;
}

export interface PaymentTransactionRecord {
  id: string;
  invoice_id?: string;
  patient_id: string;
  amount: number;
  payment_method: string;
  transaction_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}

export interface InsurancePlanRecord {
  id: string;
  name: string;
  provider_name: string;
  plan_type: string;
  coverage_details?: string;
  deductible?: number;
  copay?: number;
  max_out_of_pocket?: number;
}

export interface InsuranceVerificationRecord {
  id: string;
  patient_id: string;
  plan_id?: string;
  verification_date: string;
  status: 'pending' | 'verified' | 'denied' | 'expired';
  coverage_active: boolean;
  coverage_details?: string;
}

export interface PriorAuthorizationRecord {
  id: string;
  patient_id: string;
  procedure_code: string;
  procedure_description: string;
  status: 'submitted' | 'pending' | 'approved' | 'denied' | 'appealed';
  submitted_date: string;
  decision_date?: string;
  authorization_number?: string;
}

export interface CostEstimateRecord {
  id: string;
  patient_id: string;
  procedure_description: string;
  estimated_cost: number;
  insurance_coverage?: number;
  patient_responsibility?: number;
  created_at: string;
}

export interface ClaimSubmissionRecord {
  id: string;
  patient_id: string;
  claim_number: string;
  total_amount: number;
  status: 'submitted' | 'processing' | 'paid' | 'denied' | 'appealed';
  submitted_date: string;
  paid_amount?: number;
}

export interface DenialManagementRecord {
  id: string;
  claim_id: string;
  denial_reason: string;
  denial_code?: string;
  appeal_status?: 'not_appealed' | 'appealed' | 'appeal_approved' | 'appeal_denied';
  appeal_date?: string;
}

export interface FinancialCounselingRecord {
  id: string;
  patient_id: string;
  counselor_name?: string;
  session_date: string;
  estimated_costs?: number;
  payment_plan_offered: boolean;
  financial_assistance_eligible: boolean;
  notes?: string;
}

// ============ QUALITY & SAFETY TYPES ============

export interface AdverseEventRecord {
  id: string;
  patient_id: string;
  event_type: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'fatal';
  description: string;
  event_date: string;
  reported_by?: string;
  investigation_status: 'reported' | 'investigating' | 'resolved';
  root_cause?: string;
}

export interface IncidentReportRecord {
  id: string;
  report_number: string;
  incident_type: string;
  severity: 'near_miss' | 'minor' | 'moderate' | 'major' | 'catastrophic';
  description: string;
  location: string;
  reported_date: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  corrective_actions?: string;
}

export interface QualityMeasureRecord {
  id: string;
  measure_name: string;
  measure_id_code: string;
  category: string;
  numerator?: number;
  denominator?: number;
  performance_rate?: number;
  benchmark?: number;
  reporting_period: string;
}

export interface InfectionControlRecord {
  id: string;
  infection_type: string;
  organism?: string;
  location: string;
  patient_id?: string;
  detection_date: string;
  containment_status: 'monitoring' | 'contained' | 'outbreak';
  precautions?: string;
}

export interface SafetyChecklistRecord {
  id: string;
  name: string;
  category: string;
  items_json: string;
  total_items: number;
  status: 'active' | 'draft' | 'retired';
}

export interface RootCauseAnalysisRecord {
  id: string;
  incident_id: string;
  event_description: string;
  root_causes?: string;
  contributing_factors?: string;
  recommendations?: string;
  status: 'initiated' | 'in_progress' | 'completed';
  started_date: string;
  completed_date?: string;
}

export interface FallRiskAssessmentRecord {
  id: string;
  patient_id: string;
  assessment_date: string;
  risk_score: number;
  risk_level: 'low' | 'moderate' | 'high';
  risk_factors?: string;
  interventions?: string;
}

export interface PressureInjuryAssessmentRecord {
  id: string;
  patient_id: string;
  assessment_date: string;
  braden_score?: number;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  current_injuries?: string;
  prevention_measures?: string;
}

// ============ SUPPLY CHAIN TYPES ============

export interface InventoryItemRecord {
  id: string;
  item_name: string;
  category: string;
  sku: string;
  current_quantity: number;
  min_quantity: number;
  max_quantity?: number;
  unit_cost: number;
  supplier_id?: string;
  expiry_date?: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export interface VendorRecord {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  category: string;
  rating?: number;
  status: 'active' | 'inactive' | 'suspended';
  contract_end_date?: string;
}

export interface PurchaseOrderRecord {
  id: string;
  order_number: string;
  vendor_id: string;
  vendor_name?: string;
  total_amount: number;
  status: 'draft' | 'submitted' | 'approved' | 'shipped' | 'received' | 'cancelled';
  order_date: string;
  expected_delivery?: string;
  items_count: number;
}

export interface EquipmentRecord {
  id: string;
  name: string;
  equipment_type: string;
  serial_number: string;
  location: string;
  status: 'operational' | 'maintenance' | 'retired' | 'out_of_service';
  purchase_date?: string;
  warranty_end?: string;
  last_maintenance?: string;
  next_maintenance?: string;
}

export interface MaintenanceRequestRecord {
  id: string;
  equipment_id: string;
  equipment_name?: string;
  request_type: 'preventive' | 'corrective' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed';
  requested_date: string;
}

// ============ TELEHEALTH TYPES ============

export interface VideoSessionRecord {
  id: string;
  patient_id: string;
  provider_id: string;
  session_type: string;
  status: 'scheduled' | 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_start: string;
  actual_start?: string;
  actual_end?: string;
  duration_minutes?: number;
  meeting_url?: string;
  notes?: string;
}

export interface VirtualWaitingRoomRecord {
  id: string;
  session_id: string;
  patient_id: string;
  check_in_time: string;
  estimated_wait: number;
  position: number;
  status: 'waiting' | 'called' | 'in_session' | 'left';
}

export interface RemoteMonitoringPlanRecord {
  id: string;
  patient_id: string;
  plan_name: string;
  parameters_monitored: string;
  frequency: string;
  alert_thresholds?: string;
  status: 'active' | 'paused' | 'completed';
  start_date: string;
}

export interface RemoteMonitoringDataRecord {
  id: string;
  plan_id: string;
  parameter_name: string;
  value: number;
  unit: string;
  recorded_at: string;
  is_abnormal: boolean;
  alert_triggered: boolean;
}

export interface EPrescriptionRecord {
  id: string;
  patient_id: string;
  prescriber_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  pharmacy_name?: string;
  status: 'pending' | 'sent' | 'filled' | 'cancelled';
  prescribed_date: string;
}

export interface TelehealthChatRecord {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: 'patient' | 'provider';
  message: string;
  sent_at: string;
}

// ============ PATHOLOGY TYPES ============

export interface SpecimenRecord {
  id: string;
  patient_id: string;
  specimen_type: string;
  collection_site: string;
  collection_date: string;
  received_date?: string;
  status: 'collected' | 'received' | 'processing' | 'completed';
  accession_number: string;
}

export interface PathologyBlockRecord {
  id: string;
  specimen_id: string;
  block_number: string;
  tissue_type: string;
  embedding_medium: string;
  created_at: string;
}

export interface PathologySlideRecord {
  id: string;
  block_id: string;
  slide_number: string;
  stain_type: string;
  quality: 'good' | 'acceptable' | 'poor';
  digital_image_url?: string;
  ai_analyzed: boolean;
}

export interface PathologyReportRecord {
  id: string;
  specimen_id: string;
  pathologist_id?: string;
  diagnosis: string;
  microscopic_findings?: string;
  gross_description?: string;
  stage?: string;
  grade?: string;
  margin_status?: string;
  molecular_markers?: string;
  status: 'draft' | 'preliminary' | 'final' | 'amended';
  created_at: string;
}

export interface TumorBoardRecord {
  id: string;
  patient_id: string;
  meeting_date: string;
  participants?: string;
  case_summary: string;
  recommendations?: string;
  status: 'scheduled' | 'in_progress' | 'concluded';
}

// ============ REHABILITATION TYPES ============

export interface RehabPlanRecord {
  id: string;
  patient_id: string;
  plan_type: 'physical' | 'occupational' | 'speech' | 'cardiac' | 'pulmonary';
  diagnosis: string;
  goals: string;
  frequency: string;
  duration_weeks: number;
  status: 'active' | 'completed' | 'discontinued';
  progress_percentage: number;
  start_date: string;
}

export interface TherapySessionRecord {
  id: string;
  plan_id: string;
  therapist_name: string;
  session_date: string;
  duration_minutes: number;
  exercises_completed: string;
  pain_level_before?: number;
  pain_level_after?: number;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
}

export interface FunctionalAssessmentRecord {
  id: string;
  patient_id: string;
  assessment_type: string;
  assessment_date: string;
  score: number;
  max_score: number;
  functional_level: string;
  limitations?: string;
  recommendations?: string;
}

export interface ExercisePrescriptionRecord {
  id: string;
  plan_id: string;
  exercise_name: string;
  exercise_type: string;
  sets?: number;
  repetitions?: number;
  duration_minutes?: number;
  frequency: string;
  instructions?: string;
  video_url?: string;
}

export interface ProgressMilestoneRecord {
  id: string;
  plan_id: string;
  milestone_name: string;
  target_date: string;
  achieved_date?: string;
  status: 'pending' | 'achieved' | 'missed';
  notes?: string;
}

export interface DisabilityScoreRecord {
  id: string;
  patient_id: string;
  scale_name: string;
  score: number;
  max_score: number;
  assessment_date: string;
  category: string;
}

export interface PainManagementPlanRecord {
  id: string;
  patient_id: string;
  pain_location: string;
  pain_type: string;
  current_severity: number;
  interventions: string;
  medications?: string;
  status: 'active' | 'resolved' | 'chronic';
}

// ============ NUTRITION ENHANCED TYPES ============

export interface NutritionAssessmentRecord {
  id: string;
  patient_id: string;
  assessment_date: string;
  bmi?: number;
  weight_kg?: number;
  height_cm?: number;
  nutritional_status: 'well_nourished' | 'at_risk' | 'malnourished';
  caloric_needs?: number;
  protein_needs?: number;
  dietary_restrictions?: string;
  recommendations?: string;
}

export interface MealPlanRecord {
  id: string;
  patient_id: string;
  plan_name: string;
  plan_type: string;
  daily_calories?: number;
  meals_json: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'discontinued';
}

export interface FoodLogRecord {
  id: string;
  patient_id: string;
  meal_type: string;
  food_items: string;
  total_calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  logged_at: string;
}

export interface DietaryRestrictionRecord {
  id: string;
  patient_id: string;
  restriction_type: string;
  description: string;
  severity: 'preference' | 'intolerance' | 'allergy' | 'medical';
  is_active: boolean;
}

export interface NutritionalSupplementRecord {
  id: string;
  patient_id: string;
  supplement_name: string;
  dosage: string;
  frequency: string;
  reason?: string;
  prescribing_provider?: string;
  start_date: string;
  end_date?: string;
}

export interface HydrationLogRecord {
  id: string;
  patient_id: string;
  fluid_type: string;
  amount_ml: number;
  logged_at: string;
  daily_target_ml?: number;
}

export interface WeightManagementProgramRecord {
  id: string;
  patient_id: string;
  program_type: string;
  start_weight: number;
  target_weight: number;
  current_weight: number;
  start_date: string;
  status: 'active' | 'completed' | 'discontinued';
}

export interface EnteralNutritionRecord {
  id: string;
  patient_id: string;
  formula_name: string;
  route: string;
  rate_ml_hr: number;
  total_volume_ml: number;
  calories_per_day: number;
  start_date: string;
  status: 'active' | 'completed' | 'on_hold';
}

// ============ MENTAL HEALTH ENHANCED TYPES ============

export interface CBTSessionRecord {
  id: string;
  patient_id: string;
  therapist_id?: string;
  session_number: number;
  session_date: string;
  thought_record?: string;
  cognitive_distortions?: string;
  behavioral_experiments?: string;
  homework_assigned?: string;
  mood_score_before: number;
  mood_score_after: number;
}

export interface MindfulnessExerciseRecord {
  id: string;
  name: string;
  category: string;
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  audio_url?: string;
  instructions?: string;
}

export interface CrisisInterventionRecord {
  id: string;
  patient_id: string;
  intervention_date: string;
  crisis_type: string;
  severity: 'low' | 'moderate' | 'high' | 'imminent';
  interventions_applied: string;
  outcome: string;
  follow_up_plan?: string;
  safety_plan_activated: boolean;
}

export interface SafetyPlanRecord {
  id: string;
  patient_id: string;
  warning_signs: string;
  coping_strategies: string;
  social_contacts: string;
  professional_contacts: string;
  environment_safety_steps: string;
  reasons_for_living: string;
  status: 'active' | 'updated' | 'expired';
  created_at: string;
}

export interface SubstanceUseLogRecord {
  id: string;
  patient_id: string;
  substance_type: string;
  amount?: string;
  frequency: string;
  last_use_date?: string;
  triggers?: string;
  cravings_level?: number;
  sobriety_days?: number;
}

export interface BehavioralGoalRecord {
  id: string;
  patient_id: string;
  goal_description: string;
  target_behavior: string;
  current_frequency?: string;
  target_frequency?: string;
  progress: number;
  status: 'active' | 'achieved' | 'modified' | 'abandoned';
}

export interface MentalHealthScreeningRecord {
  id: string;
  patient_id: string;
  screening_type: string;
  tool_used: string;
  score: number;
  severity: string;
  screening_date: string;
  recommendations?: string;
}

export interface GroupTherapySessionRecord {
  id: string;
  group_name: string;
  therapy_type: string;
  facilitator_name?: string;
  session_date: string;
  participants_count: number;
  topic: string;
  notes?: string;
}

// ============ CLINICAL TRIALS V2 TYPES ============

export interface TrialProtocolRecord {
  id: string;
  protocol_number: string;
  title: string;
  phase: string;
  status: 'draft' | 'approved' | 'recruiting' | 'active' | 'completed' | 'terminated';
  sponsor: string;
  cancer_type: string;
  principal_investigator: string;
  target_enrollment: number;
  current_enrollment: number;
  start_date?: string;
  estimated_end_date?: string;
}

export interface TrialSiteRecord {
  id: string;
  protocol_id: string;
  site_name: string;
  site_number: string;
  principal_investigator: string;
  status: 'selected' | 'initiated' | 'enrolling' | 'closed';
  enrolled_count: number;
}

export interface TrialParticipantRecord {
  id: string;
  protocol_id: string;
  patient_id: string;
  site_id: string;
  subject_number: string;
  status: 'screening' | 'enrolled' | 'active' | 'completed' | 'withdrawn' | 'discontinued';
  enrollment_date?: string;
  randomization_arm?: string;
}

export interface TrialVisitRecord {
  id: string;
  participant_id: string;
  visit_name: string;
  visit_number: number;
  scheduled_date: string;
  actual_date?: string;
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled';
  notes?: string;
}

export interface TrialAdverseEventRecord {
  id: string;
  participant_id: string;
  event_term: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening' | 'fatal';
  causality: 'unrelated' | 'unlikely' | 'possible' | 'probable' | 'definite';
  onset_date: string;
  resolution_date?: string;
  is_serious: boolean;
  outcome: string;
}

export interface DataCollectionFormRecord {
  id: string;
  participant_id: string;
  form_name: string;
  visit_id?: string;
  status: 'blank' | 'in_progress' | 'completed' | 'verified' | 'locked';
  data_json: string;
  completed_date?: string;
}

export interface ProtocolDeviationRecord {
  id: string;
  protocol_id: string;
  participant_id?: string;
  deviation_type: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  detected_date: string;
  corrective_action?: string;
}

// ============ RADIOLOGY ENHANCED TYPES ============

export interface AIReadingResultRecord {
  id: string;
  study_id?: string;
  patient_id: string;
  modality: string;
  body_part: string;
  ai_findings: string;
  confidence_score: number;
  abnormalities_detected: number;
  recommendations?: string;
  reading_date: string;
  radiologist_agreement?: boolean;
}

export interface TumorMeasurementRecord {
  id: string;
  patient_id: string;
  study_id?: string;
  tumor_location: string;
  longest_diameter_mm: number;
  short_axis_mm?: number;
  volume_mm3?: number;
  measurement_date: string;
  response_category?: string;
  previous_measurement_mm?: number;
  change_percentage?: number;
}

export interface RadiationDoseRecordType {
  id: string;
  patient_id: string;
  study_type: string;
  body_region: string;
  dose_value: number;
  dose_unit: string;
  study_date: string;
  cumulative_dose?: number;
}

export interface StructuredRadiologyReportRecord {
  id: string;
  patient_id: string;
  study_type: string;
  indication: string;
  technique: string;
  findings: string;
  impression: string;
  recommendations?: string;
  reporting_radiologist?: string;
  report_date: string;
}

export interface ImagingProtocolRecord {
  id: string;
  name: string;
  modality: string;
  body_region: string;
  contrast_required: boolean;
  parameters_json: string;
  radiation_dose_estimate?: number;
  description?: string;
}

export interface ContrastReactionRecord {
  id: string;
  patient_id: string;
  contrast_agent: string;
  reaction_type: string;
  severity: 'mild' | 'moderate' | 'severe';
  treatment_given?: string;
  reaction_date: string;
  premedication_recommended: boolean;
}

export interface ImagingOrderTrackingRecord {
  id: string;
  patient_id: string;
  order_number: string;
  modality: string;
  body_part: string;
  priority: 'routine' | 'urgent' | 'stat';
  status: 'ordered' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  ordered_date: string;
  scheduled_date?: string;
  completed_date?: string;
}

// ============ PHARMACY ENHANCED TYPES ============

export interface FormularyItemRecord {
  id: string;
  drug_name: string;
  generic_name: string;
  drug_class: string;
  formulary_status: 'formulary' | 'non_formulary' | 'restricted';
  tier?: number;
  requires_prior_auth: boolean;
  therapeutic_alternatives?: string;
  cost_per_unit?: number;
}

export interface DrugUtilizationReviewRecord {
  id: string;
  patient_id: string;
  medication_name: string;
  review_type: string;
  findings: string;
  recommendation: string;
  pharmacist_name?: string;
  review_date: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'overridden';
}

export interface MedicationReconciliationRecord {
  id: string;
  patient_id: string;
  reconciliation_type: 'admission' | 'transfer' | 'discharge';
  medications_json: string;
  discrepancies_found: number;
  reconciled_by?: string;
  status: 'in_progress' | 'completed';
  reconciliation_date: string;
}

export interface CompoundedMedicationRecord {
  id: string;
  patient_id: string;
  compound_name: string;
  ingredients: string;
  preparation_instructions: string;
  beyond_use_date: string;
  prepared_by?: string;
  checked_by?: string;
  status: 'requested' | 'preparing' | 'ready' | 'dispensed';
}

export interface ControlledSubstanceLogRecord {
  id: string;
  medication_name: string;
  dea_schedule: string;
  transaction_type: 'received' | 'dispensed' | 'wasted' | 'returned';
  quantity: number;
  patient_id?: string;
  witness_name?: string;
  transaction_date: string;
}

export interface ClinicalPharmacyInterventionRecord {
  id: string;
  patient_id: string;
  pharmacist_id?: string;
  intervention_type: string;
  description: string;
  medication_involved: string;
  outcome: string;
  cost_savings?: number;
  intervention_date: string;
}

export interface AntibioticStewardshipRecord {
  id: string;
  patient_id: string;
  antibiotic: string;
  indication: string;
  culture_sent: boolean;
  de_escalation_possible: boolean;
  duration_days: number;
  review_date: string;
  pharmacist_recommendation?: string;
  status: 'active' | 'reviewed' | 'modified' | 'completed';
}

export interface AdverseReactionHistoryRecord {
  id: string;
  patient_id: string;
  medication: string;
  reaction_type: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  description: string;
  reaction_date: string;
  reported_to_fda: boolean;
}

// ============ EDUCATION TYPES ============

export interface EducationResourceRecord {
  id: string;
  title: string;
  category: string;
  content_type: 'article' | 'video' | 'infographic' | 'quiz' | 'guide';
  cancer_type?: string;
  difficulty_level: 'basic' | 'intermediate' | 'advanced';
  content_url?: string;
  summary?: string;
  reading_time_minutes?: number;
  view_count: number;
  rating?: number;
}

export interface PatientEducationAssignmentRecord {
  id: string;
  patient_id: string;
  resource_id: string;
  assigned_by?: string;
  status: 'assigned' | 'in_progress' | 'completed';
  assigned_date: string;
  completed_date?: string;
  comprehension_score?: number;
}

export interface PatientQuizRecord {
  id: string;
  title: string;
  resource_id?: string;
  questions_json: string;
  passing_score: number;
  total_points: number;
  time_limit_minutes?: number;
}

export interface QuizAttemptRecord {
  id: string;
  quiz_id: string;
  patient_id: string;
  score: number;
  passed: boolean;
  answers_json: string;
  started_at: string;
  completed_at?: string;
}

export interface HealthLiteracyScoreRecord {
  id: string;
  patient_id: string;
  score: number;
  level: 'limited' | 'marginal' | 'adequate';
  assessment_tool: string;
  assessment_date: string;
  recommendations?: string;
}

export interface TrainingModuleRecord {
  id: string;
  title: string;
  category: string;
  description?: string;
  duration_hours: number;
  is_mandatory: boolean;
  passing_score: number;
  content_url?: string;
  status: 'draft' | 'active' | 'retired';
}

export interface CertificationRecordType {
  id: string;
  user_id: string;
  certification_name: string;
  issuing_body: string;
  issued_date: string;
  expiry_date?: string;
  status: 'active' | 'expired' | 'revoked';
  credential_number?: string;
}

export interface LearningPathRecord {
  id: string;
  name: string;
  description?: string;
  modules_json: string;
  total_modules: number;
  estimated_hours: number;
  target_audience: string;
}

// ============ SOCIAL DETERMINANTS TYPES ============

export interface SDOHAssessmentRecord {
  id: string;
  patient_id: string;
  assessment_date: string;
  housing_stability: string;
  food_security: string;
  transportation_access: string;
  employment_status: string;
  education_level: string;
  social_isolation_risk: string;
  financial_stress: string;
  overall_risk_level: 'low' | 'moderate' | 'high';
  referrals_made?: number;
}

export interface SocialRiskRecord {
  id: string;
  patient_id: string;
  risk_domain: string;
  risk_description: string;
  severity: 'low' | 'moderate' | 'high';
  status: 'identified' | 'addressed' | 'resolved' | 'ongoing';
  identified_date: string;
  interventions?: string;
}

export interface CommunityProgramRecord {
  id: string;
  name: string;
  program_type: string;
  organization: string;
  description?: string;
  eligibility_criteria?: string;
  contact_info?: string;
  is_active: boolean;
  capacity?: number;
}

export interface ProgramReferralRecord {
  id: string;
  patient_id: string;
  program_id: string;
  program_name?: string;
  referral_reason: string;
  status: 'pending' | 'accepted' | 'enrolled' | 'completed' | 'declined';
  referred_date: string;
}

export interface TransportationNeedRecord {
  id: string;
  patient_id: string;
  need_type: string;
  appointment_date?: string;
  pickup_location?: string;
  destination?: string;
  status: 'requested' | 'arranged' | 'completed' | 'cancelled';
  transportation_provider?: string;
}

export interface FoodInsecurityRecordType {
  id: string;
  patient_id: string;
  screening_date: string;
  is_food_insecure: boolean;
  severity: 'marginal' | 'low' | 'very_low';
  barriers?: string;
  resources_provided?: string;
}

export interface HousingAssessmentRecord {
  id: string;
  patient_id: string;
  assessment_date: string;
  housing_status: string;
  housing_quality: string;
  safety_concerns?: string;
  accessibility_needs?: string;
  assistance_needed: boolean;
}

// ============ WEARABLE ENHANCED TYPES ============

export interface WearableDeviceRecord {
  id: string;
  patient_id: string;
  device_type: string;
  manufacturer: string;
  model: string;
  serial_number?: string;
  firmware_version?: string;
  battery_level?: number;
  last_sync?: string;
  status: 'active' | 'inactive' | 'pairing' | 'error';
}

export interface ContinuousGlucoseReadingRecord {
  id: string;
  device_id: string;
  patient_id: string;
  glucose_value: number;
  trend: 'rising_fast' | 'rising' | 'stable' | 'falling' | 'falling_fast';
  recorded_at: string;
  is_alert: boolean;
}

export interface GlucoseSummaryRecord {
  id: string;
  patient_id: string;
  period_start: string;
  period_end: string;
  average_glucose: number;
  time_in_range_pct: number;
  time_above_pct: number;
  time_below_pct: number;
  gmi?: number;
  coefficient_of_variation?: number;
}

export interface FallDetectionEventRecord {
  id: string;
  device_id: string;
  patient_id: string;
  detected_at: string;
  severity: 'minor' | 'moderate' | 'severe';
  impact_force?: number;
  location?: string;
  response_status: 'detected' | 'alert_sent' | 'responded' | 'false_alarm';
  injuries_reported?: string;
}

export interface MedicationReminderRecord {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  scheduled_time: string;
  frequency: string;
  is_active: boolean;
  notification_method: string;
}

export interface GaitAnalysisRecord {
  id: string;
  patient_id: string;
  analysis_date: string;
  step_count: number;
  stride_length_cm: number;
  gait_speed_mps: number;
  cadence: number;
  symmetry_index?: number;
  fall_risk_score?: number;
  abnormalities?: string;
}

export interface RespiratoryMonitoringRecord {
  id: string;
  patient_id: string;
  respiratory_rate: number;
  spo2: number;
  peak_flow?: number;
  cough_events?: number;
  recorded_at: string;
  is_abnormal: boolean;
}

export interface PainTrackingEntryRecord {
  id: string;
  patient_id: string;
  pain_level: number;
  pain_location: string;
  pain_type: string;
  triggers?: string;
  relief_measures?: string;
  medication_taken?: string;
  recorded_at: string;
}

export interface SleepAnalysisRecord {
  id: string;
  patient_id: string;
  sleep_date: string;
  total_sleep_hours: number;
  deep_sleep_hours: number;
  rem_sleep_hours: number;
  light_sleep_hours: number;
  awakenings: number;
  sleep_efficiency: number;
  sleep_score: number;
}

export interface VitalSignsStreamRecord {
  id: string;
  device_id: string;
  patient_id: string;
  heart_rate?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  temperature?: number;
  spo2?: number;
  respiratory_rate?: number;
  recorded_at: string;
  is_alert: boolean;
}

// ============ EMERGENCY TYPES ============

export interface TriageAssessmentRecord {
  id: string;
  patient_id: string;
  triage_level: number;
  chief_complaint: string;
  vital_signs_json: string;
  pain_score?: number;
  acuity: 'resuscitation' | 'emergent' | 'urgent' | 'less_urgent' | 'non_urgent';
  status: 'pending' | 'triaged' | 'in_treatment' | 'discharged' | 'admitted';
  arrival_time: string;
  triage_time?: string;
}

export interface SepsisScreeningRecord {
  id: string;
  patient_id: string;
  screening_date: string;
  qsofa_score: number;
  sofa_score?: number;
  lactate_level?: number;
  sepsis_suspected: boolean;
  bundle_initiated: boolean;
  antibiotic_given_time?: string;
  fluid_resuscitation_time?: string;
  outcome?: string;
}

export interface StrokeAssessmentRecord {
  id: string;
  patient_id: string;
  assessment_date: string;
  nihss_score: number;
  stroke_type?: string;
  symptom_onset_time?: string;
  ct_completed: boolean;
  tpa_eligible: boolean;
  tpa_administered: boolean;
  door_to_ct_minutes?: number;
  door_to_needle_minutes?: number;
}

export interface CodeEventRecord {
  id: string;
  patient_id: string;
  code_type: 'blue' | 'rapid_response' | 'stroke' | 'stemi' | 'trauma';
  activation_time: string;
  team_arrival_time?: string;
  resolution_time?: string;
  duration_minutes?: number;
  location: string;
  outcome?: string;
  status: 'active' | 'resolved' | 'post_review';
  team_members?: string;
}

export interface TraumaAssessmentRecord {
  id: string;
  patient_id: string;
  trauma_type: string;
  mechanism_of_injury: string;
  injury_severity_score?: number;
  gcs_score?: number;
  assessment_date: string;
  primary_survey: string;
  secondary_survey?: string;
  interventions?: string;
}

export interface RapidResponseTeamRecord {
  id: string;
  patient_id: string;
  activation_reason: string;
  activation_time: string;
  response_time_minutes?: number;
  interventions?: string;
  outcome: string;
  escalated_to_icu: boolean;
  team_leader?: string;
}

// ============ WORKFORCE TYPES ============

export interface StaffProfileRecord {
  id: string;
  user_id: string;
  employee_id: string;
  department: string;
  position: string;
  hire_date: string;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'per_diem';
  specializations?: string;
  certifications?: string;
  status: 'active' | 'on_leave' | 'terminated';
}

export interface ShiftScheduleRecord {
  id: string;
  staff_id: string;
  staff_name?: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: 'day' | 'evening' | 'night' | 'swing';
  department: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  is_overtime: boolean;
}

export interface LeaveRequestRecord {
  id: string;
  staff_id: string;
  leave_type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'bereavement' | 'educational';
  start_date: string;
  end_date: string;
  days_requested: number;
  reason?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  approved_by?: string;
}

export interface CredentialingRecordType {
  id: string;
  staff_id: string;
  credential_type: string;
  credential_name: string;
  issuing_authority: string;
  issue_date: string;
  expiry_date: string;
  status: 'active' | 'pending_renewal' | 'expired' | 'revoked';
  verification_status: 'pending' | 'verified' | 'failed';
}

export interface PerformanceReviewRecord {
  id: string;
  staff_id: string;
  reviewer_name: string;
  review_period: string;
  overall_rating: number;
  clinical_competency?: number;
  communication?: number;
  teamwork?: number;
  professionalism?: number;
  strengths?: string;
  areas_for_improvement?: string;
  goals?: string;
  status: 'draft' | 'submitted' | 'acknowledged';
}

export interface StaffingMetricsRecord {
  id: string;
  department: string;
  metric_date: string;
  total_staff: number;
  staff_on_duty: number;
  patient_to_nurse_ratio?: number;
  overtime_hours?: number;
  vacancy_rate?: number;
  turnover_rate?: number;
  agency_staff_count?: number;
}

// ============ DASHBOARD STATS TYPES ============

export interface ModuleDashboardStats {
  total: number;
  active: number;
  completed?: number;
  pending?: number;
  today?: number;
  this_week?: number;
  this_month?: number;
  [key: string]: number | undefined;
}

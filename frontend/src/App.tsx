import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { lightTheme } from './theme';

// Auth Pages (eager loaded)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// User Pages (lazy loaded)
const PatientDashboard = lazy(() => import('./pages/patient/PatientDashboard'));
const CancerRiskPage = lazy(() => import('./pages/patient/CancerRiskPage'));
const HealthRecordsPage = lazy(() => import('./pages/patient/HealthRecordsPage'));
const BloodTestsPage = lazy(() => import('./pages/patient/BloodTestsPage'));
const AppointmentsPage = lazy(() => import('./pages/patient/AppointmentsPage'));
const MedicationsPage = lazy(() => import('./pages/patient/MedicationsPage'));
const SmartwatchPage = lazy(() => import('./pages/patient/SmartwatchPage'));
const SymptomsPage = lazy(() => import('./pages/patient/SymptomsPage'));
const HealthGoalsPage = lazy(() => import('./pages/patient/HealthGoalsPage'));
const ProfilePage = lazy(() => import('./pages/patient/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/patient/SettingsPage'));
const HospitalsPage = lazy(() => import('./pages/patient/HospitalsPage'));
const MessagesPage = lazy(() => import('./pages/patient/MessagesPage'));
const VitalSignsPage = lazy(() => import('./pages/patient/VitalSignsPage'));
const NotificationsPage = lazy(() => import('./pages/patient/NotificationsPage'));
const GeneticProfilePage = lazy(() => import('./pages/patient/GeneticProfilePage'));
const DietNutritionPage = lazy(() => import('./pages/patient/DietNutritionPage'));
const MentalHealthPage = lazy(() => import('./pages/patient/MentalHealthPage'));
const TreatmentPlanPage = lazy(() => import('./pages/patient/TreatmentPlanPage'));
const ExerciseFitnessPage = lazy(() => import('./pages/patient/ExerciseFitnessPage'));
const ScreeningSchedulePage = lazy(() => import('./pages/patient/ScreeningSchedulePage'));
const FamilyHealthPage = lazy(() => import('./pages/patient/FamilyHealthPage'));
const BloodDonorPage = lazy(() => import('./pages/patient/BloodDonorPage'));
const DocumentsPage = lazy(() => import('./pages/patient/DocumentsPage'));
const InsurancePage = lazy(() => import('./pages/patient/InsurancePage'));

// New User Pages (lazy loaded)
const ClinicalPathwaysPage = lazy(() => import('./pages/patient/ClinicalPathwaysPage'));
const GenomicsPage = lazy(() => import('./pages/patient/GenomicsPage'));
const PatientEngagementPage = lazy(() => import('./pages/patient/PatientEngagementPage'));
const RehabilitationPage = lazy(() => import('./pages/patient/RehabilitationPage'));
const WearableEnhancedPage = lazy(() => import('./pages/patient/WearableEnhancedPage'));
const CommunicationHubPage = lazy(() => import('./pages/patient/CommunicationHubPage'));
const TelehealthPatientPage = lazy(() => import('./pages/patient/TelehealthPatientPage'));
const NutritionEnhancedPage = lazy(() => import('./pages/patient/NutritionEnhancedPage'));
const MentalHealthEnhancedPage = lazy(() => import('./pages/patient/MentalHealthEnhancedPage'));
const EducationPage = lazy(() => import('./pages/patient/EducationPage'));
const SocialDeterminantsPage = lazy(() => import('./pages/patient/SocialDeterminantsPage'));
const BillingPatientPage = lazy(() => import('./pages/patient/BillingPatientPage'));

// Hospital Pages (lazy loaded)
const HospitalDashboard = lazy(() => import('./pages/hospital/HospitalDashboard'));
const PatientManagement = lazy(() => import('./pages/hospital/PatientManagement'));
const DoctorManagement = lazy(() => import('./pages/hospital/DoctorManagement'));
const StaffDirectory = lazy(() => import('./pages/hospital/StaffDirectory'));
const AppointmentManagement = lazy(() => import('./pages/hospital/AppointmentManagement'));
const LabManagement = lazy(() => import('./pages/hospital/LabManagement'));
const BedManagement = lazy(() => import('./pages/hospital/BedManagement'));
const AIAnalytics = lazy(() => import('./pages/hospital/AIAnalytics'));
const HospitalReports = lazy(() => import('./pages/hospital/HospitalReports'));
const HospitalSettings = lazy(() => import('./pages/hospital/HospitalSettings'));
const SurgeryManagementPage = lazy(() => import('./pages/hospital/SurgeryManagementPage'));
const PharmacyManagementPage = lazy(() => import('./pages/hospital/PharmacyManagementPage'));
const RadiologyPage = lazy(() => import('./pages/hospital/RadiologyPage'));
const EmergencyDashboardPage = lazy(() => import('./pages/hospital/EmergencyDashboardPage'));
const TelemedicinePage = lazy(() => import('./pages/hospital/TelemedicinePage'));
const ClinicalTrialsPage = lazy(() => import('./pages/hospital/ClinicalTrialsPage'));
const QualityMetricsPage = lazy(() => import('./pages/hospital/QualityMetricsPage'));
const BloodBankPage = lazy(() => import('./pages/hospital/BloodBankPage'));

// New Hospital Pages (lazy loaded)
const PathologyManagementPage = lazy(() => import('./pages/hospital/PathologyManagementPage'));
const SupplyChainPage = lazy(() => import('./pages/hospital/SupplyChainPage'));
const QualitySafetyPage = lazy(() => import('./pages/hospital/QualitySafetyPage'));
const GenomicsLabPage = lazy(() => import('./pages/hospital/GenomicsLabPage'));
const PopulationHealthPage = lazy(() => import('./pages/hospital/PopulationHealthPage'));
const ClinicalTrialsManagementPage = lazy(() => import('./pages/hospital/ClinicalTrialsManagementPage'));
const PharmacyEnhancedPage = lazy(() => import('./pages/hospital/PharmacyEnhancedPage'));
const RadiologyEnhancedPage = lazy(() => import('./pages/hospital/RadiologyEnhancedPage'));
const EmergencyEnhancedPage = lazy(() => import('./pages/hospital/EmergencyEnhancedPage'));
const ClinicalDecisionPage = lazy(() => import('./pages/hospital/ClinicalDecisionPage'));
const RehabilitationManagementPage = lazy(() => import('./pages/hospital/RehabilitationManagementPage'));
const NutritionManagementPage = lazy(() => import('./pages/hospital/NutritionManagementPage'));

// Admin Pages (lazy loaded)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const HospitalManagement = lazy(() => import('./pages/admin/HospitalManagement'));
const SystemMonitoring = lazy(() => import('./pages/admin/SystemMonitoring'));
const AIModelManagement = lazy(() => import('./pages/admin/AIModelManagement'));
const SecurityPage = lazy(() => import('./pages/admin/SecurityPage'));
const PlatformAnalytics = lazy(() => import('./pages/admin/PlatformAnalytics'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const Configuration = lazy(() => import('./pages/admin/Configuration'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const CompliancePage = lazy(() => import('./pages/admin/CompliancePage'));
const DataManagementPage = lazy(() => import('./pages/admin/DataManagementPage'));
const BillingManagementPage = lazy(() => import('./pages/admin/BillingManagementPage'));
const IntegrationHubPage = lazy(() => import('./pages/admin/IntegrationHubPage'));
const TrainingCenterPage = lazy(() => import('./pages/admin/TrainingCenterPage'));

// New Admin Pages (lazy loaded)
const ResearchPortalPage = lazy(() => import('./pages/admin/ResearchPortalPage'));
const WorkforceManagementPage = lazy(() => import('./pages/admin/WorkforceManagementPage'));
const PopulationHealthAdminPage = lazy(() => import('./pages/admin/PopulationHealthAdminPage'));
const QualityDashboardPage = lazy(() => import('./pages/admin/QualityDashboardPage'));
const EducationManagementPage = lazy(() => import('./pages/admin/EducationManagementPage'));
const SocialDeterminantsAdminPage = lazy(() => import('./pages/admin/SocialDeterminantsAdminPage'));

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
    <CircularProgress size={48} />
  </Box>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

const DashboardRouter: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  const adminRoles = ['system_admin', 'super_admin'];
  const hospitalRoles = ['hospital_admin', 'doctor', 'nurse', 'oncologist', 'surgeon', 'radiologist', 'pathologist', 'general_practitioner', 'specialist'];

  if (adminRoles.includes(user.role)) return <Navigate to="/admin" />;
  if (hospitalRoles.includes(user.role)) return <Navigate to="/hospital" />;
  return <Navigate to="/patient" />;
};

const ADMIN_ROLES = ['system_admin', 'super_admin'];
const HOSPITAL_ROLES = ['hospital_admin', 'doctor', 'nurse', 'oncologist', 'surgeon', 'radiologist', 'pathologist', 'general_practitioner', 'specialist'];

function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />

              {/* User Routes */}
              <Route path="/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
              <Route path="/patient/cancer-risk" element={<ProtectedRoute><CancerRiskPage /></ProtectedRoute>} />
              <Route path="/patient/records" element={<ProtectedRoute><HealthRecordsPage /></ProtectedRoute>} />
              <Route path="/patient/blood-tests" element={<ProtectedRoute><BloodTestsPage /></ProtectedRoute>} />
              <Route path="/patient/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />
              <Route path="/patient/medications" element={<ProtectedRoute><MedicationsPage /></ProtectedRoute>} />
              <Route path="/patient/smartwatch" element={<ProtectedRoute><SmartwatchPage /></ProtectedRoute>} />
              <Route path="/patient/symptoms" element={<ProtectedRoute><SymptomsPage /></ProtectedRoute>} />
              <Route path="/patient/goals" element={<ProtectedRoute><HealthGoalsPage /></ProtectedRoute>} />
              <Route path="/patient/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/patient/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/patient/hospitals" element={<ProtectedRoute><HospitalsPage /></ProtectedRoute>} />
              <Route path="/patient/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/patient/vitals" element={<ProtectedRoute><VitalSignsPage /></ProtectedRoute>} />
              <Route path="/patient/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/patient/genetics" element={<ProtectedRoute><GeneticProfilePage /></ProtectedRoute>} />
              <Route path="/patient/diet" element={<ProtectedRoute><DietNutritionPage /></ProtectedRoute>} />
              <Route path="/patient/mental-health" element={<ProtectedRoute><MentalHealthPage /></ProtectedRoute>} />
              <Route path="/patient/treatment" element={<ProtectedRoute><TreatmentPlanPage /></ProtectedRoute>} />
              <Route path="/patient/exercise" element={<ProtectedRoute><ExerciseFitnessPage /></ProtectedRoute>} />
              <Route path="/patient/screening" element={<ProtectedRoute><ScreeningSchedulePage /></ProtectedRoute>} />
              <Route path="/patient/family-health" element={<ProtectedRoute><FamilyHealthPage /></ProtectedRoute>} />
              <Route path="/patient/blood-donor" element={<ProtectedRoute><BloodDonorPage /></ProtectedRoute>} />
              <Route path="/patient/clinical-pathways" element={<ProtectedRoute><ClinicalPathwaysPage /></ProtectedRoute>} />
              <Route path="/patient/genomics" element={<ProtectedRoute><GenomicsPage /></ProtectedRoute>} />
              <Route path="/patient/engagement" element={<ProtectedRoute><PatientEngagementPage /></ProtectedRoute>} />
              <Route path="/patient/rehabilitation" element={<ProtectedRoute><RehabilitationPage /></ProtectedRoute>} />
              <Route path="/patient/wearables" element={<ProtectedRoute><WearableEnhancedPage /></ProtectedRoute>} />
              <Route path="/patient/communication" element={<ProtectedRoute><CommunicationHubPage /></ProtectedRoute>} />
              <Route path="/patient/telehealth" element={<ProtectedRoute><TelehealthPatientPage /></ProtectedRoute>} />
              <Route path="/patient/nutrition" element={<ProtectedRoute><NutritionEnhancedPage /></ProtectedRoute>} />
              <Route path="/patient/mental-health-enhanced" element={<ProtectedRoute><MentalHealthEnhancedPage /></ProtectedRoute>} />
              <Route path="/patient/education" element={<ProtectedRoute><EducationPage /></ProtectedRoute>} />
              <Route path="/patient/social-determinants" element={<ProtectedRoute><SocialDeterminantsPage /></ProtectedRoute>} />
              <Route path="/patient/billing" element={<ProtectedRoute><BillingPatientPage /></ProtectedRoute>} />
              <Route path="/patient/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
              <Route path="/patient/insurance" element={<ProtectedRoute><InsurancePage /></ProtectedRoute>} />

              {/* Hospital Routes */}
              <Route path="/hospital" element={<ProtectedRoute roles={HOSPITAL_ROLES}><HospitalDashboard /></ProtectedRoute>} />
              <Route path="/hospital/patients" element={<ProtectedRoute roles={HOSPITAL_ROLES}><PatientManagement /></ProtectedRoute>} />
              <Route path="/hospital/doctors" element={<ProtectedRoute roles={HOSPITAL_ROLES}><DoctorManagement /></ProtectedRoute>} />
              <Route path="/hospital/staff" element={<ProtectedRoute roles={HOSPITAL_ROLES}><StaffDirectory /></ProtectedRoute>} />
              <Route path="/hospital/appointments" element={<ProtectedRoute roles={HOSPITAL_ROLES}><AppointmentManagement /></ProtectedRoute>} />
              <Route path="/hospital/lab" element={<ProtectedRoute roles={HOSPITAL_ROLES}><LabManagement /></ProtectedRoute>} />
              <Route path="/hospital/beds" element={<ProtectedRoute roles={HOSPITAL_ROLES}><BedManagement /></ProtectedRoute>} />
              <Route path="/hospital/ai-analytics" element={<ProtectedRoute roles={HOSPITAL_ROLES}><AIAnalytics /></ProtectedRoute>} />
              <Route path="/hospital/reports" element={<ProtectedRoute roles={HOSPITAL_ROLES}><HospitalReports /></ProtectedRoute>} />
              <Route path="/hospital/settings" element={<ProtectedRoute roles={HOSPITAL_ROLES}><HospitalSettings /></ProtectedRoute>} />
              <Route path="/hospital/surgery" element={<ProtectedRoute roles={HOSPITAL_ROLES}><SurgeryManagementPage /></ProtectedRoute>} />
              <Route path="/hospital/pharmacy" element={<ProtectedRoute roles={HOSPITAL_ROLES}><PharmacyManagementPage /></ProtectedRoute>} />
              <Route path="/hospital/radiology" element={<ProtectedRoute roles={HOSPITAL_ROLES}><RadiologyPage /></ProtectedRoute>} />
              <Route path="/hospital/emergency" element={<ProtectedRoute roles={HOSPITAL_ROLES}><EmergencyDashboardPage /></ProtectedRoute>} />
              <Route path="/hospital/telemedicine" element={<ProtectedRoute roles={HOSPITAL_ROLES}><TelemedicinePage /></ProtectedRoute>} />
              <Route path="/hospital/clinical-trials" element={<ProtectedRoute roles={HOSPITAL_ROLES}><ClinicalTrialsPage /></ProtectedRoute>} />
              <Route path="/hospital/quality" element={<ProtectedRoute roles={HOSPITAL_ROLES}><QualityMetricsPage /></ProtectedRoute>} />
              <Route path="/hospital/blood-bank" element={<ProtectedRoute roles={HOSPITAL_ROLES}><BloodBankPage /></ProtectedRoute>} />
              <Route path="/hospital/pathology" element={<ProtectedRoute roles={HOSPITAL_ROLES}><PathologyManagementPage /></ProtectedRoute>} />
              <Route path="/hospital/supply-chain" element={<ProtectedRoute roles={HOSPITAL_ROLES}><SupplyChainPage /></ProtectedRoute>} />
              <Route path="/hospital/quality-safety" element={<ProtectedRoute roles={HOSPITAL_ROLES}><QualitySafetyPage /></ProtectedRoute>} />
              <Route path="/hospital/genomics-lab" element={<ProtectedRoute roles={HOSPITAL_ROLES}><GenomicsLabPage /></ProtectedRoute>} />
              <Route path="/hospital/population-health" element={<ProtectedRoute roles={HOSPITAL_ROLES}><PopulationHealthPage /></ProtectedRoute>} />
              <Route path="/hospital/clinical-trials-mgmt" element={<ProtectedRoute roles={HOSPITAL_ROLES}><ClinicalTrialsManagementPage /></ProtectedRoute>} />
              <Route path="/hospital/pharmacy-enhanced" element={<ProtectedRoute roles={HOSPITAL_ROLES}><PharmacyEnhancedPage /></ProtectedRoute>} />
              <Route path="/hospital/radiology-enhanced" element={<ProtectedRoute roles={HOSPITAL_ROLES}><RadiologyEnhancedPage /></ProtectedRoute>} />
              <Route path="/hospital/emergency-enhanced" element={<ProtectedRoute roles={HOSPITAL_ROLES}><EmergencyEnhancedPage /></ProtectedRoute>} />
              <Route path="/hospital/clinical-decision" element={<ProtectedRoute roles={HOSPITAL_ROLES}><ClinicalDecisionPage /></ProtectedRoute>} />
              <Route path="/hospital/rehabilitation" element={<ProtectedRoute roles={HOSPITAL_ROLES}><RehabilitationManagementPage /></ProtectedRoute>} />
              <Route path="/hospital/nutrition" element={<ProtectedRoute roles={HOSPITAL_ROLES}><NutritionManagementPage /></ProtectedRoute>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={ADMIN_ROLES}><UserManagement /></ProtectedRoute>} />
              <Route path="/admin/hospitals" element={<ProtectedRoute roles={ADMIN_ROLES}><HospitalManagement /></ProtectedRoute>} />
              <Route path="/admin/system" element={<ProtectedRoute roles={ADMIN_ROLES}><SystemMonitoring /></ProtectedRoute>} />
              <Route path="/admin/ai-models" element={<ProtectedRoute roles={ADMIN_ROLES}><AIModelManagement /></ProtectedRoute>} />
              <Route path="/admin/security" element={<ProtectedRoute roles={ADMIN_ROLES}><SecurityPage /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute roles={ADMIN_ROLES}><PlatformAnalytics /></ProtectedRoute>} />
              <Route path="/admin/audit-logs" element={<ProtectedRoute roles={ADMIN_ROLES}><AuditLogs /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/config" element={<ProtectedRoute roles={ADMIN_ROLES}><Configuration /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute roles={ADMIN_ROLES}><AdminNotifications /></ProtectedRoute>} />
              <Route path="/admin/compliance" element={<ProtectedRoute roles={ADMIN_ROLES}><CompliancePage /></ProtectedRoute>} />
              <Route path="/admin/data-management" element={<ProtectedRoute roles={ADMIN_ROLES}><DataManagementPage /></ProtectedRoute>} />
              <Route path="/admin/billing" element={<ProtectedRoute roles={ADMIN_ROLES}><BillingManagementPage /></ProtectedRoute>} />
              <Route path="/admin/integrations" element={<ProtectedRoute roles={ADMIN_ROLES}><IntegrationHubPage /></ProtectedRoute>} />
              <Route path="/admin/training" element={<ProtectedRoute roles={ADMIN_ROLES}><TrainingCenterPage /></ProtectedRoute>} />
              <Route path="/admin/research" element={<ProtectedRoute roles={ADMIN_ROLES}><ResearchPortalPage /></ProtectedRoute>} />
              <Route path="/admin/workforce" element={<ProtectedRoute roles={ADMIN_ROLES}><WorkforceManagementPage /></ProtectedRoute>} />
              <Route path="/admin/population-health" element={<ProtectedRoute roles={ADMIN_ROLES}><PopulationHealthAdminPage /></ProtectedRoute>} />
              <Route path="/admin/quality-dashboard" element={<ProtectedRoute roles={ADMIN_ROLES}><QualityDashboardPage /></ProtectedRoute>} />
              <Route path="/admin/education" element={<ProtectedRoute roles={ADMIN_ROLES}><EducationManagementPage /></ProtectedRoute>} />
              <Route path="/admin/social-determinants" element={<ProtectedRoute roles={ADMIN_ROLES}><SocialDeterminantsAdminPage /></ProtectedRoute>} />

              {/* Legacy route redirects */}
              <Route path="/health-records" element={<Navigate to="/patient/records" />} />
              <Route path="/cancer-risk" element={<Navigate to="/patient/cancer-risk" />} />
              <Route path="/profile" element={<Navigate to="/patient/profile" />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

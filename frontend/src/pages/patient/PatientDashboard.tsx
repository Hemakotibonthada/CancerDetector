import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Avatar, IconButton,
  LinearProgress, Tabs, Tab, Tooltip, Divider, Badge, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Rating,
  CircularProgress,
} from '@mui/material';
import {
  Dashboard as DashIcon, Assessment as AssessIcon, MonitorHeart as HeartIcon,
  Science as ScienceIcon, Biotech as BiotechIcon, Watch as WatchIcon,
  CalendarMonth as CalendarIcon, LocalPharmacy as MedIcon,
  Warning as WarningIcon, TrendingUp as TrendIcon, TrendingDown,
  CheckCircle as CheckIcon, FolderShared as RecordsIcon,
  Shield as ShieldIcon, Notifications as NotifIcon,
  Person as PersonIcon, Favorite as FavoriteIcon,
  WaterDrop as WaterIcon, DirectionsRun as RunIcon,
  Restaurant as FoodIcon, Bedtime as SleepIcon,
  SelfImprovement as StressIcon, Thermostat as TempIcon,
  Speed as SpeedIcon, Timeline as TimelineIcon,
  Star as StarIcon, EmojiEvents as TrophyIcon,
  LocalHospital as HospitalIcon, Phone as PhoneIcon,
  Share as ShareIcon, Download as DownloadIcon,
  ArrowForward, Refresh as RefreshIcon, Air as AirIcon,
  Opacity as OpacityIcon, FitnessCenter as FitnessIcon,
  Psychology as BrainIcon, Bloodtype as BloodIcon,
  Vaccines as VaccineIcon, MedicalServices, ContentCopy,
  Lightbulb as TipIcon, MoreHoriz, Visibility, Description as DocsIcon,
  Biotech as DnaIcon, RestaurantMenu as DietIcon, Spa as SpaIcon,
  MedicalInformation as TreatmentIcon, EventAvailable as ScreeningIcon,
  FamilyRestroom as FamilyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout, { NavItem } from '../../components/common/AppLayout';
import { StatCard, ProgressCard, MetricGauge, GlassCard, SectionHeader, StatusBadge, TimelineItem } from '../../components/common/SharedComponents';
import { patientsAPI, healthRecordsAPI, notificationsAPI } from '../../services/api';

// User navigation items
export const patientNavItems: NavItem[] = [
  { icon: <DashIcon />, label: 'Dashboard', path: '/patient', section: 'Main' },
  { icon: <AssessIcon />, label: 'Cancer Risk', path: '/patient/cancer-risk', section: 'Main' },
  { icon: <RecordsIcon />, label: 'Health Records', path: '/patient/records', section: 'Health' },
  { icon: <BiotechIcon />, label: 'Blood Tests', path: '/patient/blood-tests', section: 'Health' },
  { icon: <HeartIcon />, label: 'Vital Signs', path: '/patient/vitals', section: 'Health' },
  { icon: <WatchIcon />, label: 'Smartwatch', path: '/patient/smartwatch', section: 'Devices' },
  { icon: <CalendarIcon />, label: 'Appointments', path: '/patient/appointments', section: 'Care' },
  { icon: <MedIcon />, label: 'Medications', path: '/patient/medications', section: 'Care' },
  { icon: <HospitalIcon />, label: 'Find Hospitals', path: '/patient/hospitals', section: 'Care' },
  { icon: <BrainIcon />, label: 'Symptom Checker', path: '/patient/symptoms', section: 'Tools' },
  { icon: <FitnessIcon />, label: 'Health Goals', path: '/patient/goals', section: 'Wellness' },
  { icon: <DnaIcon />, label: 'Genetic Profile', path: '/patient/genetics', section: 'Advanced' },
  { icon: <DietIcon />, label: 'Diet & Nutrition', path: '/patient/diet', section: 'Wellness' },
  { icon: <SpaIcon />, label: 'Mental Wellness', path: '/patient/mental-health', section: 'Wellness' },
  { icon: <TreatmentIcon />, label: 'Treatment Plan', path: '/patient/treatment', section: 'Care' },
  { icon: <RunIcon />, label: 'Exercise & Fitness', path: '/patient/exercise', section: 'Wellness' },
  { icon: <ScreeningIcon />, label: 'Screening Schedule', path: '/patient/screening', section: 'Care' },
  { icon: <FamilyIcon />, label: 'Family Health', path: '/patient/family-health', section: 'Advanced' },
  { icon: <BloodIcon />, label: 'Blood Donor', path: '/patient/blood-donor', section: 'Advanced' },
  { icon: <TimelineIcon />, label: 'Clinical Pathways', path: '/patient/clinical-pathways', section: 'Advanced' },
  { icon: <DnaIcon />, label: 'Genomics', path: '/patient/genomics', section: 'Advanced' },
  { icon: <TrophyIcon />, label: 'Engagement', path: '/patient/engagement', section: 'Wellness' },
  { icon: <FitnessIcon />, label: 'Rehabilitation', path: '/patient/rehabilitation', section: 'Care' },
  { icon: <WatchIcon />, label: 'Wearables+', path: '/patient/wearables', section: 'Devices' },
  { icon: <PhoneIcon />, label: 'Communication', path: '/patient/communication', section: 'Care' },
  { icon: <HospitalIcon />, label: 'Telehealth', path: '/patient/telehealth', section: 'Care' },
  { icon: <DietIcon />, label: 'Nutrition+', path: '/patient/nutrition', section: 'Wellness' },
  { icon: <SpaIcon />, label: 'Mental Health+', path: '/patient/mental-health-enhanced', section: 'Wellness' },
  { icon: <BrainIcon />, label: 'Education', path: '/patient/education', section: 'Tools' },
  { icon: <ShieldIcon />, label: 'Social Support', path: '/patient/social-determinants', section: 'Advanced' },
  { icon: <DocsIcon />, label: 'My Documents', path: '/patient/documents', section: 'Health' },
  { icon: <ShieldIcon />, label: 'Insurance', path: '/patient/insurance', section: 'Account' },
  { icon: <MedicalServices />, label: 'Billing', path: '/patient/billing', section: 'Account' },
  { icon: <NotifIcon />, label: 'Notifications', path: '/patient/notifications', section: 'Account' },
  { icon: <PersonIcon />, label: 'Profile', path: '/patient/profile', section: 'Account' },
];

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    patientsAPI.getHealthSummary().then(r => setSummary(r.data))
      .catch(err => setError(err?.response?.data?.detail || 'Unable to load your health profile.'))
      .finally(() => setLoading(false));
  }, []);
  const cards = [
    { label: 'Health records', value: summary?.total_health_records ?? 0, path: '/patient/records' },
    { label: 'Blood tests', value: summary?.total_blood_tests ?? 0, path: '/patient/blood-tests' },
    { label: 'Active medications', value: summary?.active_medications ?? 0, path: '/patient/medications' },
    { label: 'Active alerts', value: summary?.active_alerts ?? 0, path: '/patient/notifications' },
  ];
  return <AppLayout title="My Dashboard" subtitle={`Welcome, ${user?.first_name || 'patient'}`} navItems={patientNavItems} portalType="patient">
    <Stack spacing={3}>
      <Alert severity="info">Your dashboard shows recorded data only. The risk factor explorer is an unvalidated research prototype and cannot detect or diagnose cancer.</Alert>
      {loading && <LinearProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && <>
        <Card sx={{ p: 3 }}><Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}><Box><Typography variant="h5" fontWeight={700}>Your health profile</Typography><Typography color="text.secondary" mt={1}>Health ID: {user?.health_id || 'Unavailable'}</Typography></Box><Button variant="outlined" onClick={() => navigate('/patient/profile')}>Update profile</Button></Stack></Card>
        <Grid container spacing={2}>{cards.map(card => <Grid item xs={12} sm={6} md={3} key={card.label}><Card sx={{ p: 3, height: '100%', cursor: 'pointer' }} onClick={() => navigate(card.path)}><Typography color="text.secondary">{card.label}</Typography><Typography variant="h4" fontWeight={700} mt={1}>{card.value}</Typography><Typography variant="body2" color="primary" mt={1}>View records →</Typography></Card></Grid>)}</Grid>
        <Card sx={{ p: 3 }}><Typography variant="h6" fontWeight={700}>Risk factor explorer</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>{summary?.cancer_risk_score == null ? 'No assessment recorded yet.' : `Latest exploratory score: ${Math.round(summary.cancer_risk_score * 100)}/100. This is not a cancer probability.`}</Typography><Button variant="contained" onClick={() => navigate('/patient/cancer-risk')}>Open explorer</Button></Card>
        <Grid container spacing={2}><Grid item xs={12} md={6}><Card sx={{ p: 3, height: '100%' }}><Typography variant="h6" fontWeight={700}>Your records</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>Add and review health records and blood test information.</Typography><Button onClick={() => navigate('/patient/records')}>Health records</Button><Button onClick={() => navigate('/patient/blood-tests')}>Blood tests</Button></Card></Grid><Grid item xs={12} md={6}><Card sx={{ p: 3, height: '100%' }}><Typography variant="h6" fontWeight={700}>Your care</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>Review appointments and medication information you have recorded.</Typography><Button onClick={() => navigate('/patient/appointments')}>Appointments</Button><Button onClick={() => navigate('/patient/medications')}>Medications</Button></Card></Grid></Grid>
      </>}
    </Stack>
  </AppLayout>;
};
export default PatientDashboard;

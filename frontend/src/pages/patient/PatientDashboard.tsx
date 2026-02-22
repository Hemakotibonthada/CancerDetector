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
  Lightbulb as TipIcon, MoreHoriz, Visibility,
  Biotech as DnaIcon, RestaurantMenu as DietIcon, Spa as SpaIcon,
  MedicalInformation as TreatmentIcon, EventAvailable as ScreeningIcon,
  FamilyRestroom as FamilyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout, { NavItem } from '../../components/common/AppLayout';
import { StatCard, ProgressCard, MetricGauge, GlassCard, SectionHeader, StatusBadge, TimelineItem } from '../../components/common/SharedComponents';
import { patientsAPI, healthRecordsAPI, notificationsAPI } from '../../services/api';

// Patient navigation items
export const patientNavItems: NavItem[] = [
  { icon: <DashIcon />, label: 'Dashboard', path: '/dashboard', section: 'Main' },
  { icon: <AssessIcon />, label: 'Cancer Risk', path: '/cancer-risk', section: 'Main' },
  { icon: <RecordsIcon />, label: 'Health Records', path: '/health-records', section: 'Health' },
  { icon: <BiotechIcon />, label: 'Blood Tests', path: '/blood-tests', section: 'Health' },
  { icon: <HeartIcon />, label: 'Vital Signs', path: '/vital-signs', section: 'Health' },
  { icon: <WatchIcon />, label: 'Smartwatch', path: '/smartwatch', section: 'Devices' },
  { icon: <CalendarIcon />, label: 'Appointments', path: '/appointments', section: 'Care' },
  { icon: <MedIcon />, label: 'Medications', path: '/medications', section: 'Care' },
  { icon: <HospitalIcon />, label: 'Find Hospitals', path: '/hospitals', section: 'Care' },
  { icon: <BrainIcon />, label: 'Symptom Checker', path: '/symptoms', section: 'Tools' },
  { icon: <FitnessIcon />, label: 'Health Goals', path: '/health-goals', section: 'Wellness' },
  { icon: <TimelineIcon />, label: 'Health Timeline', path: '/timeline', section: 'Wellness' },
  { icon: <DnaIcon />, label: 'Genetic Profile', path: '/genetics', section: 'Advanced' },
  { icon: <DietIcon />, label: 'Diet & Nutrition', path: '/diet', section: 'Wellness' },
  { icon: <SpaIcon />, label: 'Mental Wellness', path: '/mental-health', section: 'Wellness' },
  { icon: <TreatmentIcon />, label: 'Treatment Plan', path: '/treatment', section: 'Care' },
  { icon: <RunIcon />, label: 'Exercise & Fitness', path: '/exercise', section: 'Wellness' },
  { icon: <ScreeningIcon />, label: 'Screening Schedule', path: '/screening', section: 'Care' },
  { icon: <FamilyIcon />, label: 'Family Health', path: '/family-health', section: 'Advanced' },
  { icon: <BloodIcon />, label: 'Blood Donor', path: '/blood-donor', section: 'Advanced' },
  { icon: <NotifIcon />, label: 'Notifications', path: '/notifications', badge: 3, section: 'Account' },
  { icon: <PersonIcon />, label: 'Profile', path: '/profile', section: 'Account' },
];

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showHealthIdDialog, setShowHealthIdDialog] = useState(false);
  const [waterIntake, setWaterIntake] = useState(5);
  const [dailyMood, setDailyMood] = useState(4);
  const [showSOSDialog, setShowSOSDialog] = useState(false);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const res = await patientsAPI.getHealthSummary();
      setHealthSummary(res.data);
    } catch (err) { console.error('Error loading dashboard:', err); }
    finally { setLoading(false); }
  };

  const riskScore = healthSummary?.cancer_risk_score ?? 0;
  const riskLevel = healthSummary?.cancer_risk_level ?? 'not_assessed';
  const riskPercent = (riskScore * 100);
  const riskColor = ({ very_low: '#4caf50', low: '#8bc34a', moderate: '#ff9800', high: '#f44336', very_high: '#d32f2f', critical: '#b71c1c' } as any)[riskLevel] || '#9e9e9e';

  // Simulated live data
  const heartRate = 72 + Math.floor(Math.random() * 8);
  const spo2 = 96 + Math.floor(Math.random() * 3);
  const steps = 6847;
  const calories = 1845;
  const sleepHours = 7.2;
  const stressLevel = 35;
  const bmi = healthSummary?.bmi ?? 24.5;

  const healthScore = Math.round(100 - riskPercent * 0.6 - (stressLevel * 0.1) + (sleepHours > 7 ? 5 : 0));

  return (
    <AppLayout title="Patient Dashboard" subtitle={`Welcome back, ${user?.first_name}`} navItems={patientNavItems} portalType="patient">
      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}

      {/* Health Score & Risk Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Main Health Score */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase', mb: 2 }}>
              Overall Health Score
            </Typography>
            <Stack direction="row" alignItems="center" spacing={3}>
              <MetricGauge value={healthScore} color="white" size={110} />
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 36, lineHeight: 1 }}>{healthScore}</Typography>
                <Typography sx={{ fontSize: 13, opacity: 0.8, mt: 0.5 }}>out of 100</Typography>
                <Chip label={healthScore > 75 ? 'EXCELLENT' : healthScore > 60 ? 'GOOD' : 'NEEDS ATTENTION'}
                  sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700, fontSize: 11 }} size="small" />
              </Box>
            </Stack>
            <Typography sx={{ fontSize: 11, opacity: 0.6, mt: 2 }}>
              Based on vitals, risk assessment, lifestyle & activity data
            </Typography>
          </Card>
        </Grid>

        {/* Cancer Risk Assessment */}
        <Grid item xs={12} md={4}>
          <Card sx={{
            p: 3, position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${riskColor}12, ${riskColor}04)`,
            border: `2px solid ${riskColor}25`,
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>
                  Cancer Risk Level
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: riskColor, lineHeight: 1 }}>
                  {riskPercent.toFixed(1)}%
                </Typography>
                <Chip label={riskLevel.replace(/_/g, ' ').toUpperCase()}
                  sx={{ mt: 1, bgcolor: riskColor, color: 'white', fontWeight: 700, fontSize: 11 }} size="small" />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <ScienceIcon sx={{ fontSize: 60, color: riskColor, opacity: 0.2 }} />
              </Box>
            </Stack>
            <Button size="small" onClick={() => navigate('/cancer-risk')} sx={{ mt: 2, color: riskColor, fontWeight: 600 }} endIcon={<ArrowForward />}>
              View Full Report
            </Button>
          </Card>
        </Grid>

        {/* Health ID Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{
            p: 3, background: 'linear-gradient(135deg, #0d47a1, #1976d2)',
            color: 'white', position: 'relative', overflow: 'hidden',
            cursor: 'pointer',
          }} onClick={() => setShowHealthIdDialog(true)}>
            <Box sx={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>
                  Your Health ID
                </Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 22, letterSpacing: 2, fontFamily: 'monospace' }}>
                  {user?.health_id || 'N/A'}
                </Typography>
                <Typography sx={{ fontSize: 11, opacity: 0.7, mt: 1 }}>
                  Tap to view QR code & share
                </Typography>
              </Box>
              <ShieldIcon sx={{ fontSize: 50, opacity: 0.3 }} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Chip icon={<ShareIcon sx={{ fontSize: 14 }} />} label="Share" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />
              <Chip icon={<ContentCopy sx={{ fontSize: 14 }} />} label="Copy" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 11 }} />
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Live Vitals Strip */}
      <Card sx={{ p: 2, mb: 3, background: 'linear-gradient(90deg, #f8f9ff 0%, #f0f4ff 50%, #f8f9ff 100%)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>
            Live Health Metrics
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50', animation: 'pulse 2s infinite' }} />
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Real-time from Smartwatch</Typography>
          </Stack>
        </Stack>
        <Grid container spacing={2}>
          {[
            { icon: <FavoriteIcon />, label: 'Heart Rate', value: `${heartRate}`, unit: 'bpm', color: '#ef5350', status: heartRate > 100 ? 'High' : 'Normal' },
            { icon: <OpacityIcon />, label: 'SpO2', value: `${spo2}`, unit: '%', color: '#42a5f5', status: spo2 >= 95 ? 'Normal' : 'Low' },
            { icon: <RunIcon />, label: 'Steps', value: steps.toLocaleString(), unit: 'steps', color: '#66bb6a', status: steps > 8000 ? 'Great' : 'Keep Going' },
            { icon: <FoodIcon />, label: 'Calories', value: calories.toString(), unit: 'kcal', color: '#ff7043', status: 'On Track' },
            { icon: <SleepIcon />, label: 'Sleep', value: sleepHours.toFixed(1), unit: 'hrs', color: '#7e57c2', status: sleepHours >= 7 ? 'Good' : 'Low' },
            { icon: <StressIcon />, label: 'Stress', value: `${stressLevel}`, unit: '%', color: '#26a69a', status: stressLevel < 40 ? 'Low' : 'Moderate' },
            { icon: <SpeedIcon />, label: 'BMI', value: bmi.toFixed(1), unit: 'kg/m²', color: '#5c6bc0', status: bmi < 25 ? 'Normal' : 'Overweight' },
            { icon: <TempIcon />, label: 'Temp', value: '98.4', unit: '°F', color: '#ec407a', status: 'Normal' },
          ].map((metric, i) => (
            <Grid item xs={6} sm={3} md={1.5} key={i}>
              <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 3, bgcolor: 'white', border: '1px solid #f0f0f0', transition: 'all 0.2s', '&:hover': { boxShadow: 2, transform: 'translateY(-2px)' } }}>
                <Box sx={{ color: metric.color, mb: 0.5 }}>{React.cloneElement(metric.icon as React.ReactElement, { sx: { fontSize: 22 } })}</Box>
                <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#1a1a2e', lineHeight: 1 }}>{metric.value}</Typography>
                <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{metric.unit}</Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: metric.status === 'Normal' || metric.status === 'Good' || metric.status === 'Great' || metric.status === 'Low' || metric.status === 'On Track' ? '#4caf50' : '#ff9800', mt: 0.3 }}>
                  {metric.status}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* Tabs Section */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2.5, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13 } }}>
          <Tab label="Overview" />
          <Tab label="Activity" />
          <Tab label="Insights" />
          <Tab label="Upcoming" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Quick Stats */}
            <Grid item xs={6} sm={3}>
              <StatCard icon={<RecordsIcon />} label="Health Records" value={healthSummary?.total_health_records ?? 0} color="#1565c0" change={12} onClick={() => navigate('/health-records')} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard icon={<BiotechIcon />} label="Blood Tests" value={healthSummary?.total_blood_tests ?? 0} color="#00897b" change={5} onClick={() => navigate('/blood-tests')} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard icon={<MedIcon />} label="Active Medications" value={healthSummary?.active_medications ?? 0} color="#f57c00" onClick={() => navigate('/medications')} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard icon={<CalendarIcon />} label="Appointments" value={3} color="#7b1fa2" change={-2} onClick={() => navigate('/appointments')} />
            </Grid>

            {/* Daily Goals Progress */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Daily Health Goals" subtitle="Track your daily targets" icon={<TrophyIcon />}
                  action={<Button size="small" onClick={() => navigate('/health-goals')}>View All</Button>} />
                <Stack spacing={2}>
                  <ProgressCard title="Steps" value={steps} max={10000} color="#66bb6a" icon={<RunIcon />} unit="" subtitle={`${((steps/10000)*100).toFixed(0)}% of daily goal`} />
                  <ProgressCard title="Water Intake" value={waterIntake} max={8} color="#42a5f5" icon={<WaterIcon />} unit=" glasses" subtitle={`${8-waterIntake} more glasses to go`} />
                  <ProgressCard title="Active Minutes" value={42} max={60} color="#ff7043" icon={<FitnessIcon />} unit=" min" subtitle="70% of 60 min target" />
                  <ProgressCard title="Sleep Quality" value={82} max={100} color="#7e57c2" icon={<SleepIcon />} subtitle="Good - 7.2 hours last night" />
                </Stack>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Quick Actions" subtitle="Common tasks at a glance" />
                <Grid container spacing={1.5}>
                  {[
                    { icon: <AssessIcon />, label: 'Run AI Risk\nAssessment', color: '#1565c0', path: '/cancer-risk' },
                    { icon: <BiotechIcon />, label: 'View Blood\nResults', color: '#00897b', path: '/blood-tests' },
                    { icon: <WatchIcon />, label: 'Sync\nSmartwatch', color: '#7b1fa2', path: '/smartwatch' },
                    { icon: <CalendarIcon />, label: 'Book\nAppointment', color: '#f57c00', path: '/appointments' },
                    { icon: <MedIcon />, label: 'Medication\nReminder', color: '#e91e63', path: '/medications' },
                    { icon: <RecordsIcon />, label: 'Upload\nRecords', color: '#00695c', path: '/health-records' },
                    { icon: <BrainIcon />, label: 'Symptom\nChecker', color: '#5c6bc0', path: '/symptoms' },
                    { icon: <HospitalIcon />, label: 'Find\nHospitals', color: '#ef6c00', path: '/hospitals' },
                    { icon: <PhoneIcon />, label: 'Emergency\nSOS', color: '#d32f2f', path: '' },
                  ].map((action, i) => (
                    <Grid item xs={4} key={i}>
                      <Box
                        onClick={() => action.path ? navigate(action.path) : setShowSOSDialog(true)}
                        sx={{
                          p: 2, textAlign: 'center', borderRadius: 3, cursor: 'pointer',
                          bgcolor: `${action.color}08`, border: `1px solid ${action.color}15`,
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: `${action.color}15`, transform: 'translateY(-2px)', boxShadow: 2 },
                        }}
                      >
                        <Box sx={{ color: action.color, mb: 1 }}>{React.cloneElement(action.icon as React.ReactElement, { sx: { fontSize: 28 } })}</Box>
                        <Typography sx={{ fontSize: 11, fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{action.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>

            {/* Recent Activity Timeline */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Recent Activity" subtitle="Your latest health events" icon={<TimelineIcon />} />
                <TimelineItem time="Today, 9:30 AM" title="Blood Test Results Ready" description="CBC panel completed - All values normal" icon={<BiotechIcon sx={{ fontSize: 16 }} />} color="#00897b" />
                <TimelineItem time="Yesterday" title="AI Risk Assessment Updated" description="Overall risk decreased by 2.3%" icon={<AssessIcon sx={{ fontSize: 16 }} />} color="#1565c0" />
                <TimelineItem time="Feb 19, 2026" title="Smartwatch Data Synced" description="7 days of continuous monitoring uploaded" icon={<WatchIcon sx={{ fontSize: 16 }} />} color="#7b1fa2" />
                <TimelineItem time="Feb 17, 2026" title="Appointment with Dr. Smith" description="Annual cancer screening - completed" icon={<CalendarIcon sx={{ fontSize: 16 }} />} color="#f57c00" />
                <TimelineItem time="Feb 15, 2026" title="Medication Refill" description="Aspirin 81mg refilled - 30 day supply" icon={<MedIcon sx={{ fontSize: 16 }} />} color="#e91e63" isLast />
              </Card>
            </Grid>

            {/* Health Tips & Insights */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="AI Health Insights" subtitle="Personalized recommendations" icon={<TipIcon />} />
                <Stack spacing={2}>
                  {[
                    { type: 'success', title: 'Great Sleep Pattern!', desc: 'Your average sleep of 7.2 hours is within the recommended range. Keep it up!', icon: <SleepIcon /> },
                    { type: 'info', title: 'Hydration Reminder', desc: "You're 3 glasses short of your daily water goal. Try setting hourly reminders.", icon: <WaterIcon /> },
                    { type: 'warning', title: 'Stress Level Rising', desc: 'Your stress levels have increased 15% this week. Consider meditation or light exercise.', icon: <StressIcon /> },
                    { type: 'info', title: 'Screening Due', desc: 'Your annual colonoscopy screening is due next month. Schedule an appointment.', icon: <AssessIcon /> },
                  ].map((tip, i) => (
                    <Alert key={i} severity={tip.type as any} icon={tip.icon} sx={{ borderRadius: 3, '& .MuiAlert-icon': { alignItems: 'center' } }}>
                      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{tip.title}</Typography>
                      <Typography sx={{ fontSize: 12, mt: 0.3 }}>{tip.desc}</Typography>
                    </Alert>
                  ))}
                </Stack>
              </Card>
            </Grid>

            {/* Upcoming Appointments */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Upcoming Appointments" icon={<CalendarIcon />}
                  action={<Button size="small" onClick={() => navigate('/appointments')} endIcon={<ArrowForward />}>View All</Button>} />
                <Stack spacing={2}>
                  {[
                    { doctor: 'Dr. Sarah Smith', specialty: 'Oncologist', date: 'Feb 25, 2026', time: '10:00 AM', type: 'In-Person', status: 'confirmed' },
                    { doctor: 'Dr. James Lee', specialty: 'Cardiologist', date: 'Mar 02, 2026', time: '2:30 PM', type: 'Telemedicine', status: 'scheduled' },
                    { doctor: 'Dr. Emily Chen', specialty: 'General', date: 'Mar 10, 2026', time: '9:00 AM', type: 'In-Person', status: 'pending' },
                  ].map((apt, i) => (
                    <Box key={i} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', '&:hover': { bgcolor: '#fafafa' } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 40, height: 40, bgcolor: '#e3f2fd', color: '#1565c0', fontSize: 14, fontWeight: 700 }}>
                            {apt.doctor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{apt.doctor}</Typography>
                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{apt.specialty}</Typography>
                          </Box>
                        </Stack>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{apt.date}</Typography>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{apt.time}</Typography>
                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, justifyContent: 'flex-end' }}>
                            <StatusBadge status={apt.status} />
                            <Chip label={apt.type} size="small" variant="outlined" sx={{ fontSize: 10, height: 20 }} />
                          </Stack>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>

            {/* Medication Tracker */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Today's Medications" icon={<MedIcon />}
                  action={<Button size="small" onClick={() => navigate('/medications')}>Manage</Button>} />
                <Stack spacing={1.5}>
                  {[
                    { name: 'Aspirin 81mg', time: '8:00 AM', taken: true, type: 'Preventive' },
                    { name: 'Vitamin D 2000IU', time: '8:00 AM', taken: true, type: 'Supplement' },
                    { name: 'Omega-3 Fish Oil', time: '1:00 PM', taken: false, type: 'Supplement' },
                    { name: 'Metformin 500mg', time: '6:00 PM', taken: false, type: 'Diabetes' },
                    { name: 'Multivitamin', time: '8:00 PM', taken: false, type: 'Supplement' },
                  ].map((med, i) => (
                    <Box key={i} sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      p: 1.5, borderRadius: 2, bgcolor: med.taken ? '#e8f5e9' : '#fff',
                      border: `1px solid ${med.taken ? '#c8e6c9' : '#f0f0f0'}`,
                    }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '50%',
                          bgcolor: med.taken ? '#4caf50' : '#f5f5f5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {med.taken ? <CheckIcon sx={{ color: 'white', fontSize: 18 }} /> : <MedIcon sx={{ color: '#bdbdbd', fontSize: 16 }} />}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{med.name}</Typography>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{med.time} - {med.type}</Typography>
                        </Box>
                      </Stack>
                      {!med.taken && (
                        <Button variant="outlined" size="small" sx={{ fontSize: 11, minWidth: 65, borderRadius: 2 }}>
                          Take
                        </Button>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>

            {/* Water Intake Tracker */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Water Intake" icon={<WaterIcon />} />
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <MetricGauge value={waterIntake} max={8} color="#42a5f5" size={130} unit="/8" />
                  <Typography sx={{ fontWeight: 600, mt: 1, color: '#42a5f5' }}>{waterIntake} glasses</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Goal: 8 glasses</Typography>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                    <Button variant="outlined" size="small" onClick={() => setWaterIntake(Math.max(0, waterIntake - 1))}>-</Button>
                    <Button variant="contained" size="small" onClick={() => setWaterIntake(Math.min(12, waterIntake + 1))}>+ Add Glass</Button>
                  </Stack>
                </Box>
              </Card>
            </Grid>

            {/* Daily Mood Tracker */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="How are you feeling?" icon={<StressIcon />} />
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography sx={{ fontSize: 48, mb: 1 }}>
                    {['😞', '😕', '😐', '🙂', '😊'][dailyMood - 1]}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: 16, mb: 1 }}>
                    {['Poor', 'Not Great', 'Okay', 'Good', 'Excellent'][dailyMood - 1]}
                  </Typography>
                  <Rating value={dailyMood} onChange={(_, v) => v && setDailyMood(v)} size="large" sx={{ mb: 2 }} />
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                    Tracking mood helps identify patterns in your health
                  </Typography>
                </Box>
              </Card>
            </Grid>

            {/* Cancer Screening Schedule */}
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Screening Schedule" icon={<AssessIcon />}
                  action={<Chip label="2 Due" size="small" color="warning" />} />
                <Stack spacing={1.5}>
                  {[
                    { test: 'Colonoscopy', due: 'Mar 2026', status: 'upcoming', freq: 'Every 10 years' },
                    { test: 'Mammogram', due: 'Overdue', status: 'overdue', freq: 'Annual' },
                    { test: 'PSA Test', due: 'Jun 2026', status: 'scheduled', freq: 'Annual' },
                    { test: 'Lung CT Scan', due: 'Dec 2026', status: 'upcoming', freq: 'Annual' },
                    { test: 'Skin Check', due: 'Sep 2026', status: 'upcoming', freq: 'Annual' },
                  ].map((s, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderRadius: 1.5, '&:hover': { bgcolor: '#fafafa' } }}>
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{s.test}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{s.freq}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <StatusBadge status={s.status} />
                        <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.3 }}>{s.due}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={3}>
            {/* Activity Charts Placeholder */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Weekly Activity Overview" subtitle="Your activity trends over the past 7 days" />
                <Grid container spacing={2}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const h = [65, 78, 45, 82, 70, 55, 90][i];
                    return (
                      <Grid item xs key={day}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Box sx={{ height: 120, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', mb: 1 }}>
                            <Box sx={{
                              width: 28, height: `${h}%`, borderRadius: 2,
                              background: i === 6 ? 'linear-gradient(180deg, #1565c0, #5e92f3)' : '#e3f2fd',
                              transition: 'height 0.5s ease',
                            }} />
                          </Box>
                          <Typography sx={{ fontSize: 12, fontWeight: i === 6 ? 700 : 400, color: i === 6 ? '#1565c0' : 'text.secondary' }}>
                            {day}
                          </Typography>
                          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{Math.round(h * 120)}</Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={4} justifyContent="center">
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#1565c0' }}>48,293</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Total Steps</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#00897b' }}>12,840</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Calories Burned</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#7b1fa2' }}>49.2</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Sleep Hours</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#f57c00' }}>294</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Active Minutes</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            {/* Heart Rate Trend */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Heart Rate Trends" icon={<FavoriteIcon />} />
                <Stack spacing={2}>
                  {[
                    { label: 'Resting HR', value: '62 bpm', trend: 'down', change: '-3%' },
                    { label: 'Average HR', value: '72 bpm', trend: 'stable', change: '0%' },
                    { label: 'Peak HR', value: '142 bpm', trend: 'up', change: '+5%' },
                    { label: 'HR Variability', value: '45 ms', trend: 'up', change: '+8%' },
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 2, bgcolor: '#fafafa' }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{item.label}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{item.value}</Typography>
                        <Chip label={item.change} size="small" sx={{
                          height: 20, fontSize: 10, fontWeight: 700,
                          bgcolor: item.trend === 'down' ? '#e8f5e9' : item.trend === 'up' ? '#fff3e0' : '#f5f5f5',
                          color: item.trend === 'down' ? '#2e7d32' : item.trend === 'up' ? '#e65100' : '#757575',
                        }} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>

            {/* Sleep Analysis */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Sleep Analysis" icon={<SleepIcon />} />
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <MetricGauge value={82} color="#7e57c2" size={100} unit="%" />
                  <Typography sx={{ fontWeight: 600, mt: 1 }}>Sleep Quality Score</Typography>
                </Box>
                <Stack spacing={1.5}>
                  <ProgressCard title="Deep Sleep" value={1.8} max={3} color="#3f51b5" unit=" hrs" />
                  <ProgressCard title="Light Sleep" value={3.5} max={5} color="#7986cb" unit=" hrs" />
                  <ProgressCard title="REM Sleep" value={1.9} max={2.5} color="#9fa8da" unit=" hrs" />
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="AI-Powered Health Insights" subtitle="Personalized analysis based on your data" icon={<BrainIcon />} />
                <Grid container spacing={2}>
                  {[
                    { title: 'Risk Factor Analysis', desc: 'Your top 5 modifiable risk factors and how to address them.', color: '#1565c0', icon: <AssessIcon />, importance: 'High' },
                    { title: 'Biomarker Trends', desc: 'PSA levels have been stable for 6 months. Continue monitoring.', color: '#00897b', icon: <BiotechIcon />, importance: 'Medium' },
                    { title: 'Lifestyle Impact', desc: 'Increasing daily steps by 2000 could reduce cancer risk by 8%.', color: '#7b1fa2', icon: <RunIcon />, importance: 'High' },
                    { title: 'Genetic Risk Profile', desc: 'No high-risk genetic markers detected. Family history noted.', color: '#e91e63', icon: <BloodIcon />, importance: 'Low' },
                    { title: 'Diet Recommendations', desc: 'Consider increasing fiber and antioxidant-rich foods.', color: '#ff7043', icon: <FoodIcon />, importance: 'Medium' },
                    { title: 'Exercise Optimization', desc: 'Add 20 min of cardio 3x/week for optimal heart health.', color: '#66bb6a', icon: <FitnessIcon />, importance: 'Medium' },
                  ].map((insight, i) => (
                    <Grid item xs={12} md={6} key={i}>
                      <Box sx={{
                        p: 2.5, borderRadius: 3, border: `1px solid ${insight.color}20`,
                        bgcolor: `${insight.color}05`, transition: 'all 0.2s',
                        '&:hover': { bgcolor: `${insight.color}10`, transform: 'translateX(4px)' },
                      }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box sx={{
                            width: 44, height: 44, borderRadius: 2, bgcolor: `${insight.color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: insight.color, flexShrink: 0,
                          }}>
                            {insight.icon}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{insight.title}</Typography>
                              <Chip label={insight.importance} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700,
                                bgcolor: insight.importance === 'High' ? '#ffebee' : insight.importance === 'Medium' ? '#fff3e0' : '#e8f5e9',
                                color: insight.importance === 'High' ? '#c62828' : insight.importance === 'Medium' ? '#e65100' : '#2e7d32',
                              }} />
                            </Stack>
                            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{insight.desc}</Typography>
                          </Box>
                        </Stack>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Upcoming Events" icon={<CalendarIcon />} />
                <Stack spacing={2}>
                  {[
                    { title: 'Dr. Smith - Oncology Follow-up', date: 'Feb 25, 2026 - 10:00 AM', type: 'appointment', color: '#1565c0' },
                    { title: 'Blood Test - CBC Panel', date: 'Feb 28, 2026 - 8:00 AM', type: 'lab', color: '#00897b' },
                    { title: 'Colonoscopy Screening', date: 'Mar 15, 2026 - 7:00 AM', type: 'screening', color: '#7b1fa2' },
                    { title: 'Medication Review', date: 'Mar 20, 2026 - 3:00 PM', type: 'appointment', color: '#f57c00' },
                    { title: 'Annual Physical Exam', date: 'Apr 5, 2026 - 9:00 AM', type: 'checkup', color: '#e91e63' },
                  ].map((event, i) => (
                    <Box key={i} sx={{ p: 2, borderRadius: 2, border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 4, height: 50, borderRadius: 2, bgcolor: event.color }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{event.title}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{event.date}</Typography>
                      </Box>
                      <Chip label={event.type} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Reminders" icon={<NotifIcon />} />
                <Stack spacing={1.5}>
                  {[
                    { text: 'Take Omega-3 Fish Oil at 1:00 PM', priority: 'normal', time: 'In 2 hours' },
                    { text: 'Schedule mammogram appointment', priority: 'high', time: 'Overdue by 2 weeks' },
                    { text: 'Refill Metformin prescription', priority: 'high', time: 'Due in 3 days' },
                    { text: 'Upload last month blood test results', priority: 'normal', time: 'Pending' },
                    { text: 'Review AI risk assessment changes', priority: 'normal', time: 'New update available' },
                    { text: 'Update emergency contact information', priority: 'low', time: 'No rush' },
                  ].map((reminder, i) => (
                    <Alert key={i} severity={reminder.priority === 'high' ? 'warning' : reminder.priority === 'low' ? 'info' : 'success'}
                      sx={{ borderRadius: 2, py: 0.5, '& .MuiAlert-message': { width: '100%' } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{reminder.text}</Typography>
                        <Typography sx={{ fontSize: 10, color: 'text.secondary', whiteSpace: 'nowrap', ml: 1 }}>{reminder.time}</Typography>
                      </Stack>
                    </Alert>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Health ID Dialog */}
      <Dialog open={showHealthIdDialog} onClose={() => setShowHealthIdDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Your Health ID</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Box sx={{
              width: 200, height: 200, mx: 'auto', mb: 3,
              bgcolor: '#f5f5f5', borderRadius: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed #ddd',
            }}>
              <Typography sx={{ fontSize: 14, color: 'text.secondary' }}>QR Code</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1565c0', letterSpacing: 3, fontFamily: 'monospace', mb: 1 }}>
              {user?.health_id || 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 400, mx: 'auto' }}>
              Share this ID with healthcare providers to grant them access to your health records.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHealthIdDialog(false)}>Close</Button>
          <Button variant="outlined" startIcon={<ContentCopy />}>Copy ID</Button>
          <Button variant="contained" startIcon={<ShareIcon />}>Share</Button>
        </DialogActions>
      </Dialog>

      {/* Emergency SOS Dialog */}
      <Dialog open={showSOSDialog} onClose={() => setShowSOSDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#d32f2f' }}>Emergency SOS</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This will alert emergency services and your emergency contacts.
          </Alert>
          <Stack spacing={2}>
            <Button variant="contained" color="error" size="large" startIcon={<PhoneIcon />} fullWidth sx={{ py: 2, fontSize: 16, fontWeight: 700 }}>
              Call Emergency Services (911)
            </Button>
            <Button variant="outlined" color="error" size="large" fullWidth>
              Alert Emergency Contacts
            </Button>
            <Button variant="outlined" size="large" fullWidth>
              Share Location with Hospital
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSOSDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default PatientDashboard;

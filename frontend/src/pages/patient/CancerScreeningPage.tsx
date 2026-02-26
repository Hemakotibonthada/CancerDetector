// ============================================================================
// Cancer Screening Dashboard - Comprehensive screening management for patients
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, Avatar,
  LinearProgress, Tab, Tabs, Divider, IconButton, Paper, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Stepper, Step, StepLabel, StepContent, Tooltip, Badge, Switch,
  FormControlLabel, List, ListItem, ListItemText, ListItemAvatar,
  ListItemSecondaryAction, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Fade, Grow, Slide, CircularProgress, useTheme, alpha
} from '@mui/material';
import { keyframes } from '@mui/system';

// ============================================================================
// Animations
// ============================================================================

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.6); }
`;

const progressFill = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

const slideInUp = keyframes`
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const heartbeat = keyframes`
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.05); }
  50% { transform: scale(1); }
  75% { transform: scale(1.03); }
`;

// ============================================================================
// Types
// ============================================================================

interface ScreeningTest {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  lastDate: string | null;
  nextDueDate: string;
  frequency: string;
  status: 'completed' | 'due' | 'overdue' | 'scheduled' | 'not_applicable';
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  result?: string;
  recommendation: string;
  age_range: string;
  guidelines: string;
}

interface ScreeningHistory {
  id: string;
  test_name: string;
  date: string;
  provider: string;
  facility: string;
  result: string;
  status: 'normal' | 'abnormal' | 'inconclusive' | 'pending';
  follow_up_required: boolean;
  notes: string;
  report_url?: string;
}

interface RiskAssessment {
  cancer_type: string;
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  risk_score: number;
  factors: RiskFactor[];
  recommendations: string[];
  next_screening: string;
}

interface RiskFactor {
  name: string;
  category: 'genetic' | 'lifestyle' | 'environmental' | 'medical_history' | 'demographic';
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
  modifiable: boolean;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockScreenings: ScreeningTest[] = [
  {
    id: '1',
    name: 'Mammography',
    type: 'imaging',
    category: 'Breast Cancer',
    description: 'Digital mammogram for breast cancer screening',
    lastDate: '2023-06-15',
    nextDueDate: '2024-06-15',
    frequency: 'Annual',
    status: 'due',
    risk_level: 'moderate',
    result: 'BIRADS 1 - Normal',
    recommendation: 'Schedule annual mammogram',
    age_range: '40-74',
    guidelines: 'USPSTF recommends biennial screening for women aged 50-74',
  },
  {
    id: '2',
    name: 'Colonoscopy',
    type: 'procedure',
    category: 'Colorectal Cancer',
    description: 'Colon visualization for cancer and polyp detection',
    lastDate: '2020-03-10',
    nextDueDate: '2025-03-10',
    frequency: 'Every 5 years',
    status: 'completed',
    risk_level: 'low',
    result: 'No polyps detected',
    recommendation: 'Next screening in 2025',
    age_range: '45-75',
    guidelines: 'ACS recommends regular screening starting at age 45',
  },
  {
    id: '3',
    name: 'Pap Smear + HPV Test',
    type: 'lab',
    category: 'Cervical Cancer',
    description: 'Cervical cancer screening with HPV co-testing',
    lastDate: '2022-01-20',
    nextDueDate: '2024-01-20',
    frequency: 'Every 3 years',
    status: 'overdue',
    risk_level: 'moderate',
    result: 'Normal cytology, HPV negative',
    recommendation: 'Schedule screening - OVERDUE',
    age_range: '21-65',
    guidelines: 'ACOG recommends Pap + HPV co-testing every 5 years for ages 30-65',
  },
  {
    id: '4',
    name: 'Low-Dose CT Scan',
    type: 'imaging',
    category: 'Lung Cancer',
    description: 'Low-dose chest CT for lung cancer screening',
    lastDate: null,
    nextDueDate: '2024-04-01',
    frequency: 'Annual',
    status: 'not_applicable',
    risk_level: 'low',
    recommendation: 'Not recommended based on current risk profile',
    age_range: '50-80',
    guidelines: 'USPSTF recommends for adults 50-80 with 20+ pack-year smoking history',
  },
  {
    id: '5',
    name: 'PSA Blood Test',
    type: 'lab',
    category: 'Prostate Cancer',
    description: 'Prostate-specific antigen blood test',
    lastDate: '2023-09-01',
    nextDueDate: '2024-09-01',
    frequency: 'Annual',
    status: 'completed',
    risk_level: 'low',
    result: 'PSA: 1.2 ng/mL (normal)',
    recommendation: 'Continue annual monitoring',
    age_range: '55-69',
    guidelines: 'AUA recommends shared decision-making for ages 55-69',
  },
  {
    id: '6',
    name: 'Skin Cancer Screening',
    type: 'examination',
    category: 'Skin Cancer',
    description: 'Full-body skin examination by dermatologist',
    lastDate: '2023-04-12',
    nextDueDate: '2024-04-12',
    frequency: 'Annual',
    status: 'due',
    risk_level: 'moderate',
    result: 'No suspicious lesions',
    recommendation: 'Schedule annual skin check',
    age_range: 'All adults',
    guidelines: 'AAD recommends regular self-exams and periodic professional exams',
  },
  {
    id: '7',
    name: 'CA-125 Blood Test',
    type: 'lab',
    category: 'Ovarian Cancer',
    description: 'Cancer antigen 125 blood marker test',
    lastDate: '2023-11-15',
    nextDueDate: '2024-05-15',
    frequency: 'Every 6 months',
    status: 'scheduled',
    risk_level: 'high',
    result: 'CA-125: 28 U/mL (normal <35)',
    recommendation: 'Continue monitoring due to family history',
    age_range: 'High-risk individuals',
    guidelines: 'Recommended for high-risk individuals with family history',
  },
  {
    id: '8',
    name: 'Liver Ultrasound',
    type: 'imaging',
    category: 'Liver Cancer',
    description: 'Hepatic ultrasound for liver cancer screening',
    lastDate: '2023-08-20',
    nextDueDate: '2024-02-20',
    frequency: 'Every 6 months',
    status: 'overdue',
    risk_level: 'high',
    result: 'No focal lesions',
    recommendation: 'Schedule immediately - OVERDUE',
    age_range: 'High-risk individuals',
    guidelines: 'AASLD recommends biannual screening for high-risk patients',
  },
];

const mockHistory: ScreeningHistory[] = [
  {
    id: '1',
    test_name: 'Mammography',
    date: '2023-06-15',
    provider: 'Dr. Sarah Chen',
    facility: 'Memorial Cancer Center',
    result: 'BIRADS 1 - Normal',
    status: 'normal',
    follow_up_required: false,
    notes: 'No suspicious findings. Continue routine screening.',
  },
  {
    id: '2',
    test_name: 'PSA Blood Test',
    date: '2023-09-01',
    provider: 'Dr. James Wilson',
    facility: 'City Medical Lab',
    result: 'PSA: 1.2 ng/mL',
    status: 'normal',
    follow_up_required: false,
    notes: 'Within normal range. Annual follow-up recommended.',
  },
  {
    id: '3',
    test_name: 'CA-125 Blood Test',
    date: '2023-11-15',
    provider: 'Dr. Maria Garcia',
    facility: 'Oncology Associates',
    result: 'CA-125: 28 U/mL',
    status: 'normal',
    follow_up_required: true,
    notes: 'Normal range but monitoring due to BRCA1 mutation.',
  },
  {
    id: '4',
    test_name: 'Skin Examination',
    date: '2023-04-12',
    provider: 'Dr. Emily Park',
    facility: 'Dermatology Clinic',
    result: 'No suspicious lesions',
    status: 'normal',
    follow_up_required: false,
    notes: 'Two benign nevi noted; no changes from prior exam.',
  },
  {
    id: '5',
    test_name: 'Liver Ultrasound',
    date: '2023-08-20',
    provider: 'Dr. Robert Kim',
    facility: 'Memorial Cancer Center',
    result: 'No focal lesions',
    status: 'normal',
    follow_up_required: true,
    notes: 'Continue biannual monitoring due to Hepatitis B carrier status.',
  },
];

const mockRiskAssessments: RiskAssessment[] = [
  {
    cancer_type: 'Breast Cancer',
    risk_level: 'moderate',
    risk_score: 42,
    factors: [
      { name: 'Family history of breast cancer', category: 'genetic', impact: 'negative', description: 'Mother diagnosed at age 52', modifiable: false },
      { name: 'BRCA1 mutation carrier', category: 'genetic', impact: 'negative', description: 'Confirmed genetic variant', modifiable: false },
      { name: 'Regular exercise', category: 'lifestyle', impact: 'positive', description: '150+ min/week moderate activity', modifiable: true },
      { name: 'Healthy BMI', category: 'lifestyle', impact: 'positive', description: 'BMI 23.5 - normal range', modifiable: true },
    ],
    recommendations: [
      'Annual mammography starting at age 30',
      'Consider breast MRI as supplemental screening',
      'Discuss risk-reducing options with oncologist',
      'Continue regular self-examinations',
    ],
    next_screening: '2024-06-15',
  },
  {
    cancer_type: 'Colorectal Cancer',
    risk_level: 'low',
    risk_score: 15,
    factors: [
      { name: 'No family history', category: 'genetic', impact: 'positive', description: 'No first-degree relatives affected', modifiable: false },
      { name: 'High-fiber diet', category: 'lifestyle', impact: 'positive', description: '30g+ fiber daily', modifiable: true },
      { name: 'Age factor', category: 'demographic', impact: 'neutral', description: 'Age 45 - screening age', modifiable: false },
    ],
    recommendations: [
      'Colonoscopy every 10 years (low risk)',
      'FIT test annually as alternative',
      'Maintain healthy diet and exercise',
    ],
    next_screening: '2025-03-10',
  },
  {
    cancer_type: 'Ovarian Cancer',
    risk_level: 'high',
    risk_score: 68,
    factors: [
      { name: 'BRCA1 mutation', category: 'genetic', impact: 'negative', description: 'Lifetime risk 39-46%', modifiable: false },
      { name: 'Family history', category: 'genetic', impact: 'negative', description: 'Sister diagnosed at age 42', modifiable: false },
      { name: 'Oral contraceptive use', category: 'medical_history', impact: 'positive', description: '5+ years use reduces risk', modifiable: true },
    ],
    recommendations: [
      'CA-125 every 6 months',
      'Transvaginal ultrasound every 6 months',
      'Discuss risk-reducing salpingo-oophorectomy',
      'Genetic counseling for family members',
    ],
    next_screening: '2024-05-15',
  },
  {
    cancer_type: 'Lung Cancer',
    risk_level: 'low',
    risk_score: 8,
    factors: [
      { name: 'Never smoker', category: 'lifestyle', impact: 'positive', description: 'No tobacco use history', modifiable: true },
      { name: 'Low radon exposure', category: 'environmental', impact: 'positive', description: 'Home tested - safe levels', modifiable: true },
    ],
    recommendations: [
      'No lung cancer screening indicated at this time',
      'Continue avoiding tobacco products',
      'Monitor radon levels in home',
    ],
    next_screening: 'Not recommended',
  },
  {
    cancer_type: 'Skin Cancer',
    risk_level: 'moderate',
    risk_score: 35,
    factors: [
      { name: 'Fair skin', category: 'demographic', impact: 'negative', description: 'Fitzpatrick skin type II', modifiable: false },
      { name: 'History of sunburns', category: 'lifestyle', impact: 'negative', description: '3+ blistering sunburns in childhood', modifiable: false },
      { name: 'Regular sunscreen use', category: 'lifestyle', impact: 'positive', description: 'Daily SPF 50+ application', modifiable: true },
      { name: 'Multiple moles', category: 'medical_history', impact: 'negative', description: '50+ common nevi', modifiable: false },
    ],
    recommendations: [
      'Annual full-body skin examination',
      'Monthly self-examinations using ABCDE criteria',
      'Continue sun protection measures',
      'Photograph existing moles for monitoring',
    ],
    next_screening: '2024-04-12',
  },
];

// ============================================================================
// Helper Components
// ============================================================================

const StatusChip: React.FC<{ status: ScreeningTest['status'] }> = ({ status }) => {
  const config: Record<string, { color: any; label: string }> = {
    completed: { color: 'success', label: 'Completed' },
    due: { color: 'warning', label: 'Due Soon' },
    overdue: { color: 'error', label: 'Overdue' },
    scheduled: { color: 'info', label: 'Scheduled' },
    not_applicable: { color: 'default', label: 'Not Applicable' },
  };
  const c = config[status] || config.completed;
  return <Chip size="small" color={c.color} label={c.label} sx={{ fontWeight: 600 }} />;
};

const RiskBadge: React.FC<{ level: string; score?: number }> = ({ level, score }) => {
  const colors: Record<string, string> = {
    low: '#4caf50',
    moderate: '#ff9800',
    high: '#f44336',
    very_high: '#9c27b0',
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: 12, height: 12, borderRadius: '50%',
        backgroundColor: colors[level] || '#9e9e9e',
        animation: level === 'high' || level === 'very_high' ? `${heartbeat} 2s infinite` : 'none',
      }} />
      <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
        {level.replace('_', ' ')} Risk
      </Typography>
      {score !== undefined && (
        <Typography variant="caption" color="text.secondary">
          ({score}%)
        </Typography>
      )}
    </Box>
  );
};

const CircularProgressWithLabel: React.FC<{ value: number; color: string }> = ({ value, color }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CircularProgress
      variant="determinate"
      value={value}
      size={80}
      thickness={4}
      sx={{ color }}
    />
    <Box sx={{
      position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Typography variant="h6" fontWeight={700} color={color}>
        {Math.round(value)}%
      </Typography>
    </Box>
  </Box>
);

// ============================================================================
// Tab Panel
// ============================================================================

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const CancerScreeningPage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [screenings] = useState<ScreeningTest[]>(mockScreenings);
  const [history] = useState<ScreeningHistory[]>(mockHistory);
  const [riskAssessments] = useState<RiskAssessment[]>(mockRiskAssessments);
  const [selectedScreening, setSelectedScreening] = useState<ScreeningTest | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showReminders, setShowReminders] = useState(true);

  // Statistics calculations
  const completedCount = screenings.filter(s => s.status === 'completed').length;
  const dueCount = screenings.filter(s => s.status === 'due').length;
  const overdueCount = screenings.filter(s => s.status === 'overdue').length;
  const scheduledCount = screenings.filter(s => s.status === 'scheduled').length;
  const complianceRate = Math.round((completedCount / screenings.filter(s => s.status !== 'not_applicable').length) * 100);

  const categories = ['all', ...Array.from(new Set(screenings.map(s => s.category)))];
  const filteredScreenings = filterCategory === 'all' ? screenings : screenings.filter(s => s.category === filterCategory);

  const handleSchedule = useCallback(() => {
    setScheduleDialogOpen(false);
    setSelectedDate('');
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Page Header */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom
            sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Cancer Screening Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your cancer screenings, view risk assessments, and stay on schedule with recommended tests.
          </Typography>
        </Box>
      </Fade>

      {/* Alert for Overdue Screenings */}
      {overdueCount > 0 && (
        <Grow in timeout={800}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, animation: `${pulseGlow} 3s infinite` }}>
            <Typography fontWeight={600}>
              You have {overdueCount} overdue screening{overdueCount > 1 ? 's' : ''}!
            </Typography>
            <Typography variant="body2">
              Please schedule your overdue screenings as soon as possible to maintain your cancer prevention plan.
            </Typography>
          </Alert>
        </Grow>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Compliance Rate', value: `${complianceRate}%`, color: complianceRate >= 80 ? '#4caf50' : '#ff9800', icon: '📊' },
          { label: 'Completed', value: completedCount, color: '#4caf50', icon: '✅' },
          { label: 'Due Soon', value: dueCount, color: '#ff9800', icon: '📅' },
          { label: 'Overdue', value: overdueCount, color: '#f44336', icon: '⚠️' },
          { label: 'Scheduled', value: scheduledCount, color: '#2196f3', icon: '🔄' },
        ].map((stat, idx) => (
          <Grid item xs={6} md={2.4} key={idx}>
            <Grow in timeout={400 + idx * 100}>
              <Card sx={{
                textAlign: 'center', borderTop: `3px solid ${stat.color}`,
                transition: 'all 0.3s ease',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha(stat.color, 0.3)}` },
              }}>
                <CardContent>
                  <Typography fontSize={28}>{stat.icon}</Typography>
                  <Typography variant="h4" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Screening Schedule" />
          <Tab label={<Badge badgeContent={overdueCount} color="error">Risk Assessment</Badge>} />
          <Tab label="History" />
          <Tab label="Guidelines" />
        </Tabs>
      </Paper>

      {/* Tab 0: Screening Schedule */}
      <TabPanel value={activeTab} index={0}>
        {/* Category Filter */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <Chip
              key={cat}
              label={cat === 'all' ? 'All Screenings' : cat}
              onClick={() => setFilterCategory(cat)}
              variant={filterCategory === cat ? 'filled' : 'outlined'}
              color={filterCategory === cat ? 'primary' : 'default'}
              sx={{ textTransform: 'capitalize', fontWeight: filterCategory === cat ? 700 : 400 }}
            />
          ))}
        </Box>

        {/* Reminder Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControlLabel
            control={<Switch checked={showReminders} onChange={(_, v) => setShowReminders(v)} />}
            label="Show reminders"
          />
        </Box>

        {/* Screening Cards */}
        <Grid container spacing={3}>
          {filteredScreenings.map((screening, idx) => (
            <Grid item xs={12} md={6} key={screening.id}>
              <Grow in timeout={300 + idx * 100}>
                <Card sx={{
                  cursor: 'pointer', transition: 'all 0.3s ease', borderRadius: 2,
                  borderLeft: `4px solid ${
                    screening.status === 'overdue' ? '#f44336' :
                    screening.status === 'due' ? '#ff9800' :
                    screening.status === 'completed' ? '#4caf50' :
                    screening.status === 'scheduled' ? '#2196f3' : '#9e9e9e'
                  }`,
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: theme.shadows[6] },
                  animation: screening.status === 'overdue' ? `${slideInUp} 0.5s ease-out` : 'none',
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>{screening.name}</Typography>
                        <Chip label={screening.category} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                      </Box>
                      <StatusChip status={screening.status} />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {screening.description}
                    </Typography>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Last Screening</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {screening.lastDate || 'Never performed'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Next Due</Typography>
                        <Typography variant="body2" fontWeight={600} color={
                          screening.status === 'overdue' ? 'error.main' :
                          screening.status === 'due' ? 'warning.main' : 'text.primary'
                        }>
                          {screening.nextDueDate}
                        </Typography>
                      </Grid>
                    </Grid>

                    {screening.result && (
                      <Alert severity="info" sx={{ mb: 2, '& .MuiAlert-message': { width: '100%' } }}>
                        <Typography variant="body2" fontWeight={600}>Last Result: {screening.result}</Typography>
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <RiskBadge level={screening.risk_level} />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" onClick={() => setSelectedScreening(screening)}>
                          Details
                        </Button>
                        {(screening.status === 'due' || screening.status === 'overdue') && (
                          <Button size="small" variant="contained" onClick={() => {
                            setSelectedScreening(screening);
                            setScheduleDialogOpen(true);
                          }}
                          sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                            Schedule
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab 1: Risk Assessment */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {/* Overall Risk Summary */}
          <Grid item xs={12}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent sx={{ py: 4 }}>
                <Typography variant="h5" fontWeight={700} gutterBottom>Your Cancer Risk Profile</Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                  Based on your genetic testing, family history, lifestyle factors, and medical history.
                </Typography>
                <Grid container spacing={3}>
                  {riskAssessments.map((ra, idx) => (
                    <Grid item xs={6} md={2.4} key={idx}>
                      <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' }}>
                        <CircularProgressWithLabel value={ra.risk_score} color="white" />
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>{ra.cancer_type}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Individual Risk Assessments */}
          {riskAssessments.map((assessment, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Fade in timeout={400 + idx * 150}>
                <Card sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700}>{assessment.cancer_type}</Typography>
                      <RiskBadge level={assessment.risk_level} score={assessment.risk_score} />
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={assessment.risk_score}
                      sx={{
                        mb: 3, height: 8, borderRadius: 4,
                        backgroundColor: alpha(
                          assessment.risk_level === 'high' ? '#f44336' :
                          assessment.risk_level === 'moderate' ? '#ff9800' : '#4caf50', 0.15
                        ),
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor:
                            assessment.risk_level === 'high' ? '#f44336' :
                            assessment.risk_level === 'moderate' ? '#ff9800' : '#4caf50',
                        },
                      }}
                    />

                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Risk Factors</Typography>
                    <List dense>
                      {assessment.factors.map((factor, fi) => (
                        <ListItem key={fi} disableGutters sx={{ py: 0.5 }}>
                          <ListItemAvatar sx={{ minWidth: 36 }}>
                            <Typography fontSize={16}>
                              {factor.impact === 'positive' ? '🟢' : factor.impact === 'negative' ? '🔴' : '🟡'}
                            </Typography>
                          </ListItemAvatar>
                          <ListItemText
                            primary={factor.name}
                            secondary={factor.description}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          {factor.modifiable && (
                            <Tooltip title="Modifiable factor - you can reduce this risk">
                              <Chip label="Modifiable" size="small" color="info" variant="outlined" />
                            </Tooltip>
                          )}
                        </ListItem>
                      ))}
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>Recommendations</Typography>
                    {assessment.recommendations.map((rec, ri) => (
                      <Typography key={ri} variant="body2" color="text.secondary" sx={{ mb: 0.5, display: 'flex', gap: 1 }}>
                        <span>•</span> {rec}
                      </Typography>
                    ))}

                    <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                      <Typography variant="body2" fontWeight={600}>
                        Next Screening: {assessment.next_screening}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab 2: History */}
      <TabPanel value={activeTab} index={2}>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                <TableCell sx={{ fontWeight: 700 }}>Test Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Facility</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Result</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Follow-up</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((record, idx) => (
                <Fade in timeout={200 + idx * 100} key={record.id}>
                  <TableRow hover sx={{ '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{record.test_name}</Typography>
                    </TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>{record.provider}</TableCell>
                    <TableCell>{record.facility}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{record.result}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={record.status}
                        color={record.status === 'normal' ? 'success' : record.status === 'abnormal' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>
                      {record.follow_up_required ? (
                        <Chip size="small" label="Required" color="warning" variant="outlined" />
                      ) : (
                        <Chip size="small" label="None" color="success" variant="outlined" />
                      )}
                    </TableCell>
                  </TableRow>
                </Fade>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Notes & Observations</Typography>
          {history.map(record => (
            <Accordion key={record.id} sx={{ mb: 1 }}>
              <AccordionSummary>
                <Typography fontWeight={600}>{record.test_name} - {record.date}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">{record.notes}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </TabPanel>

      {/* Tab 3: Screening Guidelines */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography fontWeight={600}>About Cancer Screening Guidelines</Typography>
              <Typography variant="body2">
                These are general guidelines from major medical organizations. Your personalized screening 
                plan may differ based on your individual risk factors. Always consult with your healthcare provider.
              </Typography>
            </Alert>
          </Grid>

          {[
            {
              title: 'Breast Cancer Screening',
              organization: 'USPSTF / ACS',
              guidelines: [
                'Women 40-44: Option to start annual mammography',
                'Women 45-54: Annual mammography',
                'Women 55+: Switch to every 2 years, or continue annual',
                'High-risk women: Add breast MRI to mammography',
                'BRCA carriers: Start screening at age 25-30',
              ],
            },
            {
              title: 'Colorectal Cancer Screening',
              organization: 'ACS / USPSTF',
              guidelines: [
                'Start at age 45 for average risk',
                'Colonoscopy every 10 years, or',
                'FIT test every year, or',
                'Stool DNA test every 3 years',
                'Higher risk: Start earlier, more frequent',
              ],
            },
            {
              title: 'Cervical Cancer Screening',
              organization: 'ACOG / USPSTF',
              guidelines: [
                'Ages 21-29: Pap test every 3 years',
                'Ages 30-65: Pap + HPV co-testing every 5 years',
                'Alternatively: Pap test alone every 3 years',
                'After 65: May stop if adequate prior screening',
                'HPV vaccination recommended through age 26',
              ],
            },
            {
              title: 'Lung Cancer Screening',
              organization: 'USPSTF',
              guidelines: [
                'Ages 50-80 with 20+ pack-year smoking history',
                'Currently smoke or quit within past 15 years',
                'Annual low-dose CT scan',
                'Discuss benefits and risks with your doctor',
                'Not recommended for non-smokers',
              ],
            },
            {
              title: 'Prostate Cancer Screening',
              organization: 'AUA / USPSTF',
              guidelines: [
                'Ages 55-69: Shared decision making with doctor',
                'PSA blood test with or without digital rectal exam',
                'High risk (AA/family history): Discuss at age 40-45',
                'Over 70: Generally not recommended',
                'Discuss benefits and harms of screening',
              ],
            },
            {
              title: 'Skin Cancer Screening',
              organization: 'AAD',
              guidelines: [
                'Monthly skin self-examinations',
                'Annual full-body exam by dermatologist',
                'Use ABCDE criteria for mole evaluation',
                'Report any new or changing moles immediately',
                'Extra vigilance for fair-skinned individuals',
              ],
            },
          ].map((guideline, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Grow in timeout={300 + idx * 100}>
                <Card sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700}>{guideline.title}</Typography>
                      <Chip label={guideline.organization} size="small" color="primary" variant="outlined" />
                    </Box>
                    <List dense>
                      {guideline.guidelines.map((g, gi) => (
                        <ListItem key={gi} disableGutters>
                          <ListItemAvatar sx={{ minWidth: 32 }}>
                            <Typography color="primary" fontWeight={700}>•</Typography>
                          </ListItemAvatar>
                          <ListItemText primary={g} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Schedule {selectedScreening?.name}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedScreening && (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Recommendation:</strong> {selectedScreening.recommendation}
                  </Typography>
                </Alert>

                <TextField
                  label="Preferred Date"
                  type="date"
                  fullWidth
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Preferred Time"
                  type="time"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Preferred Facility"
                  fullWidth
                  defaultValue="Memorial Cancer Center"
                  sx={{ mb: 2 }}
                />

                <TextField
                  label="Notes for Provider"
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Any special requirements or concerns..."
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSchedule}
            sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            Request Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!selectedScreening && !scheduleDialogOpen} onClose={() => setSelectedScreening(null)} maxWidth="md" fullWidth>
        {selectedScreening && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={700}>{selectedScreening.name}</Typography>
                <StatusChip status={selectedScreening.status} />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedScreening.category}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {selectedScreening.type}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedScreening.description}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Last Performed</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedScreening.lastDate || 'Never'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Next Due</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedScreening.nextDueDate}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Frequency</Typography>
                  <Typography variant="body1">{selectedScreening.frequency}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Recommended Age Range</Typography>
                  <Typography variant="body1">{selectedScreening.age_range}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Guidelines</Typography>
                  <Typography variant="body2">{selectedScreening.guidelines}</Typography>
                </Grid>
                {selectedScreening.result && (
                  <Grid item xs={12}>
                    <Alert severity="success">
                      <Typography fontWeight={600}>Last Result: {selectedScreening.result}</Typography>
                    </Alert>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <RiskBadge level={selectedScreening.risk_level} />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setSelectedScreening(null)}>Close</Button>
              {(selectedScreening.status === 'due' || selectedScreening.status === 'overdue') && (
                <Button variant="contained" onClick={() => setScheduleDialogOpen(true)}
                  sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  Schedule Now
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default CancerScreeningPage;

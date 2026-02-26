// ============================================================================
// Research & Clinical Trials Page - For patients to browse and enroll in trials
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, Avatar,
  LinearProgress, Tab, Tabs, Divider, Paper, Alert, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, ListItemAvatar, ListItemIcon,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Fade, Grow, CircularProgress, useTheme, alpha, InputAdornment,
  Accordion, AccordionSummary, AccordionDetails, Stepper, Step,
  StepLabel, StepContent, Tooltip, Select, MenuItem, FormControl,
  InputLabel, Pagination
} from '@mui/material';
import { keyframes } from '@mui/system';

// ============================================================================
// Animations
// ============================================================================

const fadeInScale = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// ============================================================================
// Types
// ============================================================================

interface ClinicalTrial {
  id: string;
  nctId: string;
  title: string;
  shortTitle: string;
  sponsor: string;
  phase: string;
  status: 'recruiting' | 'active' | 'completed' | 'suspended' | 'not_yet_recruiting';
  cancerType: string[];
  description: string;
  eligibility: {
    minAge: number;
    maxAge: number;
    gender: string;
    criteria: string[];
    exclusions: string[];
  };
  locations: TrialLocation[];
  startDate: string;
  estimatedEndDate: string;
  enrollment: {
    target: number;
    current: number;
  };
  primaryOutcome: string;
  interventions: string[];
  contactName: string;
  contactEmail: string;
  matchScore?: number;
}

interface TrialLocation {
  facility: string;
  city: string;
  state: string;
  distance?: number;
}

interface EnrolledTrial {
  trial: ClinicalTrial;
  enrollmentDate: string;
  status: 'screening' | 'active' | 'follow_up' | 'completed' | 'withdrawn';
  nextVisit: string;
  visits: number;
  totalVisits: number;
}

// ============================================================================
// Mock Data
// ============================================================================

const mockTrials: ClinicalTrial[] = [
  {
    id: '1', nctId: 'NCT05123456',
    title: 'A Phase III Randomized Study of Pembrolizumab Plus Chemotherapy vs Chemotherapy Alone in Previously Untreated Advanced Triple-Negative Breast Cancer',
    shortTitle: 'KEYNOTE-756: Pembrolizumab + Chemo for TNBC',
    sponsor: 'Merck Sharp & Dohme',
    phase: 'Phase III',
    status: 'recruiting',
    cancerType: ['Breast Cancer', 'Triple-Negative Breast Cancer'],
    description: 'This study evaluates the efficacy and safety of pembrolizumab combined with standard chemotherapy compared to chemotherapy alone in participants with previously untreated, advanced triple-negative breast cancer (TNBC).',
    eligibility: {
      minAge: 18, maxAge: 80, gender: 'Female',
      criteria: ['Histologically confirmed TNBC', 'ECOG performance status 0-1', 'Adequate organ function', 'No prior systemic treatment for advanced disease'],
      exclusions: ['Active autoimmune disease', 'Prior anti-PD-1/PD-L1 therapy', 'Active CNS metastases', 'Pregnant or breastfeeding'],
    },
    locations: [
      { facility: 'Memorial Cancer Center', city: 'San Francisco', state: 'CA', distance: 5 },
      { facility: 'Stanford Cancer Institute', city: 'Palo Alto', state: 'CA', distance: 32 },
    ],
    startDate: '2023-06-01', estimatedEndDate: '2026-12-31',
    enrollment: { target: 850, current: 423 },
    primaryOutcome: 'Progression-Free Survival (PFS)',
    interventions: ['Pembrolizumab 200mg IV Q3W', 'Nab-paclitaxel + Carboplatin'],
    contactName: 'Dr. Lisa Wang', contactEmail: 'trials@memorialcancer.org',
    matchScore: 92,
  },
  {
    id: '2', nctId: 'NCT05234567',
    title: 'Evaluating the Efficacy of a Novel PARP Inhibitor XR-204 in BRCA-Mutated Ovarian Cancer',
    shortTitle: 'NOVA-OC: XR-204 PARP Inhibitor for Ovarian Cancer',
    sponsor: 'XenoResearch Pharmaceuticals',
    phase: 'Phase II',
    status: 'recruiting',
    cancerType: ['Ovarian Cancer'],
    description: 'A multicenter, open-label Phase II study evaluating XR-204, a next-generation PARP inhibitor, in patients with BRCA1/2-mutated advanced ovarian cancer who have received 1-2 prior lines of therapy.',
    eligibility: {
      minAge: 18, maxAge: 75, gender: 'Female',
      criteria: ['Confirmed BRCA1/2 germline or somatic mutation', 'High-grade serous ovarian cancer', '1-2 prior lines of platinum-based therapy', 'Measurable disease per RECIST 1.1'],
      exclusions: ['Prior PARP inhibitor therapy', 'Active brain metastases', 'Myelodysplastic syndrome', 'Severe hepatic impairment'],
    },
    locations: [
      { facility: 'Oncology Associates Medical Group', city: 'San Jose', state: 'CA', distance: 48 },
    ],
    startDate: '2023-09-15', estimatedEndDate: '2025-09-15',
    enrollment: { target: 200, current: 87 },
    primaryOutcome: 'Objective Response Rate (ORR)',
    interventions: ['XR-204 300mg oral daily'],
    contactName: 'Dr. Amanda Foster', contactEmail: 'xr204trial@xenoresearch.com',
    matchScore: 78,
  },
  {
    id: '3', nctId: 'NCT05345678',
    title: 'CAR-T Cell Therapy for Relapsed/Refractory B-Cell Non-Hodgkin Lymphoma: A Phase I/II Study',
    shortTitle: 'CART-NHL: CAR-T for Non-Hodgkin Lymphoma',
    sponsor: 'National Cancer Institute',
    phase: 'Phase I/II',
    status: 'recruiting',
    cancerType: ['Non-Hodgkin Lymphoma', 'B-Cell Lymphoma'],
    description: 'This first-in-human study evaluates the safety and preliminary efficacy of a novel dual-targeting CAR-T cell therapy in patients with relapsed or refractory B-cell non-Hodgkin lymphoma after two or more lines of therapy.',
    eligibility: {
      minAge: 18, maxAge: 70, gender: 'All',
      criteria: ['CD19+ and CD20+ B-cell NHL', '≥2 prior lines of systemic therapy', 'ECOG 0-1', 'Adequate bone marrow function'],
      exclusions: ['Prior CAR-T therapy', 'Active GVHD', 'Uncontrolled infection', 'CNS lymphoma'],
    },
    locations: [
      { facility: 'UCSF Helen Diller Cancer Center', city: 'San Francisco', state: 'CA', distance: 3 },
    ],
    startDate: '2024-01-10', estimatedEndDate: '2027-01-10',
    enrollment: { target: 60, current: 12 },
    primaryOutcome: 'Dose-Limiting Toxicities (Phase I), Complete Response Rate (Phase II)',
    interventions: ['Anti-CD19/CD20 dual CAR-T cells'],
    contactName: 'Dr. Michael Roberts', contactEmail: 'cartcell@ucsf.edu',
    matchScore: 45,
  },
  {
    id: '4', nctId: 'NCT05456789',
    title: 'Artificial Intelligence-Guided Adaptive Radiation Therapy for Locally Advanced Lung Cancer',
    shortTitle: 'AI-ART: AI-Guided Radiation for Lung Cancer',
    sponsor: 'RadiOncology Research Consortium',
    phase: 'Phase II',
    status: 'active',
    cancerType: ['Lung Cancer', 'Non-Small Cell Lung Cancer'],
    description: 'A prospective study evaluating AI-guided adaptive radiation therapy planning versus standard radiation therapy in patients with locally advanced non-small cell lung cancer. The AI system adjusts treatment plans in real-time based on daily imaging.',
    eligibility: {
      minAge: 18, maxAge: 85, gender: 'All',
      criteria: ['Stage III NSCLC', 'Planned for definitive chemoradiation', 'ECOG 0-2', 'No prior thoracic radiation'],
      exclusions: ['Contraindication to radiation', 'Active interstitial lung disease', 'Pacemaker incompatible with daily CBCT'],
    },
    locations: [
      { facility: 'Memorial Cancer Center', city: 'San Francisco', state: 'CA', distance: 5 },
      { facility: 'UCLA Jonsson Cancer Center', city: 'Los Angeles', state: 'CA', distance: 340 },
    ],
    startDate: '2023-03-01', estimatedEndDate: '2025-12-31',
    enrollment: { target: 300, current: 198 },
    primaryOutcome: 'Local Control Rate at 12 months',
    interventions: ['AI-adaptive RT (60 Gy/30 fractions)', 'Standard RT (60 Gy/30 fractions)'],
    contactName: 'Dr. Sarah Kim', contactEmail: 'aiart@radonc.org',
    matchScore: 35,
  },
  {
    id: '5', nctId: 'NCT05567890',
    title: 'Liquid Biopsy-Guided Minimal Residual Disease Monitoring After Curative Surgery for Stage II-III Colorectal Cancer',
    shortTitle: 'ctDNA-MRD: Liquid Biopsy for Colorectal Cancer Follow-up',
    sponsor: 'Genomics Health Institute',
    phase: 'Observational',
    status: 'recruiting',
    cancerType: ['Colorectal Cancer'],
    description: 'An observational study evaluating circulating tumor DNA (ctDNA) as a biomarker for minimal residual disease detection and treatment response monitoring in patients with stage II-III colorectal cancer who have undergone curative-intent surgery.',
    eligibility: {
      minAge: 18, maxAge: 90, gender: 'All',
      criteria: ['Stage II-III CRC after curative surgery', 'Available tumor tissue for sequencing', 'Willingness for serial blood draws', 'No evidence of distant metastases'],
      exclusions: ['Prior malignancy within 5 years', 'Inflammatory bowel disease', 'Coagulopathy preventing blood draws'],
    },
    locations: [
      { facility: 'Kaiser Permanente Medical Center', city: 'Oakland', state: 'CA', distance: 15 },
      { facility: 'Cedars-Sinai Medical Center', city: 'Los Angeles', state: 'CA', distance: 340 },
    ],
    startDate: '2023-11-01', estimatedEndDate: '2028-11-01',
    enrollment: { target: 500, current: 156 },
    primaryOutcome: 'Sensitivity and specificity of ctDNA for detecting recurrence',
    interventions: ['Serial ctDNA blood testing (every 3 months)'],
    contactName: 'Dr. Jennifer Lee', contactEmail: 'ctdna@genomicshealth.org',
    matchScore: 62,
  },
];

const mockEnrolled: EnrolledTrial[] = [
  {
    trial: mockTrials[0],
    enrollmentDate: '2023-12-01',
    status: 'active',
    nextVisit: '2024-02-15',
    visits: 4,
    totalVisits: 18,
  },
];

// ============================================================================
// Sub Components
// ============================================================================

const TrialStatusChip: React.FC<{ status: ClinicalTrial['status'] }> = ({ status }) => {
  const config: Record<string, { color: any; label: string }> = {
    recruiting: { color: 'success', label: 'Recruiting' },
    active: { color: 'info', label: 'Active' },
    completed: { color: 'default', label: 'Completed' },
    suspended: { color: 'warning', label: 'Suspended' },
    not_yet_recruiting: { color: 'secondary', label: 'Not Yet Recruiting' },
  };
  const c = config[status] || config.active;
  return <Chip size="small" color={c.color} label={c.label} sx={{ fontWeight: 600 }} />;
};

const MatchScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 80 ? '#4caf50' : score >= 60 ? '#ff9800' : score >= 40 ? '#2196f3' : '#9e9e9e';
  return (
    <Tooltip title={`${score}% match based on your profile`}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        px: 1.5, py: 0.5, borderRadius: 2,
        background: alpha(color, 0.12), border: `1px solid ${alpha(color, 0.3)}`,
      }}>
        <Typography variant="body2" fontWeight={700} color={color}>{score}%</Typography>
        <Typography variant="caption" color="text.secondary">match</Typography>
      </Box>
    </Tooltip>
  );
};

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// ============================================================================
// Main Component  
// ============================================================================

const ResearchTrialsPage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [selectedCancerType, setSelectedCancerType] = useState('all');
  const [selectedTrial, setSelectedTrial] = useState<ClinicalTrial | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Filter trials
  const filteredTrials = useMemo(() => {
    return mockTrials.filter(trial => {
      const matchesSearch = searchQuery === '' ||
        trial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trial.nctId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trial.cancerType.some(ct => ct.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPhase = selectedPhase === 'all' || trial.phase.toLowerCase().includes(selectedPhase.toLowerCase());
      const matchesCancer = selectedCancerType === 'all' || trial.cancerType.some(ct => ct.toLowerCase().includes(selectedCancerType.toLowerCase()));
      return matchesSearch && matchesPhase && matchesCancer;
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [searchQuery, selectedPhase, selectedCancerType]);

  const cancerTypes = Array.from(new Set(mockTrials.flatMap(t => t.cancerType)));
  const phases = ['Phase I', 'Phase I/II', 'Phase II', 'Phase III', 'Observational'];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Fade in timeout={600}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom
            sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Research & Clinical Trials
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse clinical trials matched to your profile, track enrolled studies, and learn about the latest cancer research.
          </Typography>
        </Box>
      </Fade>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Available Trials', value: mockTrials.length, color: '#667eea', icon: '🔬' },
          { label: 'Recruiting Near You', value: mockTrials.filter(t => t.status === 'recruiting').length, color: '#4caf50', icon: '📍' },
          { label: 'Your Match Score', value: '92%', color: '#ff9800', icon: '⭐' },
          { label: 'Enrolled', value: mockEnrolled.length, color: '#764ba2', icon: '📋' },
        ].map((stat, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Grow in timeout={400 + idx * 100}>
              <Card sx={{
                textAlign: 'center', transition: 'all 0.3s ease',
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
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Find Trials" />
          <Tab label="My Trials" />
          <Tab label="Saved" />
          <Tab label="Research News" />
        </Tabs>
      </Paper>

      {/* Tab 0: Find Trials */}
      <TabPanel value={activeTab} index={0}>
        {/* Search & Filters */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth placeholder="Search by keyword, NCT ID, or cancer type..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Phase</InputLabel>
                <Select value={selectedPhase} label="Phase" onChange={(e) => setSelectedPhase(e.target.value)}>
                  <MenuItem value="all">All Phases</MenuItem>
                  {phases.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Cancer Type</InputLabel>
                <Select value={selectedCancerType} label="Cancer Type" onChange={(e) => setSelectedCancerType(e.target.value)}>
                  <MenuItem value="all">All Types</MenuItem>
                  {cancerTypes.map(ct => <MenuItem key={ct} value={ct}>{ct}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button variant="contained" fullWidth sx={{ height: 56, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Results */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {filteredTrials.length} clinical trial{filteredTrials.length !== 1 ? 's' : ''} found
          {searchQuery && ` for "${searchQuery}"`}
        </Typography>

        {filteredTrials.map((trial, idx) => (
          <Fade in timeout={200 + idx * 100} key={trial.id}>
            <Card sx={{
              mb: 3, borderRadius: 2, transition: 'all 0.3s ease',
              animation: `${fadeInScale} 0.4s ease-out`,
              '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[6] },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1, mr: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Chip label={trial.nctId} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} />
                      <Chip label={trial.phase} size="small" color="primary" variant="outlined" />
                      <TrialStatusChip status={trial.status} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{trial.shortTitle}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Sponsor: {trial.sponsor}
                    </Typography>
                  </Box>
                  {trial.matchScore && <MatchScoreBadge score={trial.matchScore} />}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {trial.description.length > 200 ? `${trial.description.substring(0, 200)}...` : trial.description}
                </Typography>

                {/* Cancer Types */}
                <Box sx={{ display: 'flex', gap: 0.5, mb: 2, flexWrap: 'wrap' }}>
                  {trial.cancerType.map(ct => (
                    <Chip key={ct} label={ct} size="small" sx={{ backgroundColor: alpha('#667eea', 0.1) }} />
                  ))}
                </Box>

                {/* Enrollment Progress */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Enrollment: {trial.enrollment.current}/{trial.enrollment.target}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.round((trial.enrollment.current / trial.enrollment.target) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(trial.enrollment.current / trial.enrollment.target) * 100}
                    sx={{ height: 6, borderRadius: 3, backgroundColor: alpha('#667eea', 0.12),
                      '& .MuiLinearProgress-bar': { borderRadius: 3, background: 'linear-gradient(90deg, #667eea, #764ba2)' }
                    }}
                  />
                </Box>

                {/* Locations */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {trial.locations.map((loc, li) => (
                    <Chip key={li} label={`${loc.facility}, ${loc.city}${loc.distance ? ` (${loc.distance} mi)` : ''}`}
                      size="small" variant="outlined" />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={() => { setSelectedTrial(trial); setDetailDialogOpen(true); }}>
                    View Details
                  </Button>
                  <Button variant="outlined">Save</Button>
                  {trial.status === 'recruiting' && (
                    <Button variant="contained" onClick={() => { setSelectedTrial(trial); setEnrollDialogOpen(true); }}
                      sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                      Express Interest
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={3} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      </TabPanel>

      {/* Tab 1: My Trials */}
      <TabPanel value={activeTab} index={1}>
        {mockEnrolled.length > 0 ? (
          mockEnrolled.map((enrolled, idx) => (
            <Card key={idx} sx={{ mb: 3, borderRadius: 2, borderLeft: '4px solid #4caf50' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Chip label={enrolled.trial.nctId} size="small" variant="outlined" sx={{ mb: 1, fontFamily: 'monospace' }} />
                    <Typography variant="h6" fontWeight={700}>{enrolled.trial.shortTitle}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enrolled: {enrolled.enrollmentDate} • Status: {enrolled.status}
                    </Typography>
                  </Box>
                  <Chip label={enrolled.status} color="success" sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
                </Box>

                {/* Visit Progress */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>Visit Progress</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {enrolled.visits}/{enrolled.totalVisits} visits completed
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={(enrolled.visits / enrolled.totalVisits) * 100}
                    sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #4caf50, #66bb6a)' } }} />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: alpha('#4caf50', 0.08) }}>
                      <Typography variant="caption" color="text.secondary">Next Visit</Typography>
                      <Typography variant="body2" fontWeight={700}>{enrolled.nextVisit}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: alpha('#667eea', 0.08) }}>
                      <Typography variant="caption" color="text.secondary">Treatment</Typography>
                      <Typography variant="body2" fontWeight={700}>{enrolled.trial.interventions[0]}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: alpha('#ff9800', 0.08) }}>
                      <Typography variant="caption" color="text.secondary">Contact</Typography>
                      <Typography variant="body2" fontWeight={700}>{enrolled.trial.contactName}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))
        ) : (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
            <Typography fontSize={48}>🔬</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>No Enrolled Trials</Typography>
            <Typography variant="body2" color="text.secondary">
              Browse available trials and express your interest to get started.
            </Typography>
            <Button variant="contained" sx={{ mt: 3, background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
              onClick={() => setActiveTab(0)}>
              Browse Trials
            </Button>
          </Paper>
        )}
      </TabPanel>

      {/* Tab 2: Saved */}
      <TabPanel value={activeTab} index={2}>
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography fontSize={48}>📌</Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>No Saved Trials</Typography>
          <Typography variant="body2" color="text.secondary">
            Bookmark trials you're interested in to review them later.
          </Typography>
        </Paper>
      </TabPanel>

      {/* Tab 3: Research News */}
      <TabPanel value={activeTab} index={3}>
        {[
          { title: 'Breakthrough in Immunotherapy for Triple-Negative Breast Cancer', source: 'Nature Medicine', date: 'Jan 2024', summary: 'New combination approach shows 45% improvement in overall survival for TNBC patients.' },
          { title: 'AI-Powered Early Detection Shows Promise in Lung Cancer Screening', source: 'The Lancet Oncology', date: 'Jan 2024', summary: 'Machine learning algorithm achieves 94% sensitivity in detecting early-stage lung nodules on low-dose CT scans.' },
          { title: 'Liquid Biopsy Advances Enable Real-Time Treatment Monitoring', source: 'JAMA Oncology', date: 'Dec 2023', summary: 'ctDNA monitoring helps oncologists adapt treatment strategies weeks before imaging changes become apparent.' },
          { title: 'Gene Therapy Approach Targets Hard-to-Treat Pancreatic Cancer', source: 'Cell', date: 'Dec 2023', summary: 'Novel gene editing strategy shows significant tumor reduction in preclinical models of pancreatic adenocarcinoma.' },
        ].map((article, idx) => (
          <Grow in timeout={300 + idx * 100} key={idx}>
            <Card sx={{ mb: 2, borderRadius: 2, transition: 'all 0.3s ease', '&:hover': { boxShadow: theme.shadows[4] } }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{article.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{article.source} • {article.date}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{article.summary}</Typography>
                  </Box>
                  <Button variant="outlined" size="small" sx={{ minWidth: 80 }}>Read</Button>
                </Box>
              </CardContent>
            </Card>
          </Grow>
        ))}
      </TabPanel>

      {/* Trial Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedTrial && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Chip label={selectedTrial.nctId} size="small" variant="outlined" sx={{ fontFamily: 'monospace', mb: 1 }} />
                  <Typography variant="h6" fontWeight={700}>{selectedTrial.title}</Typography>
                </Box>
                <TrialStatusChip status={selectedTrial.status} />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12}><Typography variant="body1">{selectedTrial.description}</Typography></Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Sponsor</Typography>
                  <Typography fontWeight={600}>{selectedTrial.sponsor}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" color="text.secondary">Phase</Typography>
                  <Typography fontWeight={600}>{selectedTrial.phase}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2" color="text.secondary">Primary Outcome</Typography>
                  <Typography fontWeight={600}>{selectedTrial.primaryOutcome}</Typography>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Interventions</Typography>
                  {selectedTrial.interventions.map((inv, i) => (
                    <Chip key={i} label={inv} sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Eligibility Criteria</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ages {selectedTrial.eligibility.minAge}-{selectedTrial.eligibility.maxAge} • {selectedTrial.eligibility.gender}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={600}>Inclusion:</Typography>
                  {selectedTrial.eligibility.criteria.map((c, ci) => (
                    <Typography key={ci} variant="body2" sx={{ ml: 2 }}>• {c}</Typography>
                  ))}
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>Exclusion:</Typography>
                  {selectedTrial.eligibility.exclusions.map((e, ei) => (
                    <Typography key={ei} variant="body2" sx={{ ml: 2 }}>• {e}</Typography>
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Locations</Typography>
                  {selectedTrial.locations.map((loc, li) => (
                    <Paper key={li} sx={{ p: 2, mb: 1, borderRadius: 2, bgcolor: alpha('#667eea', 0.05) }}>
                      <Typography fontWeight={600}>{loc.facility}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {loc.city}, {loc.state}{loc.distance ? ` • ${loc.distance} miles away` : ''}
                      </Typography>
                    </Paper>
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>Contact</Typography>
                  <Typography>{selectedTrial.contactName} - {selectedTrial.contactEmail}</Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
              {selectedTrial.status === 'recruiting' && (
                <Button variant="contained" onClick={() => { setDetailDialogOpen(false); setEnrollDialogOpen(true); }}
                  sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                  Express Interest
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Enrollment Interest Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Express Interest in Clinical Trial</Typography>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, mt: 1 }}>
            Expressing interest does not guarantee enrollment. The study team will review your eligibility and contact you.
          </Alert>
          <Stepper activeStep={0} orientation="vertical">
            <Step><StepLabel>Submit Interest Form</StepLabel><StepContent>
              <TextField label="Why are you interested?" fullWidth multiline rows={3} sx={{ mb: 2 }} />
              <TextField label="Current Treatments" fullWidth sx={{ mb: 2 }} />
              <TextField label="Additional Notes" fullWidth multiline rows={2} />
            </StepContent></Step>
            <Step><StepLabel>Eligibility Review</StepLabel></Step>
            <Step><StepLabel>Study Team Contact</StepLabel></Step>
            <Step><StepLabel>Informed Consent</StepLabel></Step>
          </Stepper>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setEnrollDialogOpen(false)}
            sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            Submit Interest
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResearchTrialsPage;

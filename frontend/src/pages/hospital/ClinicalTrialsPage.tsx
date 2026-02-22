import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Avatar, Stepper, Step, StepLabel,
} from '@mui/material';
import {
  Science, Person, TrendingUp, Assignment, CheckCircle, Schedule,
  Group, MedicalServices, Timeline, Star, Description, ArrowForward,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { hospitalNavItems } from './HospitalDashboard';

const TRIALS = [
  { id: 'CT-2024-001', title: 'Immunotherapy + Targeted Therapy for NSCLC', phase: 'Phase III', status: 'recruiting', sponsor: 'NCI', pi: 'Dr. Patel', enrolled: 45, target: 120, startDate: '2024-01-15', endDate: '2026-06-30', cancer: 'Lung', primaryEndpoint: 'Overall Survival', arms: ['Immunotherapy + Targeted', 'Standard Chemo'], enrollment_rate: 85 },
  { id: 'CT-2024-002', title: 'CAR-T Cell Therapy for Relapsed B-Cell Lymphoma', phase: 'Phase II', status: 'recruiting', sponsor: 'Internal', pi: 'Dr. Kim', enrolled: 18, target: 50, startDate: '2024-03-01', endDate: '2025-12-31', cancer: 'Lymphoma', primaryEndpoint: 'Complete Response Rate', arms: ['CAR-T High Dose', 'CAR-T Low Dose'], enrollment_rate: 72 },
  { id: 'CT-2024-003', title: 'Liquid Biopsy for Early Breast Cancer Detection', phase: 'Phase I', status: 'enrolling', sponsor: 'BioTech Inc', pi: 'Dr. Chen', enrolled: 12, target: 30, startDate: '2024-06-01', endDate: '2025-09-30', cancer: 'Breast', primaryEndpoint: 'Sensitivity & Specificity', arms: ['Liquid Biopsy + Standard', 'Standard Only'], enrollment_rate: 60 },
  { id: 'CT-2024-004', title: 'AI-Guided Radiation Dosing Optimization', phase: 'Phase II', status: 'active', sponsor: 'RadOnc Corp', pi: 'Dr. Kim', enrolled: 35, target: 35, startDate: '2023-09-01', endDate: '2025-03-31', cancer: 'Various', primaryEndpoint: 'Toxicity Reduction', arms: ['AI-Guided', 'Standard Protocol'], enrollment_rate: 100 },
  { id: 'CT-2024-005', title: 'Neoadjuvant Pembrolizumab for Colorectal Cancer', phase: 'Phase III', status: 'pending', sponsor: 'Pharma Corp', pi: 'Dr. Patel', enrolled: 0, target: 200, startDate: '2025-01-15', endDate: '2028-01-15', cancer: 'Colorectal', primaryEndpoint: 'Pathological Complete Response', arms: ['Neoadjuvant Pembro', 'Adjuvant Pembro', 'Control'], enrollment_rate: 0 },
];

const ENROLLMENT_TREND = [
  { month: 'Jul', enrolled: 8 }, { month: 'Aug', enrolled: 12 }, { month: 'Sep', enrolled: 15 },
  { month: 'Oct', enrolled: 10 }, { month: 'Nov', enrolled: 18 }, { month: 'Dec', enrolled: 7 },
];

const PHASE_DISTRIBUTION = [
  { name: 'Phase I', value: 1, fill: '#ff9800' },
  { name: 'Phase II', value: 2, fill: '#5e92f3' },
  { name: 'Phase III', value: 2, fill: '#4caf50' },
];

const CANCER_TYPES = [
  { name: 'Lung', value: 1, fill: '#5e92f3' },
  { name: 'Lymphoma', value: 1, fill: '#ae52d4' },
  { name: 'Breast', value: 1, fill: '#e91e63' },
  { name: 'Various', value: 1, fill: '#ff9800' },
  { name: 'Colorectal', value: 1, fill: '#4caf50' },
];

const phaseSteps = ['Phase I', 'Phase II', 'Phase III', 'Phase IV'];

const ClinicalTrialsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTrial, setSelectedTrial] = useState<typeof TRIALS[0] | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const activeTrials = TRIALS.filter(t => t.status === 'recruiting' || t.status === 'active' || t.status === 'enrolling');
  const totalEnrolled = TRIALS.reduce((s, t) => s + t.enrolled, 0);

  return (
    <AppLayout title="Clinical Trials" navItems={hospitalNavItems} portalType="hospital" subtitle="Research trial management & enrollment tracking">
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Science />} label="Active Trials" value={activeTrials.length.toString()} color="#5e92f3" subtitle="Currently running" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Group />} label="Total Enrolled" value={totalEnrolled.toString()} change="+7" color="#4caf50" subtitle="All trials combined" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<TrendingUp />} label="Avg Enrollment" value="74%" color="#ff9800" subtitle="Of target capacity" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<MedicalServices />} label="New This Month" value="7" color="#ae52d4" subtitle="Patients enrolled" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<Assignment />} label="Trials" iconPosition="start" />
            <Tab icon={<Group />} label="Enrollment" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Clinical Trials" icon={<Science />}
              action={<Button startIcon={<Science />} variant="contained" size="small" onClick={() => setShowCreateDialog(true)}>New Trial</Button>}
            />
            <Stack spacing={2}>
              {TRIALS.map((trial, idx) => (
                <Box key={idx} sx={{ p: 2.5, border: '1px solid #f0f0f0', borderRadius: 3, cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc', borderColor: '#5e92f3' } }}
                  onClick={() => setSelectedTrial(trial)}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Chip label={trial.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} />
                        <Chip label={trial.phase} size="small" sx={{ bgcolor: trial.phase === 'Phase III' ? '#e8f5e9' : trial.phase === 'Phase II' ? '#e3f2fd' : '#fff3e0', color: trial.phase === 'Phase III' ? '#2e7d32' : trial.phase === 'Phase II' ? '#1565c0' : '#e65100', fontWeight: 700, fontSize: 10 }} />
                        <StatusBadge status={trial.status} />
                      </Stack>
                      <Typography fontWeight={700} fontSize={14}>{trial.title}</Typography>
                      <Typography variant="caption" color="text.secondary">PI: {trial.pi} • Sponsor: {trial.sponsor} • {trial.cancer}</Typography>
                    </Box>
                    <MetricGauge value={trial.enrollment_rate} size={60} color={trial.enrollment_rate >= 80 ? '#4caf50' : trial.enrollment_rate >= 50 ? '#ff9800' : '#f44336'} />
                  </Stack>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Enrollment: {trial.enrolled}/{trial.target}</Typography>
                        <Typography variant="caption" fontWeight={600}>{Math.round((trial.enrolled / trial.target) * 100)}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={(trial.enrolled / trial.target) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: trial.enrollment_rate >= 80 ? '#4caf50' : '#ff9800' } }} />
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {trial.arms.map((arm, ai) => (
                        <Chip key={ai} label={arm} size="small" variant="outlined" sx={{ fontSize: 9 }} />
                      ))}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Card>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Monthly Enrollment Trends" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ENROLLMENT_TREND}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RTooltip />
                    <Bar dataKey="enrolled" fill="#5e92f3" name="Patients Enrolled" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Eligible Patients for Active Trials" icon={<Group />} />
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>AI has identified 23 patients who may be eligible for active clinical trials based on their cancer type, stage, and treatment history.</Alert>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Cancer Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Matched Trial</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Match Score</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[
                        { patient: 'Alice Thompson', cancer: 'NSCLC Stage IIIA', trial: 'CT-2024-001', score: 95 },
                        { patient: 'Bob Williams', cancer: 'B-Cell Lymphoma', trial: 'CT-2024-002', score: 88 },
                        { patient: 'Eva Martinez', cancer: 'Breast IDC', trial: 'CT-2024-003', score: 82 },
                      ].map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell><Typography fontWeight={600} fontSize={13}>{p.patient}</Typography></TableCell>
                          <TableCell><Typography fontSize={12}>{p.cancer}</Typography></TableCell>
                          <TableCell><Chip label={p.trial} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                          <TableCell>
                            <Chip label={`${p.score}% match`} size="small" sx={{ bgcolor: p.score >= 90 ? '#e8f5e9' : '#fff3e0', color: p.score >= 90 ? '#2e7d32' : '#e65100', fontWeight: 700, fontSize: 10 }} />
                          </TableCell>
                          <TableCell><Button size="small" variant="outlined" sx={{ fontSize: 10 }}>Screen Patient</Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Trials by Phase" icon={<Timeline />} />
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={PHASE_DISTRIBUTION} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                      {PHASE_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Trials by Cancer Type" icon={<MedicalServices />} />
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={CANCER_TYPES} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name }: any) => name}>
                      {CANCER_TYPES.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Trial Detail Dialog */}
        <Dialog open={!!selectedTrial} onClose={() => setSelectedTrial(null)} maxWidth="md" fullWidth>
          <DialogTitle>{selectedTrial?.title}</DialogTitle>
          <DialogContent>
            {selectedTrial && (
              <Stack spacing={3} sx={{ mt: 1 }}>
                <Stepper activeStep={phaseSteps.indexOf(selectedTrial.phase)} alternativeLabel>
                  {phaseSteps.map(label => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                  ))}
                </Stepper>
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography variant="body2"><strong>ID:</strong> {selectedTrial.id}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2"><strong>Phase:</strong> {selectedTrial.phase}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2"><strong>PI:</strong> {selectedTrial.pi}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2"><strong>Sponsor:</strong> {selectedTrial.sponsor}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2"><strong>Start:</strong> {selectedTrial.startDate}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2"><strong>End:</strong> {selectedTrial.endDate}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2"><strong>Cancer Type:</strong> {selectedTrial.cancer}</Typography></Grid>
                  <Grid item xs={6}><Typography variant="body2"><strong>Primary Endpoint:</strong> {selectedTrial.primaryEndpoint}</Typography></Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 1 }}><strong>Arms:</strong></Typography>
                    <Stack direction="row" spacing={1}>{selectedTrial.arms.map((a, i) => <Chip key={i} label={a} size="small" variant="outlined" />)}</Stack>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}><strong>Enrollment:</strong> {selectedTrial.enrolled}/{selectedTrial.target}</Typography>
                    <LinearProgress variant="determinate" value={(selectedTrial.enrolled / selectedTrial.target) * 100} sx={{ height: 10, borderRadius: 5 }} />
                  </Grid>
                </Grid>
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedTrial(null)}>Close</Button>
            <Button variant="contained">View Full Protocol</Button>
          </DialogActions>
        </Dialog>

        {/* Create Trial Dialog */}
        <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Register New Clinical Trial</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Trial Title" fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField select label="Phase" fullWidth defaultValue="">
                    {phaseSteps.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={6}><TextField label="Target Enrollment" type="number" fullWidth /></Grid>
              </Grid>
              <TextField label="Principal Investigator" fullWidth />
              <TextField label="Sponsor" fullWidth />
              <TextField label="Cancer Type" fullWidth />
              <TextField label="Primary Endpoint" fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField label="End Date" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </Grid>
              <TextField label="Arms / Groups" multiline rows={2} fullWidth placeholder="One arm per line" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowCreateDialog(false)}>Register Trial</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default ClinicalTrialsPage;

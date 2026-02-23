import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Alert, Stepper, Step, StepLabel, StepContent, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress,
} from '@mui/material';
import {
  MedicalServices, Science, Timeline, Vaccines, LocalHospital,
  CheckCircle, Schedule, Warning, Info, ArrowForward, Download,
  Biotech, Healing, Psychology, Visibility, Star, TrendingUp,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, GlassCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { patientNavItems } from './PatientDashboard';
import { treatmentAPI, secondOpinionAPI } from '../../services/api';

const phaseColors: Record<string, string> = {
  completed: '#4caf50', in_progress: '#5e92f3', pending: '#9e9e9e',
};
const phaseIcons: Record<string, React.ReactNode> = {
  Chemotherapy: <Vaccines />, Surgery: <LocalHospital />, Radiation: <Science />, Hormone: <Biotech />,
};

const TreatmentPlanPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showSecondOpinionDialog, setShowSecondOpinionDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState<any>({ cancer_type: '', stage: '', plan_type: '', doctor: '', hospital: '', success_rate: 0, start_date: '', end_date: '', phases: [] });
  const [sideEffectsData, setSideEffectsData] = useState<any[]>([]);
  const [responseTracking, setResponseTracking] = useState<any[]>([]);
  const [clinicalTrials, setClinicalTrials] = useState<any[]>([]);
  const [secondOpinions, setSecondOpinions] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [plansRes, trialsRes, opinionsRes] = await Promise.all([
        treatmentAPI.getPlans().catch(() => null),
        treatmentAPI.getClinicalTrials('all').catch(() => null),
        secondOpinionAPI.getRequests().catch(() => null),
      ]);

      if (plansRes?.data) {
        const plans = Array.isArray(plansRes.data) ? plansRes.data : (plansRes.data.plans ?? [plansRes.data]);
        if (plans.length > 0) {
          const p = plans[0];
          setTreatmentPlan({
            cancer_type: p.cancer_type ?? '', stage: p.stage ?? '', plan_type: p.plan_type ?? p.treatment_type ?? '',
            doctor: p.doctor ?? p.physician ?? '', hospital: p.hospital ?? '',
            success_rate: p.success_rate ?? 0, start_date: p.start_date ?? '', end_date: p.end_date ?? '',
            phases: (p.phases ?? p.treatment_phases ?? []).map((ph: any) => ({
              name: ph.name ?? '', type: ph.type ?? ph.treatment_type ?? '', start: ph.start ?? ph.start_date ?? '',
              end: ph.end ?? ph.end_date ?? '', status: ph.status ?? 'pending', progress: ph.progress ?? 0,
              cycles: ph.cycles ?? '', notes: ph.notes ?? '',
            })),
          });
          if (p.side_effects) setSideEffectsData(p.side_effects);
          if (p.response_tracking) setResponseTracking(p.response_tracking);
        }
      }
      if (trialsRes?.data) {
        const trials = Array.isArray(trialsRes.data) ? trialsRes.data : (trialsRes.data.trials ?? []);
        setClinicalTrials(trials.map((t: any) => ({
          id: t.id ?? t.trial_id ?? '', title: t.title ?? '', phase: t.phase ?? '',
          status: t.status ?? '', match: t.match_score ?? t.match ?? 0, sponsor: t.sponsor ?? '',
        })));
      }
      if (opinionsRes?.data) {
        const opinions = Array.isArray(opinionsRes.data) ? opinionsRes.data : (opinionsRes.data.requests ?? []);
        setSecondOpinions(opinions.map((o: any) => ({
          id: o.id ?? '', date: o.date ?? o.created_at ?? '', original: o.original_diagnosis ?? o.original ?? '',
          reviewer: o.reviewer ?? '', hospital: o.hospital ?? '', status: o.status ?? '',
          agreement: o.agreement ?? o.agreement_percentage ?? 0, recommendation: o.recommendation ?? '',
        })));
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load treatment plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout title="Treatment Plan" navItems={patientNavItems} portalType="patient" subtitle="Your personalized treatment journey">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 3 }} action={<Button onClick={loadData}>Retry</Button>}>{error}</Alert>
      ) : (
      <Box sx={{ p: 3 }}>
        {/* Overview Banner */}
        <GlassCard gradient="linear-gradient(135deg, #1565c020, #5e92f310)" sx={{ mb: 3, p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#1565c0' }}><MedicalServices /></Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800}>{treatmentPlan.cancer_type} — {treatmentPlan.stage}</Typography>
                  <Typography variant="body2" color="text.secondary">{treatmentPlan.plan_type} Treatment Plan • {treatmentPlan.doctor} • {treatmentPlan.hospital}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Chip icon={<CheckCircle />} label="Phase 1 Complete" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }} />
                <Chip icon={<Schedule />} label="Phase 2 In Progress" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                <Chip label={`${treatmentPlan.start_date} → ${treatmentPlan.end_date}`} variant="outlined" />
              </Stack>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
              <MetricGauge value={treatmentPlan.success_rate} color="#4caf50" size={140} />
              <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Predicted Success Rate</Typography>
            </Grid>
          </Grid>
        </GlassCard>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Timeline />} label="Treatment Timeline" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Response Tracking" iconPosition="start" />
            <Tab icon={<Warning />} label="Side Effects" iconPosition="start" />
            <Tab icon={<Science />} label="Clinical Trials" iconPosition="start" />
            <Tab icon={<Visibility />} label="Second Opinions" iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab 0: Timeline */}
        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Treatment Journey" subtitle="Step-by-step progress through your treatment plan" icon={<Timeline />} />
            <Stepper orientation="vertical" activeStep={1}>
              {treatmentPlan.phases.map((phase: any, idx: number) => (
                <Step key={idx} completed={phase.status === 'completed'} active={phase.status === 'in_progress'}>
                  <StepLabel StepIconComponent={() => (
                    <Avatar sx={{ width: 40, height: 40, bgcolor: `${phaseColors[phase.status]}20`, color: phaseColors[phase.status] }}>
                      {phaseIcons[phase.type] || <MedicalServices />}
                    </Avatar>
                  )}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography fontWeight={700} fontSize={16}>{phase.name}</Typography>
                      <Chip label={phase.status.replace('_', ' ').toUpperCase()} size="small" sx={{ bgcolor: `${phaseColors[phase.status]}15`, color: phaseColors[phase.status], fontWeight: 700 }} />
                    </Stack>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, mb: 2 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{phase.cycles}</Typography>
                      <Typography variant="body2" color="text.secondary" fontSize={12}>{phase.notes}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{phase.start} → {phase.end}</Typography>
                      {phase.status !== 'pending' && (
                        <Box sx={{ mt: 1.5 }}>
                          <LinearProgress variant="determinate" value={phase.progress} sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: phaseColors[phase.status], borderRadius: 4 } }} />
                          <Typography variant="caption" fontWeight={600} sx={{ mt: 0.5 }}>{phase.progress}% complete</Typography>
                        </Box>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Card>
        )}

        {/* Tab 1: Response Tracking */}
        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Tumor Response Over Time" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={responseTracking}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" label={{ value: 'Tumor Size (cm)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Marker Level', angle: 90, position: 'insideRight' }} />
                    <RTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="tumor_size" stroke="#f44336" strokeWidth={3} name="Tumor Size (cm)" dot={{ fill: '#f44336', r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="marker" stroke="#5e92f3" strokeWidth={3} name="Tumor Marker" dot={{ fill: '#5e92f3', r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 2.5 }}>
                <SectionHeader title="Treatment Response" icon={<CheckCircle />} />
                <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>
                  <strong>Excellent Response!</strong><br />
                  Tumor size reduced by 62.5% since treatment start.
                </Alert>
                <Stack spacing={2}>
                  {[
                    { label: 'Tumor Reduction', value: '62.5%', color: '#4caf50' },
                    { label: 'Marker Decline', value: '60%', color: '#5e92f3' },
                    { label: 'Overall Response', value: 'Excellent', color: '#4caf50' },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                      <Chip label={item.value} size="small" sx={{ bgcolor: `${item.color}15`, color: item.color, fontWeight: 700 }} />
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Side Effects */}
        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Side Effects Severity" icon={<Warning />} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sideEffectsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 10]} />
                    <YAxis type="category" dataKey="effect" width={100} />
                    <RTooltip />
                    <Bar dataKey="severity" fill="#ff9800" radius={[0, 4, 4, 0]} name="Severity (1-10)">
                      {sideEffectsData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.severity >= 7 ? '#f44336' : entry.severity >= 5 ? '#ff9800' : '#4caf50'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Management Tips" icon={<Healing />} />
                <Stack spacing={1.5}>
                  {[
                    { effect: 'Fatigue', tip: 'Short naps, light exercise, energy conservation', icon: '😴' },
                    { effect: 'Nausea', tip: 'Anti-emetics, ginger tea, small frequent meals', icon: '🤢' },
                    { effect: 'Hair Loss', tip: 'Scalp cooling, gentle care, support groups', icon: '💇' },
                    { effect: 'Neuropathy', tip: 'L-glutamine, gentle massage, protect hands/feet', icon: '🖐️' },
                  ].map((item, i) => (
                    <Box key={i} sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f0f0f0' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontSize={20}>{item.icon}</Typography>
                        <Box>
                          <Typography variant="body2" fontWeight={700} fontSize={12}>{item.effect}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.tip}</Typography>
                        </Box>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 3: Clinical Trials */}
        {activeTab === 3 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Eligible Clinical Trials" subtitle="AI-matched trials based on your diagnosis" icon={<Science />} />
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              <strong>4 clinical trials</strong> match your cancer type and treatment history. Discuss these options with your oncologist.
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Trial ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Phase</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Match Score</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clinicalTrials.map((trial, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Chip label={trial.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} /></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} fontSize={12}>{trial.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{trial.sponsor}</Typography>
                      </TableCell>
                      <TableCell><Chip label={`Phase ${trial.phase}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }} /></TableCell>
                      <TableCell><StatusBadge status={trial.status.toLowerCase()} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <LinearProgress variant="determinate" value={trial.match} sx={{ width: 50, height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: trial.match >= 85 ? '#4caf50' : '#ff9800' } }} />
                          <Typography variant="body2" fontWeight={700} color={trial.match >= 85 ? 'success.main' : 'warning.main'}>{trial.match}%</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Button size="small" variant="outlined">Learn More</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Tab 4: Second Opinions */}
        {activeTab === 4 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Second Opinions" subtitle="Expert & AI-powered diagnosis verification" icon={<Visibility />}
              action={<Button startIcon={<Science />} variant="contained" size="small" onClick={() => setShowSecondOpinionDialog(true)}>Request Second Opinion</Button>}
            />
            {secondOpinions.map((opinion, idx) => (
              <Box key={idx} sx={{ mb: 2.5, p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f0f0f0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: opinion.reviewer.includes('AI') ? '#ae52d420' : '#e3f2fd', color: opinion.reviewer.includes('AI') ? '#ae52d4' : '#1565c0' }}>
                      {opinion.reviewer.includes('AI') ? <Psychology /> : <LocalHospital />}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700}>{opinion.reviewer}</Typography>
                      <Typography variant="caption" color="text.secondary">{opinion.hospital} • {opinion.date}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Chip label={`${opinion.agreement}% Agreement`} size="small" sx={{ bgcolor: opinion.agreement >= 85 ? '#e8f5e9' : '#fff3e0', color: opinion.agreement >= 85 ? '#2e7d32' : '#e65100', fontWeight: 700 }} />
                    <StatusBadge status={opinion.status.toLowerCase()} />
                  </Stack>
                </Stack>
                <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #f0f0f0' }}>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Original: {opinion.original}</Typography>
                  <Typography variant="body2" color="text.secondary" fontSize={12}><strong>Recommendation:</strong> {opinion.recommendation}</Typography>
                </Box>
              </Box>
            ))}
          </Card>
        )}

        {/* Second Opinion Dialog */}
        <Dialog open={showSecondOpinionDialog} onClose={() => setShowSecondOpinionDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request Second Opinion</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Opinion Type" fullWidth defaultValue="expert">
                <MenuItem value="expert">Expert Oncologist Review</MenuItem>
                <MenuItem value="ai">AI Analysis</MenuItem>
                <MenuItem value="both">Both Expert + AI</MenuItem>
              </TextField>
              <TextField label="Current Diagnosis" fullWidth defaultValue={`${treatmentPlan.cancer_type} - ${treatmentPlan.stage}`} />
              <TextField label="Specific Questions" multiline rows={3} fullWidth placeholder="What aspects would you like reviewed?" />
              <TextField select label="Urgency" fullWidth defaultValue="routine">
                <MenuItem value="routine">Routine (5-7 days)</MenuItem>
                <MenuItem value="priority">Priority (2-3 days)</MenuItem>
                <MenuItem value="urgent">Urgent (24 hours)</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSecondOpinionDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowSecondOpinionDialog(false)}>Submit Request</Button>
          </DialogActions>
        </Dialog>
      </Box>
      )}
    </AppLayout>
  );
};

export default TreatmentPlanPage;

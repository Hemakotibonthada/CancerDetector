import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  Accessibility as RehabIcon, FitnessCenter as ExerciseIcon,
  Assessment as AssessIcon, Schedule as ScheduleIcon,
  TrendingUp as ProgressIcon, Groups as TherapyIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { rehabilitationAPI } from '../../services/api';

const RehabilitationManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [plans, setPlans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pl, ss, ex, as_] = await Promise.all([
        rehabilitationAPI.getPlans().catch(() => ({ data: [] })),
        rehabilitationAPI.getSessions().catch(() => ({ data: [] })),
        rehabilitationAPI.getExercises('').catch(() => ({ data: [] })),
        rehabilitationAPI.getFunctionalAssessments().catch(() => ({ data: [] })),
      ]);
      setPlans(pl.data || []);
      setSessions(ss.data || []);
      setExercises(ex.data || []);
      setAssessments(as_.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Rehabilitation Management" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Active Plans', value: plans.filter(p => p.status === 'active').length, icon: <RehabIcon />, color: '#4caf50' },
            { label: "Today's Sessions", value: sessions.filter(s => new Date(s.scheduled_date).toDateString() === new Date().toDateString()).length, icon: <ScheduleIcon />, color: '#2196f3' },
            { label: 'Exercise Library', value: exercises.length, icon: <ExerciseIcon />, color: '#ff9800' },
            { label: 'Assessments Due', value: assessments.filter(a => a.status === 'pending').length, icon: <AssessIcon />, color: '#9c27b0' },
          ].map((s, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>{s.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Rehab Plans" icon={<RehabIcon />} iconPosition="start" />
          <Tab label="Therapy Sessions" icon={<ScheduleIcon />} iconPosition="start" />
          <Tab label="Exercise Library" icon={<ExerciseIcon />} iconPosition="start" />
          <Tab label="Functional Assessments" icon={<AssessIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {plans.map((p: any) => (
              <Card key={p.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{p.plan_type} - {p.patient_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Provider: {p.provider_name} • Start: {new Date(p.start_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Goals: {p.goals || 'Improve functional mobility'}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          Progress: {p.progress_percentage || 0}%
                        </Typography>
                        <LinearProgress variant="determinate" value={p.progress_percentage || 0}
                          sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={`${p.sessions_completed || 0}/${p.total_sessions || 0} sessions`} size="small"
                          sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                        <Chip label={p.rehab_type || 'Physical'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                      </Stack>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={p.status} size="small"
                        sx={{ bgcolor: p.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: p.status === 'active' ? '#81c784' : '#ffb74d' }} />
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>
                        View Plan
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {plans.length === 0 && <Alert severity="info">No rehabilitation plans.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Patient</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Session Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Therapist</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date/Time</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Duration</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Pain Level</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ color: '#fff' }}>{s.patient_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.session_type}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.therapist_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {new Date(s.scheduled_date).toLocaleDateString()} {s.scheduled_time}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.duration_minutes} min</TableCell>
                    <TableCell>
                      {s.pain_level !== undefined && (
                        <Chip label={`${s.pain_level}/10`} size="small"
                          sx={{ bgcolor: s.pain_level > 7 ? 'rgba(244,67,54,0.3)' : s.pain_level > 4 ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                                color: s.pain_level > 7 ? '#ef5350' : s.pain_level > 4 ? '#ffb74d' : '#81c784' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={s.status} size="small"
                        sx={{ bgcolor: s.status === 'completed' ? 'rgba(76,175,80,0.3)' : s.status === 'scheduled' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)',
                              color: s.status === 'completed' ? '#81c784' : s.status === 'scheduled' ? '#90caf9' : '#ffb74d' }} />
                    </TableCell>
                  </TableRow>
                ))}
                {sessions.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No sessions</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {exercises.map((e: any) => (
              <Grid item xs={12} sm={6} md={4} key={e.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{e.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>{e.description}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={e.category || 'Strength'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={e.difficulty || 'Moderate'} size="small"
                        sx={{ bgcolor: e.difficulty === 'hard' ? 'rgba(244,67,54,0.3)' : e.difficulty === 'easy' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: e.difficulty === 'hard' ? '#ef5350' : e.difficulty === 'easy' ? '#81c784' : '#ffb74d' }} />
                      <Chip label={`${e.sets || 3}x${e.reps || 10}`} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                    </Stack>
                    {e.target_muscle_group && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>Target: {e.target_muscle_group}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {exercises.length === 0 && <Grid item xs={12}><Alert severity="info">No exercises in library.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {assessments.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{a.assessment_type} - {a.patient_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Assessor: {a.assessor_name} • Date: {new Date(a.assessment_date).toLocaleDateString()}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        {a.mobility_score !== undefined && <Typography variant="body2" sx={{ color: '#90caf9' }}>Mobility: {a.mobility_score}/10</Typography>}
                        {a.strength_score !== undefined && <Typography variant="body2" sx={{ color: '#81c784' }}>Strength: {a.strength_score}/10</Typography>}
                        {a.balance_score !== undefined && <Typography variant="body2" sx={{ color: '#ffb74d' }}>Balance: {a.balance_score}/10</Typography>}
                        {a.adl_score !== undefined && <Typography variant="body2" sx={{ color: '#ce93d8' }}>ADL: {a.adl_score}/10</Typography>}
                      </Stack>
                      {a.notes && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>{a.notes}</Typography>}
                    </Box>
                    <Chip label={a.status} size="small"
                      sx={{ bgcolor: a.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                            color: a.status === 'completed' ? '#81c784' : '#ffb74d' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {assessments.length === 0 && <Alert severity="info">No functional assessments.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default RehabilitationManagementPage;

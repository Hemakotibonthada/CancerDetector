import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  Psychology as PsyIcon, SelfImprovement as MindIcon,
  Warning as CrisisIcon, Shield as SafetyIcon,
  Groups as GroupIcon, TrackChanges as GoalIcon,
  Assessment as ScreenIcon, Spa as SpaIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { mentalHealthEnhancedAPI } from '../../services/api';

const MentalHealthEnhancedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [cbtSessions, setCbtSessions] = useState<any[]>([]);
  const [mindfulness, setMindfulness] = useState<any[]>([]);
  const [safetyPlans, setSafetyPlans] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [groupSessions, setGroupSessions] = useState<any[]>([]);
  const [exerciseDialog, setExerciseDialog] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cbt, mind, safety, gl, scr, grp] = await Promise.all([
        mentalHealthEnhancedAPI.getCBTSessions().catch(() => ({ data: [] })),
        mentalHealthEnhancedAPI.getMindfulnessExercises().catch(() => ({ data: [] })),
        mentalHealthEnhancedAPI.getSafetyPlans().catch(() => ({ data: [] })),
        mentalHealthEnhancedAPI.getBehavioralGoals().catch(() => ({ data: [] })),
        mentalHealthEnhancedAPI.getScreenings().catch(() => ({ data: [] })),
        mentalHealthEnhancedAPI.getGroupTherapy().catch(() => ({ data: [] })),
      ]);
      setCbtSessions(cbt.data || []);
      setMindfulness(mind.data || []);
      setSafetyPlans(safety.data || []);
      setGoals(gl.data || []);
      setScreenings(scr.data || []);
      setGroupSessions(grp.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const moodColors: Record<string, string> = { excellent: '#4caf50', good: '#8bc34a', neutral: '#ff9800', low: '#f44336', crisis: '#d32f2f' };

  return (
    <AppLayout title="Mental Health & Wellness" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Crisis Support Banner */}
        <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(244,67,54,0.1)', color: '#ef5350' }}
          action={<Button size="small" sx={{ color: '#ef5350', fontWeight: 700 }}>988 Lifeline</Button>}>
          If you're in crisis, call 988 (Suicide & Crisis Lifeline) or text HOME to 741741
        </Alert>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'CBT Sessions', value: cbtSessions.length, icon: <PsyIcon />, color: '#2196f3' },
            { label: 'Mindfulness', value: mindfulness.length, icon: <MindIcon />, color: '#4caf50' },
            { label: 'Safety Plans', value: safetyPlans.length, icon: <SafetyIcon />, color: '#ff9800' },
            { label: 'Active Goals', value: goals.filter(g => g.status === 'active').length, icon: <GoalIcon />, color: '#9c27b0' },
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
          <Tab label="CBT Sessions" icon={<PsyIcon />} iconPosition="start" />
          <Tab label="Mindfulness" icon={<MindIcon />} iconPosition="start" />
          <Tab label="Safety Plans" icon={<SafetyIcon />} iconPosition="start" />
          <Tab label="Goals" icon={<GoalIcon />} iconPosition="start" />
          <Tab label="Screenings" icon={<ScreenIcon />} iconPosition="start" />
          <Tab label="Group Therapy" icon={<GroupIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {cbtSessions.map((s: any) => (
              <Card key={s.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>Session #{s.session_number || s.id}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(s.session_date).toLocaleDateString()} • Therapist: {s.therapist_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Focus: {s.focus_area || 'Cognitive Restructuring'}
                      </Typography>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Stack direction="row" spacing={1}>
                        <Chip label={`Mood: ${s.mood_before || '-'}`} size="small"
                          sx={{ bgcolor: 'rgba(244,67,54,0.2)', color: '#ef5350' }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>→</Typography>
                        <Chip label={`Mood: ${s.mood_after || '-'}`} size="small"
                          sx={{ bgcolor: 'rgba(76,175,80,0.2)', color: '#81c784' }} />
                      </Stack>
                      <Chip label={s.status || 'completed'} size="small"
                        sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                  </Stack>
                  {s.homework && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#90caf9' }}>Homework: {s.homework}</Typography>
                    </Box>
                  )}
                  {s.thought_record && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <Typography variant="caption" sx={{ color: '#ff9800' }}>Thought Record: {s.thought_record}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
            {cbtSessions.length === 0 && <Alert severity="info">No CBT sessions recorded.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <Box>
            <Button variant="contained" sx={{ mb: 2, bgcolor: '#4caf50' }} startIcon={<SpaIcon />}
              onClick={() => setExerciseDialog(true)}>
              Start Guided Exercise
            </Button>
            <Grid container spacing={2}>
              {mindfulness.map((ex: any) => (
                <Grid item xs={12} sm={6} md={4} key={ex.id}>
                  <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #1b5e20 20%)', border: '1px solid rgba(76,175,80,0.3)' }}>
                    <CardContent>
                      <SpaIcon sx={{ color: '#4caf50', fontSize: 32, mb: 1 }} />
                      <Typography variant="h6" sx={{ color: '#fff' }}>{ex.exercise_type || 'Meditation'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Duration: {ex.duration_minutes || 10} min
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(ex.completed_at || ex.created_at).toLocaleDateString()}
                      </Typography>
                      {ex.stress_before !== undefined && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Chip label={`Before: ${ex.stress_before}/10`} size="small" sx={{ bgcolor: 'rgba(244,67,54,0.2)', color: '#ef5350' }} />
                          <Chip label={`After: ${ex.stress_after}/10`} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.2)', color: '#81c784' }} />
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {mindfulness.length === 0 && <Grid item xs={12}><Alert severity="info">Start your first mindfulness exercise!</Alert></Grid>}
            </Grid>

            <Dialog open={exerciseDialog} onClose={() => setExerciseDialog(false)} maxWidth="sm" fullWidth
              PaperProps={{ sx: { bgcolor: '#1a1a2e', color: '#fff' } }}>
              <DialogTitle>Guided Mindfulness Exercise</DialogTitle>
              <DialogContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <SpaIcon sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
                  <Typography variant="h5" sx={{ mb: 2 }}>Deep Breathing Exercise</Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                    Close your eyes. Breathe in slowly for 4 counts, hold for 4 counts, exhale for 6 counts. Repeat 5 times.
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#4caf50' }}>5 minutes</Typography>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setExerciseDialog(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>Close</Button>
                <Button variant="contained" sx={{ bgcolor: '#4caf50' }}
                  onClick={async () => {
                    await mentalHealthEnhancedAPI.logMindfulnessSession({ exercise_type: 'deep_breathing', duration_minutes: 5 });
                    setExerciseDialog(false); loadData();
                  }}>
                  Mark Complete
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {safetyPlans.map((plan: any) => (
              <Card key={plan.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,152,0,0.3)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" sx={{ color: '#fff' }}><SafetyIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#ff9800' }} />Safety Plan</Typography>
                    <Chip label={plan.is_active ? 'Active' : 'Archived'} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                  </Stack>
                  {plan.warning_signs && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ color: '#ff9800' }}>Warning Signs</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{plan.warning_signs}</Typography>
                    </Box>
                  )}
                  {plan.coping_strategies && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#4caf50' }}>Coping Strategies</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{plan.coping_strategies}</Typography>
                    </Box>
                  )}
                  {plan.emergency_contacts && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: '#f44336' }}>Emergency Contacts</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{plan.emergency_contacts}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
            {safetyPlans.length === 0 && <Alert severity="info">No safety plans. Talk to your care team if needed.</Alert>}
          </Stack>
        )}

        {activeTab === 3 && (
          <Grid container spacing={2}>
            {goals.map((goal: any) => (
              <Grid item xs={12} md={6} key={goal.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{goal.goal_description}</Typography>
                      <Chip label={goal.status} size="small"
                        sx={{ bgcolor: goal.status === 'achieved' ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)',
                              color: goal.status === 'achieved' ? '#81c784' : '#90caf9' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                      Category: {goal.category} • Target: {goal.target_date ? new Date(goal.target_date).toLocaleDateString() : '-'}
                    </Typography>
                    {goal.progress !== undefined && (
                      <Box sx={{ mt: 2 }}>
                        <LinearProgress variant="determinate" value={goal.progress}
                          sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#9c27b0' } }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{goal.progress}% complete</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {goals.length === 0 && <Alert severity="info">No behavioral goals set.</Alert>}
          </Grid>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {screenings.map((s: any) => (
              <Card key={s.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{s.screening_type || 'PHQ-9'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(s.completed_at || s.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h4" sx={{ color: s.risk_level === 'high' ? '#f44336' : s.risk_level === 'moderate' ? '#ff9800' : '#4caf50', fontWeight: 700 }}>
                        {s.total_score}
                      </Typography>
                      <Chip label={s.risk_level || 'Low'} size="small"
                        sx={{ bgcolor: s.risk_level === 'high' ? 'rgba(244,67,54,0.3)' : s.risk_level === 'moderate' ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                              color: s.risk_level === 'high' ? '#ef5350' : s.risk_level === 'moderate' ? '#ffb74d' : '#81c784' }} />
                    </Box>
                  </Stack>
                  {s.interpretation && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>{s.interpretation}</Typography>}
                </CardContent>
              </Card>
            ))}
            {screenings.length === 0 && <Alert severity="info">No screenings completed.</Alert>}
          </Stack>
        )}

        {activeTab === 5 && (
          <Grid container spacing={2}>
            {groupSessions.map((gs: any) => (
              <Grid item xs={12} md={6} key={gs.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{gs.group_name || 'Support Group'}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Facilitator: {gs.facilitator_name} • Topic: {gs.topic}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(gs.session_date).toLocaleDateString()} • {gs.duration_minutes} min
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={`${gs.participants_count || 0} participants`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={gs.format || 'Virtual'} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                    </Stack>
                    {gs.status === 'upcoming' && (
                      <Button size="small" variant="outlined" sx={{ mt: 1, color: '#90caf9', borderColor: '#90caf9' }}>Register</Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {groupSessions.length === 0 && <Alert severity="info">No group therapy sessions.</Alert>}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
};

export default MentalHealthEnhancedPage;

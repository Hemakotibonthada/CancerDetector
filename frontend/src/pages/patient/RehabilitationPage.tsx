import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import {
  Healing as RehabIcon, FitnessCenter as ExerciseIcon,
  Assessment as AssessIcon, Timeline as ProgressIcon,
  EmojiEvents as MilestoneIcon, Accessibility as DisabilityIcon,
  LocalHospital as PainIcon, CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { rehabilitationAPI } from '../../services/api';

const RehabilitationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [plans, setPlans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [painPlans, setPainPlans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pl, ss, as_, pm, st] = await Promise.all([
        rehabilitationAPI.getPlans().catch(() => ({ data: [] })),
        rehabilitationAPI.getSessions().catch(() => ({ data: [] })),
        rehabilitationAPI.getFunctionalAssessments().catch(() => ({ data: [] })),
        rehabilitationAPI.getPainManagement().catch(() => ({ data: [] })),
        rehabilitationAPI.getDashboardStats().catch(() => ({ data: {} })),
      ]);
      setPlans(pl.data || []);
      setSessions(ss.data || []);
      setAssessments(as_.data || []);
      setPainPlans(pm.data || []);
      setStats(st.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const typeColors: Record<string, string> = { physical: '#2196f3', occupational: '#4caf50', speech: '#ff9800', cardiac: '#f44336', pulmonary: '#9c27b0' };

  return (
    <AppLayout title="Rehabilitation & Therapy" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Active Plans', value: plans.filter(p => p.status === 'active').length, icon: <RehabIcon />, color: '#2196f3' },
            { label: 'Sessions', value: sessions.length, icon: <CalendarIcon />, color: '#4caf50' },
            { label: 'Assessments', value: assessments.length, icon: <AssessIcon />, color: '#ff9800' },
            { label: 'Pain Plans', value: painPlans.length, icon: <PainIcon />, color: '#f44336' },
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

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="My Plans" icon={<RehabIcon />} iconPosition="start" />
          <Tab label="Sessions" icon={<CalendarIcon />} iconPosition="start" />
          <Tab label="Exercises" icon={<ExerciseIcon />} iconPosition="start" />
          <Tab label="Pain Management" icon={<PainIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {plans.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No rehabilitation plans. Your care team will create one if needed.</Alert></Grid>
            ) : plans.map((p: any) => (
              <Grid item xs={12} md={6} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${typeColors[p.plan_type] || '#9e9e9e'}40` }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{p.plan_type?.charAt(0).toUpperCase() + p.plan_type?.slice(1)} Therapy</Typography>
                      <Chip label={p.status} size="small" sx={{ bgcolor: p.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: p.status === 'active' ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>Diagnosis: {p.diagnosis}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Frequency: {p.frequency}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Duration: {p.duration_weeks} weeks</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Progress</Typography>
                        <Typography variant="caption" sx={{ color: '#90caf9' }}>{p.progress_percentage}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={p.progress_percentage || 0} sx={{ height: 8, borderRadius: 4 }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>Goals: {p.goals}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {sessions.length === 0 ? (
              <Alert severity="info">No therapy sessions scheduled.</Alert>
            ) : sessions.map((s: any) => (
              <Card key={s.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>Session with {s.therapist_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(s.session_date).toLocaleDateString()} • {s.duration_minutes} min
                      </Typography>
                    </Box>
                    <Chip label={s.status} size="small" sx={{ bgcolor: s.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)', color: s.status === 'completed' ? '#81c784' : '#90caf9' }} />
                  </Stack>
                  {s.pain_level_before != null && s.pain_level_after != null && (
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      <Chip label={`Pain Before: ${s.pain_level_before}/10`} size="small" sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350' }} />
                      <Chip label={`Pain After: ${s.pain_level_after}/10`} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                    </Stack>
                  )}
                  {s.notes && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>{s.notes}</Typography>}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {activeTab === 2 && (
          <Alert severity="info">Your exercise prescriptions will appear here. Your therapist will assign exercises from your rehabilitation plan.</Alert>
        )}

        {activeTab === 3 && (
          <Grid container spacing={2}>
            {painPlans.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No pain management plans active.</Alert></Grid>
            ) : painPlans.map((p: any) => (
              <Grid item xs={12} md={6} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(244,67,54,0.3)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Pain: {p.pain_location}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={`Type: ${p.pain_type}`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={`Severity: ${p.current_severity}/10`} size="small" sx={{ bgcolor: p.current_severity >= 7 ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)', color: p.current_severity >= 7 ? '#ef5350' : '#ffb74d' }} />
                      <Chip label={p.status} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>Interventions: {p.interventions}</Typography>
                    {p.medications && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Medications: {p.medications}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
};

export default RehabilitationPage;

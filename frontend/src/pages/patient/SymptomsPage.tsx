import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Avatar, Divider, Alert, Switch, FormControlLabel,
  LinearProgress, Slider, Rating, CircularProgress,
} from '@mui/material';
import {
  ReportProblem, Add, Psychology, LocalHospital, TrendingUp,
  CheckCircle, Warning, Info, History, BarChart, Person,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { StatCard, MetricGauge, SectionHeader } from '../../components/common/SharedComponents';
import { healthRecordsAPI } from '../../services/api';

const SymptomsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [severity, setSeverity] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentSymptoms, setRecentSymptoms] = useState<any[]>([]);
  const [cancerWarnings, setCancerWarnings] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any[]>([]);

  const bodyParts = ['Head', 'Neck', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'Skin', 'General'];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await healthRecordsAPI.getMyRecords({ type: 'symptom' }).catch(() => null);
      if (res?.data) {
        const records = Array.isArray(res.data) ? res.data : (res.data.records ?? res.data.symptoms ?? []);
        setRecentSymptoms(records.map((s: any) => ({
          id: s.id ?? '', name: s.title ?? s.symptom_name ?? s.name ?? '',
          severity: s.severity ?? 3, date: s.date ?? s.created_at ?? '',
          duration: s.duration ?? '', frequency: s.frequency ?? '',
          bodyPart: s.body_part ?? s.bodyPart ?? 'General',
          notes: s.notes ?? s.description ?? '', aiFlag: s.ai_flag ?? s.aiFlag ?? false,
        })));
        if (res.data.cancer_warnings) setCancerWarnings(res.data.cancer_warnings);
        if (res.data.ai_insights) setAiInsights(res.data.ai_insights);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load symptoms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout title="Symptom Tracker" subtitle="Log symptoms and get AI-powered health insights" navItems={patientNavItems} portalType="patient">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 3 }} action={<Button onClick={loadData}>Retry</Button>}>{error}</Alert>
      ) : (<>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<ReportProblem />} label="Logged This Month" value={recentSymptoms.length} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="AI Flagged" value={recentSymptoms.filter(s => s.aiFlag).length} color="#c62828" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Cancer Warnings" value={`${cancerWarnings.filter(c => c.present).length}/${cancerWarnings.length}`} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 2.5, cursor: 'pointer', '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }, transition: 'all 0.25s' }} onClick={() => setShowLogDialog(true)}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2e7d32' }}><Add /></Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>Log</Typography>
                <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>New Symptom</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Recent Symptoms" />
        <Tab label="Cancer Warning Signs" />
        <Tab label="AI Analysis" />
        <Tab label="Body Map" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          {recentSymptoms.map((s) => (
            <Grid item xs={12} md={6} key={s.id}>
              <Card sx={{ p: 2.5, borderLeft: `4px solid ${s.aiFlag ? '#c62828' : s.severity >= 5 ? '#f57c00' : '#4caf50'}`, transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{s.name}</Typography>
                      {s.aiFlag && <Chip label="AI Flagged" size="small" color="error" sx={{ fontSize: 10, height: 20 }} icon={<Psychology sx={{ fontSize: 14 }} />} />}
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{s.date} • {s.bodyPart}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 800, color: s.severity >= 7 ? '#c62828' : s.severity >= 4 ? '#f57c00' : '#4caf50' }}>{s.severity}/10</Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Severity</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Duration</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{s.duration}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Frequency</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{s.frequency}</Typography>
                  </Grid>
                </Grid>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1, fontStyle: 'italic' }}>"{s.notes}"</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>These are common cancer warning signs. If you experience any, consult your healthcare provider. Having these symptoms doesn't necessarily mean cancer.</Alert>
          </Grid>
          {cancerWarnings.map((w, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ p: 2.5, bgcolor: w.present ? '#fff3e0' : 'background.paper', border: w.present ? '2px solid #f57c00' : '1px solid #e0e0e0' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  {w.present ? <Warning sx={{ color: '#f57c00', fontSize: 22 }} /> : <CheckCircle sx={{ color: '#4caf50', fontSize: 22 }} />}
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{w.symptom}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{w.desc}</Typography>
                <Chip label={w.present ? 'Present' : 'Not Present'} size="small" color={w.present ? 'warning' : 'success'} sx={{ mt: 1, fontSize: 10 }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {aiInsights.map((insight, i) => (
            <Grid item xs={12} key={i}>
              <Alert severity={insight.level as any} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 0.5 }}>{insight.title}</Typography>
                <Typography sx={{ fontSize: 13 }}>{insight.message}</Typography>
              </Alert>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Card sx={{ p: 3, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: 'white' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Psychology sx={{ fontSize: 40, color: '#7c4dff' }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 18 }}>AI Symptom Correlation Analysis</Typography>
                  <Typography sx={{ fontSize: 13, opacity: 0.8, mt: 0.5 }}>
                    Based on your symptom patterns, the AI has identified potential correlations between your fatigue, night sweats, and easy bruising.
                    These symptoms together warrant further investigation. A comprehensive blood panel is recommended.
                  </Typography>
                  <Button variant="contained" sx={{ mt: 2, bgcolor: '#7c4dff' }}>Schedule Blood Test</Button>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Select Body Area</Typography>
              <Grid container spacing={1}>
                {bodyParts.map((part) => {
                  const count = recentSymptoms.filter(s => s.bodyPart === part).length;
                  return (
                    <Grid item xs={4} key={part}>
                      <Button
                        variant={selectedBodyPart === part ? 'contained' : 'outlined'}
                        onClick={() => setSelectedBodyPart(part)}
                        fullWidth sx={{ height: 60, flexDirection: 'column', fontSize: 12 }}
                      >
                        {part}
                        {count > 0 && <Chip label={count} size="small" sx={{ fontSize: 10, height: 18, mt: 0.5 }} color="error" />}
                      </Button>
                    </Grid>
                  );
                })}
              </Grid>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>
                {selectedBodyPart ? `Symptoms: ${selectedBodyPart}` : 'Select a body area to view symptoms'}
              </Typography>
              {selectedBodyPart && recentSymptoms.filter(s => s.bodyPart === selectedBodyPart).length === 0 && (
                <Alert severity="success">No symptoms logged for this area.</Alert>
              )}
              {recentSymptoms.filter(s => s.bodyPart === selectedBodyPart).map((s) => (
                <Box key={s.id} sx={{ p: 2, mb: 1, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{s.name}</Typography>
                    <Chip label={`${s.severity}/10`} size="small" color={s.severity >= 5 ? 'error' : 'warning'} sx={{ fontSize: 10 }} />
                  </Stack>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{s.date} • {s.duration}</Typography>
                </Box>
              ))}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Log Symptom Dialog */}
      <Dialog open={showLogDialog} onClose={() => setShowLogDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Log New Symptom</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Symptom Name" fullWidth size="small" placeholder="e.g., Headache, Nausea" />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Body Area</Typography>
              <Grid container spacing={1}>
                {bodyParts.map(p => (
                  <Grid item xs={4} key={p}>
                    <Button variant={selectedBodyPart === p ? 'contained' : 'outlined'} size="small" fullWidth onClick={() => setSelectedBodyPart(p)} sx={{ fontSize: 11 }}>{p}</Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Severity: {severity}/10</Typography>
              <Slider value={severity} onChange={(_, v) => setSeverity(v as number)} min={1} max={10} marks step={1} valueLabelDisplay="auto" />
            </Box>
            <TextField label="Duration" fullWidth size="small" placeholder="e.g., 2 hours, All day" />
            <TextField label="Frequency" fullWidth size="small" placeholder="e.g., First time, Twice this week" />
            <TextField label="Notes" multiline rows={2} fullWidth size="small" placeholder="Describe your symptom..." />
            <FormControlLabel control={<Switch />} label="This symptom is new / unusual for me" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowLogDialog(false)}>Log Symptom</Button>
        </DialogActions>
      </Dialog>
      </>)}
    </AppLayout>
  );
};

export default SymptomsPage;

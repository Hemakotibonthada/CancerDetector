import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Watch as WatchIcon, Bloodtype as GlucoseIcon,
  Warning as FallIcon, MedicationLiquid as MedIcon,
  DirectionsWalk as GaitIcon, Air as RespIcon,
  NightsStay as SleepIcon, MonitorHeart as VitalsIcon,
  AddCircle as AddIcon, TrendingUp,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { wearableEnhancedAPI } from '../../services/api';

const WearableEnhancedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [devices, setDevices] = useState<any[]>([]);
  const [glucoseSummary, setGlucoseSummary] = useState<any[]>([]);
  const [fallEvents, setFallEvents] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [gaitData, setGaitData] = useState<any[]>([]);
  const [painData, setPainData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dev, glu, fall, rem, slp, gait, pain, st] = await Promise.all([
        wearableEnhancedAPI.getDevices().catch(() => ({ data: [] })),
        wearableEnhancedAPI.getGlucoseSummary().catch(() => ({ data: [] })),
        wearableEnhancedAPI.getFallEvents().catch(() => ({ data: [] })),
        wearableEnhancedAPI.getMedicationReminders().catch(() => ({ data: [] })),
        wearableEnhancedAPI.getSleepAnalysis().catch(() => ({ data: [] })),
        wearableEnhancedAPI.getGaitAnalysis().catch(() => ({ data: [] })),
        wearableEnhancedAPI.getPainTracking().catch(() => ({ data: [] })),
        wearableEnhancedAPI.getDashboardStats().catch(() => ({ data: {} })),
      ]);
      setDevices(dev.data || []);
      setGlucoseSummary(glu.data || []);
      setFallEvents(fall.data || []);
      setReminders(rem.data || []);
      setSleepData(slp.data || []);
      setGaitData(gait.data || []);
      setPainData(pain.data || []);
      setStats(st.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Wearable & IoT Health Monitoring" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Connected Devices', value: devices.filter(d => d.status === 'active').length, icon: <WatchIcon />, color: '#2196f3' },
            { label: 'Fall Events', value: fallEvents.length, icon: <FallIcon />, color: '#f44336' },
            { label: 'Med Reminders', value: reminders.filter(r => r.is_active).length, icon: <MedIcon />, color: '#4caf50' },
            { label: 'Sleep Score', value: sleepData.length > 0 ? sleepData[0].sleep_score || '-' : '-', icon: <SleepIcon />, color: '#9c27b0' },
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
          <Tab label="Devices" icon={<WatchIcon />} iconPosition="start" />
          <Tab label="Glucose" icon={<GlucoseIcon />} iconPosition="start" />
          <Tab label="Sleep" icon={<SleepIcon />} iconPosition="start" />
          <Tab label="Gait" icon={<GaitIcon />} iconPosition="start" />
          <Tab label="Pain Tracking" icon={<VitalsIcon />} iconPosition="start" />
          <Tab label="Med Reminders" icon={<MedIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {devices.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No wearable devices connected. Register a device to start tracking your health data.</Alert></Grid>
            ) : devices.map((d: any) => (
              <Grid item xs={12} md={6} lg={4} key={d.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${d.status === 'active' ? '#4caf50' : '#9e9e9e'}40` }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <WatchIcon sx={{ color: d.status === 'active' ? '#4caf50' : '#9e9e9e', fontSize: 36 }} />
                      <Chip label={d.status} size="small" sx={{ bgcolor: d.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: d.status === 'active' ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>{d.manufacturer} {d.model}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Type: {d.device_type}</Typography>
                    {d.battery_level != null && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Battery: {d.battery_level}%</Typography>
                        <LinearProgress variant="determinate" value={d.battery_level} sx={{ height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.1)',
                          '& .MuiLinearProgress-bar': { bgcolor: d.battery_level > 50 ? '#4caf50' : d.battery_level > 20 ? '#ff9800' : '#f44336' } }} />
                      </Box>
                    )}
                    {d.last_sync && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mt: 1 }}>Last sync: {new Date(d.last_sync).toLocaleString()}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2}>
            {glucoseSummary.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No glucose data. Connect a CGM device to track glucose levels.</Alert></Grid>
            ) : glucoseSummary.map((g: any) => (
              <Grid item xs={12} md={6} key={g.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>Glucose Summary</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(g.period_start).toLocaleDateString()} - {new Date(g.period_end).toLocaleDateString()}
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ color: '#2196f3' }}>{g.average_glucose}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>Avg mg/dL</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ color: '#4caf50' }}>{g.time_in_range_pct}%</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>In Range</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ color: '#ff9800' }}>{g.gmi || '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>GMI</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {sleepData.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No sleep analysis data available.</Alert></Grid>
            ) : sleepData.map((s: any) => (
              <Grid item xs={12} md={6} key={s.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{new Date(s.sleep_date).toLocaleDateString()}</Typography>
                      <Chip label={`Score: ${s.sleep_score}`} sx={{ bgcolor: s.sleep_score >= 80 ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)', color: s.sleep_score >= 80 ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid item xs={3} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#90caf9' }}>{s.total_sleep_hours?.toFixed(1)}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Total hrs</Typography>
                      </Grid>
                      <Grid item xs={3} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#1a237e' }}>{s.deep_sleep_hours?.toFixed(1)}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Deep</Typography>
                      </Grid>
                      <Grid item xs={3} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#4a148c' }}>{s.rem_sleep_hours?.toFixed(1)}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>REM</Typography>
                      </Grid>
                      <Grid item xs={3} sx={{ textAlign: 'center' }}>
                        <Typography variant="h6" sx={{ color: '#ff9800' }}>{s.awakenings}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Wakeups</Typography>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Sleep Efficiency: {s.sleep_efficiency}%</Typography>
                      <LinearProgress variant="determinate" value={s.sleep_efficiency || 0} sx={{ height: 4, borderRadius: 2 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 3 && (
          <Grid container spacing={2}>
            {gaitData.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No gait analysis data. Wear your device while walking to collect data.</Alert></Grid>
            ) : gaitData.map((g: any) => (
              <Grid item xs={12} md={6} key={g.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{new Date(g.analysis_date).toLocaleDateString()}</Typography>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {[
                        { label: 'Steps', value: g.step_count, color: '#4caf50' },
                        { label: 'Stride (cm)', value: g.stride_length_cm, color: '#2196f3' },
                        { label: 'Speed (m/s)', value: g.gait_speed_mps?.toFixed(2), color: '#ff9800' },
                        { label: 'Cadence', value: g.cadence, color: '#9c27b0' },
                      ].map((m, i) => (
                        <Grid item xs={3} key={i} sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ color: m.color }}>{m.value}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{m.label}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                    {g.fall_risk_score != null && (
                      <Chip label={`Fall Risk: ${g.fall_risk_score}`} size="small" sx={{ mt: 1, bgcolor: g.fall_risk_score > 50 ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)', color: g.fall_risk_score > 50 ? '#ef5350' : '#81c784' }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {painData.length === 0 ? (
              <Alert severity="info">No pain tracking entries. Log your pain levels to track trends.</Alert>
            ) : painData.map((p: any) => (
              <Card key={p.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{p.pain_location}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{p.pain_type} • {new Date(p.recorded_at).toLocaleString()}</Typography>
                    </Box>
                    <Chip label={`${p.pain_level}/10`} sx={{ bgcolor: p.pain_level >= 7 ? 'rgba(244,67,54,0.3)' : p.pain_level >= 4 ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                      color: p.pain_level >= 7 ? '#ef5350' : p.pain_level >= 4 ? '#ffb74d' : '#81c784', fontSize: 16, fontWeight: 700 }} />
                  </Stack>
                  {p.triggers && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>Triggers: {p.triggers}</Typography>}
                  {p.relief_measures && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Relief: {p.relief_measures}</Typography>}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {activeTab === 5 && (
          <Grid container spacing={2}>
            {reminders.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No medication reminders set up.</Alert></Grid>
            ) : reminders.map((r: any) => (
              <Grid item xs={12} md={6} lg={4} key={r.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${r.is_active ? '#4caf50' : '#9e9e9e'}40` }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <MedIcon sx={{ color: r.is_active ? '#4caf50' : '#9e9e9e', fontSize: 32 }} />
                      <Chip label={r.is_active ? 'Active' : 'Paused'} size="small" sx={{ bgcolor: r.is_active ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: r.is_active ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>{r.medication_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Dosage: {r.dosage}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Time: {r.scheduled_time}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Frequency: {r.frequency}</Typography>
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

export default WearableEnhancedPage;

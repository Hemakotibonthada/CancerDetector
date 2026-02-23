import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Avatar, Divider, Alert, Switch, FormControlLabel,
  LinearProgress, Tooltip, Slider, CircularProgress,
} from '@mui/material';
import {
  Watch, Favorite, DirectionsWalk, Bedtime, Speed, Thermostat,
  FitnessCenter, Sync, BatteryFull, Bluetooth, CloudSync,
  Settings, Info, TrendingUp, TrendingDown, Timeline,
  Opacity, AirlineSeatFlat, SelfImprovement, MonitorHeart,
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart, Tooltip as RTooltip } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { StatCard, MetricGauge } from '../../components/common/SharedComponents';
import { smartwatchAPI } from '../../services/api';

const SmartwatchPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showDeviceDialog, setShowDeviceDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done'>('idle');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [watchData, setWatchData] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const [dashRes, dataRes] = await Promise.all([
        smartwatchAPI.getDashboard().catch(() => ({ data: null })),
        smartwatchAPI.getData({ limit: 7 }),
      ]);
      setDashboard(dashRes.data);
      const data = Array.isArray(dataRes.data) ? dataRes.data : (dataRes.data?.items || []);
      setWatchData(data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load smartwatch data:', err);
      setError('Failed to load smartwatch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const deviceInfo = dashboard?.device || {
    name: 'No device connected', model: '-', firmware: '-',
    battery: 0, lastSync: '-', connected: false,
    serialNumber: '-', storage: '-', os: '-'
  };

  const latest = watchData.length > 0 ? watchData[0] : null;
  const heartRateData = watchData.slice(0, 7).reverse().map((d: any, i: number) => ({
    time: `D${i+1}`, rate: d.avg_heart_rate || 70, min: d.min_heart_rate || 55, max: d.max_heart_rate || 90,
  }));

  const sleepData = latest ? [
    { stage: 'Awake', duration: latest.awake_time || 0.5, color: '#ef5350', pct: latest.awake_pct || 6 },
    { stage: 'REM', duration: latest.rem_sleep || 1.8, color: '#7b1fa2', pct: latest.rem_pct || 23 },
    { stage: 'Light', duration: latest.light_sleep || 3.2, color: '#42a5f5', pct: latest.light_pct || 41 },
    { stage: 'Deep', duration: latest.deep_sleep || 2.3, color: '#1565c0', pct: latest.deep_pct || 30 },
  ] : [];

  const weeklySteps = watchData.slice(0, 7).reverse().map((d: any, i: number) => ({
    day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7], steps: d.steps || 0,
  }));

  const spo2Data = watchData.slice(0, 7).reverse().map((d: any, i: number) => ({
    time: `D${i+1}`, value: d.avg_spo2 || d.spo2 || 97,
  }));

  const stressData = watchData.slice(0, 7).reverse().map((d: any, i: number) => ({
    time: `D${i+1}`, level: d.stress_level || d.avg_stress || 30,
  }));

  const weeklyActivity = watchData.slice(0, 7).reverse().map((d: any, i: number) => ({
    day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7], calories: d.calories_burned || d.calories || 0,
  }));

  const handleSync = () => {
    setSyncStatus('syncing');
    setTimeout(() => { setSyncStatus('done'); loadDashboard(); }, 2000);
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  return (
    <AppLayout title="Smartwatch Data" subtitle="Monitor real-time health data from your wearable" navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : !latest ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Watch sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No smartwatch data available</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>Connect a smartwatch device to start monitoring</Typography>
          <Button variant="contained" sx={{ mt: 2 }} startIcon={<Bluetooth />} onClick={() => setShowDeviceDialog(true)}>Connect Device</Button>
        </Card>
      ) : <>
      {/* Device Status Bar */}
      <Card sx={{ p: 2, mb: 3, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: '#ffffff20', width: 48, height: 48 }}><Watch /></Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{deviceInfo.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Bluetooth sx={{ fontSize: 14 }} />
                <Typography sx={{ fontSize: 12, opacity: 0.8 }}>{deviceInfo.connected ? 'Connected' : 'Disconnected'}</Typography>
                <Typography sx={{ fontSize: 12, opacity: 0.6 }}>• Last sync: {deviceInfo.lastSync}</Typography>
              </Stack>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <BatteryFull sx={{ fontSize: 20, color: deviceInfo.battery > 20 ? '#4caf50' : '#f44336' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{deviceInfo.battery}%</Typography>
            </Stack>
            <Button
              variant="outlined"
              size="small"
              startIcon={syncStatus === 'syncing' ? <Sync sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } } }} /> : <CloudSync />}
              onClick={handleSync}
              sx={{ color: 'white', borderColor: '#ffffff40', fontSize: 12 }}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'done' ? '✓ Synced' : 'Sync Now'}
            </Button>
            <IconButton size="small" sx={{ color: 'white' }} onClick={() => setShowDeviceDialog(true)}>
              <Settings sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        </Stack>
      </Card>

      {/* Live Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Favorite sx={{ fontSize: 28, color: '#c62828', mb: 0.5 }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#c62828' }}>{latest?.avg_heart_rate || latest?.heart_rate || '-'}</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Heart Rate (bpm)</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Opacity sx={{ fontSize: 28, color: '#1565c0', mb: 0.5 }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1565c0' }}>{latest?.avg_spo2 || latest?.spo2 || '-'}%</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>SpO2</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <DirectionsWalk sx={{ fontSize: 28, color: '#2e7d32', mb: 0.5 }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#2e7d32' }}>{(latest?.steps || 0).toLocaleString()}</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Steps Today</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <FitnessCenter sx={{ fontSize: 28, color: '#f57c00', mb: 0.5 }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#f57c00' }}>{latest?.calories_burned || latest?.calories || 0}</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Calories Burned</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <Bedtime sx={{ fontSize: 28, color: '#7b1fa2', mb: 0.5 }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#7b1fa2' }}>{latest?.sleep_duration || latest?.total_sleep ? `${(latest.sleep_duration || latest.total_sleep).toFixed(1)}h` : '-'}</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Sleep Last Night</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ p: 2, textAlign: 'center' }}>
            <SelfImprovement sx={{ fontSize: 28, color: '#00897b', mb: 0.5 }} />
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#00897b' }}>{latest?.stress_level || latest?.avg_stress || '-'}</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Stress Level</Typography>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Heart Rate" />
        <Tab label="Sleep Analysis" />
        <Tab label="Activity & Steps" />
        <Tab label="SpO2 & Stress" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Heart Rate - Today</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={heartRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[40, 140]} />
                  <RTooltip />
                  <Area type="monotone" dataKey="max" stackId="1" stroke="#ffcdd2" fill="#ffcdd2" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="rate" stackId="2" stroke="#c62828" fill="#ef5350" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="min" stackId="3" stroke="#ef9a9a" fill="#ef9a9a" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Today's Summary</Typography>
              {[
                { label: 'Resting HR', value: '62 bpm', icon: <Favorite sx={{ fontSize: 16, color: '#4caf50' }} />, desc: 'Normal range' },
                { label: 'Average HR', value: '78 bpm', icon: <MonitorHeart sx={{ fontSize: 16, color: '#1565c0' }} />, desc: 'Good' },
                { label: 'Max HR', value: '132 bpm', icon: <TrendingUp sx={{ fontSize: 16, color: '#f57c00' }} />, desc: 'During workout' },
                { label: 'Min HR', value: '56 bpm', icon: <TrendingDown sx={{ fontSize: 16, color: '#7b1fa2' }} />, desc: 'During sleep' },
              ].map((item) => (
                <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {item.icon}
                    <Box>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.label}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.desc}</Typography>
                    </Box>
                  </Stack>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{item.value}</Typography>
                </Stack>
              ))}
            </Card>
            <Card sx={{ p: 2, bgcolor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Info sx={{ fontSize: 18, color: '#2e7d32' }} />
                <Typography sx={{ fontSize: 12, color: '#2e7d32', fontWeight: 500 }}>
                  Your heart rate variability has improved by 12% this week.
                </Typography>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Last Night's Sleep</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <MetricGauge value={82} max={100} size={140} color="#7b1fa2" label="Sleep Score" />
              </Box>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Bedtime</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>10:32 PM</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Wake Time</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>6:18 AM</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Total Sleep</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>7h 46m</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Time to Fall Asleep</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600 }}>12 min</Typography>
                </Stack>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Sleep Stages Breakdown</Typography>
              {sleepData.map((stage) => (
                <Box key={stage.stage} sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: stage.color }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{stage.stage}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{stage.duration}h ({stage.pct}%)</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate" value={stage.pct}
                    sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: stage.color, borderRadius: 4 } }}
                  />
                </Box>
              ))}
            </Card>
            <Card sx={{ p: 2, bgcolor: '#f3e5f5', border: '1px solid #e1bee7' }}>
              <Typography sx={{ fontSize: 12, color: '#7b1fa2', fontWeight: 500 }}>
                💡 Your deep sleep is above average (30%). Maintain your current bedtime routine for optimal recovery.
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Weekly Steps</Typography>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weeklySteps}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Bar dataKey="steps" fill="#2e7d32" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 3, mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Activity Rings</Typography>
              {[
                { label: 'Calories', value: 420, goal: 500, color: '#c62828', icon: <FitnessCenter sx={{ fontSize: 16, color: '#c62828' }} /> },
                { label: 'Active Minutes', value: 45, goal: 60, color: '#4caf50', icon: <DirectionsWalk sx={{ fontSize: 16, color: '#4caf50' }} /> },
                { label: 'Stand Hours', value: 10, goal: 12, color: '#1565c0', icon: <AirlineSeatFlat sx={{ fontSize: 16, color: '#1565c0' }} /> },
              ].map((ring) => (
                <Box key={ring.label} sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {ring.icon}
                      <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{ring.label}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{ring.value}/{ring.goal}</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate" value={Math.min((ring.value / ring.goal) * 100, 100)}
                    sx={{ height: 10, borderRadius: 5, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: ring.color, borderRadius: 5 } }}
                  />
                </Box>
              ))}
            </Card>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 2 }}>Weekly Activity</Typography>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyActivity}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Bar dataKey="calories" fill="#c62828" radius={[3, 3, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Blood Oxygen (SpO2) - Today</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={spo2Data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[90, 100]} />
                  <RTooltip />
                  <Area type="monotone" dataKey="value" stroke="#1565c0" fill="#bbdefb" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
              <Alert severity="success" sx={{ mt: 1, fontSize: 12 }}>SpO2 levels are consistently above 95% - Normal range</Alert>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Stress Level - Today</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={stressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <RTooltip />
                  <Area type="monotone" dataKey="level" stroke="#f57c00" fill="#ffe0b2" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                {[
                  { label: 'Avg', value: '35', c: '#4caf50' },
                  { label: 'Peak', value: '72', c: '#f57c00' },
                  { label: 'Low', value: '18', c: '#1565c0' },
                ].map(s => (
                  <Box key={s.label} sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: '#f8f9ff', borderRadius: 1 }}>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: s.c }}>{s.value}</Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      </>}

      {/* Device Settings Dialog */}
      <Dialog open={showDeviceDialog} onClose={() => setShowDeviceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Device Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {Object.entries(deviceInfo).map(([key, val]) => (
              <Stack key={key} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Typography sx={{ fontSize: 13, textTransform: 'capitalize', color: 'text.secondary' }}>{key.replace(/([A-Z])/g, ' $1')}</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{String(val)}</Typography>
              </Stack>
            ))}
            <Divider />
            <FormControlLabel control={<Switch defaultChecked />} label="Auto sync every 15 minutes" />
            <FormControlLabel control={<Switch defaultChecked />} label="Background heart rate monitoring" />
            <FormControlLabel control={<Switch defaultChecked />} label="Sleep tracking" />
            <FormControlLabel control={<Switch />} label="Blood oxygen during sleep" />
            <FormControlLabel control={<Switch defaultChecked />} label="Fall detection alerts" />
            <FormControlLabel control={<Switch defaultChecked />} label="Irregular rhythm notifications" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeviceDialog(false)}>Close</Button>
          <Button variant="contained" color="error">Disconnect Device</Button>
          <Button variant="contained">Save Settings</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default SmartwatchPage;

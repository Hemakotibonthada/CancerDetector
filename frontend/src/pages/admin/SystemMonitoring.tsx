import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  LinearProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, Avatar, Divider, CircularProgress,
} from '@mui/material';
import {
  Speed, Memory, Storage, Dns, CloudQueue, Timer,
  TrendingUp, Warning, CheckCircle, Error as ErrorIcon,
  Refresh, Settings, Notifications, MonitorHeart,
  DataUsage, NetworkCheck, Schedule,
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';
import { adminAPI } from '../../services/api';

const SystemMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('1h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [serverMetrics, setServerMetrics] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [apiEndpoints, setApiEndpoints] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [cronJobs, setCronJobs] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.systemHealth();
      const d = res.data ?? res;
      setServerMetrics(d.server_metrics ?? d.serverMetrics ?? []);
      setServices(d.services ?? []);
      setApiEndpoints(d.api_endpoints ?? d.apiEndpoints ?? []);
      setAlerts(d.alerts ?? []);
      setCronJobs(d.cron_jobs ?? d.cronJobs ?? []);
    } catch {
      setError('Failed to load system monitoring data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <AppLayout title="System Monitoring" subtitle="Real-time system health & performance" navItems={adminNavItems} portalType="admin">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="System Monitoring" subtitle="Real-time system health & performance" navItems={adminNavItems} portalType="admin">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {services.some(s => s.status !== 'running') && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>Service Alert:</strong> {services.filter(s => s.status !== 'running').map(s => s.name).join(', ')} - performance issues detected
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Speed />} label="CPU Usage" value="33%" color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Memory />} label="Memory" value="51%" color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Storage />} label="Disk" value="40%" color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<NetworkCheck />} label="Network I/O" value="20 MB/s" color="#7b1fa2" /></Grid>
      </Grid>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label="Resources" />
          <Tab label="Services" />
          <Tab label="API Performance" />
          <Tab label="Alerts" />
          <Tab label="Cron Jobs" />
        </Tabs>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <MenuItem value="1h">1 Hour</MenuItem><MenuItem value="6h">6 Hours</MenuItem><MenuItem value="24h">24 Hours</MenuItem><MenuItem value="7d">7 Days</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>CPU & Memory Usage</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={serverMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="cpu" stroke="#1565c0" fill="#e3f2fd" strokeWidth={2} name="CPU %" />
                  <Area type="monotone" dataKey="memory" stroke="#4caf50" fill="#e8f5e9" strokeWidth={2} name="Memory %" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Disk & Network I/O</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={serverMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="disk" stroke="#f57c00" strokeWidth={2} dot={false} name="Disk %" />
                  <Line type="monotone" dataKey="network" stroke="#9c27b0" strokeWidth={2} dot={false} name="Network MB/s" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {services.map((s) => (
            <Grid item xs={12} sm={6} md={4} key={s.name}>
              <Card sx={{ p: 2.5, borderLeft: `3px solid ${s.status === 'running' ? '#4caf50' : s.status === 'degraded' ? '#ff9800' : '#d32f2f'}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{s.name}</Typography>
                  <StatusBadge status={s.status} />
                </Stack>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>CPU</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <LinearProgress variant="determinate" value={s.cpu} sx={{ height: 6, borderRadius: 3, flex: 1 }} color={s.cpu > 70 ? 'warning' : 'success'} />
                      <Typography sx={{ fontSize: 10, fontWeight: 700, width: 28 }}>{s.cpu}%</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Memory</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{s.memory >= 1024 ? `${(s.memory/1024).toFixed(1)} GB` : `${s.memory} MB`}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Uptime</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{s.uptime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Version</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace' }}>{s.version}</Typography>
                  </Grid>
                </Grid>
                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                  <Chip label={`${s.instances} instance${s.instances > 1 ? 's' : ''}`} size="small" sx={{ fontSize: 9 }} />
                  <Chip label={`Port ${s.port}`} size="small" variant="outlined" sx={{ fontSize: 9 }} />
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Endpoint', 'Method', 'Avg Response', 'P99', 'RPM', 'Errors', 'Health'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {apiEndpoints.map((ep) => (
                  <TableRow key={ep.endpoint} hover>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{ep.endpoint}</TableCell>
                    <TableCell><Chip label={ep.method} size="small" color={ep.method === 'GET' ? 'success' : 'primary'} sx={{ fontSize: 10, fontWeight: 700, height: 22 }} /></TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{ep.avgTime}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: parseInt(ep.p99) > 500 ? '#d32f2f' : 'inherit' }}>{ep.p99}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{ep.rpm}</TableCell>
                    <TableCell>
                      <Chip label={ep.errors} size="small" color={ep.errors > 0 ? 'error' : 'success'} sx={{ fontSize: 10, fontWeight: 700, height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 50, height: 6, borderRadius: 3, bgcolor: ep.errors > 0 ? '#ffcdd2' : parseInt(ep.p99) > 500 ? '#fff3e0' : '#e8f5e9' }}>
                        <Box sx={{ width: `${100 - ep.errors * 10}%`, height: '100%', borderRadius: 3, bgcolor: ep.errors > 0 ? '#f44336' : parseInt(ep.p99) > 500 ? '#ff9800' : '#4caf50' }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 3 && (
        <Stack spacing={1.5}>
          {alerts.map((a, i) => (
            <Alert key={i} severity={a.severity === 'resolved' ? 'success' : a.severity as any} sx={{ '& .MuiAlert-message': { flex: 1 } }}
              action={!a.acknowledged && <Button size="small" color="inherit">Acknowledge</Button>}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontSize: 13 }}>{a.message}</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', ml: 2 }}>{a.time}</Typography>
              </Stack>
            </Alert>
          ))}
        </Stack>
      )}

      {activeTab === 4 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Job Name', 'Schedule', 'Last Run', 'Next Run', 'Duration', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {cronJobs.map((j) => (
                  <TableRow key={j.name} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{j.name}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{j.schedule}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{j.lastRun}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{j.nextRun}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{j.duration}</TableCell>
                    <TableCell><StatusBadge status={j.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </AppLayout>
  );
};

export default SystemMonitoring;

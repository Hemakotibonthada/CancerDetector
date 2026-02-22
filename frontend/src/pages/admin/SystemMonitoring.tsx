import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  LinearProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, FormControl, InputLabel,
  Switch, FormControlLabel, Avatar, Divider,
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

const SystemMonitoring: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('1h');

  const serverMetrics = [
    { time: '10:00', cpu: 22, memory: 45, disk: 38, network: 12 },
    { time: '10:05', cpu: 28, memory: 46, disk: 38, network: 15 },
    { time: '10:10', cpu: 35, memory: 48, disk: 38, network: 22 },
    { time: '10:15', cpu: 42, memory: 52, disk: 39, network: 28 },
    { time: '10:20', cpu: 38, memory: 50, disk: 39, network: 25 },
    { time: '10:25', cpu: 30, memory: 49, disk: 39, network: 18 },
    { time: '10:30', cpu: 25, memory: 47, disk: 39, network: 14 },
    { time: '10:35', cpu: 45, memory: 55, disk: 40, network: 35 },
    { time: '10:40', cpu: 55, memory: 58, disk: 40, network: 42 },
    { time: '10:45', cpu: 48, memory: 56, disk: 40, network: 38 },
    { time: '10:50', cpu: 33, memory: 51, disk: 40, network: 20 },
    { time: '10:55', cpu: 28, memory: 48, disk: 40, network: 15 },
  ];

  const services = [
    { name: 'API Gateway', status: 'running', cpu: 15, memory: 512, uptime: '45d 12h', version: 'v3.2.1', instances: 3, port: 8000 },
    { name: 'Web Frontend', status: 'running', cpu: 8, memory: 256, uptime: '45d 12h', version: 'v3.2.1', instances: 2, port: 3000 },
    { name: 'AI/ML Engine', status: 'running', cpu: 67, memory: 4096, uptime: '12d 5h', version: 'v3.3.0', instances: 2, port: 8501 },
    { name: 'PostgreSQL', status: 'running', cpu: 25, memory: 2048, uptime: '90d 3h', version: '15.4', instances: 1, port: 5432 },
    { name: 'Redis Cache', status: 'running', cpu: 5, memory: 1024, uptime: '90d 3h', version: '7.2', instances: 1, port: 6379 },
    { name: 'Notification Worker', status: 'degraded', cpu: 78, memory: 512, uptime: '3d 8h', version: 'v2.1.0', instances: 1, port: 8080 },
    { name: 'Background Jobs', status: 'running', cpu: 12, memory: 256, uptime: '45d 12h', version: 'v2.5.0', instances: 1, port: 8081 },
    { name: 'File Storage', status: 'running', cpu: 3, memory: 128, uptime: '90d 3h', version: 'v1.0', instances: 1, port: 9000 },
  ];

  const apiEndpoints = [
    { endpoint: '/api/auth/login', method: 'POST', avgTime: '45ms', p99: '120ms', rpm: 85, errors: 0 },
    { endpoint: '/api/patients', method: 'GET', avgTime: '32ms', p99: '95ms', rpm: 120, errors: 0 },
    { endpoint: '/api/cancer-detection/predict', method: 'POST', avgTime: '250ms', p99: '800ms', rpm: 15, errors: 1 },
    { endpoint: '/api/health-records', method: 'GET', avgTime: '28ms', p99: '85ms', rpm: 95, errors: 0 },
    { endpoint: '/api/blood-samples', method: 'POST', avgTime: '55ms', p99: '150ms', rpm: 35, errors: 0 },
    { endpoint: '/api/appointments', method: 'GET', avgTime: '22ms', p99: '65ms', rpm: 60, errors: 0 },
    { endpoint: '/api/notifications', method: 'GET', avgTime: '120ms', p99: '450ms', rpm: 200, errors: 3 },
    { endpoint: '/api/analytics/dashboard', method: 'GET', avgTime: '180ms', p99: '650ms', rpm: 25, errors: 0 },
  ];

  const alerts = [
    { severity: 'warning', message: 'Notification Worker CPU usage above 75%', time: '5 min ago', acknowledged: false },
    { severity: 'info', message: 'AI Model retraining completed successfully', time: '15 min ago', acknowledged: true },
    { severity: 'warning', message: 'API endpoint /notifications P99 latency > 400ms', time: '20 min ago', acknowledged: false },
    { severity: 'info', message: 'Database backup completed', time: '1 hr ago', acknowledged: true },
    { severity: 'resolved', message: 'Disk usage alert resolved (was 85%, now 40%)', time: '2 hrs ago', acknowledged: true },
  ];

  const cronJobs = [
    { name: 'Database Backup', schedule: 'Every 6 hours', lastRun: '1 hr ago', nextRun: '5 hrs', status: 'completed', duration: '12 min' },
    { name: 'AI Model Evaluation', schedule: 'Daily at 2 AM', lastRun: '8 hrs ago', nextRun: '16 hrs', status: 'completed', duration: '45 min' },
    { name: 'Cache Cleanup', schedule: 'Every 30 min', lastRun: '12 min ago', nextRun: '18 min', status: 'completed', duration: '2 sec' },
    { name: 'Email Digest', schedule: 'Daily at 8 AM', lastRun: '2 hrs ago', nextRun: '22 hrs', status: 'completed', duration: '5 min' },
    { name: 'Data Archival', schedule: 'Weekly Sunday', lastRun: '3 days ago', nextRun: '4 days', status: 'completed', duration: '2 hrs' },
    { name: 'Health Check', schedule: 'Every 5 min', lastRun: '2 min ago', nextRun: '3 min', status: 'running', duration: '-' },
  ];

  return (
    <AppLayout title="System Monitoring" subtitle="Real-time system health & performance" navItems={adminNavItems} portalType="admin">
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

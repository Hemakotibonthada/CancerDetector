import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  LinearProgress, Avatar, Divider, Alert,
} from '@mui/material';
import {
  Dashboard, People, LocalHospital, Security, Psychology,
  Analytics, Settings, Assessment, Gavel, Storage,
  Notifications, Speed, TrendingUp, TrendingDown,
  Warning, CheckCircle, Error as ErrorIcon, MonitorHeart,
  Cloud, BugReport, Build, Code,
  Shield, Hub, Payment, School,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, StatusBadge, GlassCard, SectionHeader } from '../../components/common/SharedComponents';
import { NavItem } from '../../components/common/AppLayout';

export const adminNavItems: NavItem[] = [
  { icon: <Dashboard />, label: 'Dashboard', path: '/admin', section: 'Overview' },
  { icon: <People />, label: 'User Management', path: '/admin/users', section: 'Management' },
  { icon: <LocalHospital />, label: 'Hospital Management', path: '/admin/hospitals', section: 'Management' },
  { icon: <Speed />, label: 'System Monitoring', path: '/admin/system', section: 'System' },
  { icon: <Psychology />, label: 'AI Model Management', path: '/admin/ai-models', section: 'System' },
  { icon: <Security />, label: 'Security & Compliance', path: '/admin/security', section: 'System' },
  { icon: <Analytics />, label: 'Platform Analytics', path: '/admin/analytics', section: 'Analytics' },
  { icon: <Gavel />, label: 'Audit Logs', path: '/admin/audit-logs', section: 'Analytics' },
  { icon: <Assessment />, label: 'Reports', path: '/admin/reports', section: 'Analytics' },
  { icon: <Settings />, label: 'Configuration', path: '/admin/config', section: 'Configuration' },
  { icon: <Notifications />, label: 'Notifications', path: '/admin/notifications', section: 'Configuration' },
  { icon: <Shield />, label: 'Compliance', path: '/admin/compliance', section: 'Governance' },
  { icon: <Storage />, label: 'Data Management', path: '/admin/data-management', section: 'Governance' },
  { icon: <Payment />, label: 'Billing', path: '/admin/billing', section: 'Business' },
  { icon: <Hub />, label: 'Integrations', path: '/admin/integrations', section: 'System' },
  { icon: <School />, label: 'Training Center', path: '/admin/training', section: 'Business' },
];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const platformStats = [
    { month: 'Jul', users: 3200, hospitals: 12, predictions: 4500, revenue: 125000 },
    { month: 'Aug', users: 3800, hospitals: 14, predictions: 5200, revenue: 142000 },
    { month: 'Sep', users: 4200, hospitals: 15, predictions: 5800, revenue: 158000 },
    { month: 'Oct', users: 4800, hospitals: 18, predictions: 6500, revenue: 175000 },
    { month: 'Nov', users: 5500, hospitals: 20, predictions: 7200, revenue: 192000 },
    { month: 'Dec', users: 6200, hospitals: 22, predictions: 8100, revenue: 215000 },
  ];

  const systemHealth = [
    { service: 'API Server', status: 'healthy', uptime: 99.99, responseTime: '45ms', load: 23 },
    { service: 'Database', status: 'healthy', uptime: 99.95, responseTime: '12ms', load: 45 },
    { service: 'AI Engine', status: 'healthy', uptime: 99.90, responseTime: '250ms', load: 67 },
    { service: 'Storage', status: 'healthy', uptime: 99.99, responseTime: '8ms', load: 38 },
    { service: 'Auth Service', status: 'healthy', uptime: 99.99, responseTime: '25ms', load: 12 },
    { service: 'Notification Service', status: 'warning', uptime: 99.85, responseTime: '120ms', load: 78 },
  ];

  const recentActivity = [
    { action: 'New hospital registered', entity: 'Metro Health Center', time: '5 min ago', type: 'hospital', user: 'System' },
    { action: 'AI model retrained', entity: 'Ensemble NeuralNet v3.3', time: '15 min ago', type: 'ai', user: 'AutoML' },
    { action: 'User account locked', entity: 'user@example.com', time: '22 min ago', type: 'security', user: 'Security Bot' },
    { action: 'System backup completed', entity: 'Full Backup', time: '1 hr ago', type: 'system', user: 'CronJob' },
    { action: 'New report generated', entity: 'Q4 Platform Report', time: '2 hrs ago', type: 'report', user: 'Admin' },
    { action: 'Database migration', entity: 'Migration v52', time: '3 hrs ago', type: 'system', user: 'DevOps' },
    { action: 'HIPAA audit passed', entity: 'Annual Compliance', time: '1 day ago', type: 'compliance', user: 'Auditor' },
    { action: 'Model accuracy alert', entity: 'SVM accuracy < 90%', time: '1 day ago', type: 'ai', user: 'Monitor' },
  ];

  const userDistribution = [
    { name: 'Patients', value: 4800, color: '#1565c0' },
    { name: 'Doctors', value: 350, color: '#4caf50' },
    { name: 'Hospital Staff', value: 680, color: '#ff9800' },
    { name: 'Admins', value: 15, color: '#9c27b0' },
  ];

  return (
    <AppLayout title="Admin Dashboard" subtitle="Platform administration & monitoring" navItems={adminNavItems} portalType="admin">
      {systemHealth.some(s => s.status !== 'healthy') && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>System Alert:</strong> {systemHealth.filter(s => s.status !== 'healthy').map(s => s.service).join(', ')} - Performance degradation detected
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<People />} label="Total Users" value="6,200" color="#1565c0" change="+12.7%" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<LocalHospital />} label="Hospitals" value="22" color="#4caf50" change="+2" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Psychology />} label="AI Predictions" value="8,100" color="#f57c00" change="+12.5%" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Speed />} label="System Uptime" value="99.9%" color="#7b1fa2" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Overview" />
        <Tab label="System Health" />
        <Tab label="Activity Feed" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Platform Growth</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={platformStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="users" stroke="#1565c0" fill="#e3f2fd" strokeWidth={2} name="Users" />
                  <Area type="monotone" dataKey="predictions" stroke="#4caf50" fill="#e8f5e9" strokeWidth={2} name="Predictions" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>User Distribution</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={userDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" label={({name, value}) => `${value}`}>
                    {userDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Stack spacing={0.5}>
                {userDistribution.map(u => (
                  <Stack key={u.name} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: u.color }} />
                      <Typography sx={{ fontSize: 11 }}>{u.name}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{u.value.toLocaleString()}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Add User', icon: <People />, color: '#1565c0' },
                  { label: 'Add Hospital', icon: <LocalHospital />, color: '#4caf50' },
                  { label: 'Retrain Models', icon: <Psychology />, color: '#f57c00' },
                  { label: 'Run Audit', icon: <Gavel />, color: '#9c27b0' },
                  { label: 'Backup Data', icon: <Storage />, color: '#d32f2f' },
                  { label: 'View Logs', icon: <Code />, color: '#00796b' },
                  { label: 'Generate Report', icon: <Assessment />, color: '#c62828' },
                  { label: 'System Config', icon: <Build />, color: '#455a64' },
                ].map(a => (
                  <Grid item xs={6} sm={3} md={1.5} key={a.label}>
                    <Card sx={{ p: 1.5, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' } }}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: `${a.color}15`, color: a.color, mx: 'auto', mb: 0.5 }}>{a.icon}</Avatar>
                      <Typography sx={{ fontSize: 10, fontWeight: 600 }}>{a.label}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {systemHealth.map((s) => (
            <Grid item xs={12} sm={6} md={4} key={s.service}>
              <Card sx={{ p: 2.5, borderLeft: `3px solid ${s.status === 'healthy' ? '#4caf50' : s.status === 'warning' ? '#ff9800' : '#d32f2f'}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{s.service}</Typography>
                  <StatusBadge status={s.status} />
                </Stack>
                <Grid container spacing={1}>
                  <Grid item xs={4}><Box><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Uptime</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{s.uptime}%</Typography></Box></Grid>
                  <Grid item xs={4}><Box><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Response</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{s.responseTime}</Typography></Box></Grid>
                  <Grid item xs={4}><Box><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Load</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>{s.load}%</Typography></Box></Grid>
                </Grid>
                <LinearProgress variant="determinate" value={s.load} sx={{ mt: 1.5, height: 6, borderRadius: 3 }} color={s.load > 70 ? 'warning' : 'success'} />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Card sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Recent Activity</Typography>
          <Stack spacing={1}>
            {recentActivity.map((a, i) => (
              <Stack key={i} direction="row" spacing={2} alignItems="center" sx={{ p: 1.5, bgcolor: i % 2 === 0 ? '#f8f9ff' : 'white', borderRadius: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: a.type === 'hospital' ? '#e8f5e9' : a.type === 'ai' ? '#fff3e0' : a.type === 'security' ? '#fce4ec' : a.type === 'compliance' ? '#e8eaf6' : '#f5f5f5', color: a.type === 'hospital' ? '#2e7d32' : a.type === 'ai' ? '#f57c00' : a.type === 'security' ? '#c62828' : a.type === 'compliance' ? '#3f51b5' : '#757575' }}>
                  {a.type === 'hospital' ? <LocalHospital sx={{ fontSize: 18 }} /> : a.type === 'ai' ? <Psychology sx={{ fontSize: 18 }} /> : a.type === 'security' ? <Security sx={{ fontSize: 18 }} /> : a.type === 'compliance' ? <Gavel sx={{ fontSize: 18 }} /> : <Build sx={{ fontSize: 18 }} />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{a.action}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{a.entity} • By {a.user}</Typography>
                </Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{a.time}</Typography>
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </AppLayout>
  );
};

export default AdminDashboard;

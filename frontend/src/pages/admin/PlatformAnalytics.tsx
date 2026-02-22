import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Avatar, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Analytics, TrendingUp, People, LocalHospital, Science,
  Public, DeviceHub, Timeline, Assessment, PieChart as PieIcon,
  Speed, Visibility, PhoneAndroid, DesktopWindows, Tablet,
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Legend,
  Tooltip, ComposedChart,
} from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, SectionHeader } from '../../components/common/SharedComponents';

const PlatformAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [period, setPeriod] = useState('30d');

  const userGrowth = [
    { month: 'Jul', patients: 2400, doctors: 180, staff: 320, hospitals: 8 },
    { month: 'Aug', patients: 3100, doctors: 210, staff: 380, hospitals: 10 },
    { month: 'Sep', patients: 3800, doctors: 245, staff: 420, hospitals: 12 },
    { month: 'Oct', patients: 4500, doctors: 275, staff: 480, hospitals: 14 },
    { month: 'Nov', patients: 5200, doctors: 310, staff: 540, hospitals: 16 },
    { month: 'Dec', patients: 6100, doctors: 350, staff: 620, hospitals: 18 },
  ];

  const featureAdoption = [
    { feature: 'Cancer Risk Assessment', usage: 92, users: 5612 },
    { feature: 'Blood Test Analysis', usage: 87, users: 5307 },
    { feature: 'AI Health Score', usage: 85, users: 5185 },
    { feature: 'Smartwatch Integration', usage: 68, users: 4148 },
    { feature: 'Appointment Booking', usage: 78, users: 4758 },
    { feature: 'Telemedicine', usage: 55, users: 3355 },
    { feature: 'Health Goals', usage: 45, users: 2745 },
    { feature: 'Symptom Tracker', usage: 62, users: 3782 },
    { feature: 'Medication Manager', usage: 72, users: 4392 },
    { feature: 'Health Records', usage: 80, users: 4880 },
  ];

  const geoDistribution = [
    { region: 'North America', patients: 2800, hospitals: 8, color: '#1565c0' },
    { region: 'Europe', patients: 1500, hospitals: 4, color: '#4caf50' },
    { region: 'Asia Pacific', patients: 1200, hospitals: 3, color: '#ff9800' },
    { region: 'Middle East', patients: 400, hospitals: 2, color: '#9c27b0' },
    { region: 'South America', patients: 200, hospitals: 1, color: '#00bcd4' },
  ];

  const dailyActive = [
    { day: 'Mon', dau: 3200, sessions: 8500, avgTime: 12.5 },
    { day: 'Tue', dau: 3500, sessions: 9200, avgTime: 13.2 },
    { day: 'Wed', dau: 3400, sessions: 8800, avgTime: 11.8 },
    { day: 'Thu', dau: 3100, sessions: 7900, avgTime: 12.0 },
    { day: 'Fri', dau: 2900, sessions: 7200, avgTime: 10.5 },
    { day: 'Sat', dau: 1800, sessions: 4500, avgTime: 8.2 },
    { day: 'Sun', dau: 1500, sessions: 3800, avgTime: 7.5 },
  ];

  const deviceBreakdown = [
    { name: 'Desktop', value: 45, color: '#1565c0', icon: <DesktopWindows /> },
    { name: 'Mobile', value: 40, color: '#4caf50', icon: <PhoneAndroid /> },
    { name: 'Tablet', value: 15, color: '#ff9800', icon: <Tablet /> },
  ];

  const kpis = [
    { name: 'Monthly Active Users', current: 5200, target: 6000, trend: +12 },
    { name: 'Patient Engagement Rate', current: 78, target: 85, trend: +5 },
    { name: 'Screening Completion', current: 85, target: 90, trend: +3 },
    { name: 'AI Detection Accuracy', current: 94.7, target: 95, trend: +1.2 },
    { name: 'Platform Uptime', current: 99.95, target: 99.99, trend: 0 },
    { name: 'NPS Score', current: 72, target: 80, trend: +4 },
    { name: 'Support Ticket Resolution', current: 92, target: 95, trend: +2 },
    { name: 'Data Processing Time', current: 250, target: 200, trend: -15 },
  ];

  return (
    <AppLayout title="Platform Analytics" subtitle="Comprehensive platform insights" navItems={adminNavItems} portalType="admin">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<People />} label="Total Users" value="7,070" color="#1565c0" change="+12%" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<LocalHospital />} label="Hospitals" value="18" color="#4caf50" change="+2" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Science />} label="AI Predictions" value="45.2K" color="#9c27b0" change="+18%" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Speed />} label="Engagement" value="78%" color="#f57c00" change="+5%" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="User Growth" />
        <Tab label="Feature Adoption" />
        <Tab label="Engagement" />
        <Tab label="Geography" />
        <Tab label="KPI Tracker" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>User Growth Trends</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select value={period} onChange={(e) => setPeriod(e.target.value as string)}>
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                    <MenuItem value="30d">Last 30 Days</MenuItem>
                    <MenuItem value="90d">Last 90 Days</MenuItem>
                    <MenuItem value="1y">Last Year</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="patients" stackId="1" stroke="#1565c0" fill="#1565c020" strokeWidth={2} name="Patients" />
                  <Area type="monotone" dataKey="staff" stackId="1" stroke="#4caf50" fill="#4caf5020" strokeWidth={2} name="Staff" />
                  <Area type="monotone" dataKey="doctors" stackId="1" stroke="#ff9800" fill="#ff980020" strokeWidth={2} name="Doctors" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {[
                { label: 'Patients', value: '6,100', growth: '+17.3%', color: '#1565c0' },
                { label: 'Doctors', value: '350', growth: '+12.9%', color: '#ff9800' },
                { label: 'Staff', value: '620', growth: '+14.8%', color: '#4caf50' },
                { label: 'Hospitals', value: '18', growth: '+12.5%', color: '#9c27b0' },
              ].map(s => (
                <Grid item xs={6} sm={3} key={s.label}>
                  <Card sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${s.color}` }}>
                    <Typography sx={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</Typography>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{s.label}</Typography>
                    <Chip label={s.growth} size="small" sx={{ mt: 0.5, bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Feature Adoption Rates</Typography>
          <Stack spacing={1.5}>
            {featureAdoption.sort((a, b) => b.usage - a.usage).map((f) => (
              <Box key={f.feature}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{f.feature}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{f.users.toLocaleString()} users</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{f.usage}%</Typography>
                  </Stack>
                </Stack>
                <LinearProgress variant="determinate" value={f.usage} sx={{ height: 10, borderRadius: 5, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { borderRadius: 5, background: f.usage > 80 ? 'linear-gradient(90deg, #1565c0, #42a5f5)' : f.usage > 60 ? 'linear-gradient(90deg, #4caf50, #81c784)' : 'linear-gradient(90deg, #ff9800, #ffb74d)' } }} />
              </Box>
            ))}
          </Stack>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Daily Active Users & Sessions</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={dailyActive}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Bar yAxisId="left" dataKey="dau" fill="#1565c020" stroke="#1565c0" name="DAU" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="sessions" stroke="#ff9800" strokeWidth={2} dot={{ r: 4 }} name="Sessions" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Device Breakdown</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deviceBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {deviceBreakdown.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {deviceBreakdown.map(d => (
                  <Stack key={d.name} direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color }} />
                    <Typography sx={{ fontSize: 12, flex: 1 }}>{d.name}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{d.value}%</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Geographic Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={geoDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Bar dataKey="patients" fill="#1565c0" name="Patients" radius={[0, 4, 4, 0]} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              {geoDistribution.map(g => (
                <Card key={g.region} sx={{ p: 2, borderLeft: `3px solid ${g.color}` }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{g.region}</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                    <Box><Typography sx={{ fontSize: 20, fontWeight: 800, color: g.color }}>{g.patients.toLocaleString()}</Typography><Typography sx={{ fontSize: 10 }}>patients</Typography></Box>
                    <Box><Typography sx={{ fontSize: 20, fontWeight: 800 }}>{g.hospitals}</Typography><Typography sx={{ fontSize: 10 }}>hospitals</Typography></Box>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={2}>
          {kpis.map((k) => (
            <Grid item xs={12} sm={6} md={3} key={k.name}>
              <Card sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', mb: 1 }}>{k.name}</Typography>
                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography sx={{ fontWeight: 800, fontSize: 24, color: k.current >= k.target ? '#4caf50' : '#ff9800' }}>
                    {typeof k.current === 'number' && k.current > 100 ? k.current.toLocaleString() : k.current}
                    {k.name.includes('%') || k.name.includes('Rate') || k.name.includes('Accuracy') || k.name.includes('Uptime') || k.name.includes('Completion') || k.name.includes('Resolution') ? '%' : ''}
                    {k.name.includes('Time') ? 'ms' : ''}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>/ {k.target}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min((k.current / k.target) * 100, 100)} sx={{ mt: 1, height: 6, borderRadius: 3 }} color={k.current >= k.target ? 'success' : 'warning'} />
                <Chip label={`${k.trend > 0 ? '+' : ''}${k.trend}`} size="small" sx={{ mt: 1, fontSize: 10, fontWeight: 700, bgcolor: k.trend > 0 ? '#e8f5e9' : k.trend < 0 ? '#ffebee' : '#f5f5f5', color: k.trend > 0 ? '#2e7d32' : k.trend < 0 ? '#d32f2f' : '#9e9e9e' }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </AppLayout>
  );
};

export default PlatformAnalytics;

import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Avatar, Divider, IconButton, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Dashboard, People, LocalHospital, CalendarMonth, Science,
  Bed, Assessment, Psychology, Settings, PersonAdd, TrendingUp,
  TrendingDown, Warning, CheckCircle, AccessTime, Notifications,
  Groups, MedicalServices, BarChart as BarIcon, EventAvailable,
  Bloodtype,
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, MetricGauge, SectionHeader, StatusBadge } from '../../components/common/SharedComponents';

export const hospitalNavItems = [
  { section: 'Overview', icon: <Dashboard />, label: 'Dashboard', path: '/hospital/dashboard' },
  { section: 'Patients', icon: <People />, label: 'Patient Management', path: '/hospital/patients' },
  { section: 'Patients', icon: <PersonAdd />, label: 'Admissions', path: '/hospital/admissions' },
  { section: 'Staff', icon: <MedicalServices />, label: 'Doctor Management', path: '/hospital/doctors' },
  { section: 'Staff', icon: <Groups />, label: 'Staff Directory', path: '/hospital/staff' },
  { section: 'Clinical', icon: <CalendarMonth />, label: 'Appointments', path: '/hospital/appointments' },
  { section: 'Clinical', icon: <Science />, label: 'Lab Management', path: '/hospital/lab' },
  { section: 'Clinical', icon: <Bed />, label: 'Bed Management', path: '/hospital/beds' },
  { section: 'Clinical', icon: <MedicalServices />, label: 'Surgery', path: '/hospital/surgery' },
  { section: 'Clinical', icon: <Science />, label: 'Pharmacy', path: '/hospital/pharmacy' },
  { section: 'Clinical', icon: <Science />, label: 'Radiology', path: '/hospital/radiology' },
  { section: 'Clinical', icon: <MedicalServices />, label: 'Emergency', path: '/hospital/emergency' },
  { section: 'Clinical', icon: <Science />, label: 'Telemedicine', path: '/hospital/telemedicine' },
  { section: 'Clinical', icon: <Bloodtype />, label: 'Blood Bank', path: '/hospital/blood-bank' },
  { section: 'AI & Analytics', icon: <Psychology />, label: 'AI Predictions', path: '/hospital/ai-analytics' },
  { section: 'AI & Analytics', icon: <Assessment />, label: 'Reports', path: '/hospital/reports' },
  { section: 'AI & Analytics', icon: <BarIcon />, label: 'Analytics', path: '/hospital/analytics' },
  { section: 'Research', icon: <Science />, label: 'Clinical Trials', path: '/hospital/clinical-trials' },
  { section: 'Research', icon: <Assessment />, label: 'Quality Metrics', path: '/hospital/quality' },
  { section: 'Management', icon: <Settings />, label: 'Settings', path: '/hospital/settings' },
];

const HospitalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const patientStats = [
    { day: 'Mon', admissions: 12, discharges: 8, outpatient: 45 },
    { day: 'Tue', admissions: 15, discharges: 10, outpatient: 52 },
    { day: 'Wed', admissions: 8, discharges: 12, outpatient: 38 },
    { day: 'Thu', admissions: 20, discharges: 14, outpatient: 60 },
    { day: 'Fri', admissions: 18, discharges: 16, outpatient: 55 },
    { day: 'Sat', admissions: 6, discharges: 5, outpatient: 20 },
    { day: 'Sun', admissions: 4, discharges: 3, outpatient: 12 },
  ];

  const departmentStats = [
    { name: 'Oncology', patients: 45, beds: 60, occupancy: 75, color: '#c62828' },
    { name: 'Cardiology', patients: 38, beds: 50, occupancy: 76, color: '#1565c0' },
    { name: 'Neurology', patients: 22, beds: 40, occupancy: 55, color: '#7b1fa2' },
    { name: 'Surgery', patients: 30, beds: 45, occupancy: 67, color: '#2e7d32' },
    { name: 'ICU', patients: 18, beds: 20, occupancy: 90, color: '#f57c00' },
    { name: 'Pediatrics', patients: 15, beds: 30, occupancy: 50, color: '#00897b' },
  ];

  const riskPatients = [
    { id: 'P001', name: 'John Davis', age: 65, risk: 82, cancer: 'Lung', status: 'Critical', ward: 'Oncology', admitDate: 'Feb 15', doctor: 'Dr. Smith' },
    { id: 'P002', name: 'Mary Johnson', age: 58, risk: 75, cancer: 'Breast', status: 'Monitoring', ward: 'Oncology', admitDate: 'Feb 18', doctor: 'Dr. Lee' },
    { id: 'P003', name: 'Robert Brown', age: 72, risk: 68, cancer: 'Prostate', status: 'Stable', ward: 'Surgery', admitDate: 'Feb 20', doctor: 'Dr. Chen' },
    { id: 'P004', name: 'Susan Wilson', age: 45, risk: 45, cancer: 'Screening', status: 'Follow-up', ward: 'Outpatient', admitDate: 'Feb 22', doctor: 'Dr. Park' },
  ];

  const recentActivities = [
    { action: 'Patient admitted', detail: 'John Davis - Oncology Ward', time: '10 min ago', type: 'admission' },
    { action: 'Lab results ready', detail: 'Blood panel for Mary Johnson', time: '25 min ago', type: 'lab' },
    { action: 'Surgery completed', detail: 'Biopsy - Robert Brown', time: '1 hour ago', type: 'surgery' },
    { action: 'AI Risk Alert', detail: 'High risk detected for Patient P089', time: '2 hours ago', type: 'alert' },
    { action: 'Doctor scheduled', detail: 'Dr. Lee assigned to Ward B', time: '3 hours ago', type: 'staff' },
    { action: 'Bed assigned', detail: 'ICU Bed #12 - Emergency admission', time: '4 hours ago', type: 'bed' },
  ];

  const revenueData = [
    { month: 'Sep', revenue: 1200000 }, { month: 'Oct', revenue: 1350000 },
    { month: 'Nov', revenue: 1180000 }, { month: 'Dec', revenue: 1420000 },
    { month: 'Jan', revenue: 1500000 }, { month: 'Feb', revenue: 1380000 },
  ];

  const appointmentTypes = [
    { name: 'Screening', value: 35, color: '#1565c0' },
    { name: 'Follow-up', value: 28, color: '#4caf50' },
    { name: 'Consultation', value: 20, color: '#f57c00' },
    { name: 'Emergency', value: 12, color: '#c62828' },
    { name: 'Telemedicine', value: 5, color: '#7b1fa2' },
  ];

  return (
    <AppLayout title="Hospital Dashboard" subtitle="Cancer Research Center - Overview" navItems={hospitalNavItems} portalType="hospital">
      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}><StatCard icon={<People />} label="Total Patients" value="1,248" color="#1565c0" change={+5.2} /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard icon={<Bed />} label="Bed Occupancy" value="72%" color="#f57c00" change={-2.1} /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard icon={<MedicalServices />} label="Active Doctors" value="45" color="#2e7d32" /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard icon={<Science />} label="Pending Labs" value="23" color="#7b1fa2" /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard icon={<CalendarMonth />} label="Today's Appts" value="67" color="#00897b" /></Grid>
        <Grid item xs={6} sm={4} md={2}><StatCard icon={<Warning />} label="Critical Alerts" value="3" color="#c62828" /></Grid>
      </Grid>

      {/* Alerts */}
      <Alert severity="error" sx={{ mb: 2 }}>
        <strong>ICU Alert:</strong> Bed occupancy at 90%. Consider transfer protocols for stable patients.
      </Alert>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Overview" />
        <Tab label="High-Risk Patients" />
        <Tab label="Department Stats" />
        <Tab label="Activity Feed" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, mb: 2 }}>
              <SectionHeader title="Weekly Patient Flow" />
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={patientStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Bar dataKey="admissions" fill="#1565c0" name="Admissions" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="discharges" fill="#4caf50" name="Discharges" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outpatient" fill="#f57c00" name="Outpatient" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Revenue Trend (6 months)" />
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} />
                  <RTooltip formatter={(v: any) => [`$${(v / 1000).toLocaleString()}K`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, mb: 2 }}>
              <SectionHeader title="Appointment Types" />
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={appointmentTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                    {appointmentTypes.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {appointmentTypes.map(a => (
                  <Stack key={a.name} direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: a.color }} />
                    <Typography sx={{ fontSize: 12, flex: 1 }}>{a.name}</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{a.value}%</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Quick Actions" />
              <Grid container spacing={1}>
                {[
                  { label: 'New Admission', icon: <PersonAdd />, color: '#1565c0' },
                  { label: 'Order Lab', icon: <Science />, color: '#7b1fa2' },
                  { label: 'Schedule Appt', icon: <EventAvailable />, color: '#2e7d32' },
                  { label: 'View Reports', icon: <Assessment />, color: '#f57c00' },
                ].map(action => (
                  <Grid item xs={6} key={action.label}>
                    <Button variant="outlined" fullWidth sx={{ py: 2, flexDirection: 'column', fontSize: 11, borderColor: '#e0e0e0', color: action.color }}>
                      {action.icon}
                      <Typography sx={{ fontSize: 10, mt: 0.5 }}>{action.label}</Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fce4ec' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Patient ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Age</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Cancer Risk</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Cancer Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Ward</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Doctor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riskPatients.map((p) => (
                  <TableRow key={p.id} hover sx={{ bgcolor: p.risk > 70 ? '#fff5f5' : 'inherit' }}>
                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{p.id}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{p.name}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.age}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 40, height: 8, borderRadius: 4, bgcolor: '#f0f0f0', overflow: 'hidden' }}>
                          <Box sx={{ width: `${p.risk}%`, height: '100%', bgcolor: p.risk > 70 ? '#c62828' : p.risk > 40 ? '#f57c00' : '#4caf50' }} />
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: p.risk > 70 ? '#c62828' : p.risk > 40 ? '#f57c00' : '#4caf50' }}>{p.risk}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.cancer}</TableCell>
                    <TableCell><StatusBadge status={p.status.toLowerCase()} /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.ward}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.doctor}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" sx={{ fontSize: 10, mr: 0.5 }}>View</Button>
                      <Button size="small" variant="contained" sx={{ fontSize: 10 }}>AI Report</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {departmentStats.map((dept) => (
            <Grid item xs={12} sm={6} md={4} key={dept.name}>
              <Card sx={{ p: 3, borderTop: `4px solid ${dept.color}` }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>{dept.name}</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Patients</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{dept.patients}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Total Beds</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{dept.beds}</Typography>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Occupancy</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: dept.occupancy > 80 ? '#c62828' : dept.color }}>{dept.occupancy}%</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate" value={dept.occupancy}
                    sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: dept.occupancy > 80 ? '#c62828' : dept.color, borderRadius: 4 } }}
                  />
                </Box>
                {dept.occupancy > 80 && <Alert severity="warning" sx={{ mt: 1.5, fontSize: 11 }}>High occupancy - consider patient transfers</Alert>}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Card sx={{ p: 3 }}>
          <SectionHeader title="Recent Activity" />
          <Stack spacing={0}>
            {recentActivities.map((a, i) => (
              <Box key={i} sx={{ py: 2, borderBottom: i < recentActivities.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{
                    width: 36, height: 36, fontSize: 14,
                    bgcolor: a.type === 'alert' ? '#fce4ec' : a.type === 'lab' ? '#f3e5f5' : a.type === 'surgery' ? '#e8f5e9' : '#e3f2fd',
                    color: a.type === 'alert' ? '#c62828' : a.type === 'lab' ? '#7b1fa2' : a.type === 'surgery' ? '#2e7d32' : '#1565c0',
                  }}>
                    {a.type === 'alert' ? <Warning /> : a.type === 'lab' ? <Science /> : a.type === 'surgery' ? <LocalHospital /> : <People />}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{a.action}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{a.detail}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{a.time}</Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Card>
      )}
    </AppLayout>
  );
};

export default HospitalDashboard;

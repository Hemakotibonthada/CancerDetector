import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Avatar, Divider, IconButton, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress,
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
import { hospitalsAPI, analyticsAPI } from '../../services/api';

export const hospitalNavItems = [
  { section: 'Overview', icon: <Dashboard />, label: 'Dashboard', path: '/hospital/dashboard' },
  { section: 'Patients', icon: <People />, label: 'User Management', path: '/hospital/patients' },
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
  { section: 'Advanced', icon: <Science />, label: 'Pathology', path: '/hospital/pathology' },
  { section: 'Advanced', icon: <Assessment />, label: 'Supply Chain', path: '/hospital/supply-chain' },
  { section: 'Advanced', icon: <MedicalServices />, label: 'Quality & Safety', path: '/hospital/quality-safety' },
  { section: 'Advanced', icon: <Science />, label: 'Genomics Lab', path: '/hospital/genomics-lab' },
  { section: 'Advanced', icon: <People />, label: 'Population Health', path: '/hospital/population-health' },
  { section: 'Advanced', icon: <Science />, label: 'Clinical Trials+', path: '/hospital/clinical-trials-mgmt' },
  { section: 'Advanced', icon: <MedicalServices />, label: 'Pharmacy+', path: '/hospital/pharmacy-enhanced' },
  { section: 'Advanced', icon: <Science />, label: 'Radiology+', path: '/hospital/radiology-enhanced' },
  { section: 'Advanced', icon: <MedicalServices />, label: 'Emergency+', path: '/hospital/emergency-enhanced' },
  { section: 'Advanced', icon: <Psychology />, label: 'Clinical Decision', path: '/hospital/clinical-decision' },
  { section: 'Advanced', icon: <MedicalServices />, label: 'Rehabilitation', path: '/hospital/rehabilitation' },
  { section: 'Advanced', icon: <Science />, label: 'Nutrition Mgmt', path: '/hospital/nutrition' },
  { section: 'Management', icon: <Settings />, label: 'Settings', path: '/hospital/settings' },
];

const HospitalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [patientStats, setPatientStats] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [riskPatients, setRiskPatients] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [appointmentTypes, setAppointmentTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes] = await Promise.all([
        analyticsAPI.getOverview(),
      ]);
      const overview = overviewRes.data ?? overviewRes;

      setPatientStats(overview.patient_stats ?? overview.patientStats ?? []);
      setDepartmentStats(overview.department_stats ?? overview.departmentStats ?? []);
      setRiskPatients(overview.risk_patients ?? overview.riskPatients ?? []);
      setRecentActivities(overview.recent_activities ?? overview.recentActivities ?? []);
      setRevenueData(overview.revenue_data ?? overview.revenueData ?? []);
      setAppointmentTypes(overview.appointment_types ?? overview.appointmentTypes ?? []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppLayout title="Hospital Dashboard" subtitle="Cancer Research Center - Overview" navItems={hospitalNavItems} portalType="hospital">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (<>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
      </>)}
    </AppLayout>
  );
};

export default HospitalDashboard;

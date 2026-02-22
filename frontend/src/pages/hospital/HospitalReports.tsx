import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, TextField, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Assessment, Download, CalendarMonth, TrendingUp, PictureAsPdf,
  TableChart, BarChart as BarChartIcon, Schedule, Share,
  Print, FilterList, Add,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, StatusBadge } from '../../components/common/SharedComponents';

const HospitalReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showCustomReport, setShowCustomReport] = useState(false);

  const dailyStats = [
    { metric: 'Total Admissions', value: 28, change: '+12%', trend: 'up' },
    { metric: 'Discharges', value: 22, change: '+5%', trend: 'up' },
    { metric: 'Surgeries', value: 8, change: '-2%', trend: 'down' },
    { metric: 'Lab Tests', value: 156, change: '+18%', trend: 'up' },
    { metric: 'Outpatient Visits', value: 85, change: '+8%', trend: 'up' },
    { metric: 'Emergency Cases', value: 12, change: '-15%', trend: 'down' },
    { metric: 'Cancer Screenings', value: 34, change: '+22%', trend: 'up' },
    { metric: 'AI Predictions', value: 89, change: '+35%', trend: 'up' },
  ];

  const monthlyRevenue = [
    { month: 'Jul', inpatient: 2.1, outpatient: 1.5, lab: 0.8, pharmacy: 0.4, total: 4.8 },
    { month: 'Aug', inpatient: 2.3, outpatient: 1.6, lab: 0.9, pharmacy: 0.5, total: 5.3 },
    { month: 'Sep', inpatient: 2.0, outpatient: 1.7, lab: 0.85, pharmacy: 0.45, total: 5.0 },
    { month: 'Oct', inpatient: 2.5, outpatient: 1.8, lab: 0.95, pharmacy: 0.5, total: 5.75 },
    { month: 'Nov', inpatient: 2.4, outpatient: 1.9, lab: 1.0, pharmacy: 0.55, total: 5.85 },
    { month: 'Dec', inpatient: 2.6, outpatient: 2.0, lab: 1.1, pharmacy: 0.6, total: 6.3 },
  ];

  const departmentStats = [
    { dept: 'Oncology', patients: 145, revenue: '$1.2M', occupancy: '85%', satisfaction: 4.5 },
    { dept: 'Cardiology', patients: 120, revenue: '$980K', occupancy: '78%', satisfaction: 4.6 },
    { dept: 'Surgery', patients: 95, revenue: '$1.5M', occupancy: '72%', satisfaction: 4.3 },
    { dept: 'Emergency', patients: 210, revenue: '$650K', occupancy: '65%', satisfaction: 4.1 },
    { dept: 'Neurology', patients: 78, revenue: '$720K', occupancy: '70%', satisfaction: 4.7 },
    { dept: 'Pathology', patients: 0, revenue: '$450K', occupancy: '-', satisfaction: 4.8 },
  ];

  const savedReports = [
    { name: 'Monthly Executive Summary', type: 'PDF', created: '2024-01-01', schedule: 'Monthly', status: 'active' },
    { name: 'Weekly Census Report', type: 'Excel', created: '2024-01-07', schedule: 'Weekly', status: 'active' },
    { name: 'Q4 Financial Report', type: 'PDF', created: '2023-12-31', schedule: 'Quarterly', status: 'completed' },
    { name: 'Cancer Screening Report', type: 'PDF', created: '2024-01-05', schedule: 'Monthly', status: 'active' },
    { name: 'Staff Performance Review', type: 'Excel', created: '2024-01-01', schedule: 'Monthly', status: 'active' },
    { name: 'AI Model Accuracy Report', type: 'PDF', created: '2024-01-03', schedule: 'Weekly', status: 'active' },
  ];

  const diseasePrevalence = [
    { name: 'Breast Cancer', value: 25, color: '#e91e63' },
    { name: 'Lung Cancer', value: 20, color: '#2196f3' },
    { name: 'Colorectal', value: 18, color: '#4caf50' },
    { name: 'Prostate', value: 15, color: '#ff9800' },
    { name: 'Skin Cancer', value: 12, color: '#9c27b0' },
    { name: 'Other', value: 10, color: '#607d8b' },
  ];

  return (
    <AppLayout title="Reports" subtitle="Hospital analytics and reporting" navItems={hospitalNavItems} portalType="hospital">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Assessment />} label="Reports Generated" value={24} color="#1565c0" change="+8" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Schedule />} label="Scheduled" value={6} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Download />} label="Downloads" value={156} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Share />} label="Shared" value={12} color="#7b1fa2" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Daily Summary" />
        <Tab label="Revenue & Finance" />
        <Tab label="Department Stats" />
        <Tab label="Disease Prevalence" />
        <Tab label="Saved Reports" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Today's Dashboard - {new Date().toLocaleDateString()}</Typography>
                <Stack direction="row" spacing={1}>
                  <Button size="small" startIcon={<Print />} variant="outlined">Print</Button>
                  <Button size="small" startIcon={<Download />} variant="contained">Export PDF</Button>
                </Stack>
              </Stack>
              <Grid container spacing={2}>
                {dailyStats.map((s) => (
                  <Grid item xs={6} sm={3} key={s.metric}>
                    <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: 2, textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#1565c0' }}>{s.value}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{s.metric}</Typography>
                      <Chip label={s.change} size="small" color={s.trend === 'up' ? 'success' : 'error'} sx={{ fontSize: 10, mt: 0.5 }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Monthly Revenue Breakdown ($M)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Bar dataKey="inpatient" stackId="a" fill="#1565c0" name="Inpatient" />
                  <Bar dataKey="outpatient" stackId="a" fill="#4caf50" name="Outpatient" />
                  <Bar dataKey="lab" stackId="a" fill="#ff9800" name="Lab" />
                  <Bar dataKey="pharmacy" stackId="a" fill="#9c27b0" name="Pharmacy" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Revenue Trend</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="total" stroke="#1565c0" strokeWidth={3} dot={{ r: 5 }} name="Total Revenue ($M)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Department', 'Patients', 'Revenue', 'Occupancy', 'Satisfaction', 'Performance'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {departmentStats.map((d) => (
                  <TableRow key={d.dept} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{d.dept}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>{d.patients}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.revenue}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{d.occupancy}</TableCell>
                    <TableCell>
                      <Chip label={`${d.satisfaction}/5`} size="small" color={d.satisfaction >= 4.5 ? 'success' : d.satisfaction >= 4 ? 'warning' : 'error'} sx={{ fontSize: 11, fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ width: 60, height: 6, borderRadius: 3, bgcolor: '#f0f0f0', overflow: 'hidden' }}>
                        <Box sx={{ width: `${d.satisfaction * 20}%`, height: '100%', borderRadius: 3, bgcolor: d.satisfaction >= 4.5 ? '#4caf50' : '#ff9800' }} />
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
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Cancer Type Distribution</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={diseasePrevalence} cx="50%" cy="50%" outerRadius={110} dataKey="value" label={({name, value}) => `${name}: ${value}%`}>
                    {diseasePrevalence.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Key Metrics</Typography>
              <Stack spacing={2}>
                {[
                  { label: 'Total Cancer Cases', value: '157', change: '+12 from last month' },
                  { label: 'Early Detection Rate', value: '87.3%', change: '+5.2% improvement' },
                  { label: 'Screening Compliance', value: '78.5%', change: 'Target: 85%' },
                  { label: '5-Year Survival Rate', value: '82.1%', change: '+3.4% improvement' },
                  { label: 'Readmission Rate', value: '4.2%', change: 'Below 5% target' },
                  { label: 'Treatment Success', value: '79.8%', change: '+2.1% from Q3' },
                ].map((m) => (
                  <Stack key={m.label} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{m.label}</Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{m.change}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#1565c0' }}>{m.value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowCustomReport(true)}>Custom Report</Button>
          </Stack>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                    {['Report Name', 'Type', 'Created', 'Schedule', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedReports.map((r) => (
                    <TableRow key={r.name} hover>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{r.name}</TableCell>
                      <TableCell><Chip label={r.type} size="small" color={r.type === 'PDF' ? 'error' : 'success'} variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.created}</TableCell>
                      <TableCell><Chip label={r.schedule} size="small" sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Button size="small" startIcon={<Download />} sx={{ fontSize: 10 }}>Download</Button>
                          <Button size="small" startIcon={<Share />} sx={{ fontSize: 10 }}>Share</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {/* Custom Report Dialog */}
      <Dialog open={showCustomReport} onClose={() => setShowCustomReport(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create Custom Report</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Report Name" fullWidth size="small" />
            <FormControl fullWidth size="small"><InputLabel>Report Type</InputLabel><Select label="Report Type">
              <MenuItem value="census">Census Report</MenuItem><MenuItem value="revenue">Revenue Report</MenuItem><MenuItem value="clinical">Clinical Report</MenuItem><MenuItem value="screening">Screening Report</MenuItem><MenuItem value="ai">AI Analytics Report</MenuItem>
            </Select></FormControl>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Start Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="End Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <FormControl fullWidth size="small"><InputLabel>Format</InputLabel><Select label="Format"><MenuItem value="pdf">PDF</MenuItem><MenuItem value="excel">Excel</MenuItem><MenuItem value="csv">CSV</MenuItem></Select></FormControl>
            <FormControl fullWidth size="small"><InputLabel>Schedule</InputLabel><Select label="Schedule"><MenuItem value="once">One-time</MenuItem><MenuItem value="daily">Daily</MenuItem><MenuItem value="weekly">Weekly</MenuItem><MenuItem value="monthly">Monthly</MenuItem></Select></FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomReport(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowCustomReport(false)}>Generate Report</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default HospitalReports;

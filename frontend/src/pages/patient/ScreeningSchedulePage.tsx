import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Switch, FormControlLabel, Divider,
} from '@mui/material';
import {
  EventNote, CalendarMonth, CheckCircle, Warning, Schedule, Notifications,
  MedicalServices, LocalHospital, TrendingUp, Done, PriorityHigh,
  Assignment, Timer, Science,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, GlassCard, SectionHeader, StatusBadge } from '../../components/common/SharedComponents';
import { patientNavItems } from './PatientDashboard';

const SCREENING_SCHEDULE = [
  { id: '1', cancer_type: 'Breast', test: 'Mammogram', recommended: '2025-01-15', frequency: 'Annual', status: 'scheduled', last_done: '2024-01-20', risk: 'high', provider: 'National Cancer Center' },
  { id: '2', cancer_type: 'Colorectal', test: 'Colonoscopy', recommended: '2025-03-01', frequency: 'Every 5 yrs', status: 'upcoming', last_done: '2020-03-15', risk: 'moderate', provider: 'City Hospital' },
  { id: '3', cancer_type: 'Cervical', test: 'Pap Smear + HPV', recommended: '2024-12-01', frequency: 'Every 3 yrs', status: 'overdue', last_done: '2021-12-10', risk: 'low', provider: 'Women\'s Health Clinic' },
  { id: '4', cancer_type: 'Skin', test: 'Full Body Exam', recommended: '2025-02-20', frequency: 'Annual', status: 'upcoming', last_done: '2024-02-15', risk: 'moderate', provider: 'Dermatology Center' },
  { id: '5', cancer_type: 'Lung', test: 'Low-dose CT', recommended: '2025-06-01', frequency: 'Annual', status: 'upcoming', last_done: '2024-06-20', risk: 'low', provider: 'Lung Health Center' },
  { id: '6', cancer_type: 'Prostate', test: 'PSA Test', recommended: '2025-04-15', frequency: 'Annual', status: 'upcoming', last_done: '2024-04-10', risk: 'low', provider: 'Urology Clinic' },
  { id: '7', cancer_type: 'Thyroid', test: 'Thyroid Ultrasound', recommended: '2024-11-15', frequency: 'Every 2 yrs', status: 'completed', last_done: '2024-11-15', risk: 'low', provider: 'Endocrine Center' },
];

const SCREENING_STATS = [
  { name: 'Completed', value: 1, fill: '#4caf50' },
  { name: 'Scheduled', value: 1, fill: '#5e92f3' },
  { name: 'Upcoming', value: 4, fill: '#ff9800' },
  { name: 'Overdue', value: 1, fill: '#f44336' },
];

const GUIDELINES = [
  { cancer: 'Breast', who: 'Women 40+', guidelines: 'Annual mammogram starting at 40. Consider earlier if BRCA+.', organization: 'ACS', urgency: 'Important for you' },
  { cancer: 'Colorectal', who: 'Adults 45+', guidelines: 'Colonoscopy every 10 years, or FIT test annually.', organization: 'ACS', urgency: 'Schedule soon' },
  { cancer: 'Cervical', who: 'Women 21-65', guidelines: 'Pap smear every 3 years, or co-test every 5 years.', organization: 'USPSTF', urgency: 'Overdue' },
  { cancer: 'Lung', who: 'Age 50-80, 20+ pack-year', guidelines: 'Annual low-dose CT for current/former smokers.', organization: 'USPSTF', urgency: 'Monitor' },
  { cancer: 'Skin', who: 'All adults', guidelines: 'Annual skin exam, especially with risk factors.', organization: 'AAD', urgency: 'Schedule soon' },
  { cancer: 'Prostate', who: 'Men 50+', guidelines: 'PSA discussion with doctor at 50, or 40 if high-risk.', organization: 'AUA', urgency: 'On track' },
];

const riskColors: Record<string, string> = { low: '#4caf50', moderate: '#ff9800', high: '#f44336' };
const statusColors: Record<string, string> = { completed: '#4caf50', scheduled: '#5e92f3', upcoming: '#ff9800', overdue: '#f44336' };

const ScreeningSchedulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  const overdueCount = SCREENING_SCHEDULE.filter(s => s.status === 'overdue').length;

  return (
    <AppLayout title="Screening Schedule" navItems={patientNavItems} portalType="patient" subtitle="Preventive cancer screening calendar">
      <Box sx={{ p: 3 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EventNote />} label="Total Screenings" value={SCREENING_SCHEDULE.length.toString()} color="#5e92f3" subtitle="Active schedule" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircle />} label="Completed" value="1" change="On Track" color="#4caf50" subtitle="This year" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Warning />} label="Overdue" value={overdueCount.toString()} color="#f44336" subtitle="Action needed" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Schedule />} label="Next Screening" value="Jan 15" color="#ff9800" subtitle="Mammogram" />
          </Grid>
        </Grid>

        {overdueCount > 0 && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} action={<Button size="small" variant="outlined" color="error" onClick={() => setShowScheduleDialog(true)}>Schedule Now</Button>}>
            <strong>You have {overdueCount} overdue screening(s).</strong> Pap Smear + HPV test was due on Dec 1, 2024. Please schedule as soon as possible.
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<CalendarMonth />} label="Schedule" iconPosition="start" />
            <Tab icon={<Assignment />} label="Guidelines" iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab 0: Schedule */}
        {activeTab === 0 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Screening Calendar" subtitle="AI-recommended screening schedule based on your risk profile" icon={<CalendarMonth />}
                  action={<Button startIcon={<CalendarMonth />} variant="contained" size="small" onClick={() => setShowScheduleDialog(true)}>Schedule Screening</Button>}
                />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Cancer Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Test</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Frequency</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Risk</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {SCREENING_SCHEDULE.map((screening, idx) => (
                        <TableRow key={idx} sx={{ bgcolor: screening.status === 'overdue' ? '#fff5f5' : 'transparent' }}>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 28, height: 28, bgcolor: `${riskColors[screening.risk]}15`, color: riskColors[screening.risk], fontSize: 11, fontWeight: 700 }}>
                                {screening.cancer_type.charAt(0)}
                              </Avatar>
                              <Typography fontWeight={600} fontSize={13}>{screening.cancer_type}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell><Typography fontSize={12}>{screening.test}</Typography></TableCell>
                          <TableCell><Typography fontSize={12} fontWeight={screening.status === 'overdue' ? 700 : 400} color={screening.status === 'overdue' ? 'error' : 'text.primary'}>{screening.recommended}</Typography></TableCell>
                          <TableCell><Chip label={screening.frequency} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                          <TableCell><Chip label={screening.risk.toUpperCase()} size="small" sx={{ bgcolor: `${riskColors[screening.risk]}15`, color: riskColors[screening.risk], fontWeight: 700, fontSize: 10 }} /></TableCell>
                          <TableCell><Chip label={screening.status.toUpperCase()} size="small" sx={{ bgcolor: `${statusColors[screening.status]}15`, color: statusColors[screening.status], fontWeight: 700, fontSize: 10 }} /></TableCell>
                          <TableCell>
                            {screening.status !== 'completed' && (
                              <Button size="small" variant={screening.status === 'overdue' ? 'contained' : 'outlined'} color={screening.status === 'overdue' ? 'error' : 'primary'} sx={{ fontSize: 11 }}>
                                {screening.status === 'overdue' ? 'Schedule' : 'Manage'}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 2.5 }}>
                <SectionHeader title="Screening Status" icon={<Science />} />
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={SCREENING_STATS} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                      {SCREENING_STATS.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Screening Reminders" icon={<Notifications />} />
                <Stack spacing={1.5}>
                  <FormControlLabel control={<Switch defaultChecked />} label={<Typography variant="body2">Email reminders</Typography>} />
                  <FormControlLabel control={<Switch defaultChecked />} label={<Typography variant="body2">SMS reminders</Typography>} />
                  <FormControlLabel control={<Switch defaultChecked />} label={<Typography variant="body2">In-app notifications</Typography>} />
                  <FormControlLabel control={<Switch />} label={<Typography variant="body2">Doctor reminders</Typography>} />
                  <Divider />
                  <TextField select label="Remind before" fullWidth size="small" defaultValue="7">
                    <MenuItem value="1">1 day before</MenuItem>
                    <MenuItem value="3">3 days before</MenuItem>
                    <MenuItem value="7">1 week before</MenuItem>
                    <MenuItem value="14">2 weeks before</MenuItem>
                    <MenuItem value="30">1 month before</MenuItem>
                  </TextField>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Guidelines */}
        {activeTab === 1 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Cancer Screening Guidelines" subtitle="Personalized recommendations based on your risk factors" icon={<Assignment />} />
            <Grid container spacing={2}>
              {GUIDELINES.map((guide, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Card variant="outlined" sx={{ p: 2.5, height: '100%', borderLeft: `4px solid ${guide.urgency === 'Overdue' ? '#f44336' : guide.urgency.includes('Important') ? '#ff9800' : '#4caf50'}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography fontWeight={700}>{guide.cancer} Cancer</Typography>
                      <Chip label={guide.urgency} size="small" sx={{
                        fontWeight: 600, fontSize: 10,
                        bgcolor: guide.urgency === 'Overdue' ? '#ffebee' : guide.urgency.includes('Important') ? '#fff3e0' : '#e8f5e9',
                        color: guide.urgency === 'Overdue' ? '#c62828' : guide.urgency.includes('Important') ? '#e65100' : '#2e7d32',
                      }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" fontSize={12} sx={{ mb: 1 }}><strong>Who:</strong> {guide.who}</Typography>
                    <Typography variant="body2" fontSize={12}>{guide.guidelines}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Source: {guide.organization}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}

        {/* Schedule Dialog */}
        <Dialog open={showScheduleDialog} onClose={() => setShowScheduleDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Screening</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Screening Type" fullWidth defaultValue="pap">
                {SCREENING_SCHEDULE.filter(s => s.status !== 'completed').map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.cancer_type} - {s.test}</MenuItem>
                ))}
              </TextField>
              <TextField label="Preferred Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField select label="Provider" fullWidth defaultValue="">
                <MenuItem value="ncc">National Cancer Center</MenuItem>
                <MenuItem value="city">City Hospital</MenuItem>
                <MenuItem value="clinic">Women's Health Clinic</MenuItem>
              </TextField>
              <TextField select label="Time Preference" fullWidth defaultValue="morning">
                <MenuItem value="morning">Morning (8AM-12PM)</MenuItem>
                <MenuItem value="afternoon">Afternoon (12PM-5PM)</MenuItem>
                <MenuItem value="any">Any Available</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowScheduleDialog(false)}>Schedule</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default ScreeningSchedulePage;

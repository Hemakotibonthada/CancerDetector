import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Switch, FormControlLabel, Divider, CircularProgress,
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
import { screeningAPI } from '../../services/api';

const riskColors: Record<string, string> = { low: '#4caf50', moderate: '#ff9800', high: '#f44336' };
const statusColors: Record<string, string> = { completed: '#4caf50', scheduled: '#5e92f3', upcoming: '#ff9800', overdue: '#f44336' };

const ScreeningSchedulePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [screeningSchedule, setScreeningSchedule] = useState<any[]>([]);
  const [screeningStats, setScreeningStats] = useState<any[]>([]);
  const [guidelines, setGuidelines] = useState<any[]>([]);

  const overdueCount = screeningSchedule.filter(s => s.status === 'overdue').length;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [scheduleRes, guidelinesRes] = await Promise.all([
        screeningAPI.getSchedule().catch(() => null),
        screeningAPI.getGuidelines().catch(() => null),
      ]);

      if (scheduleRes?.data) {
        const items = Array.isArray(scheduleRes.data) ? scheduleRes.data : (scheduleRes.data.schedule ?? scheduleRes.data.screenings ?? []);
        setScreeningSchedule(items.map((s: any) => ({
          id: s.id ?? '', cancer_type: s.cancer_type ?? '', test: s.test ?? s.test_name ?? '',
          recommended: s.recommended_date ?? s.recommended ?? '', frequency: s.frequency ?? '',
          status: s.status ?? 'upcoming', last_done: s.last_done ?? s.last_completed ?? '',
          risk: s.risk ?? s.risk_level ?? 'low', provider: s.provider ?? '',
        })));
        // Compute stats from schedule
        const statusCounts: Record<string, number> = {};
        items.forEach((s: any) => { const st = s.status ?? 'upcoming'; statusCounts[st] = (statusCounts[st] || 0) + 1; });
        setScreeningStats(Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), value,
          fill: statusColors[name] ?? '#9e9e9e',
        })));
      }
      if (guidelinesRes?.data) {
        const g = Array.isArray(guidelinesRes.data) ? guidelinesRes.data : (guidelinesRes.data.guidelines ?? []);
        setGuidelines(g.map((gl: any) => ({
          cancer: gl.cancer ?? gl.cancer_type ?? '', who: gl.who ?? gl.target_population ?? '',
          guidelines: gl.guidelines ?? gl.description ?? '', organization: gl.organization ?? '',
          urgency: gl.urgency ?? '',
        })));
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load screening data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout title="Screening Schedule" navItems={patientNavItems} portalType="patient" subtitle="Preventive cancer screening calendar">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 3 }} action={<Button onClick={loadData}>Retry</Button>}>{error}</Alert>
      ) : (
      <Box sx={{ p: 3 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EventNote />} label="Total Screenings" value={screeningSchedule.length.toString()} color="#5e92f3" subtitle="Active schedule" />
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
                      {screeningSchedule.map((screening, idx) => (
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
                    <Pie data={screeningStats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                      {screeningStats.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
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
              {guidelines.map((guide, idx) => (
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
                {screeningSchedule.filter(s => s.status !== 'completed').map(s => (
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
      )}
    </AppLayout>
  );
};

export default ScreeningSchedulePage;

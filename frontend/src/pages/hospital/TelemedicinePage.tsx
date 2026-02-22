import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Switch, FormControlLabel, Divider,
} from '@mui/material';
import {
  Videocam, Schedule, Person, CheckCircle, Timer, TrendingUp,
  Assignment, Star, CalendarMonth, VideocamOff, Chat, Description,
  Mic, MicOff,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { hospitalNavItems } from './HospitalDashboard';

const SESSIONS = [
  { id: 'TM-001', patient: 'Alice Thompson', doctor: 'Dr. Patel', specialty: 'Oncology', date: '2024-12-18', time: '9:00 AM', duration: 30, status: 'in_progress', type: 'Follow-up', platform: 'Video', rating: 0, notes: '' },
  { id: 'TM-002', patient: 'Bob Williams', doctor: 'Dr. Kim', specialty: 'Radiation', date: '2024-12-18', time: '10:00 AM', duration: 20, status: 'scheduled', type: 'Consultation', platform: 'Video', rating: 0, notes: '' },
  { id: 'TM-003', patient: 'Carol Davis', doctor: 'Dr. Patel', specialty: 'Oncology', date: '2024-12-18', time: '11:00 AM', duration: 45, status: 'scheduled', type: 'New Patient', platform: 'Video', rating: 0, notes: '' },
  { id: 'TM-004', patient: 'David Lee', doctor: 'Dr. Chen', specialty: 'Surgery', date: '2024-12-17', time: '2:00 PM', duration: 25, status: 'completed', type: 'Pre-Op', platform: 'Video', rating: 5, notes: 'Discussed surgical plan. Patient well-informed.' },
  { id: 'TM-005', patient: 'Eva Martinez', doctor: 'Dr. Patel', specialty: 'Oncology', date: '2024-12-17', time: '3:30 PM', duration: 35, status: 'completed', type: 'Follow-up', platform: 'Phone', rating: 4, notes: 'Treatment response positive. Adjusting medication.' },
  { id: 'TM-006', patient: 'Frank Chen', doctor: 'Dr. Kim', specialty: 'Radiation', date: '2024-12-16', time: '10:00 AM', duration: 30, status: 'completed', type: 'Treatment Review', platform: 'Video', rating: 5, notes: 'Radiation plan finalized. Side effects manageable.' },
];

const WEEKLY_STATS = [
  { day: 'Mon', sessions: 8, minutes: 240 },
  { day: 'Tue', sessions: 10, minutes: 320 },
  { day: 'Wed', sessions: 7, minutes: 210 },
  { day: 'Thu', sessions: 12, minutes: 380 },
  { day: 'Fri', sessions: 9, minutes: 280 },
];

const SESSION_TYPES = [
  { name: 'Follow-up', value: 40, fill: '#5e92f3' },
  { name: 'Consultation', value: 25, fill: '#ae52d4' },
  { name: 'New Patient', value: 15, fill: '#4caf50' },
  { name: 'Pre-Op', value: 10, fill: '#ff9800' },
  { name: 'Treatment Review', value: 10, fill: '#f44336' },
];

const TelemedicinePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showSessionView, setShowSessionView] = useState(false);

  const todaySessions = SESSIONS.filter(s => s.date === '2024-12-18');
  const completed = SESSIONS.filter(s => s.status === 'completed');
  const avgRating = completed.reduce((s, c) => s + c.rating, 0) / completed.length;

  return (
    <AppLayout title="Telemedicine" navItems={hospitalNavItems} portalType="hospital" subtitle="Virtual consultation management">
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Videocam />} label="Today's Sessions" value={todaySessions.length.toString()} color="#5e92f3" subtitle="Scheduled & in-progress" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircle />} label="Completed" value={completed.length.toString()} change="+2" color="#4caf50" subtitle="This week" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Star />} label="Avg Rating" value={avgRating.toFixed(1)} color="#ff9800" subtitle="Patient satisfaction" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Timer />} label="Avg Duration" value="30 min" color="#ae52d4" subtitle="Per session" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<CalendarMonth />} label="Sessions" iconPosition="start" />
            <Tab icon={<Videocam />} label="Virtual Room" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Telemedicine Sessions" icon={<Videocam />}
              action={<Button startIcon={<Schedule />} variant="contained" size="small" onClick={() => setShowScheduleDialog(true)}>Schedule Session</Button>}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Doctor</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Platform</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {SESSIONS.map((s, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: s.status === 'in_progress' ? '#e8f5e9' : 'transparent' }}>
                      <TableCell><Chip label={s.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} /></TableCell>
                      <TableCell><Typography fontWeight={600} fontSize={13}>{s.patient}</Typography></TableCell>
                      <TableCell>
                        <Stack>
                          <Typography fontSize={12}>{s.doctor}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.specialty}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Chip label={s.type} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell><Typography fontSize={12}>{s.date} • {s.time}</Typography></TableCell>
                      <TableCell><Typography fontSize={12}>{s.duration} min</Typography></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {s.platform === 'Video' ? <Videocam sx={{ fontSize: 14, color: '#5e92f3' }} /> : <Chat sx={{ fontSize: 14, color: '#4caf50' }} />}
                          <Typography fontSize={11}>{s.platform}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><StatusBadge status={s.status.replace('_', ' ')} /></TableCell>
                      <TableCell>
                        {s.status === 'in_progress' && (
                          <Button size="small" variant="contained" startIcon={<Videocam />} sx={{ fontSize: 10 }} onClick={() => setShowSessionView(true)}>Join</Button>
                        )}
                        {s.status === 'scheduled' && (
                          <Button size="small" variant="outlined" startIcon={<Videocam />} sx={{ fontSize: 10 }} onClick={() => setShowSessionView(true)}>Start</Button>
                        )}
                        {s.status === 'completed' && (
                          <Stack direction="row" spacing={0.5}>
                            {[...Array(s.rating)].map((_, i) => <Star key={i} sx={{ fontSize: 14, color: '#ffc107' }} />)}
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Virtual Consultation Room" icon={<Videocam />} />
                <Box sx={{
                  height: 400, bgcolor: '#1a1a2e', borderRadius: 3, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', position: 'relative', overflow: 'hidden', mb: 2,
                }}>
                  <Stack alignItems="center" spacing={2}>
                    <Avatar sx={{ width: 80, height: 80, bgcolor: '#5e92f3', fontSize: 32 }}>P</Avatar>
                    <Typography color="#fff" fontWeight={600}>Waiting for patient to join...</Typography>
                    <Chip label="Room Ready" sx={{ bgcolor: '#4caf50', color: '#fff', fontWeight: 600 }} />
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ position: 'absolute', bottom: 20 }}>
                    <Button variant="contained" sx={{ borderRadius: '50%', minWidth: 50, height: 50, bgcolor: '#4caf50' }}><Mic /></Button>
                    <Button variant="contained" sx={{ borderRadius: '50%', minWidth: 50, height: 50, bgcolor: '#5e92f3' }}><Videocam /></Button>
                    <Button variant="contained" sx={{ borderRadius: '50%', minWidth: 50, height: 50, bgcolor: '#ae52d4' }}><Chat /></Button>
                    <Button variant="contained" sx={{ borderRadius: '50%', minWidth: 50, height: 50, bgcolor: '#f44336' }}><VideocamOff /></Button>
                  </Stack>
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, height: '100%' }}>
                <SectionHeader title="Session Notes" icon={<Description />} />
                <Stack spacing={2}>
                  <TextField label="Session Notes" multiline rows={6} fullWidth placeholder="Enter clinical notes during the session..." />
                  <TextField select label="Follow-up Required" fullWidth defaultValue="yes">
                    <MenuItem value="yes">Yes - Schedule follow-up</MenuItem>
                    <MenuItem value="no">No follow-up needed</MenuItem>
                  </TextField>
                  <TextField label="Prescriptions" multiline rows={3} fullWidth placeholder="Any prescriptions or orders..." />
                  <Button variant="contained" startIcon={<CheckCircle />}>Save & End Session</Button>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Weekly Session Volume" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={WEEKLY_STATS}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Bar dataKey="sessions" fill="#5e92f3" name="Sessions" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Session Types" icon={<Assignment />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={SESSION_TYPES} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                      {SESSION_TYPES.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Schedule Dialog */}
        <Dialog open={showScheduleDialog} onClose={() => setShowScheduleDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Telemedicine Session</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Patient Name" fullWidth />
              <TextField select label="Doctor" fullWidth defaultValue="">
                <MenuItem value="patel">Dr. Patel - Oncology</MenuItem>
                <MenuItem value="kim">Dr. Kim - Radiation</MenuItem>
                <MenuItem value="chen">Dr. Chen - Surgery</MenuItem>
              </TextField>
              <TextField select label="Session Type" fullWidth defaultValue="">
                <MenuItem value="followup">Follow-up</MenuItem>
                <MenuItem value="consultation">New Consultation</MenuItem>
                <MenuItem value="preop">Pre-Op Discussion</MenuItem>
                <MenuItem value="review">Treatment Review</MenuItem>
              </TextField>
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Date" type="date" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
                <Grid item xs={6}><TextField label="Time" type="time" fullWidth InputLabelProps={{ shrink: true }} /></Grid>
              </Grid>
              <TextField label="Duration (minutes)" type="number" fullWidth defaultValue={30} />
              <TextField select label="Platform" fullWidth defaultValue="video">
                <MenuItem value="video">Video Call</MenuItem>
                <MenuItem value="phone">Phone Call</MenuItem>
              </TextField>
              <TextField label="Notes / Agenda" multiline rows={2} fullWidth />
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

export default TelemedicinePage;

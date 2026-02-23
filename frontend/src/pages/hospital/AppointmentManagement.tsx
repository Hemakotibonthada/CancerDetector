import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Badge, Avatar,
  Stepper, Step, StepLabel, ToggleButton, ToggleButtonGroup, Divider,
  IconButton, Alert,
} from '@mui/material';
import {
  CalendarMonth, Search, Add, FilterList, AccessTime, Person,
  VideoCall, LocalHospital, Check, Close, Schedule, 
  NavigateBefore, NavigateNext, Refresh, Download,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, StatusBadge } from '../../components/common/SharedComponents';
import { appointmentsAPI } from '../../services/api';

const AppointmentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [dateFilter, setDateFilter] = useState('today');
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [calendarView, setCalendarView] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>(['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30', '04:00', '04:30']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [apptRes] = await Promise.all([
        appointmentsAPI.getMyAppointments().catch(() => ({ data: [] })),
      ]);
      const data = apptRes.data || [];
      setAppointments(Array.isArray(data) ? data : data.appointments ?? []);
      setWaitlist(Array.isArray(data) ? [] : data.waitlist ?? []);
      setTimeSlots(prev => Array.isArray(data) ? prev : data.timeSlots ?? prev);
      setError('');
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statusColor = (s: string) => {
    const m: Record<string, string> = { checked_in: '#43a047', waiting: '#f57c00', in_progress: '#1565c0', scheduled: '#9e9e9e', completed: '#2e7d32', no_show: '#d32f2f', cancelled: '#757575' };
    return m[s] || '#9e9e9e';
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <AppLayout title="Appointment Management" subtitle="Schedule and manage appointments" navItems={hospitalNavItems} portalType="hospital">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<CalendarMonth />} label="Today's Appts" value={appointments.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<AccessTime />} label="In Progress" value={appointments.filter(a => a.status === 'in_progress').length} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<VideoCall />} label="Telemedicine" value={appointments.filter(a => a.mode === 'telemedicine').length} color="#7b1fa2" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Close />} label="No Shows" value={appointments.filter(a => a.status === 'no_show').length} color="#d32f2f" /></Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField placeholder="Search appointments..." size="small" sx={{ flex: 1, minWidth: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Date</InputLabel>
            <Select label="Date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <MenuItem value="today">Today</MenuItem><MenuItem value="tomorrow">Tomorrow</MenuItem><MenuItem value="week">This Week</MenuItem><MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" defaultValue="all">
              <MenuItem value="all">All Status</MenuItem><MenuItem value="scheduled">Scheduled</MenuItem><MenuItem value="checked_in">Checked In</MenuItem><MenuItem value="in_progress">In Progress</MenuItem><MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowNewAppt(true)}>New Appointment</Button>
        </Stack>
      </Card>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Queue View" />
        <Tab label="Calendar View" />
        <Tab label="Waitlist" />
        <Tab label="Walk-ins" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['ID', 'Patient', 'Doctor', 'Time', 'Type', 'Mode', 'Room', 'Status', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id} hover sx={{ cursor: 'pointer', borderLeft: `3px solid ${statusColor(a.status)}` }} onClick={() => setSelectedAppt(a)}>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{a.id}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{a.patient}</Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{a.patientId}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{a.doctor}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{a.time}</Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{a.duration}</Typography>
                    </TableCell>
                    <TableCell><Chip label={a.type.replace('_', ' ')} size="small" sx={{ fontSize: 10, height: 22, textTransform: 'capitalize' }} /></TableCell>
                    <TableCell>
                      {a.mode === 'telemedicine' ? <Chip icon={<VideoCall sx={{ fontSize: 12 }} />} label="Video" size="small" color="secondary" sx={{ fontSize: 10, height: 22 }} /> : <Chip label="In-Person" size="small" variant="outlined" sx={{ fontSize: 10, height: 22 }} />}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{a.room}</TableCell>
                    <TableCell><StatusBadge status={a.status.replace('_', ' ')} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {a.status === 'scheduled' && <Chip label="Check In" size="small" color="success" sx={{ fontSize: 10, cursor: 'pointer', height: 24 }} onClick={(e) => e.stopPropagation()} />}
                        {a.status === 'checked_in' && <Chip label="Start" size="small" color="primary" sx={{ fontSize: 10, cursor: 'pointer', height: 24 }} onClick={(e) => e.stopPropagation()} />}
                        {a.status === 'in_progress' && <Chip label="Complete" size="small" color="success" sx={{ fontSize: 10, cursor: 'pointer', height: 24 }} onClick={(e) => e.stopPropagation()} />}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 1 && (
        <Card sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton size="small"><NavigateBefore /></IconButton>
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Today, {new Date().toLocaleDateString()}</Typography>
              <IconButton size="small"><NavigateNext /></IconButton>
            </Stack>
            <ToggleButtonGroup value={calendarView} exclusive onChange={(_, v) => v && setCalendarView(v)} size="small">
              <ToggleButton value="day">Day</ToggleButton>
              <ToggleButton value="week">Week</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Box sx={{ maxHeight: 500, overflowY: 'auto' }}>
            {timeSlots.map((slot) => {
              const slotAppts = appointments.filter(a => a.time.replace(' ', '').toLowerCase().includes(slot.replace(':', '')));
              return (
                <Stack key={slot} direction="row" spacing={2} sx={{ py: 1, borderBottom: '1px solid #f0f0f0', minHeight: 45 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, width: 60, color: 'text.secondary', pt: 0.5 }}>{slot}</Typography>
                  <Box sx={{ flex: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {slotAppts.map(a => (
                      <Chip key={a.id} label={`${a.patient} - ${a.doctor} (${a.room})`} size="small"
                        sx={{ bgcolor: `${statusColor(a.status)}15`, color: statusColor(a.status), fontWeight: 500, fontSize: 10, cursor: 'pointer' }}
                        onClick={() => setSelectedAppt(a)} />
                    ))}
                  </Box>
                </Stack>
              );
            })}
          </Box>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mb: 2 }}>3 patients currently on the waitlist</Alert>
          </Grid>
          {waitlist.map((w, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Card sx={{ p: 2, borderLeft: `3px solid ${w.urgency === 'high' ? '#d32f2f' : w.urgency === 'medium' ? '#f57c00' : '#4caf50'}` }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{w.patient}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{w.department}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip label={`Wait: ${w.waiting}`} size="small" sx={{ fontSize: 10 }} />
                  <Chip label={w.urgency} size="small" color={w.urgency === 'high' ? 'error' : w.urgency === 'medium' ? 'warning' : 'success'} sx={{ fontSize: 10, textTransform: 'capitalize' }} />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Button size="small" variant="contained">Assign</Button>
                  <Button size="small" variant="outlined">Notify</Button>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>Walk-in Registration</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField label="Patient Name" fullWidth size="small" /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Health ID / Phone" fullWidth size="small" /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small"><InputLabel>Department</InputLabel>
                <Select label="Department"><MenuItem value="oncology">Oncology</MenuItem><MenuItem value="cardiology">Cardiology</MenuItem><MenuItem value="emergency">Emergency</MenuItem><MenuItem value="general">General</MenuItem></Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small"><InputLabel>Urgency</InputLabel>
                <Select label="Urgency"><MenuItem value="low">Low</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="high">High</MenuItem><MenuItem value="critical">Critical</MenuItem></Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField label="Reason for Visit" fullWidth multiline rows={2} size="small" /></Grid>
            <Grid item xs={12}><Button variant="contained" startIcon={<Add />}>Register Walk-in</Button></Grid>
          </Grid>
        </Card>
      )}

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppt} onClose={() => setSelectedAppt(null)} maxWidth="sm" fullWidth>
        {selectedAppt && (
          <>
            <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f0f0f0' }}>Appointment Details</DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Stack spacing={1.5}>
                {[
                  { l: 'Appointment ID', v: selectedAppt.id },
                  { l: 'Patient', v: `${selectedAppt.patient} (${selectedAppt.patientId})` },
                  { l: 'Doctor', v: selectedAppt.doctor },
                  { l: 'Department', v: selectedAppt.department },
                  { l: 'Time', v: `${selectedAppt.time} (${selectedAppt.duration})` },
                  { l: 'Type', v: selectedAppt.type.replace('_', ' ') },
                  { l: 'Mode', v: selectedAppt.mode },
                  { l: 'Room', v: selectedAppt.room },
                  { l: 'Notes', v: selectedAppt.notes },
                ].map(item => (
                  <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{item.v}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAppt(null)}>Close</Button>
              <Button variant="outlined" color="error">Cancel Appt</Button>
              <Button variant="outlined">Reschedule</Button>
              <Button variant="contained">Update Status</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={showNewAppt} onClose={() => setShowNewAppt(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Schedule New Appointment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Search Patient" fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
            <FormControl fullWidth size="small"><InputLabel>Doctor</InputLabel><Select label="Doctor"><MenuItem value="d1">Dr. Sarah Smith</MenuItem><MenuItem value="d2">Dr. James Lee</MenuItem><MenuItem value="d3">Dr. Emily Chen</MenuItem></Select></FormControl>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="Time" type="time" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small"><InputLabel>Type</InputLabel><Select label="Type"><MenuItem value="new">New Visit</MenuItem><MenuItem value="follow">Follow-up</MenuItem><MenuItem value="procedure">Procedure</MenuItem><MenuItem value="consultation">Consultation</MenuItem></Select></FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small"><InputLabel>Mode</InputLabel><Select label="Mode"><MenuItem value="in_person">In-Person</MenuItem><MenuItem value="telemedicine">Telemedicine</MenuItem></Select></FormControl>
              </Grid>
            </Grid>
            <TextField label="Notes" fullWidth multiline rows={2} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewAppt(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowNewAppt(false)}>Schedule</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default AppointmentManagement;

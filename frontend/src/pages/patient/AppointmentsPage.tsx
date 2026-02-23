import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Alert, Divider,
  IconButton, Avatar, Rating, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, LinearProgress, CircularProgress,
} from '@mui/material';
import {
  CalendarMonth, Add, VideoCall, Person, AccessTime, LocationOn,
  Phone, Notes, CheckCircle, Cancel, Edit, Delete, Search,
  ArrowForward, ArrowBack, Refresh, FilterList, Download,
  LocalHospital, Star, EventAvailable, EventBusy, Schedule,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { SectionHeader, StatusBadge, StatCard } from '../../components/common/SharedComponents';
import { appointmentsAPI, hospitalsAPI } from '../../services/api';

const formatDate = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
};

const formatTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return ''; }
};

const AppointmentsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isTelemedicine, setIsTelemedicine] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [appointments, setAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await appointmentsAPI.getMyAppointments();
      const all = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.appointments || []);
      
      const upcoming = all.filter((a: any) => ['scheduled', 'confirmed', 'pending', 'waitlisted'].includes(a.status));
      const past = all.filter((a: any) => ['completed', 'cancelled', 'no_show'].includes(a.status));
      
      setAppointments(upcoming.map((a: any) => ({
        id: a.id,
        doctor: a.doctor_name || `Doctor`,
        specialization: a.specialization || a.appointment_type || 'Specialist',
        date: formatDate(a.scheduled_date),
        time: formatTime(a.scheduled_date),
        type: (a.appointment_type || 'consultation').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        status: a.status,
        telemedicine: a.is_telemedicine || false,
        hospital: a.hospital_name || 'Hospital',
        duration: a.duration_minutes || 30,
        reason: a.reason || '',
        telemedicine_link: a.telemedicine_link || '',
      })));
      
      setPastAppointments(past.map((a: any) => ({
        id: a.id,
        doctor: a.doctor_name || `Doctor`,
        specialization: a.specialization || a.appointment_type || 'Specialist',
        date: formatDate(a.scheduled_date),
        time: formatTime(a.scheduled_date),
        type: (a.appointment_type || 'consultation').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        status: a.status,
        telemedicine: a.is_telemedicine || false,
        hospital: a.hospital_name || 'Hospital',
        rating: a.patient_rating || 0,
        notes: a.notes || a.patient_feedback || '',
      })));
    } catch (err: any) {
      console.error('Failed to load appointments:', err);
      setError(err?.response?.data?.detail || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);

  if (loading) {
    return (
      <AppLayout title="Appointments" subtitle="Manage your healthcare appointments" navItems={patientNavItems} portalType="patient">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Appointments" subtitle="Manage your healthcare appointments" navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<EventAvailable />} label="Upcoming" value={appointments.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Completed" value={pastAppointments.filter(a => a.status === 'completed').length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<VideoCall />} label="Telemedicine" value={appointments.filter(a => a.telemedicine).length} color="#7b1fa2" /></Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ p: 2.5, cursor: 'pointer', '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 }, transition: 'all 0.25s' }} onClick={() => setShowBookDialog(true)}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#fff3e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f57c00' }}>
                <Add />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a2e' }}>Book</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12 }}>New Appointment</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Upcoming" />
        <Tab label="Past Appointments" />
        <Tab label="Find a Doctor" />
      </Tabs>

      {activeTab === 0 && (
        appointments.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <EventBusy sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No upcoming appointments</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Book your first appointment to get started</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowBookDialog(true)}>Book Appointment</Button>
          </Card>
        ) : (
        <Grid container spacing={2}>
          {appointments.map((apt) => (
            <Grid item xs={12} md={6} key={apt.id}>
              <Card sx={{ p: 3, transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: 52, height: 52, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700, fontSize: 16 }}>
                      {apt.doctor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{apt.doctor}</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{apt.specialization}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{apt.hospital}</Typography>
                    </Box>
                  </Stack>
                  <StatusBadge status={apt.status} />
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonth sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{apt.date}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{apt.time} ({apt.duration}min)</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {apt.telemedicine ? <VideoCall sx={{ fontSize: 16, color: '#7b1fa2' }} /> : <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />}
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: apt.telemedicine ? '#7b1fa2' : 'text.primary' }}>
                        {apt.telemedicine ? 'Telemedicine' : 'In-Person'}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={6}>
                    <Chip label={apt.type} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                  </Grid>
                </Grid>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1.5 }}>Reason: {apt.reason}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  {apt.telemedicine && <Button variant="contained" size="small" startIcon={<VideoCall />} color="secondary">Join Call</Button>}
                  <Button variant="outlined" size="small" startIcon={<Edit />}>Reschedule</Button>
                  <Button variant="outlined" size="small" color="error" startIcon={<Cancel />} onClick={() => setShowCancelDialog(true)}>Cancel</Button>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
        )
      )}

      {activeTab === 1 && (
        pastAppointments.length === 0 ? (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Schedule sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" color="text.secondary">No past appointments</Typography>
            <Typography variant="body2" color="text.secondary">Your completed appointments will appear here</Typography>
          </Card>
        ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Doctor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Hospital</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Notes</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pastAppointments.map((apt: any) => (
                  <TableRow key={apt.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{apt.doctor}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{apt.specialization}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{apt.date} {apt.time}</TableCell>
                    <TableCell><Chip label={apt.type} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{apt.hospital}</TableCell>
                    <TableCell><Rating value={apt.rating} size="small" readOnly /></TableCell>
                    <TableCell sx={{ fontSize: 12, maxWidth: 200 }}>{apt.notes}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" sx={{ fontSize: 11 }}>Book Again</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
        )
      )}

      {activeTab === 2 && (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Search sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary">Find a Doctor</Typography>
          <Typography variant="body2" color="text.secondary">Search for doctors and book appointments through the hospitals page</Typography>
          <Button variant="outlined" sx={{ mt: 2 }} href="/patient/hospitals">Browse Hospitals</Button>
        </Card>
      )}

      {/* Book Appointment Dialog */}
      <Dialog open={showBookDialog} onClose={() => { setShowBookDialog(false); setBookingStep(0); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Book an Appointment</DialogTitle>
        <DialogContent>
          <Stepper activeStep={bookingStep} sx={{ mb: 3, mt: 1 }}>
            <Step><StepLabel>Select Doctor</StepLabel></Step>
            <Step><StepLabel>Date & Time</StepLabel></Step>
            <Step><StepLabel>Details</StepLabel></Step>
          </Stepper>
          {bookingStep === 0 && (
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Specialization</InputLabel>
                <Select label="Specialization" defaultValue="">
                  <MenuItem value="oncologist">Oncologist</MenuItem>
                  <MenuItem value="general">General Physician</MenuItem>
                  <MenuItem value="cardiologist">Cardiologist</MenuItem>
                  <MenuItem value="dermatologist">Dermatologist</MenuItem>
                  <MenuItem value="neurologist">Neurologist</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Doctor</InputLabel>
                <Select label="Doctor" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value as string)}>
                  <MenuItem value="">Select a doctor</MenuItem>
                </Select>
              </FormControl>
              <Alert severity="info" sx={{ fontSize: 12 }}>Visit the Hospitals page to browse available doctors</Alert>
            </Stack>
          )}
          {bookingStep === 1 && (
            <Stack spacing={2}>
              <TextField label="Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Available Time Slots</Typography>
              <Grid container spacing={1}>
                {['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM','1:00 PM','1:30 PM','2:00 PM','2:30 PM','3:00 PM','3:30 PM'].map((slot) => (
                  <Grid item xs={4} key={slot}>
                    <Button
                      variant={selectedTime === slot ? 'contained' : 'outlined'}
                      onClick={() => setSelectedTime(slot)}
                      fullWidth size="small" sx={{ fontSize: 12 }}
                    >
                      {slot}
                    </Button>
                  </Grid>
                ))}
              </Grid>
              <FormControlLabel control={<Switch checked={isTelemedicine} onChange={(e) => setIsTelemedicine(e.target.checked)} />} label="Telemedicine (Video Call)" />
            </Stack>
          )}
          {bookingStep === 2 && (
            <Stack spacing={2}>
              <TextField label="Reason for Visit" multiline rows={2} fullWidth size="small" />
              <TextField label="Additional Notes" multiline rows={2} fullWidth size="small" />
              <Alert severity="info">
                You will receive a confirmation email and SMS once the appointment is confirmed.
              </Alert>
              <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Appointment Summary</Typography>
                <Typography sx={{ fontSize: 13 }}>Doctor: {selectedDoctor || 'Not selected'}</Typography>
                <Typography sx={{ fontSize: 13 }}>Date: {selectedDate || 'Not selected'}</Typography>
                <Typography sx={{ fontSize: 13 }}>Time: {selectedTime || 'Not selected'}</Typography>
                <Typography sx={{ fontSize: 13 }}>Type: {isTelemedicine ? 'Telemedicine' : 'In-Person'}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {bookingStep > 0 && <Button onClick={() => setBookingStep(bookingStep - 1)} startIcon={<ArrowBack />}>Back</Button>}
          <Button onClick={() => { setShowBookDialog(false); setBookingStep(0); }}>Cancel</Button>
          {bookingStep < 2 ? (
            <Button variant="contained" onClick={() => setBookingStep(bookingStep + 1)} endIcon={<ArrowForward />}>Next</Button>
          ) : (
            <Button variant="contained" color="success" onClick={() => { setShowBookDialog(false); setBookingStep(0); }}>Confirm Booking</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Cancel Appointment?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>This action cannot be undone. The doctor will be notified of the cancellation.</Alert>
          <TextField label="Reason for cancellation" multiline rows={2} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>Keep Appointment</Button>
          <Button variant="contained" color="error" onClick={() => setShowCancelDialog(false)}>Cancel Appointment</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default AppointmentsPage;

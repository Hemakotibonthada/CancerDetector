import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Alert, Divider,
  IconButton, Avatar, Rating, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, LinearProgress,
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

  const appointments = [
    { id: '1', doctor: 'Dr. Sarah Smith', specialization: 'Oncologist', date: 'Feb 25, 2026', time: '10:00 AM', type: 'Follow-up', status: 'confirmed', telemedicine: false, hospital: 'Cancer Research Center', duration: 30, reason: 'Cancer risk review' },
    { id: '2', doctor: 'Dr. James Lee', specialization: 'Cardiologist', date: 'Mar 02, 2026', time: '2:30 PM', type: 'Consultation', status: 'scheduled', telemedicine: true, hospital: 'City Heart Hospital', duration: 20, reason: 'Heart health check' },
    { id: '3', doctor: 'Dr. Emily Chen', specialization: 'General Physician', date: 'Mar 10, 2026', time: '9:00 AM', type: 'Check-up', status: 'pending', telemedicine: false, hospital: 'Community Health Center', duration: 45, reason: 'Annual physical exam' },
  ];

  const pastAppointments = [
    { id: '4', doctor: 'Dr. Sarah Smith', specialization: 'Oncologist', date: 'Feb 15, 2026', time: '10:00 AM', type: 'Screening', status: 'completed', telemedicine: false, hospital: 'Cancer Research Center', rating: 5, notes: 'All clear, follow up in 6 months' },
    { id: '5', doctor: 'Dr. Robert Wilson', specialization: 'Dermatologist', date: 'Jan 20, 2026', time: '3:00 PM', type: 'Consultation', status: 'completed', telemedicine: true, hospital: 'Skin Care Clinic', rating: 4, notes: 'Mole biopsy results benign' },
    { id: '6', doctor: 'Dr. Lisa Park', specialization: 'Pathologist', date: 'Dec 15, 2025', time: '8:00 AM', type: 'Lab Review', status: 'completed', telemedicine: false, hospital: 'City Lab Corp', rating: 5, notes: 'Blood work all normal' },
  ];

  const availableDoctors = [
    { id: '1', name: 'Dr. Sarah Smith', specialization: 'Oncologist', rating: 4.9, experience: 15, hospital: 'Cancer Research Center', fee: 200, available: true, photo: 'SS' },
    { id: '2', name: 'Dr. James Lee', specialization: 'Cardiologist', rating: 4.8, experience: 12, hospital: 'City Heart Hospital', fee: 180, available: true, photo: 'JL' },
    { id: '3', name: 'Dr. Emily Chen', specialization: 'General Physician', rating: 4.7, experience: 8, hospital: 'Community Health Center', fee: 100, available: true, photo: 'EC' },
    { id: '4', name: 'Dr. Robert Wilson', specialization: 'Dermatologist', rating: 4.6, experience: 20, hospital: 'Skin Care Clinic', fee: 150, available: false, photo: 'RW' },
    { id: '5', name: 'Dr. Maria Garcia', specialization: 'Neurologist', rating: 4.9, experience: 18, hospital: 'Brain Health Institute', fee: 250, available: true, photo: 'MG' },
  ];

  const timeSlots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'];

  return (
    <AppLayout title="Appointments" subtitle="Manage your healthcare appointments" navItems={patientNavItems} portalType="patient">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<EventAvailable />} label="Upcoming" value={appointments.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Completed" value={pastAppointments.length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<VideoCall />} label="Telemedicine" value={1} color="#7b1fa2" /></Grid>
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
      )}

      {activeTab === 1 && (
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
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {availableDoctors.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card sx={{ p: 3, opacity: doc.available ? 1 : 0.6, '&:hover': { boxShadow: doc.available ? 4 : 1 }, transition: 'all 0.2s' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }}>{doc.photo}</Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{doc.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{doc.specialization}</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Star sx={{ fontSize: 14, color: '#f57c00' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{doc.rating}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>• {doc.experience} yrs</Typography>
                    </Stack>
                  </Box>
                </Stack>
                <Divider sx={{ mb: 1.5 }} />
                <Stack spacing={0.5} sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{doc.hospital}</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>Consultation Fee: ${doc.fee}</Typography>
                </Stack>
                <Chip label={doc.available ? 'Available' : 'Not Available'} size="small" color={doc.available ? 'success' : 'default'} sx={{ mb: 1.5 }} />
                <Button variant="contained" fullWidth disabled={!doc.available} onClick={() => { setSelectedDoctor(doc.name); setShowBookDialog(true); }}>
                  Book Appointment
                </Button>
              </Card>
            </Grid>
          ))}
        </Grid>
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
                <Select label="Doctor" value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
                  {availableDoctors.filter(d => d.available).map(d => (
                    <MenuItem key={d.id} value={d.name}>{d.name} - {d.specialization}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
          {bookingStep === 1 && (
            <Stack spacing={2}>
              <TextField label="Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Available Time Slots</Typography>
              <Grid container spacing={1}>
                {timeSlots.map((slot) => (
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

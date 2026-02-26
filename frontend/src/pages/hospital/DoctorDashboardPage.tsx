// ============================================================================
// Doctor Dashboard Page - Comprehensive physician workflow management
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, Avatar,
  LinearProgress, Tab, Tabs, Divider, IconButton, Paper, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Badge, List, ListItem, ListItemText, ListItemAvatar,
  ListItemSecondaryAction, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Fade, Grow, Slide, CircularProgress,
  useTheme, alpha, Menu, MenuItem, Tooltip, Drawer, Switch,
  FormControlLabel, Stepper, Step, StepLabel
} from '@mui/material';
import { keyframes } from '@mui/system';

// ============================================================================
// Animations
// ============================================================================

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeInUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const pulseDot = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
`;

const countUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ============================================================================
// Types
// ============================================================================

interface DoctorPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  mrn: string;
  condition: string;
  status: 'stable' | 'critical' | 'improving' | 'new';
  lastVisit: string;
  nextAppointment: string;
  riskLevel: 'low' | 'moderate' | 'high';
  avatar?: string;
  alerts: number;
}

interface TodayAppointment {
  id: string;
  time: string;
  patientName: string;
  type: string;
  duration: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  room?: string;
}

interface ClinicalTask {
  id: string;
  title: string;
  patient: string;
  type: 'lab_review' | 'prescription' | 'referral' | 'documentation' | 'follow_up' | 'consult';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface LabResult {
  id: string;
  patient: string;
  test: string;
  result: string;
  status: 'normal' | 'abnormal' | 'critical';
  date: string;
  reviewed: boolean;
}

interface Message {
  id: string;
  from: string;
  role: string;
  subject: string;
  preview: string;
  date: string;
  unread: boolean;
  priority: 'normal' | 'urgent';
}

// ============================================================================
// Mock Data
// ============================================================================

const mockPatients: DoctorPatient[] = [
  { id: '1', name: 'Emma Thompson', age: 52, gender: 'F', mrn: 'MRN-7821', condition: 'Breast Cancer - Stage II', status: 'improving', lastVisit: '2024-01-20', nextAppointment: '2024-02-10', riskLevel: 'high', alerts: 2 },
  { id: '2', name: 'Michael Chen', age: 67, gender: 'M', mrn: 'MRN-4523', condition: 'Lung Cancer - Stage IIIA', status: 'stable', lastVisit: '2024-01-18', nextAppointment: '2024-02-05', riskLevel: 'high', alerts: 1 },
  { id: '3', name: 'Sarah Williams', age: 45, gender: 'F', mrn: 'MRN-9034', condition: 'Ovarian Cancer - Stage I', status: 'improving', lastVisit: '2024-01-22', nextAppointment: '2024-02-15', riskLevel: 'moderate', alerts: 0 },
  { id: '4', name: 'James Rodriguez', age: 58, gender: 'M', mrn: 'MRN-2156', condition: 'Colorectal Cancer - Stage II', status: 'stable', lastVisit: '2024-01-15', nextAppointment: '2024-02-08', riskLevel: 'moderate', alerts: 0 },
  { id: '5', name: 'Linda Patel', age: 73, gender: 'F', mrn: 'MRN-6789', condition: 'Pancreatic Cancer - Stage III', status: 'critical', lastVisit: '2024-01-23', nextAppointment: '2024-01-30', riskLevel: 'high', alerts: 5 },
  { id: '6', name: 'Robert Kim', age: 41, gender: 'M', mrn: 'MRN-3345', condition: 'Melanoma - Stage I', status: 'improving', lastVisit: '2024-01-10', nextAppointment: '2024-03-01', riskLevel: 'low', alerts: 0 },
  { id: '7', name: 'Maria Garcia', age: 49, gender: 'F', mrn: 'MRN-8901', condition: 'Thyroid Cancer', status: 'new', lastVisit: '2024-01-24', nextAppointment: '2024-02-01', riskLevel: 'moderate', alerts: 1 },
  { id: '8', name: 'David Wilson', age: 62, gender: 'M', mrn: 'MRN-5567', condition: 'Prostate Cancer - Stage II', status: 'stable', lastVisit: '2024-01-12', nextAppointment: '2024-02-20', riskLevel: 'moderate', alerts: 0 },
];

const mockAppointments: TodayAppointment[] = [
  { id: '1', time: '08:00', patientName: 'Linda Patel', type: 'Chemotherapy Review', duration: 45, status: 'completed', room: 'Room 3A', notes: 'Treatment response evaluation' },
  { id: '2', time: '09:00', patientName: 'Emma Thompson', type: 'Follow-up', duration: 30, status: 'completed', room: 'Room 2B' },
  { id: '3', time: '10:00', patientName: 'Maria Garcia', type: 'New Patient Consult', duration: 60, status: 'in_progress', room: 'Room 1A', notes: 'Initial oncology consultation' },
  { id: '4', time: '11:30', patientName: 'James Rodriguez', type: 'Imaging Review', duration: 30, status: 'upcoming', room: 'Room 2B' },
  { id: '5', time: '13:00', patientName: 'Michael Chen', type: 'Treatment Planning', duration: 45, status: 'upcoming', room: 'Room 3A' },
  { id: '6', time: '14:00', patientName: 'John Davis', type: 'Biopsy Results', duration: 30, status: 'upcoming', room: 'Room 1A' },
  { id: '7', time: '15:00', patientName: 'Susan Lee', type: 'Second Opinion', duration: 60, status: 'upcoming', room: 'Room 2B' },
  { id: '8', time: '16:30', patientName: 'Mark Johnson', type: 'Post-Surgery Follow-up', duration: 30, status: 'upcoming', room: 'Room 3A' },
];

const mockTasks: ClinicalTask[] = [
  { id: '1', title: 'Review CT scan results', patient: 'Linda Patel', type: 'lab_review', priority: 'urgent', dueDate: '2024-01-25', status: 'pending' },
  { id: '2', title: 'Prescribe anti-nausea medication', patient: 'Michael Chen', type: 'prescription', priority: 'high', dueDate: '2024-01-25', status: 'pending' },
  { id: '3', title: 'Radiology referral', patient: 'Maria Garcia', type: 'referral', priority: 'high', dueDate: '2024-01-26', status: 'in_progress' },
  { id: '4', title: 'Complete surgical notes', patient: 'Robert Kim', type: 'documentation', priority: 'normal', dueDate: '2024-01-27', status: 'pending' },
  { id: '5', title: 'Schedule genetic counseling', patient: 'Emma Thompson', type: 'follow_up', priority: 'normal', dueDate: '2024-01-28', status: 'pending' },
  { id: '6', title: 'Tumor board presentation', patient: 'James Rodriguez', type: 'consult', priority: 'high', dueDate: '2024-01-29', status: 'pending' },
  { id: '7', title: 'Review pathology report', patient: 'Sarah Williams', type: 'lab_review', priority: 'normal', dueDate: '2024-01-30', status: 'pending' },
];

const mockLabResults: LabResult[] = [
  { id: '1', patient: 'Linda Patel', test: 'CA-19-9', result: '245 U/mL (↑)', status: 'abnormal', date: '2024-01-24', reviewed: false },
  { id: '2', patient: 'Emma Thompson', test: 'CA-15-3', result: '18 U/mL', status: 'normal', date: '2024-01-23', reviewed: false },
  { id: '3', patient: 'Michael Chen', test: 'CEA', result: '12.5 ng/mL (↑)', status: 'abnormal', date: '2024-01-23', reviewed: false },
  { id: '4', patient: 'Sarah Williams', test: 'CA-125', result: '22 U/mL', status: 'normal', date: '2024-01-22', reviewed: true },
  { id: '5', patient: 'Linda Patel', test: 'CBC', result: 'WBC: 2.8 (↓)', status: 'critical', date: '2024-01-24', reviewed: false },
  { id: '6', patient: 'David Wilson', test: 'PSA', result: '3.2 ng/mL', status: 'normal', date: '2024-01-20', reviewed: true },
];

const mockMessages: Message[] = [
  { id: '1', from: 'Dr. Sarah Chen', role: 'Radiologist', subject: 'CT Findings - Linda Patel', preview: 'New findings on latest CT scan...', date: '2024-01-24 14:30', unread: true, priority: 'urgent' },
  { id: '2', from: 'Nurse Johnson', role: 'Oncology Nurse', subject: 'Patient Vitals Alert', preview: 'Michael Chen BP elevated...', date: '2024-01-24 13:15', unread: true, priority: 'urgent' },
  { id: '3', from: 'Dr. Lee', role: 'Pathologist', subject: 'Biopsy Results Ready', preview: 'Pathology report for Garcia...', date: '2024-01-24 11:00', unread: true, priority: 'normal' },
  { id: '4', from: 'Lab Manager', role: 'Laboratory', subject: 'Critical Lab Values', preview: 'Patel WBC count critically low...', date: '2024-01-24 10:30', unread: false, priority: 'urgent' },
  { id: '5', from: 'Admin Office', role: 'Administration', subject: 'Tumor Board Meeting', preview: 'Reminder: Wednesday 3pm...', date: '2024-01-23 16:00', unread: false, priority: 'normal' },
];

// ============================================================================
// Helper Components
// ============================================================================

const StatCard: React.FC<{ label: string; value: number | string; color: string; icon: string; trend?: string }> = ({ label, value, color, icon, trend }) => {
  const theme = useTheme();
  return (
    <Card sx={{
      transition: 'all 0.3s ease', cursor: 'pointer',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 25px ${alpha(color, 0.3)}` },
    }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>{label}</Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color, animation: `${countUp} 0.5s ease-out` }}>
              {value}
            </Typography>
            {trend && <Typography variant="caption" sx={{ color: trend.startsWith('+') ? '#4caf50' : '#f44336' }}>{trend}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: alpha(color, 0.12), width: 48, height: 48, fontSize: 24 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

const PriorityChip: React.FC<{ priority: string }> = ({ priority }) => {
  const config: Record<string, { color: any }> = {
    urgent: { color: 'error' },
    high: { color: 'warning' },
    normal: { color: 'info' },
    low: { color: 'default' },
  };
  return <Chip size="small" label={priority} color={config[priority]?.color || 'default'} sx={{ fontWeight: 600, textTransform: 'capitalize' }} />;
};

const PatientStatusDot: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = { stable: '#4caf50', critical: '#f44336', improving: '#2196f3', new: '#ff9800' };
  return (
    <Box sx={{
      width: 10, height: 10, borderRadius: '50%',
      backgroundColor: colors[status] || '#9e9e9e',
      animation: status === 'critical' ? `${pulseDot} 1.5s infinite` : 'none',
    }} />
  );
};

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const DoctorDashboardPage: React.FC = () => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [patients] = useState(mockPatients);
  const [appointments] = useState(mockAppointments);
  const [tasks, setTasks] = useState(mockTasks);
  const [labResults, setLabResults] = useState(mockLabResults);
  const [messages] = useState(mockMessages);
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatient | null>(null);
  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false);

  const currentTime = new Date();
  const currentAppointment = appointments.find(a => a.status === 'in_progress');
  const nextAppointment = appointments.find(a => a.status === 'upcoming');
  const completedToday = appointments.filter(a => a.status === 'completed').length;
  const remainingToday = appointments.filter(a => a.status === 'upcoming').length;
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const unreadMessages = messages.filter(m => m.unread).length;
  const unreviewedLabs = labResults.filter(l => !l.reviewed).length;
  const criticalPatients = patients.filter(p => p.status === 'critical').length;

  const handleMarkTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' as const } : t));
  };

  const handleReviewLab = (labId: string) => {
    setLabResults(prev => prev.map(l => l.id === labId ? { ...l, reviewed: true } : l));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Fade in timeout={500}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={800}
                sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. Anderson
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                {' • '} Department of Oncology
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Badge badgeContent={unreadMessages} color="error">
                <Button variant="outlined">Messages</Button>
              </Badge>
              <Badge badgeContent={urgentTasks} color="warning">
                <Button variant="outlined">Tasks</Button>
              </Badge>
              <Button variant="contained"
                sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                New Note
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>

      {/* Critical Alert Banner */}
      {criticalPatients > 0 && (
        <Grow in timeout={700}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, animation: `${pulseDot} 3s infinite` }}>
            <Typography fontWeight={600}>
              {criticalPatients} critical patient{criticalPatients > 1 ? 's' : ''} requiring immediate attention
            </Typography>
            {patients.filter(p => p.status === 'critical').map(p => (
              <Typography key={p.id} variant="body2">• {p.name} - {p.condition}</Typography>
            ))}
          </Alert>
        </Grow>
      )}

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}><StatCard label="Today's Appointments" value={appointments.length} color="#667eea" icon="📅" trend={`${completedToday} done`} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="My Patients" value={patients.length} color="#764ba2" icon="👥" trend={`${criticalPatients} critical`} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Pending Tasks" value={tasks.filter(t => t.status !== 'completed').length} color="#ff9800" icon="📋" trend={`${urgentTasks} urgent`} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Lab Reviews" value={unreviewedLabs} color="#f44336" icon="🔬" /></Grid>
      </Grid>

      {/* Current/Next Appointment Banner */}
      {currentAppointment && (
        <Fade in timeout={600}>
          <Paper sx={{
            mb: 3, p: 3, borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))',
            border: '1px solid', borderColor: alpha(theme.palette.primary.main, 0.2),
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Chip label="IN PROGRESS" color="success" size="small" sx={{ mb: 1, fontWeight: 700 }} />
                <Typography variant="h6" fontWeight={700}>
                  {currentAppointment.patientName} - {currentAppointment.type}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentAppointment.time} • {currentAppointment.duration} min • {currentAppointment.room}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small">View Chart</Button>
                <Button variant="outlined" size="small">Order Lab</Button>
                <Button variant="contained" size="small" color="success">Complete Visit</Button>
              </Box>
            </Box>
          </Paper>
        </Fade>
      )}

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Schedule" />
          <Tab label={<Badge badgeContent={criticalPatients} color="error">Patients</Badge>} />
          <Tab label={<Badge badgeContent={urgentTasks} color="warning">Tasks</Badge>} />
          <Tab label={<Badge badgeContent={unreviewedLabs} color="error">Lab Results</Badge>} />
          <Tab label={<Badge badgeContent={unreadMessages} color="info">Messages</Badge>} />
        </Tabs>
      </Paper>

      {/* Tab 0: Today's Schedule */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>Today's Appointments</Typography>
                <List>
                  {appointments.map((appt, idx) => (
                    <Fade in timeout={200 + idx * 100} key={appt.id}>
                      <ListItem
                        sx={{
                          mb: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                          backgroundColor: appt.status === 'in_progress' ? alpha('#4caf50', 0.08) :
                            appt.status === 'completed' ? alpha('#9e9e9e', 0.08) : 'transparent',
                          opacity: appt.status === 'completed' ? 0.7 : 1,
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{
                            bgcolor: appt.status === 'in_progress' ? '#4caf50' :
                              appt.status === 'completed' ? '#9e9e9e' : alpha('#667eea', 0.15),
                            color: appt.status === 'in_progress' ? 'white' :
                              appt.status === 'completed' ? 'white' : '#667eea',
                            fontWeight: 700,
                          }}>
                            {appt.time.split(':')[0]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography fontWeight={600}>{appt.patientName}</Typography>
                              <Chip label={appt.type} size="small" variant="outlined" />
                            </Box>
                          }
                          secondary={`${appt.time} • ${appt.duration} min • ${appt.room}${appt.notes ? ` • ${appt.notes}` : ''}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={appt.status.replace('_', ' ')}
                            size="small"
                            color={
                              appt.status === 'completed' ? 'success' :
                              appt.status === 'in_progress' ? 'primary' :
                              appt.status === 'cancelled' ? 'error' : 'default'
                            }
                            sx={{ textTransform: 'capitalize' }}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Fade>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Schedule Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>Schedule Summary</Typography>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                    <CircularProgress variant="determinate" value={(completedToday / appointments.length) * 100}
                      size={100} thickness={5} sx={{ color: '#667eea' }} />
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight={700}>{completedToday}/{appointments.length}</Typography>
                        <Typography variant="caption" color="text.secondary">Done</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <List dense>
                  <ListItem><ListItemText primary="Completed" /><Chip label={completedToday} size="small" color="success" /></ListItem>
                  <ListItem><ListItemText primary="In Progress" /><Chip label={appointments.filter(a => a.status === 'in_progress').length} size="small" color="primary" /></ListItem>
                  <ListItem><ListItemText primary="Upcoming" /><Chip label={remainingToday} size="small" /></ListItem>
                </List>
              </CardContent>
            </Card>

            {nextAppointment && (
              <Card sx={{ borderRadius: 2, borderLeft: '4px solid #667eea' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="primary" fontWeight={700}>NEXT APPOINTMENT</Typography>
                  <Typography variant="h6" fontWeight={700}>{nextAppointment.patientName}</Typography>
                  <Typography variant="body2" color="text.secondary">{nextAppointment.type}</Typography>
                  <Typography variant="body2">{nextAppointment.time} • {nextAppointment.room}</Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 2 }} fullWidth>Prepare Visit</Button>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Tab 1: My Patients */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          {patients.map((patient, idx) => (
            <Grid item xs={12} md={6} lg={4} key={patient.id}>
              <Grow in timeout={200 + idx * 100}>
                <Card sx={{
                  borderRadius: 2, cursor: 'pointer', transition: 'all 0.3s ease',
                  borderLeft: `4px solid ${
                    patient.status === 'critical' ? '#f44336' :
                    patient.status === 'improving' ? '#4caf50' :
                    patient.status === 'new' ? '#ff9800' : '#2196f3'
                  }`,
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: theme.shadows[6] },
                }}
                onClick={() => { setSelectedPatient(patient); setPatientDrawerOpen(true); }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Badge badgeContent={patient.alerts} color="error">
                          <Avatar sx={{ bgcolor: alpha('#667eea', 0.15), color: '#667eea', fontWeight: 700 }}>
                            {patient.name.charAt(0)}
                          </Avatar>
                        </Badge>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>{patient.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {patient.age}y {patient.gender} • {patient.mrn}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PatientStatusDot status={patient.status} />
                        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                          {patient.status}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>{patient.condition}</Typography>

                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Last Visit</Typography>
                        <Typography variant="body2">{patient.lastVisit}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Next Appt</Typography>
                        <Typography variant="body2">{patient.nextAppointment}</Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" fullWidth>Chart</Button>
                      <Button size="small" variant="outlined" fullWidth>Orders</Button>
                      <Button size="small" variant="outlined" fullWidth>Notes</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Tab 2: Clinical Tasks */}
      <TabPanel value={activeTab} index={2}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Clinical Tasks</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['all', 'urgent', 'pending', 'completed'].map(filter => (
                  <Chip key={filter} label={filter} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                ))}
              </Box>
            </Box>

            <List>
              {tasks.sort((a, b) => {
                const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
                return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
              }).map((task, idx) => (
                <Fade in timeout={200 + idx * 80} key={task.id}>
                  <ListItem
                    sx={{
                      mb: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                      opacity: task.status === 'completed' ? 0.6 : 1,
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha('#667eea', 0.12), width: 36, height: 36, fontSize: 16 }}>
                        {task.type === 'lab_review' ? '🔬' :
                         task.type === 'prescription' ? '💊' :
                         task.type === 'referral' ? '📤' :
                         task.type === 'documentation' ? '📝' :
                         task.type === 'follow_up' ? '🔄' : '🩺'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight={600}>{task.title}</Typography>}
                      secondary={`${task.patient} • Due: ${task.dueDate}`}
                    />
                    <ListItemSecondaryAction sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <PriorityChip priority={task.priority} />
                      {task.status !== 'completed' && (
                        <Button size="small" variant="outlined" onClick={() => handleMarkTaskComplete(task.id)}>
                          Complete
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                </Fade>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 3: Lab Results */}
      <TabPanel value={activeTab} index={3}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Pending Lab Reviews</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.08) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Test</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Result</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {labResults.sort((a, b) => {
                    const statusOrder = { critical: 0, abnormal: 1, normal: 2 };
                    return (statusOrder[a.status] || 2) - (statusOrder[b.status] || 2);
                  }).map((lab, idx) => (
                    <Fade in timeout={200 + idx * 100} key={lab.id}>
                      <TableRow hover sx={{
                        opacity: lab.reviewed ? 0.6 : 1,
                        backgroundColor: lab.status === 'critical' && !lab.reviewed ? alpha('#f44336', 0.08) : 'transparent',
                      }}>
                        <TableCell><Typography fontWeight={600}>{lab.patient}</Typography></TableCell>
                        <TableCell>{lab.test}</TableCell>
                        <TableCell><Typography fontWeight={600}>{lab.result}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={lab.status}
                            color={lab.status === 'critical' ? 'error' : lab.status === 'abnormal' ? 'warning' : 'success'}
                          />
                        </TableCell>
                        <TableCell>{lab.date}</TableCell>
                        <TableCell>
                          {!lab.reviewed ? (
                            <Button size="small" variant="contained" onClick={() => handleReviewLab(lab.id)}
                              sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                              Review
                            </Button>
                          ) : (
                            <Chip label="Reviewed" size="small" color="success" variant="outlined" />
                          )}
                        </TableCell>
                      </TableRow>
                    </Fade>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Tab 4: Messages */}
      <TabPanel value={activeTab} index={4}>
        <Card sx={{ borderRadius: 2 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Messages</Typography>
            <List>
              {messages.map((msg, idx) => (
                <Fade in timeout={200 + idx * 100} key={msg.id}>
                  <ListItem
                    sx={{
                      mb: 1, borderRadius: 2, cursor: 'pointer',
                      backgroundColor: msg.unread ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                      border: '1px solid', borderColor: msg.unread ? alpha(theme.palette.primary.main, 0.2) : 'divider',
                      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge variant="dot" color={msg.unread ? 'primary' : 'default'}>
                        <Avatar sx={{ bgcolor: msg.priority === 'urgent' ? alpha('#f44336', 0.15) : alpha('#667eea', 0.15) }}>
                          {msg.from.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={msg.unread ? 700 : 400}>{msg.subject}</Typography>
                          {msg.priority === 'urgent' && <Chip label="Urgent" size="small" color="error" />}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {msg.from} ({msg.role}) • {msg.preview} • {msg.date}
                        </Typography>
                      }
                    />
                  </ListItem>
                </Fade>
              ))}
            </List>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Patient Detail Drawer */}
      <Drawer anchor="right" open={patientDrawerOpen} onClose={() => setPatientDrawerOpen(false)}
        PaperProps={{ sx: { width: 420, p: 3 } }}>
        {selectedPatient && (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: '#667eea', fontSize: 24 }}>
                {selectedPatient.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>{selectedPatient.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedPatient.age}y {selectedPatient.gender} • {selectedPatient.mrn}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <PatientStatusDot status={selectedPatient.status} />
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                    {selectedPatient.status}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Diagnosis</Typography>
            <Typography variant="body1" fontWeight={600} sx={{ mb: 2 }}>{selectedPatient.condition}</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: alpha('#667eea', 0.08) }}>
                  <Typography variant="caption" color="text.secondary">Last Visit</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedPatient.lastVisit}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2, bgcolor: alpha('#667eea', 0.08) }}>
                  <Typography variant="caption" color="text.secondary">Next Appt</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedPatient.nextAppointment}</Typography>
                </Paper>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Quick Actions</Typography>
            <Grid container spacing={1} sx={{ mb: 3 }}>
              {['View Chart', 'New Note', 'Order Lab', 'Prescribe', 'Refer', 'Message'].map(action => (
                <Grid item xs={6} key={action}>
                  <Button variant="outlined" size="small" fullWidth>{action}</Button>
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle2" fontWeight={700} gutterBottom>Treatment Timeline</Typography>
            <Stepper orientation="vertical" activeStep={2}>
              <Step completed><StepLabel>Diagnosis & Staging</StepLabel></Step>
              <Step completed><StepLabel>Treatment Planning</StepLabel></Step>
              <Step><StepLabel>Active Treatment</StepLabel></Step>
              <Step><StepLabel>Follow-up Care</StepLabel></Step>
              <Step><StepLabel>Survivorship</StepLabel></Step>
            </Stepper>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default DoctorDashboardPage;

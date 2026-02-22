import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, Avatar, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Rating, Tabs, Tab,
} from '@mui/material';
import {
  MedicalServices, Search, Add, PersonAdd, Star, AccessTime,
  CalendarMonth, Phone, Email, Edit, Visibility, Assessment,
  Groups, TrendingUp, EventAvailable, LocalHospital,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, SectionHeader, StatusBadge } from '../../components/common/SharedComponents';

const DoctorManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);

  const doctors = [
    { id: 'D-001', name: 'Dr. Sarah Smith', specialization: 'Oncology', department: 'Oncology', experience: 15, rating: 4.9, patients: 45, status: 'on_duty', phone: '+1-555-2001', email: 'sarah.smith@hospital.org', shift: 'Morning (8AM-4PM)', onCall: false, surgeries: 12, consultations: 156, avatar: 'SS' },
    { id: 'D-002', name: 'Dr. James Lee', specialization: 'Cardiology', department: 'Cardiology', experience: 12, rating: 4.8, patients: 38, status: 'on_duty', phone: '+1-555-2002', email: 'james.lee@hospital.org', shift: 'Morning (8AM-4PM)', onCall: true, surgeries: 8, consultations: 234, avatar: 'JL' },
    { id: 'D-003', name: 'Dr. Emily Chen', specialization: 'Neurosurgery', department: 'Neurology', experience: 20, rating: 4.7, patients: 22, status: 'in_surgery', phone: '+1-555-2003', email: 'emily.chen@hospital.org', shift: 'Morning (8AM-4PM)', onCall: false, surgeries: 25, consultations: 89, avatar: 'EC' },
    { id: 'D-004', name: 'Dr. Robert Wilson', specialization: 'General Surgery', department: 'Surgery', experience: 18, rating: 4.6, patients: 30, status: 'off_duty', phone: '+1-555-2004', email: 'robert.wilson@hospital.org', shift: 'Night (8PM-8AM)', onCall: false, surgeries: 35, consultations: 120, avatar: 'RW' },
    { id: 'D-005', name: 'Dr. Lisa Park', specialization: 'Pathology', department: 'Lab', experience: 10, rating: 4.9, patients: 0, status: 'on_duty', phone: '+1-555-2005', email: 'lisa.park@hospital.org', shift: 'Morning (8AM-4PM)', onCall: false, surgeries: 0, consultations: 445, avatar: 'LP' },
    { id: 'D-006', name: 'Dr. Mark Johnson', specialization: 'Radiation Oncology', department: 'Oncology', experience: 8, rating: 4.5, patients: 28, status: 'on_leave', phone: '+1-555-2006', email: 'mark.johnson@hospital.org', shift: '-', onCall: false, surgeries: 5, consultations: 178, avatar: 'MJ' },
  ];

  const onCallSchedule = [
    { day: 'Mon', doctors: ['Dr. Smith', 'Dr. Lee'], department: 'Oncology, Cardiology' },
    { day: 'Tue', doctors: ['Dr. Chen', 'Dr. Wilson'], department: 'Neurology, Surgery' },
    { day: 'Wed', doctors: ['Dr. Park', 'Dr. Smith'], department: 'Lab, Oncology' },
    { day: 'Thu', doctors: ['Dr. Lee', 'Dr. Chen'], department: 'Cardiology, Neurology' },
    { day: 'Fri', doctors: ['Dr. Wilson', 'Dr. Park'], department: 'Surgery, Lab' },
    { day: 'Sat', doctors: ['Dr. Smith'], department: 'Oncology' },
    { day: 'Sun', doctors: ['Dr. Lee'], department: 'Cardiology' },
  ];

  const filtered = doctors.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialization.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AppLayout title="Doctor Management" subtitle="Manage hospital medical staff" navItems={hospitalNavItems} portalType="hospital">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<MedicalServices />} label="Total Doctors" value={doctors.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Groups />} label="On Duty" value={doctors.filter(d => d.status === 'on_duty' || d.status === 'in_surgery').length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Phone />} label="On Call" value={doctors.filter(d => d.onCall).length} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<EventAvailable />} label="On Leave" value={doctors.filter(d => d.status === 'on_leave').length} color="#7b1fa2" /></Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField placeholder="Search doctors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="small" sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>Department</InputLabel><Select label="Department" defaultValue="all"><MenuItem value="all">All</MenuItem><MenuItem value="oncology">Oncology</MenuItem><MenuItem value="cardiology">Cardiology</MenuItem><MenuItem value="neurology">Neurology</MenuItem></Select></FormControl>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setShowAddDialog(true)}>Add Doctor</Button>
        </Stack>
      </Card>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Doctor List" />
        <Tab label="On-Call Schedule" />
        <Tab label="Performance" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          {filtered.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card sx={{ p: 3, transition: 'all 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }, cursor: 'pointer' }} onClick={() => setSelectedDoctor(doc)}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ width: 52, height: 52, bgcolor: doc.status === 'on_duty' ? '#e8f5e9' : doc.status === 'in_surgery' ? '#fff3e0' : '#f5f5f5', color: doc.status === 'on_duty' ? '#2e7d32' : doc.status === 'in_surgery' ? '#f57c00' : '#9e9e9e', fontWeight: 700, fontSize: 16 }}>{doc.avatar}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{doc.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{doc.specialization}</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Star sx={{ fontSize: 14, color: '#f57c00' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{doc.rating}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>• {doc.experience} yrs</Typography>
                    </Stack>
                  </Box>
                  <StatusBadge status={doc.status.replace('_', ' ')} />
                </Stack>
                <Divider sx={{ mb: 1.5 }} />
                <Grid container spacing={1}>
                  <Grid item xs={4}><Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: 16, fontWeight: 700 }}>{doc.patients}</Typography><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Patients</Typography></Box></Grid>
                  <Grid item xs={4}><Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: 16, fontWeight: 700 }}>{doc.surgeries}</Typography><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Surgeries</Typography></Box></Grid>
                  <Grid item xs={4}><Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: 16, fontWeight: 700 }}>{doc.consultations}</Typography><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Consults</Typography></Box></Grid>
                </Grid>
                <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
                  <Chip label={doc.department} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                  {doc.onCall && <Chip label="On Call" size="small" color="warning" sx={{ fontSize: 10 }} />}
                  <Chip label={doc.shift} size="small" sx={{ fontSize: 10 }} />
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
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Day</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>On-Call Doctors</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Departments</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {onCallSchedule.map((s) => (
                  <TableRow key={s.day} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{s.day}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>{s.doctors.map(d => <Chip key={d} label={d} size="small" sx={{ fontSize: 10 }} />)}</Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{s.department}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Doctor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Patients</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Surgeries</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Consultations</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Rating</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Performance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map((d) => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#e3f2fd', color: '#1565c0' }}>{d.avatar}</Avatar>
                        <Box><Typography sx={{ fontSize: 12, fontWeight: 600 }}>{d.name}</Typography><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{d.specialization}</Typography></Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{d.patients}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{d.surgeries}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{d.consultations}</TableCell>
                    <TableCell><Rating value={d.rating} readOnly size="small" precision={0.1} /></TableCell>
                    <TableCell>
                      <LinearProgress variant="determinate" value={d.rating * 20} sx={{ height: 6, borderRadius: 3, width: 80 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Doctor Detail Dialog */}
      <Dialog open={!!selectedDoctor} onClose={() => setSelectedDoctor(null)} maxWidth="sm" fullWidth>
        {selectedDoctor && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 52, height: 52, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }}>{selectedDoctor.avatar}</Avatar>
                <Box><Typography sx={{ fontWeight: 700, fontSize: 18 }}>{selectedDoctor.name}</Typography><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{selectedDoctor.specialization} • {selectedDoctor.department}</Typography></Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1.5}>
                {[
                  { l: 'Email', v: selectedDoctor.email },
                  { l: 'Phone', v: selectedDoctor.phone },
                  { l: 'Experience', v: `${selectedDoctor.experience} years` },
                  { l: 'Current Shift', v: selectedDoctor.shift },
                  { l: 'Status', v: selectedDoctor.status.replace('_', ' ') },
                  { l: 'Active Patients', v: selectedDoctor.patients },
                  { l: 'Total Surgeries', v: selectedDoctor.surgeries },
                  { l: 'Total Consultations', v: selectedDoctor.consultations },
                ].map(item => (
                  <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{item.v}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedDoctor(null)}>Close</Button>
              <Button variant="outlined" startIcon={<CalendarMonth />}>View Schedule</Button>
              <Button variant="contained" startIcon={<Edit />}>Edit Profile</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Doctor Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Doctor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="First Name" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Last Name" fullWidth size="small" /></Grid>
            </Grid>
            <TextField label="Email" fullWidth size="small" />
            <TextField label="Phone" fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Specialization" fullWidth size="small" /></Grid>
              <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Department</InputLabel><Select label="Department"><MenuItem value="oncology">Oncology</MenuItem><MenuItem value="cardiology">Cardiology</MenuItem><MenuItem value="neurology">Neurology</MenuItem><MenuItem value="surgery">Surgery</MenuItem></Select></FormControl></Grid>
            </Grid>
            <TextField label="Years of Experience" type="number" fullWidth size="small" />
            <TextField label="Medical License Number" fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowAddDialog(false)}>Add Doctor</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default DoctorManagement;

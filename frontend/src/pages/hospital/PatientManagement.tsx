import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  TextField, InputAdornment, Avatar, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Badge,
} from '@mui/material';
import {
  People, Search, Add, FilterList, PersonAdd, Download, Upload,
  Visibility, Edit, Delete, LocalHospital, Warning, CheckCircle,
  TrendingUp, Assessment, QrCode, Print, Phone, Email, Favorite,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';

const PatientManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdmitDialog, setShowAdmitDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  const patients = [
    { id: 'P-001', healthId: 'CG-2026-001234', name: 'John Davis', age: 65, gender: 'M', bloodType: 'O+', phone: '+1-555-1001', status: 'admitted', ward: 'Oncology', bed: 'A-12', doctor: 'Dr. Smith', riskScore: 82, cancerType: 'Lung', admitDate: 'Feb 15, 2026', insurance: 'BlueCross' },
    { id: 'P-002', healthId: 'CG-2026-001235', name: 'Mary Johnson', age: 58, gender: 'F', bloodType: 'A+', phone: '+1-555-1002', status: 'admitted', ward: 'Oncology', bed: 'A-15', doctor: 'Dr. Lee', riskScore: 75, cancerType: 'Breast', admitDate: 'Feb 18, 2026', insurance: 'Aetna' },
    { id: 'P-003', healthId: 'CG-2026-001236', name: 'Robert Brown', age: 72, gender: 'M', bloodType: 'B-', phone: '+1-555-1003', status: 'surgery', ward: 'Surgery', bed: 'S-03', doctor: 'Dr. Chen', riskScore: 68, cancerType: 'Prostate', admitDate: 'Feb 20, 2026', insurance: 'UnitedHealth' },
    { id: 'P-004', healthId: 'CG-2026-001237', name: 'Susan Wilson', age: 45, gender: 'F', bloodType: 'AB+', phone: '+1-555-1004', status: 'outpatient', ward: 'Outpatient', bed: '-', doctor: 'Dr. Park', riskScore: 45, cancerType: 'Screening', admitDate: 'Feb 22, 2026', insurance: 'Cigna' },
    { id: 'P-005', healthId: 'CG-2026-001238', name: 'Michael Lee', age: 55, gender: 'M', bloodType: 'O-', phone: '+1-555-1005', status: 'icu', ward: 'ICU', bed: 'ICU-05', doctor: 'Dr. Smith', riskScore: 91, cancerType: 'Liver', admitDate: 'Feb 10, 2026', insurance: 'Medicare' },
    { id: 'P-006', healthId: 'CG-2026-001239', name: 'Jennifer Garcia', age: 38, gender: 'F', bloodType: 'A-', phone: '+1-555-1006', status: 'discharged', ward: '-', bed: '-', doctor: 'Dr. Lee', riskScore: 22, cancerType: 'Clear', admitDate: 'Feb 05, 2026', insurance: 'BlueCross' },
    { id: 'P-007', healthId: 'CG-2026-001240', name: 'William Taylor', age: 68, gender: 'M', bloodType: 'B+', phone: '+1-555-1007', status: 'admitted', ward: 'Cardiology', bed: 'C-08', doctor: 'Dr. Lee', riskScore: 55, cancerType: 'Monitoring', admitDate: 'Feb 19, 2026', insurance: 'Aetna' },
    { id: 'P-008', healthId: 'CG-2026-001241', name: 'Patricia Anderson', age: 62, gender: 'F', bloodType: 'O+', phone: '+1-555-1008', status: 'admitted', ward: 'Neurology', bed: 'N-03', doctor: 'Dr. Chen', riskScore: 60, cancerType: 'Brain screening', admitDate: 'Feb 21, 2026', insurance: 'UnitedHealth' },
  ];

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.healthId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Patient Management" subtitle="Manage all patients in your hospital" navItems={hospitalNavItems} portalType="hospital">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<People />} label="Total Patients" value={patients.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<LocalHospital />} label="Admitted" value={patients.filter(p => p.status === 'admitted' || p.status === 'icu' || p.status === 'surgery').length} color="#2e7d32" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="High Risk" value={patients.filter(p => p.riskScore > 70).length} color="#c62828" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Discharged Today" value={1} color="#4caf50" /></Grid>
      </Grid>

      {/* Search & Filter Bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            placeholder="Search by name, patient ID, or Health ID..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            size="small" sx={{ minWidth: 300, flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" defaultValue="all"><MenuItem value="all">All</MenuItem><MenuItem value="admitted">Admitted</MenuItem><MenuItem value="icu">ICU</MenuItem><MenuItem value="outpatient">Outpatient</MenuItem><MenuItem value="discharged">Discharged</MenuItem></Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ward</InputLabel>
            <Select label="Ward" defaultValue="all"><MenuItem value="all">All Wards</MenuItem><MenuItem value="oncology">Oncology</MenuItem><MenuItem value="cardiology">Cardiology</MenuItem><MenuItem value="neurology">Neurology</MenuItem><MenuItem value="surgery">Surgery</MenuItem><MenuItem value="icu">ICU</MenuItem></Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Risk Level</InputLabel>
            <Select label="Risk Level" defaultValue="all"><MenuItem value="all">All</MenuItem><MenuItem value="high">High (&gt;70%)</MenuItem><MenuItem value="medium">Medium (40-70%)</MenuItem><MenuItem value="low">Low (&lt;40%)</MenuItem></Select>
          </FormControl>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setShowAdmitDialog(true)}>New Admission</Button>
          <Button variant="outlined" startIcon={<Download />}>Export</Button>
        </Stack>
      </Card>

      {/* Patient Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Patient ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Health ID</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Age/Gender</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Ward/Bed</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Cancer Risk</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Cancer Type</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Doctor</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} hover sx={{ bgcolor: p.riskScore > 80 ? '#fff5f5' : p.status === 'icu' ? '#fff8e1' : 'inherit', cursor: 'pointer' }} onClick={() => setSelectedPatient(p)}>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{p.id}</TableCell>
                  <TableCell sx={{ fontSize: 11 }}><Chip label={p.healthId} size="small" sx={{ fontSize: 10 }} /></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#e3f2fd', color: '#1565c0' }}>{p.name.split(' ').map(n => n[0]).join('')}</Avatar>
                      <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{p.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{p.age}/{p.gender} • {p.bloodType}</TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{p.ward} {p.bed !== '-' && `• ${p.bed}`}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Box sx={{ width: 35, height: 6, borderRadius: 3, bgcolor: '#f0f0f0', overflow: 'hidden' }}>
                        <Box sx={{ width: `${p.riskScore}%`, height: '100%', bgcolor: p.riskScore > 70 ? '#c62828' : p.riskScore > 40 ? '#f57c00' : '#4caf50' }} />
                      </Box>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: p.riskScore > 70 ? '#c62828' : p.riskScore > 40 ? '#f57c00' : '#4caf50' }}>{p.riskScore}%</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{p.cancerType}</TableCell>
                  <TableCell sx={{ fontSize: 12 }}>{p.doctor}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small"><Visibility sx={{ fontSize: 16 }} /></IconButton>
                      <IconButton size="small"><Edit sx={{ fontSize: 16 }} /></IconButton>
                      <IconButton size="small"><Assessment sx={{ fontSize: 16 }} /></IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Showing {filtered.length} of {patients.length} patients</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" disabled>Previous</Button>
            <Button size="small" variant="contained">1</Button>
            <Button size="small">2</Button>
            <Button size="small">Next</Button>
          </Stack>
        </Box>
      </Card>

      {/* Patient Detail Dialog */}
      <Dialog open={!!selectedPatient} onClose={() => setSelectedPatient(null)} maxWidth="md" fullWidth>
        {selectedPatient && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: '#1565c0', fontWeight: 700 }}>{selectedPatient.name.split(' ').map((n: string) => n[0]).join('')}</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{selectedPatient.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{selectedPatient.id} • {selectedPatient.healthId}</Typography>
                </Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <SectionHeader title="Patient Information" />
                  <Stack spacing={1.5}>
                    {[
                      { l: 'Age/Gender', v: `${selectedPatient.age} / ${selectedPatient.gender === 'M' ? 'Male' : 'Female'}` },
                      { l: 'Blood Type', v: selectedPatient.bloodType },
                      { l: 'Phone', v: selectedPatient.phone },
                      { l: 'Insurance', v: selectedPatient.insurance },
                      { l: 'Admit Date', v: selectedPatient.admitDate },
                      { l: 'Ward/Bed', v: `${selectedPatient.ward} / ${selectedPatient.bed}` },
                      { l: 'Attending Doctor', v: selectedPatient.doctor },
                    ].map(item => (
                      <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{item.l}</Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{item.v}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SectionHeader title="Cancer Risk Assessment" />
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: selectedPatient.riskScore > 70 ? '#fce4ec' : '#f8f9ff', borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 48, fontWeight: 800, color: selectedPatient.riskScore > 70 ? '#c62828' : selectedPatient.riskScore > 40 ? '#f57c00' : '#4caf50' }}>
                      {selectedPatient.riskScore}%
                    </Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Cancer Risk Score</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Type: {selectedPatient.cancerType}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button variant="contained" fullWidth size="small">Run AI Analysis</Button>
                    <Button variant="outlined" fullWidth size="small">View Records</Button>
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPatient(null)}>Close</Button>
              <Button variant="outlined" startIcon={<Print />}>Print</Button>
              <Button variant="contained" startIcon={<Edit />}>Edit</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Admit Patient Dialog */}
      <Dialog open={showAdmitDialog} onClose={() => setShowAdmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Patient Admission</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Health ID / Search Patient" fullWidth size="small" InputProps={{ endAdornment: <InputAdornment position="end"><QrCode sx={{ cursor: 'pointer' }} /></InputAdornment> }} />
            <Divider>Or Register New Patient</Divider>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="First Name" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Last Name" fullWidth size="small" /></Grid>
              <Grid item xs={4}><TextField label="Age" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={4}><FormControl fullWidth size="small"><InputLabel>Gender</InputLabel><Select label="Gender"><MenuItem value="M">Male</MenuItem><MenuItem value="F">Female</MenuItem></Select></FormControl></Grid>
              <Grid item xs={4}><FormControl fullWidth size="small"><InputLabel>Blood Type</InputLabel><Select label="Blood Type"><MenuItem value="O+">O+</MenuItem><MenuItem value="O-">O-</MenuItem><MenuItem value="A+">A+</MenuItem><MenuItem value="A-">A-</MenuItem><MenuItem value="B+">B+</MenuItem><MenuItem value="B-">B-</MenuItem><MenuItem value="AB+">AB+</MenuItem><MenuItem value="AB-">AB-</MenuItem></Select></FormControl></Grid>
            </Grid>
            <TextField label="Phone" fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Ward</InputLabel><Select label="Ward"><MenuItem value="oncology">Oncology</MenuItem><MenuItem value="cardiology">Cardiology</MenuItem><MenuItem value="neurology">Neurology</MenuItem><MenuItem value="surgery">Surgery</MenuItem><MenuItem value="icu">ICU</MenuItem></Select></FormControl></Grid>
              <Grid item xs={6}><FormControl fullWidth size="small"><InputLabel>Attending Doctor</InputLabel><Select label="Attending Doctor"><MenuItem value="dr_smith">Dr. Smith</MenuItem><MenuItem value="dr_lee">Dr. Lee</MenuItem><MenuItem value="dr_chen">Dr. Chen</MenuItem></Select></FormControl></Grid>
            </Grid>
            <TextField label="Reason for Admission" multiline rows={2} fullWidth size="small" />
            <TextField label="Insurance Provider" fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAdmitDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowAdmitDialog(false)}>Admit Patient</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default PatientManagement;

import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Avatar, Divider, Alert, Switch, FormControlLabel, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Badge,
} from '@mui/material';
import {
  Person, Edit, Save, CameraAlt, LocalHospital, FamilyRestroom,
  ContactEmergency, HealthAndSafety, Badge as BadgeIcon, Email,
  Phone, LocationOn, CalendarMonth, Wc, Bloodtype, Height,
  MonitorWeight, ReportProblem, Warning, Verified, Lock,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { SectionHeader, InfoRow, StatCard } from '../../components/common/SharedComponents';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showAllergyDialog, setShowAllergyDialog] = useState(false);

  const profile = {
    name: user?.full_name || 'John Doe', email: user?.email || 'john.doe@email.com',
    phone: '+1 (555) 123-4567', dateOfBirth: '1985-06-15', gender: 'Male',
    bloodType: 'O+', height: '5\'10"', weight: '165 lbs', bmi: 23.7,
    address: '456 Health Street, Medical City, MC 12345',
    healthId: 'CG-2026-001234', insuranceProvider: 'BlueCross BlueShield',
    insuranceId: 'BCB-789456', pcp: 'Dr. Sarah Smith', pcpPhone: '+1 (555) 987-6543',
    joinDate: 'January 15, 2025', lastLogin: 'February 20, 2026',
  };

  const emergencyContacts = [
    { id: '1', name: 'Jane Doe', relationship: 'Spouse', phone: '+1 (555) 234-5678', email: 'jane.doe@email.com', primary: true },
    { id: '2', name: 'Robert Doe', relationship: 'Brother', phone: '+1 (555) 345-6789', email: 'robert.doe@email.com', primary: false },
  ];

  const allergies = [
    { id: '1', allergen: 'Penicillin', type: 'Drug', severity: 'Severe', reaction: 'Anaphylaxis', diagnosed: '2010' },
    { id: '2', allergen: 'Peanuts', type: 'Food', severity: 'Moderate', reaction: 'Hives, swelling', diagnosed: '2005' },
    { id: '3', allergen: 'Latex', type: 'Environmental', severity: 'Mild', reaction: 'Skin irritation', diagnosed: '2015' },
  ];

  const familyHistory = [
    { relation: 'Father', condition: 'Type 2 Diabetes', age: 52, status: 'Living with condition' },
    { relation: 'Mother', condition: 'Breast Cancer', age: 48, status: 'In remission' },
    { relation: 'Grandfather (Paternal)', condition: 'Colon Cancer', age: 65, status: 'Deceased' },
    { relation: 'Grandmother (Maternal)', condition: 'Heart Disease', age: 70, status: 'Living with condition' },
    { relation: 'Uncle (Paternal)', condition: 'Prostate Cancer', age: 58, status: 'In remission' },
  ];

  const medicalHistory = [
    { condition: 'Appendectomy', date: '2010', type: 'Surgery', status: 'Resolved' },
    { condition: 'Pre-diabetes', date: '2023', type: 'Chronic', status: 'Monitoring' },
    { condition: 'High Cholesterol', date: '2024', type: 'Chronic', status: 'Managed with medication' },
    { condition: 'Seasonal Allergies', date: '2015', type: 'Chronic', status: 'Managed' },
  ];

  return (
    <AppLayout title="My Profile" subtitle="Manage your personal and medical information" navItems={patientNavItems} portalType="patient">
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Personal Info" />
        <Tab label="Medical Info" />
        <Tab label="Emergency Contacts" />
        <Tab label="Family History" />
        <Tab label="Insurance" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={<IconButton size="small" sx={{ bgcolor: '#1565c0', color: 'white', width: 32, height: 32, '&:hover': { bgcolor: '#0d47a1' } }}><CameraAlt sx={{ fontSize: 16 }} /></IconButton>}
              >
                <Avatar sx={{ width: 100, height: 100, mx: 'auto', fontSize: 36, bgcolor: '#1565c0', fontWeight: 700 }}>
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
              </Badge>
              <Typography sx={{ fontWeight: 700, fontSize: 20, mt: 2 }}>{profile.name}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{profile.email}</Typography>
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                <Chip label={profile.healthId} size="small" icon={<Verified sx={{ fontSize: 14 }} />} color="primary" sx={{ fontSize: 11 }} />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1.5}>
                <InfoRow label="Member Since" value={profile.joinDate} />
                <InfoRow label="Last Login" value={profile.lastLogin} />
                <InfoRow label="Blood Type" value={profile.bloodType} />
                <InfoRow label="BMI" value={`${profile.bmi} (Normal)`} />
              </Stack>
              <Button variant="outlined" fullWidth sx={{ mt: 2 }} onClick={() => setEditing(!editing)} startIcon={editing ? <Save /> : <Edit />}>
                {editing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Personal Details" />
              <Grid container spacing={2}>
                {[
                  { label: 'Full Name', value: profile.name, icon: <Person />, type: 'text' },
                  { label: 'Email', value: profile.email, icon: <Email />, type: 'email' },
                  { label: 'Phone', value: profile.phone, icon: <Phone />, type: 'tel' },
                  { label: 'Date of Birth', value: profile.dateOfBirth, icon: <CalendarMonth />, type: 'date' },
                  { label: 'Gender', value: profile.gender, icon: <Wc />, type: 'text' },
                  { label: 'Blood Type', value: profile.bloodType, icon: <Bloodtype />, type: 'text' },
                  { label: 'Height', value: profile.height, icon: <Height />, type: 'text' },
                  { label: 'Weight', value: profile.weight, icon: <MonitorWeight />, type: 'text' },
                ].map((field) => (
                  <Grid item xs={12} sm={6} key={field.label}>
                    {editing ? (
                      <TextField label={field.label} defaultValue={field.value} fullWidth size="small" type={field.type} InputLabelProps={field.type === 'date' ? { shrink: true } : undefined} />
                    ) : (
                      <Box sx={{ p: 1.5, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ color: 'text.secondary' }}>{field.icon}</Box>
                          <Box>
                            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{field.label}</Typography>
                            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{field.value}</Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ my: 2 }} />
              <SectionHeader title="Address" />
              {editing ? (
                <TextField label="Full Address" defaultValue={profile.address} fullWidth size="small" multiline rows={2} />
              ) : (
                <Box sx={{ p: 1.5, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOn sx={{ color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 13 }}>{profile.address}</Typography>
                  </Stack>
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <SectionHeader title="Allergies" action={<Button startIcon={<ReportProblem />} size="small" onClick={() => setShowAllergyDialog(true)}>Add Allergy</Button>} />
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#fff3e0' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Allergen</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Severity</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Reaction</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Diagnosed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {allergies.map((a) => (
                      <TableRow key={a.id} hover>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {a.severity === 'Severe' && <Warning sx={{ fontSize: 16, color: '#c62828' }} />}
                            <span>{a.allergen}</span>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{a.type}</TableCell>
                        <TableCell>
                          <Chip label={a.severity} size="small" color={a.severity === 'Severe' ? 'error' : a.severity === 'Moderate' ? 'warning' : 'info'} sx={{ fontSize: 10 }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{a.reaction}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{a.diagnosed}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <SectionHeader title="Medical History" />
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Condition</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Year</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {medicalHistory.map((m, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{m.condition}</TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{m.date}</TableCell>
                        <TableCell><Chip label={m.type} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                        <TableCell sx={{ fontSize: 12 }}>{m.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<ContactEmergency />} onClick={() => setShowEmergencyDialog(true)}>Add Contact</Button>
          </Box>
          <Grid container spacing={2}>
            {emergencyContacts.map((c) => (
              <Grid item xs={12} sm={6} key={c.id}>
                <Card sx={{ p: 3, border: c.primary ? '2px solid #1565c0' : '1px solid #e0e0e0' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }}>{c.name[0]}</Avatar>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{c.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{c.relationship}</Typography>
                      </Box>
                    </Stack>
                    {c.primary && <Chip label="Primary" size="small" color="primary" sx={{ fontSize: 10 }} />}
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography sx={{ fontSize: 13 }}>{c.phone}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography sx={{ fontSize: 13 }}>{c.email}</Typography>
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button size="small" variant="outlined" startIcon={<Phone />}>Call</Button>
                    <Button size="small" variant="outlined" startIcon={<Edit />}>Edit</Button>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {activeTab === 3 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Relation</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Condition</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Age at Diagnosis</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {familyHistory.map((f, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{f.relation}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {f.condition.toLowerCase().includes('cancer') && <Warning sx={{ fontSize: 14, color: '#c62828' }} />}
                        <Typography sx={{ fontSize: 13 }}>{f.condition}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{f.age}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{f.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2 }}>
            <Alert severity="warning">
              Family history of cancer (breast, colon, prostate) increases your risk. Discuss screening schedules with your oncologist.
            </Alert>
          </Box>
        </Card>
      )}

      {activeTab === 4 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Insurance Information" />
              <Stack spacing={2}>
                <InfoRow label="Provider" value={profile.insuranceProvider} />
                <InfoRow label="Policy Number" value={profile.insuranceId} />
                <InfoRow label="Group Number" value="GRP-45678" />
                <InfoRow label="Plan Type" value="PPO" />
                <InfoRow label="Effective Date" value="January 1, 2025" />
                <InfoRow label="Copay (Office Visit)" value="$25" />
                <InfoRow label="Copay (Specialist)" value="$50" />
                <InfoRow label="Deductible" value="$1,500" />
                <InfoRow label="Out-of-Pocket Max" value="$5,000" />
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Primary Care Provider" />
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#e3f2fd', color: '#1565c0' }}>SS</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{profile.pcp}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Oncologist • Cancer Research Center</Typography>
                </Box>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 13 }}>{profile.pcpPhone}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 13 }}>dr.smith@cancerresearch.org</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 13 }}>123 Medical Blvd, Suite 200</Typography>
                </Stack>
              </Stack>
              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>Book Appointment</Button>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Emergency Contact Dialog */}
      <Dialog open={showEmergencyDialog} onClose={() => setShowEmergencyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Emergency Contact</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full Name" fullWidth size="small" />
            <TextField label="Relationship" fullWidth size="small" />
            <TextField label="Phone Number" fullWidth size="small" />
            <TextField label="Email" fullWidth size="small" />
            <FormControlLabel control={<Switch />} label="Set as primary contact" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmergencyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowEmergencyDialog(false)}>Add Contact</Button>
        </DialogActions>
      </Dialog>

      {/* Allergy Dialog */}
      <Dialog open={showAllergyDialog} onClose={() => setShowAllergyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Allergy</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Allergen" fullWidth size="small" />
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select label="Type" defaultValue="">
                <MenuItem value="Drug">Drug</MenuItem>
                <MenuItem value="Food">Food</MenuItem>
                <MenuItem value="Environmental">Environmental</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select label="Severity" defaultValue="">
                <MenuItem value="Mild">Mild</MenuItem>
                <MenuItem value="Moderate">Moderate</MenuItem>
                <MenuItem value="Severe">Severe</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Reaction" fullWidth size="small" />
            <TextField label="Year Diagnosed" fullWidth size="small" type="number" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAllergyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowAllergyDialog(false)}>Add Allergy</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default ProfilePage;

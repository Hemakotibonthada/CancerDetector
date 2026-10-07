import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Avatar, Divider, Alert, Switch, FormControlLabel, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Badge, CircularProgress,
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
import { patientsAPI } from '../../services/api';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editing, setEditing] = useState(false);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [showAllergyDialog, setShowAllergyDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>({
    name: user?.full_name || '', email: user?.email || '',
    phone: '', dateOfBirth: '', gender: '', bloodType: '',
    height: '', weight: '', bmi: 0, address: '', healthId: '',
    insuranceProvider: '', insuranceId: '', pcp: '', pcpPhone: '',
    joinDate: '', lastLogin: '',
  });
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [familyHistory, setFamilyHistory] = useState<any[]>([]);
  const [medicalHistory, setMedicalHistory] = useState<any[]>([]);
  const [contactDraft, setContactDraft] = useState({ name: '', relationship: '', phone: '', email: '', is_primary: false });
  const [allergyDraft, setAllergyDraft] = useState({ allergen: '', allergy_type: 'Drug', severity: 'Mild', reaction: '', year: '' });
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await patientsAPI.getMyProfile();
      const p = res.data;
      setProfile({
        name: p.full_name || p.user?.full_name || user?.full_name || '',
        email: p.email || p.user?.email || user?.email || '',
        phone: p.phone_number || p.phone || '',
        dateOfBirth: p.date_of_birth || '',
        gender: p.gender || '',
        bloodType: p.blood_type || '',
        height: p.height ? `${p.height}` : '',
        weight: p.weight ? `${p.weight} lbs` : '',
        bmi: p.bmi || 0,
        address: p.address || '',
        healthId: p.health_id || '',
        insuranceProvider: p.insurance_provider || '',
        insuranceId: p.insurance_id || '',
        pcp: p.primary_care_physician || '',
        pcpPhone: p.pcp_phone || '',
        joinDate: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
        lastLogin: p.last_login ? new Date(p.last_login).toLocaleDateString() : '—',
      });
      if (p.emergency_contacts) setEmergencyContacts(Array.isArray(p.emergency_contacts) ? p.emergency_contacts : []);
      if (p.allergies) setAllergies(Array.isArray(p.allergies) ? p.allergies : JSON.parse(p.allergies || '[]'));
      const history = p.family_histories || p.family_history;
      if (history) setFamilyHistory(Array.isArray(history) ? history : []);
      if (p.medical_history) setMedicalHistory(Array.isArray(p.medical_history) ? p.medical_history : JSON.parse(p.medical_history || '[]'));
      setError(null);
    } catch (err: any) {
      console.error('Failed to load profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const saveContact = async () => {
    if (!contactDraft.name.trim() || !contactDraft.phone.trim() || !contactDraft.relationship.trim()) return;
    setSaving(true);
    try {
      await patientsAPI.addEmergencyContact(contactDraft);
      setShowEmergencyDialog(false);
      setContactDraft({ name: '', relationship: '', phone: '', email: '', is_primary: false });
      await loadProfile();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not save the contact');
    } finally {
      setSaving(false);
    }
  };

  const saveAllergy = async () => {
    if (!allergyDraft.allergen.trim()) return;
    setSaving(true);
    try {
      await patientsAPI.addAllergy({
        allergy_type: allergyDraft.allergy_type,
        allergen: allergyDraft.allergen,
        reaction: allergyDraft.reaction || null,
        severity: allergyDraft.severity,
        onset_date: allergyDraft.year ? `${allergyDraft.year}-01-01T00:00:00` : null,
      });
      setShowAllergyDialog(false);
      setAllergyDraft({ allergen: '', allergy_type: 'Drug', severity: 'Mild', reaction: '', year: '' });
      await loadProfile();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Could not save the allergy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="My Profile" subtitle="Manage your personal and medical information" navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : <>
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
                <InfoRow label="Provider" value={profile.insuranceProvider || '—'} />
                <InfoRow label="Policy Number" value={profile.insuranceId || '—'} />
                <InfoRow label="Group Number" value="—" />
                <InfoRow label="Plan Type" value="—" />
                <InfoRow label="Effective Date" value="—" />
                <InfoRow label="Copay (Office Visit)" value="—" />
                <InfoRow label="Copay (Specialist)" value="—" />
                <InfoRow label="Deductible" value="—" />
                <InfoRow label="Out-of-Pocket Max" value="—" />
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Primary Care Provider" />
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#e3f2fd', color: '#1565c0' }}>SS</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{profile.pcp || 'No primary clinician recorded'}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{profile.pcp ? 'Recorded clinician' : '—'}</Typography>
                </Box>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 13 }}>{profile.pcpPhone || '—'}</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 13 }}>—</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography sx={{ fontSize: 13 }}>{profile.address || '—'}</Typography>
                </Stack>
              </Stack>
              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>Book Appointment</Button>
            </Card>
          </Grid>
        </Grid>
      )}

      </>}

      {/* Emergency Contact Dialog */}
      <Dialog open={showEmergencyDialog} onClose={() => setShowEmergencyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Emergency Contact</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full Name" fullWidth size="small" value={contactDraft.name} onChange={(e) => setContactDraft({ ...contactDraft, name: e.target.value })} />
            <TextField label="Relationship" fullWidth size="small" value={contactDraft.relationship} onChange={(e) => setContactDraft({ ...contactDraft, relationship: e.target.value })} />
            <TextField label="Phone Number" fullWidth size="small" value={contactDraft.phone} onChange={(e) => setContactDraft({ ...contactDraft, phone: e.target.value })} />
            <TextField label="Email" fullWidth size="small" value={contactDraft.email} onChange={(e) => setContactDraft({ ...contactDraft, email: e.target.value })} />
            <FormControlLabel control={<Switch checked={contactDraft.is_primary} onChange={(e) => setContactDraft({ ...contactDraft, is_primary: e.target.checked })} />} label="Set as primary contact" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEmergencyDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={saveContact}>Add Contact</Button>
        </DialogActions>
      </Dialog>

      {/* Allergy Dialog */}
      <Dialog open={showAllergyDialog} onClose={() => setShowAllergyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Allergy</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Allergen" fullWidth size="small" value={allergyDraft.allergen} onChange={(e) => setAllergyDraft({ ...allergyDraft, allergen: e.target.value })} />
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={allergyDraft.allergy_type} onChange={(e) => setAllergyDraft({ ...allergyDraft, allergy_type: e.target.value })}>
                <MenuItem value="Drug">Drug</MenuItem>
                <MenuItem value="Food">Food</MenuItem>
                <MenuItem value="Environmental">Environmental</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select label="Severity" value={allergyDraft.severity} onChange={(e) => setAllergyDraft({ ...allergyDraft, severity: e.target.value })}>
                <MenuItem value="Mild">Mild</MenuItem>
                <MenuItem value="Moderate">Moderate</MenuItem>
                <MenuItem value="Severe">Severe</MenuItem>
              </Select>
            </FormControl>
            <TextField label="Reaction" fullWidth size="small" value={allergyDraft.reaction} onChange={(e) => setAllergyDraft({ ...allergyDraft, reaction: e.target.value })} />
            <TextField label="Year Diagnosed" fullWidth size="small" type="number" value={allergyDraft.year} onChange={(e) => setAllergyDraft({ ...allergyDraft, year: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAllergyDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled={saving} onClick={saveAllergy}>Add Allergy</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default ProfilePage;

import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, Avatar, Divider, Rating, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, Tabs, Tab,
} from '@mui/material';
import {
  LocalHospital, Search, LocationOn, Star, Phone, Email,
  DirectionsCar, AccessTime, MedicalServices, Verified,
  MyLocation, FilterList, Favorite, FavoriteBorder,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { StatCard } from '../../components/common/SharedComponents';

const HospitalsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);

  const hospitals = [
    { id: '1', name: 'Cancer Research Center', type: 'Specialty Cancer Center', address: '123 Medical Blvd, Suite 200, Medical City', distance: 2.3, rating: 4.8, reviews: 234, phone: '+1 (555) 100-2000', email: 'info@crc.org', hours: 'Mon-Fri 8AM-6PM', emergency: true, departments: ['Oncology', 'Radiology', 'Pathology', 'Surgery'], doctors: 45, beds: 200, accredited: true, insurance: ['BlueCross', 'Aetna', 'UnitedHealth'], favorite: true },
    { id: '2', name: 'City General Hospital', type: 'General Hospital', address: '456 Health Street, Medical City', distance: 3.1, rating: 4.5, reviews: 567, phone: '+1 (555) 200-3000', email: 'info@cgh.org', hours: '24/7', emergency: true, departments: ['General Medicine', 'Cardiology', 'Neurology', 'Orthopedics', 'Oncology'], doctors: 120, beds: 500, accredited: true, insurance: ['All major insurances'], favorite: false },
    { id: '3', name: 'Community Health Center', type: 'Community Clinic', address: '789 Wellness Ave, Medical City', distance: 1.5, rating: 4.3, reviews: 123, phone: '+1 (555) 300-4000', email: 'info@chc.org', hours: 'Mon-Sat 9AM-5PM', emergency: false, departments: ['Primary Care', 'Lab Services', 'Vaccination'], doctors: 15, beds: 30, accredited: true, insurance: ['BlueCross', 'Medicaid'], favorite: false },
    { id: '4', name: 'University Medical Center', type: 'Teaching Hospital', address: '321 Academic Drive, University District', distance: 5.8, rating: 4.9, reviews: 890, phone: '+1 (555) 400-5000', email: 'info@umc.edu', hours: '24/7', emergency: true, departments: ['All Specialties', 'Research', 'Clinical Trials'], doctors: 300, beds: 800, accredited: true, insurance: ['All major insurances'], favorite: true },
    { id: '5', name: 'Skin & Dermatology Clinic', type: 'Specialty Clinic', address: '654 Park Road, Medical City', distance: 4.2, rating: 4.6, reviews: 78, phone: '+1 (555) 500-6000', email: 'info@sdc.org', hours: 'Mon-Fri 9AM-4PM', emergency: false, departments: ['Dermatology', 'Cosmetic Surgery', 'Skin Cancer'], doctors: 8, beds: 0, accredited: true, insurance: ['BlueCross', 'Cigna'], favorite: false },
    { id: '6', name: 'Heart & Vascular Institute', type: 'Specialty Center', address: '987 Cardiac Lane, Medical City', distance: 6.1, rating: 4.7, reviews: 345, phone: '+1 (555) 600-7000', email: 'info@hvi.org', hours: 'Mon-Fri 7AM-7PM', emergency: true, departments: ['Cardiology', 'Cardiac Surgery', 'Vascular'], doctors: 35, beds: 150, accredited: true, insurance: ['BlueCross', 'Aetna', 'UnitedHealth'], favorite: false },
  ];

  const filtered = hospitals.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()) || h.type.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <AppLayout title="Find Hospitals" subtitle="Search nearby healthcare facilities" navItems={patientNavItems} portalType="patient">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<LocalHospital />} label="Nearby" value={hospitals.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<MedicalServices />} label="Cancer Centers" value={2} color="#c62828" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Favorite />} label="Favorites" value={hospitals.filter(h => h.favorite).length} color="#e91e63" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Verified />} label="Accredited" value={hospitals.filter(h => h.accredited).length} color="#4caf50" /></Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search hospitals, clinics, specialties..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          />
          <Button variant="outlined" startIcon={<MyLocation />} sx={{ whiteSpace: 'nowrap' }}>Use Location</Button>
          <Button variant="outlined" startIcon={<FilterList />}>Filter</Button>
        </Stack>
      </Card>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="All" />
        <Tab label="Cancer Centers" />
        <Tab label="Favorites" />
      </Tabs>

      <Grid container spacing={2}>
        {(activeTab === 1 ? filtered.filter(h => h.type.includes('Cancer')) : activeTab === 2 ? filtered.filter(h => h.favorite) : filtered).map((h) => (
          <Grid item xs={12} md={6} key={h.id}>
            <Card sx={{ p: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' } }} onClick={() => setSelectedHospital(h)}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ width: 52, height: 52, bgcolor: h.type.includes('Cancer') ? '#fce4ec' : '#e3f2fd', color: h.type.includes('Cancer') ? '#c62828' : '#1565c0', fontWeight: 700, fontSize: 14 }}>
                    <LocalHospital />
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{h.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{h.type}</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                      <Star sx={{ fontSize: 14, color: '#f57c00' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{h.rating}</Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>({h.reviews} reviews)</Typography>
                    </Stack>
                  </Box>
                </Stack>
                <Box sx={{ cursor: 'pointer' }}>
                  {h.favorite ? <Favorite sx={{ color: '#e91e63' }} /> : <FavoriteBorder sx={{ color: '#ccc' }} />}
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 12 }}>{h.distance} miles away</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 12 }}>{h.hours}</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MedicalServices sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography sx={{ fontSize: 12 }}>{h.doctors} doctors</Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  {h.emergency && <Chip label="24/7 Emergency" size="small" color="error" sx={{ fontSize: 10 }} />}
                  {h.accredited && <Chip label="Accredited" size="small" color="success" sx={{ fontSize: 10, ml: 0.5 }} />}
                </Grid>
              </Grid>
              <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                {h.departments.slice(0, 3).map(d => <Chip key={d} label={d} size="small" variant="outlined" sx={{ fontSize: 10 }} />)}
                {h.departments.length > 3 && <Chip label={`+${h.departments.length - 3} more`} size="small" sx={{ fontSize: 10 }} />}
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button size="small" variant="contained" fullWidth>Book Appointment</Button>
                <Button size="small" variant="outlined" startIcon={<Phone />}>Call</Button>
                <Button size="small" variant="outlined" startIcon={<DirectionsCar />}>Directions</Button>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Hospital Detail Dialog */}
      <Dialog open={!!selectedHospital} onClose={() => setSelectedHospital(null)} maxWidth="md" fullWidth>
        {selectedHospital && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>{selectedHospital.name}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1.5}>
                    <Box sx={{ p: 1.5, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Address</Typography>
                      <Typography sx={{ fontSize: 13 }}>{selectedHospital.address}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Phone</Typography>
                      <Typography sx={{ fontSize: 13 }}>{selectedHospital.phone}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Email</Typography>
                      <Typography sx={{ fontSize: 13 }}>{selectedHospital.email}</Typography>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: '#f8f9ff', borderRadius: 2 }}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Hours</Typography>
                      <Typography sx={{ fontSize: 13 }}>{selectedHospital.hours}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Rating value={selectedHospital.rating} readOnly precision={0.1} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{selectedHospital.rating} ({selectedHospital.reviews} reviews)</Typography>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Departments</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {selectedHospital.departments.map((d: string) => <Chip key={d} label={d} size="small" variant="outlined" />)}
                  </Stack>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Accepted Insurance</Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {selectedHospital.insurance.map((i: string) => <Chip key={i} label={i} size="small" color="primary" variant="outlined" />)}
                  </Stack>
                  <Grid container spacing={2}>
                    <Grid item xs={4}><Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8f9ff', borderRadius: 2 }}><Typography sx={{ fontSize: 20, fontWeight: 700 }}>{selectedHospital.doctors}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Doctors</Typography></Box></Grid>
                    <Grid item xs={4}><Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8f9ff', borderRadius: 2 }}><Typography sx={{ fontSize: 20, fontWeight: 700 }}>{selectedHospital.beds}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Beds</Typography></Box></Grid>
                    <Grid item xs={4}><Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8f9ff', borderRadius: 2 }}><Typography sx={{ fontSize: 20, fontWeight: 700 }}>{selectedHospital.distance}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Miles</Typography></Box></Grid>
                  </Grid>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedHospital(null)}>Close</Button>
              <Button variant="contained">Book Appointment</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </AppLayout>
  );
};

export default HospitalsPage;

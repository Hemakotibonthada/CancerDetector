import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Avatar,
  LinearProgress, CircularProgress, Switch, FormControlLabel, Rating, Alert,
} from '@mui/material';
import {
  LocalHospital, Search, Add, Edit, Visibility, CheckCircle,
  Warning, Block, LocationOn, Phone, Email, Star,
  TrendingUp, People, Hotel, Science, Verified,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';
import { hospitalsAPI } from '../../services/api';

const HospitalManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hospitalsAPI.list();
      setHospitals(res.data?.hospitals ?? res.data ?? []);
    } catch (err) {
      setError('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = hospitals.filter(h =>
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Hospital Management" subtitle="Manage registered hospitals" navItems={adminNavItems} portalType="admin">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<LocalHospital />} label="Total Hospitals" value={hospitals.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Active" value={hospitals.filter(h => h.status === 'active').length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Pending" value={hospitals.filter(h => h.status === 'pending').length} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Hotel />} label="Total Beds" value={hospitals.reduce((a, h) => a + h.beds, 0)} color="#7b1fa2" /></Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField placeholder="Search hospitals..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="small" sx={{ flex: 1, minWidth: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" defaultValue="all"><MenuItem value="all">All</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="pending">Pending</MenuItem><MenuItem value="suspended">Suspended</MenuItem></Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select label="Type" defaultValue="all"><MenuItem value="all">All</MenuItem><MenuItem value="general">General</MenuItem><MenuItem value="specialty">Specialty</MenuItem><MenuItem value="clinic">Clinic</MenuItem></Select>
          </FormControl>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowAddHospital(true)}>Register Hospital</Button>
        </Stack>
      </Card>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Hospital List" />
        <Tab label="Performance Comparison" />
        <Tab label="Subscription Plans" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Hospital', 'Location', 'Type', 'Beds', 'Doctors', 'Occupancy', 'Rating', 'Status', 'AI', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((h) => (
                  <TableRow key={h.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedHospital(h)}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, bgcolor: h.status === 'active' ? '#e8f5e9' : h.status === 'pending' ? '#fff3e0' : '#fce4ec', color: h.status === 'active' ? '#2e7d32' : h.status === 'pending' ? '#f57c00' : '#c62828' }}>
                          <LocalHospital sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{h.name}</Typography>
                            {h.verified && <Verified sx={{ fontSize: 14, color: '#1565c0' }} />}
                          </Stack>
                          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{h.id} • Since {h.joined}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{h.city}, {h.state}</TableCell>
                    <TableCell><Chip label={h.type} size="small" sx={{ fontSize: 10 }} /></TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{h.beds}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{h.doctors}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LinearProgress variant="determinate" value={h.occupancy} sx={{ height: 6, borderRadius: 3, width: 40 }} color={h.occupancy > 80 ? 'warning' : 'success'} />
                        <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{h.occupancy}%</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {h.rating > 0 ? <Stack direction="row" spacing={0.3} alignItems="center"><Star sx={{ fontSize: 14, color: '#f57c00' }} /><Typography sx={{ fontSize: 12, fontWeight: 600 }}>{h.rating}</Typography></Stack> : <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>N/A</Typography>}
                    </TableCell>
                    <TableCell><StatusBadge status={h.status} /></TableCell>
                    <TableCell>{h.aiEnabled ? <Chip label="AI" size="small" color="primary" sx={{ fontSize: 9, height: 20 }} /> : <Chip label="OFF" size="small" sx={{ fontSize: 9, height: 20 }} />}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" sx={{ fontSize: 10 }} onClick={(e) => { e.stopPropagation(); setSelectedHospital(h); }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {hospitals.filter(h => h.status === 'active').map((h) => (
            <Grid item xs={12} sm={6} md={4} key={h.id}>
              <Card sx={{ p: 2.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 1.5 }}>{h.name}</Typography>
                {[
                  { label: 'Patients', value: h.patients, max: 3000 },
                  { label: 'Occupancy', value: h.occupancy, max: 100, suffix: '%' },
                  { label: 'Screenings', value: h.screenings, max: 700 },
                  { label: 'Rating', value: h.rating * 20, max: 100, display: `${h.rating}/5` },
                ].map(m => (
                  <Box key={m.label} sx={{ mb: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{m.label}</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{m.display || `${m.value}${m.suffix || ''}`}</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={Math.min((m.value / m.max) * 100, 100)} sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                ))}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {[
            { plan: 'Basic', price: '$499/mo', features: ['Up to 5 doctors', 'Basic user portal', 'Standard reports', 'Email support'], hospitals: 2, color: '#9e9e9e' },
            { plan: 'Professional', price: '$1,499/mo', features: ['Up to 50 doctors', 'Full user portal', 'AI risk assessment', 'Advanced reports', 'Priority support', 'Telemedicine'], hospitals: 8, color: '#1565c0' },
            { plan: 'Enterprise', price: '$4,999/mo', features: ['Unlimited doctors', 'Full platform access', 'Custom AI models', 'Custom reports', '24/7 support', 'API access', 'White-label', 'SLA guarantee'], hospitals: 12, color: '#7b1fa2' },
          ].map((p) => (
            <Grid item xs={12} md={4} key={p.plan}>
              <Card sx={{ p: 3, borderTop: `3px solid ${p.color}`, textAlign: 'center' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 22 }}>{p.plan}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 28, color: p.color, my: 1 }}>{p.price}</Typography>
                <Chip label={`${p.hospitals} hospitals`} size="small" sx={{ mb: 2 }} />
                <Stack spacing={0.5} sx={{ textAlign: 'left' }}>
                  {p.features.map(f => (
                    <Stack key={f} direction="row" spacing={1} alignItems="center">
                      <CheckCircle sx={{ fontSize: 14, color: '#4caf50' }} />
                      <Typography sx={{ fontSize: 12 }}>{f}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      </>
      )}

      {/* Hospital Detail Dialog */}
      <Dialog open={!!selectedHospital} onClose={() => setSelectedHospital(null)} maxWidth="md" fullWidth>
        {selectedHospital && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#e3f2fd', color: '#1565c0' }}><LocalHospital /></Avatar>
                <Box><Typography sx={{ fontWeight: 700, fontSize: 18 }}>{selectedHospital.name}</Typography><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{selectedHospital.id} • {selectedHospital.city}, {selectedHospital.state}</Typography></Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Stack spacing={1}>
                    {[
                      { l: 'Type', v: selectedHospital.type },
                      { l: 'Total Beds', v: selectedHospital.beds },
                      { l: 'Doctors', v: selectedHospital.doctors },
                      { l: 'Active Patients', v: selectedHospital.patients },
                      { l: 'Occupancy', v: `${selectedHospital.occupancy}%` },
                    ].map(item => (
                      <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{item.v}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack spacing={1}>
                    {[
                      { l: 'Subscription', v: selectedHospital.subscription },
                      { l: 'AI Enabled', v: selectedHospital.aiEnabled ? 'Yes' : 'No' },
                      { l: 'Cancer Screenings', v: selectedHospital.screenings },
                      { l: 'Verified', v: selectedHospital.verified ? 'Yes' : 'No' },
                      { l: 'Joined', v: selectedHospital.joined },
                    ].map(item => (
                      <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{item.v}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedHospital(null)}>Close</Button>
              {selectedHospital.status === 'pending' && <Button variant="contained" color="success">Approve</Button>}
              {selectedHospital.status === 'active' && <Button variant="outlined" color="warning">Suspend</Button>}
              <Button variant="contained" startIcon={<Edit />}>Edit</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Register Hospital Dialog */}
      <Dialog open={showAddHospital} onClose={() => setShowAddHospital(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Register New Hospital</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Hospital Name" fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={8}><TextField label="City" fullWidth size="small" /></Grid>
              <Grid item xs={4}><TextField label="State" fullWidth size="small" /></Grid>
            </Grid>
            <TextField label="Address" fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Phone" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Email" fullWidth size="small" /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small"><InputLabel>Type</InputLabel><Select label="Type"><MenuItem value="general">General</MenuItem><MenuItem value="specialty">Specialty</MenuItem><MenuItem value="clinic">Clinic</MenuItem></Select></FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small"><InputLabel>Subscription</InputLabel><Select label="Subscription"><MenuItem value="basic">Basic</MenuItem><MenuItem value="pro">Professional</MenuItem><MenuItem value="enterprise">Enterprise</MenuItem></Select></FormControl>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={4}><TextField label="Total Beds" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={4}><TextField label="Doctors" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={4}><TextField label="Staff" type="number" fullWidth size="small" /></Grid>
            </Grid>
            <TextField label="Registration / License Number" fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddHospital(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowAddHospital(false)}>Register Hospital</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default HospitalManagement;

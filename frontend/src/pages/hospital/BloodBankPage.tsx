import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button, Avatar,
  IconButton, LinearProgress, Tabs, Tab, Tooltip, Divider, Badge, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Slider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Snackbar,
} from '@mui/material';
import {
  Bloodtype as BloodIcon, LocationOn as LocationIcon,
  CheckCircle as CheckIcon, Cancel as CancelIcon,
  AccessTime as TimeIcon, LocalHospital as HospitalIcon,
  Person as PersonIcon, Favorite as HeartIcon,
  VolunteerActivism as DonateIcon, Warning as WarningIcon,
  Refresh as RefreshIcon, Send as SendIcon, History as HistoryIcon,
  Speed as SpeedIcon, People as PeopleIcon,
  Assessment as AssessmentIcon, TrendingUp as TrendUpIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, SectionHeader } from '../../components/common/SharedComponents';
import { bloodDonorAPI } from '../../services/api';
import { BloodRequest, BloodDonorMatch } from '../../types';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const urgencyColors: Record<string, string> = {
  routine: '#4caf50', urgent: '#ff9800', emergency: '#f44336', critical: '#b71c1c',
};

const BloodBankPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [reqForm, setReqForm] = useState({
    blood_group: '', units_needed: 1, urgency: 'urgent',
    hospital_name: '', hospital_address: '', patient_name: '',
    description: '', contact_phone: '', contact_email: '',
    search_radius_km: 50, latitude: 0, longitude: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allReqRes, myReqRes, statsRes] = await Promise.all([
        bloodDonorAPI.listRequests(),
        bloodDonorAPI.getMyRequests(),
        bloodDonorAPI.getStats(),
      ]);
      setRequests(allReqRes.data.requests || []);
      setMyRequests(myReqRes.data.requests || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Error loading blood bank data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setReqForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
        () => setSnackbar({ open: true, message: 'Unable to get location', severity: 'error' })
      );
    }
  };

  const handleCreateRequest = async () => {
    try {
      const res = await bloodDonorAPI.createRequest(reqForm);
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      setShowCreateDialog(false);
      setReqForm({ blood_group: '', units_needed: 1, urgency: 'urgent', hospital_name: '', hospital_address: '', patient_name: '', description: '', contact_phone: '', contact_email: '', search_radius_km: 50, latitude: 0, longitude: 0 });
      loadData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to create request', severity: 'error' });
    }
  };

  const viewRequestDetails = async (requestId: string) => {
    try {
      const res = await bloodDonorAPI.getRequest(requestId);
      setSelectedRequest(res.data);
    } catch (err) {
      console.error('Error loading request details:', err);
    }
  };

  const groupStats = stats?.donors_by_blood_group || {};

  return (
    <AppLayout title="Blood Bank" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #c62828, #e53935)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🏥 Blood Bank Management
            </Typography>
            <Typography color="text.secondary">Manage blood requests, track donors, and save lives</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={loadData}><RefreshIcon /></IconButton>
            <Button variant="contained" color="error" startIcon={<SendIcon />} onClick={() => { getCurrentLocation(); setShowCreateDialog(true); }} sx={{ borderRadius: 2 }}>
              New Blood Request
            </Button>
          </Stack>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} color="error" />}

        {/* Stats Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <PeopleIcon sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h4" fontWeight={700}>{stats?.total_active_donors || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Active Donors</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #fb8c00 0%, #ef6c00 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <WarningIcon sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h4" fontWeight={700}>{stats?.total_open_requests || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Open Requests</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CheckIcon sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h4" fontWeight={700}>{stats?.total_fulfilled || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Fulfilled</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <HeartIcon sx={{ fontSize: 36, mb: 1 }} />
                <Typography variant="h4" fontWeight={700}>
                  {Object.values(groupStats as Record<string, number>).reduce((a: number, b: number) => a + b, 0)}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Donors</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Blood Group Inventory */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Donor Inventory by Blood Group</Typography>
            <Grid container spacing={1}>
              {BLOOD_GROUPS.map(bg => (
                <Grid item xs={3} md={1.5} key={bg}>
                  <Paper sx={{
                    textAlign: 'center', p: 1.5, borderRadius: 2,
                    background: (groupStats[bg] || 0) > 0 ? 'linear-gradient(135deg, #ffebee, #ffcdd2)' : '#f5f5f5',
                    border: (groupStats[bg] || 0) > 5 ? '2px solid #4caf50' : (groupStats[bg] || 0) > 0 ? '1px solid #ffcdd2' : '1px solid #eee',
                  }}>
                    <Typography variant="h6" fontWeight={700} color="error">{bg}</Typography>
                    <Typography variant="h5" fontWeight={800}>{groupStats[bg] || 0}</Typography>
                    <Typography variant="caption" color="text.secondary">donors</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          textColor="inherit" sx={{ mb: 2, '& .Mui-selected': { color: '#c62828' }, '& .MuiTabs-indicator': { bgcolor: '#c62828' } }}>
          <Tab label="All Blood Requests" />
          <Tab label="My Hospital Requests" />
          <Tab label={`Recent Activity`} />
        </Tabs>

        {/* All Blood Requests */}
        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Blood Group</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Units</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Urgency</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hospital</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Donors Notified</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow><TableCell colSpan={9} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">No blood requests found</Typography>
                  </TableCell></TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id} hover sx={{ cursor: 'pointer' }} onClick={() => viewRequestDetails(req.id)}>
                      <TableCell>
                        <Chip label={req.blood_group} sx={{ bgcolor: '#c62828', color: 'white', fontWeight: 700 }} />
                      </TableCell>
                      <TableCell>{req.units_fulfilled}/{req.units_needed}</TableCell>
                      <TableCell>
                        <Chip size="small" label={req.urgency.toUpperCase()} sx={{ bgcolor: urgencyColors[req.urgency], color: 'white', fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>{req.hospital_name || '—'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={req.status.replace('_', ' ')} color={req.status === 'fulfilled' ? 'success' : req.status === 'open' ? 'warning' : 'default'} />
                      </TableCell>
                      <TableCell>{req.donors_notified}</TableCell>
                      <TableCell>
                        <LinearProgress variant="determinate" value={(req.units_fulfilled / req.units_needed) * 100}
                          sx={{ borderRadius: 1, height: 8 }} color={req.units_fulfilled >= req.units_needed ? 'success' : 'error'} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}</TableCell>
                      <TableCell>
                        <Button size="small" onClick={(e) => { e.stopPropagation(); viewRequestDetails(req.id); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* My Hospital Requests */}
        {activeTab === 1 && (
          <Box>
            {myRequests.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6, borderRadius: 3 }}>
                <SendIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">No requests created by your hospital</Typography>
                <Button variant="contained" color="error" startIcon={<SendIcon />} sx={{ mt: 2, borderRadius: 2 }}
                  onClick={() => { getCurrentLocation(); setShowCreateDialog(true); }}>
                  Create Blood Request
                </Button>
              </Card>
            ) : (
              <Stack spacing={2}>
                {myRequests.map((req) => (
                  <Card key={req.id} sx={{ borderRadius: 3, cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                    onClick={() => viewRequestDetails(req.id)}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: urgencyColors[req.urgency], width: 48, height: 48, fontWeight: 700 }}>
                            {req.blood_group}
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={700}>
                              {req.blood_group} - {req.units_needed} unit{req.units_needed > 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {req.patient_name ? `Patient: ${req.patient_name} • ` : ''}{req.hospital_name}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              <Chip size="small" label={req.urgency.toUpperCase()} sx={{ bgcolor: urgencyColors[req.urgency], color: 'white' }} />
                              <Chip size="small" label={req.status.replace('_', ' ')}
                                color={req.status === 'fulfilled' ? 'success' : 'default'} />
                            </Stack>
                          </Box>
                        </Stack>
                        <Stack alignItems="flex-end" spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">{req.donors_notified} donors notified</Typography>
                          <Box sx={{ width: 120 }}>
                            <LinearProgress variant="determinate" value={(req.units_fulfilled / req.units_needed) * 100}
                              sx={{ borderRadius: 1, height: 8 }} color={req.units_fulfilled >= req.units_needed ? 'success' : 'error'} />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              {req.units_fulfilled}/{req.units_needed} fulfilled
                            </Typography>
                          </Box>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Recent Activity */}
        {activeTab === 2 && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Recent Blood Request Activity</Typography>
              {(stats?.recent_requests || []).length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No recent activity</Typography>
              ) : (
                <Stack spacing={1}>
                  {(stats?.recent_requests || []).map((req: any, idx: number) => (
                    <Paper key={idx} sx={{ p: 2, borderRadius: 2, '&:hover': { bgcolor: '#fafafa' } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ bgcolor: '#c62828', width: 36, height: 36, fontSize: 12 }}>{req.blood_group}</Avatar>
                          <Box>
                            <Typography fontWeight={600}>
                              {req.blood_group} blood request - {req.units_needed} unit{req.units_needed > 1 ? 's' : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {req.hospital_name || 'Hospital'} • {req.created_at ? new Date(req.created_at).toLocaleString() : ''}
                            </Typography>
                          </Box>
                        </Stack>
                        <Chip size="small" label={req.status?.replace('_', ' ')} color={req.status === 'fulfilled' ? 'success' : 'warning'} />
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        )}

        {/* Request Details Dialog */}
        <Dialog open={!!selectedRequest} onClose={() => setSelectedRequest(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Blood Request Details
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Blood Group</Typography>
                    <Typography variant="h5" fontWeight={700} color="error">{selectedRequest.request?.blood_group}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Units</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {selectedRequest.request?.units_fulfilled}/{selectedRequest.request?.units_needed}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Urgency</Typography>
                    <Chip label={selectedRequest.request?.urgency?.toUpperCase()}
                      sx={{ bgcolor: urgencyColors[selectedRequest.request?.urgency] || '#9e9e9e', color: 'white', fontWeight: 700 }} />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Chip label={selectedRequest.request?.status?.replace('_', ' ')}
                      color={selectedRequest.request?.status === 'fulfilled' ? 'success' : 'warning'} />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Matched Donors ({selectedRequest.stats?.total_matched || 0})
                </Typography>

                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={3}>
                    <Paper sx={{ textAlign: 'center', p: 1, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={700} color="success.main">{selectedRequest.stats?.accepted || 0}</Typography>
                      <Typography variant="caption">Accepted</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ textAlign: 'center', p: 1, bgcolor: '#fff3e0', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={700} color="warning.main">{selectedRequest.stats?.pending || 0}</Typography>
                      <Typography variant="caption">Pending</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ textAlign: 'center', p: 1, bgcolor: '#ffebee', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={700} color="error">{selectedRequest.stats?.declined || 0}</Typography>
                      <Typography variant="caption">Declined</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={3}>
                    <Paper sx={{ textAlign: 'center', p: 1, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={700} color="primary">{selectedRequest.stats?.total_matched || 0}</Typography>
                      <Typography variant="caption">Total</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Donor</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Distance</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Responded</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedRequest.matches || []).map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell>{m.donor_name || 'Anonymous'}</TableCell>
                          <TableCell>{m.distance_km?.toFixed(1)} km</TableCell>
                          <TableCell>
                            <Chip size="small" label={m.status}
                              color={m.status === 'accepted' ? 'success' : m.status === 'declined' ? 'error' : 'default'} />
                          </TableCell>
                          <TableCell>{m.responded_at ? new Date(m.responded_at).toLocaleString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedRequest(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Create Request Dialog */}
        <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>🆘 Create Blood Request</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Blood Group *</InputLabel>
                <Select value={reqForm.blood_group} label="Blood Group *"
                  onChange={(e) => setReqForm({ ...reqForm, blood_group: e.target.value })}>
                  {BLOOD_GROUPS.map(bg => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Units Needed" type="number" value={reqForm.units_needed} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, units_needed: parseInt(e.target.value) || 1 })} />
              <FormControl fullWidth>
                <InputLabel>Urgency</InputLabel>
                <Select value={reqForm.urgency} label="Urgency"
                  onChange={(e) => setReqForm({ ...reqForm, urgency: e.target.value })}>
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
              <Divider><Chip label="Details" size="small" /></Divider>
              <TextField label="Hospital Name" value={reqForm.hospital_name} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, hospital_name: e.target.value })} />
              <TextField label="Hospital Address" value={reqForm.hospital_address} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, hospital_address: e.target.value })} />
              <TextField label="Patient Name" value={reqForm.patient_name} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, patient_name: e.target.value })} />
              <TextField label="Contact Phone" value={reqForm.contact_phone} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, contact_phone: e.target.value })} />
              <TextField label="Contact Email" value={reqForm.contact_email} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, contact_email: e.target.value })} />
              <TextField label="Description" value={reqForm.description} fullWidth multiline rows={2}
                onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" startIcon={<MyLocationIcon />} onClick={getCurrentLocation} sx={{ borderRadius: 2 }}>
                  Use Current Location
                </Button>
                {reqForm.latitude !== 0 && (
                  <Chip icon={<CheckIcon />} label={`${reqForm.latitude.toFixed(4)}, ${reqForm.longitude.toFixed(4)}`} color="success" size="small" />
                )}
              </Stack>
              <Box>
                <Typography gutterBottom>Search Radius: {reqForm.search_radius_km} km</Typography>
                <Slider value={reqForm.search_radius_km} onChange={(_, v) => setReqForm({ ...reqForm, search_radius_km: v as number })}
                  min={5} max={200} step={5} valueLabelDisplay="auto" color="error" />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleCreateRequest} disabled={!reqForm.blood_group}>
              Send Request & Notify Donors
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
      </Box>
    </AppLayout>
  );
};

export default BloodBankPage;

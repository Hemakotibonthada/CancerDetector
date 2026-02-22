import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button, Avatar,
  IconButton, LinearProgress, Tabs, Tab, Tooltip, Divider, Badge, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Select, MenuItem, FormControl, InputLabel, Slider,
  CircularProgress, List, ListItem, ListItemAvatar, ListItemText,
  ListItemSecondaryAction, Paper, Snackbar, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  Bloodtype as BloodIcon, LocationOn as LocationIcon,
  Notifications as NotifIcon, CheckCircle as CheckIcon,
  Cancel as CancelIcon, AccessTime as TimeIcon,
  LocalHospital as HospitalIcon, Person as PersonIcon,
  MyLocation as MyLocationIcon, Favorite as HeartIcon,
  VolunteerActivism as DonateIcon, Warning as WarningIcon,
  Refresh as RefreshIcon, Send as SendIcon, History as HistoryIcon,
  EmojiEvents as TrophyIcon, Speed as SpeedIcon,
  Close as CloseIcon, Done as DoneIcon, Info as InfoIcon,
  NotificationsActive as AlertIcon, Star as StarIcon,
  NavigateNext, ExpandMore, Visibility,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { SectionHeader, GlassCard, StatCard, StatusBadge } from '../../components/common/SharedComponents';
import { bloodDonorAPI } from '../../services/api';
import { BloodDonor, BloodRequest, BloodDonorMatch, DonationRecord } from '../../types';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const urgencyColors: Record<string, string> = {
  routine: '#4caf50',
  urgent: '#ff9800',
  emergency: '#f44336',
  critical: '#b71c1c',
};

const statusColors: Record<string, string> = {
  active: '#4caf50',
  inactive: '#9e9e9e',
  cooldown: '#ff9800',
  temporarily_unavailable: '#ff9800',
  permanently_ineligible: '#f44336',
};

const BloodDonorPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [donor, setDonor] = useState<BloodDonor | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [incomingMatches, setIncomingMatches] = useState<BloodDonorMatch[]>([]);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [allRequests, setAllRequests] = useState<BloodRequest[]>([]);
  const [history, setHistory] = useState<DonationRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Dialogs
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showRespondDialog, setShowRespondDialog] = useState<BloodDonorMatch | null>(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Registration form
  const [regForm, setRegForm] = useState({
    blood_group: '', latitude: 0, longitude: 0, city: '', state: '',
    address: '', max_distance_km: 25, weight_kg: 0,
  });

  // Request form
  const [reqForm, setReqForm] = useState({
    blood_group: '', units_needed: 1, urgency: 'routine',
    hospital_name: '', hospital_address: '', patient_name: '',
    description: '', contact_phone: '', search_radius_km: 50,
    latitude: 0, longitude: 0,
  });

  const [responseMessage, setResponseMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes] = await Promise.all([
        bloodDonorAPI.getProfile(),
        bloodDonorAPI.getStats(),
      ]);
      setIsRegistered(profileRes.data.registered);
      setDonor(profileRes.data.donor);
      setStats(statsRes.data);

      if (profileRes.data.registered) {
        const [incomingRes, myReqRes, historyRes, allReqRes] = await Promise.all([
          bloodDonorAPI.getIncoming(),
          bloodDonorAPI.getMyRequests(),
          bloodDonorAPI.getHistory(),
          bloodDonorAPI.listRequests({ status: 'open' }),
        ]);
        setIncomingMatches(incomingRes.data.matches || []);
        setMyRequests(myReqRes.data.requests || []);
        setHistory(historyRes.data.donations || []);
        setAllRequests(allReqRes.data.requests || []);
      }
    } catch (err) {
      console.error('Error loading blood donor data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRegForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
          setReqForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
        },
        () => setSnackbar({ open: true, message: 'Unable to get location. Please enter manually.', severity: 'error' })
      );
    }
  };

  const handleRegister = async () => {
    try {
      await bloodDonorAPI.register(regForm);
      setSnackbar({ open: true, message: 'Successfully registered as blood donor!', severity: 'success' });
      setShowRegisterDialog(false);
      loadData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Registration failed', severity: 'error' });
    }
  };

  const handleToggle = async () => {
    if (!donor) return;
    try {
      const newStatus = donor.donor_status !== 'active';
      const res = await bloodDonorAPI.toggleStatus(newStatus);
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      loadData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Toggle failed', severity: 'error' });
    }
  };

  const handleCreateRequest = async () => {
    try {
      const res = await bloodDonorAPI.createRequest(reqForm);
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      setShowRequestDialog(false);
      setReqForm({ blood_group: '', units_needed: 1, urgency: 'routine', hospital_name: '', hospital_address: '', patient_name: '', description: '', contact_phone: '', search_radius_km: 50, latitude: 0, longitude: 0 });
      loadData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Failed to create request', severity: 'error' });
    }
  };

  const handleRespond = async (matchId: string, accept: boolean) => {
    try {
      const res = await bloodDonorAPI.respond(matchId, { accept, message: responseMessage });
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      setShowRespondDialog(null);
      setResponseMessage('');
      loadData();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.response?.data?.detail || 'Response failed', severity: 'error' });
    }
  };

  const handleUpdateLocation = async () => {
    getCurrentLocation();
    if (regForm.latitude && regForm.longitude) {
      try {
        await bloodDonorAPI.updateLocation({ latitude: regForm.latitude, longitude: regForm.longitude });
        setSnackbar({ open: true, message: 'Location updated!', severity: 'success' });
        loadData();
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to update location', severity: 'error' });
      }
    }
  };

  const pendingCount = incomingMatches.filter(m => ['pending', 'notified'].includes(m.status)).length;

  // Stats cards
  const renderStats = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #e53935 0%, #c62828 100%)', color: 'white', borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <BloodIcon sx={{ fontSize: 36, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{donor?.total_donations || 0}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Donations</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={6} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)', color: 'white', borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 2 }}>
            <HeartIcon sx={{ fontSize: 36, mb: 1 }} />
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
            <TrophyIcon sx={{ fontSize: 36, mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{stats?.total_fulfilled || 0}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>Lives Saved</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // Donor profile card
  const renderDonorProfile = () => {
    if (!isRegistered || !donor) {
      return (
        <Card sx={{ borderRadius: 3, textAlign: 'center', py: 6, background: 'linear-gradient(135deg, #fce4ec 0%, #ffebee 100%)' }}>
          <BloodIcon sx={{ fontSize: 64, color: '#c62828', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>Become a Blood Donor</Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Register as a blood donor and help save lives. When someone nearby needs blood matching your type,
            you'll receive a notification and can choose to donate.
          </Typography>
          <Button variant="contained" size="large" color="error" startIcon={<DonateIcon />}
            onClick={() => { getCurrentLocation(); setShowRegisterDialog(true); }}
            sx={{ borderRadius: 3, px: 4, py: 1.5 }}>
            Register as Donor
          </Button>
        </Card>
      );
    }

    return (
      <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ background: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)', color: 'white', p: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 24, fontWeight: 700 }}>
                {donor.blood_group}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>Blood Donor</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Chip
                    size="small"
                    icon={donor.donor_status === 'active' ? <CheckIcon /> : <CancelIcon />}
                    label={donor.donor_status.replace('_', ' ').toUpperCase()}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)', color: 'white',
                      '& .MuiChip-icon': { color: 'white' },
                    }}
                  />
                  {donor.blood_type_verified && (
                    <Chip size="small" icon={<CheckIcon />} label="Verified"
                      sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: 'white', '& .MuiChip-icon': { color: 'white' } }} />
                  )}
                </Stack>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Update Location">
                <IconButton onClick={handleUpdateLocation} sx={{ color: 'white' }}>
                  <MyLocationIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton onClick={() => setShowSettingsDialog(true)} sx={{ color: 'white' }}>
                  <NotifIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                onClick={handleToggle}
                sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', borderRadius: 2 }}
              >
                {donor.donor_status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </Stack>
          </Stack>
        </Box>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Blood Group</Typography>
              <Typography variant="h6" fontWeight={700} color="error">{donor.blood_group}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Total Donations</Typography>
              <Typography variant="h6" fontWeight={700}>{donor.total_donations}</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Last Donation</Typography>
              <Typography variant="h6" fontWeight={600}>
                {donor.last_donation_date ? new Date(donor.last_donation_date).toLocaleDateString() : 'Never'}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="caption" color="text.secondary">Max Distance</Typography>
              <Typography variant="h6" fontWeight={600}>{donor.max_distance_km} km</Typography>
            </Grid>
          </Grid>
          {donor.next_eligible_date && new Date(donor.next_eligible_date) > new Date() && (
            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
              Next eligible donation date: {new Date(donor.next_eligible_date).toLocaleDateString()}
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  // Incoming requests tab
  const renderIncoming = () => (
    <Box>
      {pendingCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          You have {pendingCount} pending blood donation request{pendingCount > 1 ? 's' : ''} awaiting your response.
        </Alert>
      )}
      {incomingMatches.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6, borderRadius: 3 }}>
          <DonateIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No incoming requests</Typography>
          <Typography color="text.secondary">When someone nearby needs your blood type, you'll be notified here.</Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {incomingMatches.map((match) => (
            <Card key={match.id} sx={{
              borderRadius: 3,
              border: ['pending', 'notified'].includes(match.status) ? '2px solid #f44336' : '1px solid #e0e0e0',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 6 },
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Avatar sx={{ bgcolor: urgencyColors[match.request?.urgency || 'routine'], width: 40, height: 40 }}>
                        <BloodIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {match.request?.blood_group} Blood Needed
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {match.request?.hospital_name || 'Hospital not specified'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Distance</Typography>
                        <Typography fontWeight={600}>{match.distance_km?.toFixed(1)} km</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Units Needed</Typography>
                        <Typography fontWeight={600}>{match.request?.units_needed}</Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Urgency</Typography>
                        <Chip size="small" label={match.request?.urgency?.toUpperCase()}
                          sx={{ bgcolor: urgencyColors[match.request?.urgency || 'routine'], color: 'white', fontWeight: 700 }} />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Requested</Typography>
                        <Typography fontWeight={600}>
                          {match.request?.created_at ? new Date(match.request.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                    {match.request?.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {match.request.description}
                      </Typography>
                    )}
                  </Box>
                  <Stack spacing={1} alignItems="flex-end">
                    <Chip
                      size="small"
                      label={match.status.replace('_', ' ').toUpperCase()}
                      sx={{
                        bgcolor: statusColors[match.status] || '#9e9e9e',
                        color: 'white', fontWeight: 600,
                      }}
                    />
                    {['pending', 'notified'].includes(match.status) && (
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" color="success" size="small" startIcon={<CheckIcon />}
                          onClick={() => setShowRespondDialog(match)} sx={{ borderRadius: 2 }}>
                          Accept
                        </Button>
                        <Button variant="outlined" color="error" size="small" startIcon={<CancelIcon />}
                          onClick={() => handleRespond(match.id, false)} sx={{ borderRadius: 2 }}>
                          Decline
                        </Button>
                      </Stack>
                    )}
                    {match.status === 'accepted' && (
                      <Chip icon={<CheckIcon />} label="You accepted" color="success" size="small" />
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );

  // Open requests / blood bank tab
  const renderOpenRequests = () => (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Open Blood Requests</Typography>
        <Button variant="contained" color="error" startIcon={<SendIcon />} onClick={() => { getCurrentLocation(); setShowRequestDialog(true); }}
          sx={{ borderRadius: 2 }}>
          Create Request
        </Button>
      </Stack>
      {allRequests.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6, borderRadius: 3 }}>
          <HospitalIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No open blood requests</Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {allRequests.map((req) => (
            <Card key={req.id} sx={{ borderRadius: 3, '&:hover': { boxShadow: 4 } }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: urgencyColors[req.urgency], width: 48, height: 48, fontWeight: 700, fontSize: 16 }}>
                      {req.blood_group}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{req.blood_group} Blood Needed</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {req.hospital_name || 'Location not specified'} &bull; {req.units_needed} unit{req.units_needed > 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack alignItems="flex-end" spacing={0.5}>
                    <Chip size="small" label={req.urgency.toUpperCase()} sx={{ bgcolor: urgencyColors[req.urgency], color: 'white', fontWeight: 700 }} />
                    <Typography variant="caption" color="text.secondary">
                      {req.donors_notified} donors notified
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(req.units_fulfilled / req.units_needed) * 100}
                      sx={{ width: 100, borderRadius: 1, height: 6 }}
                      color={req.units_fulfilled >= req.units_needed ? 'success' : 'error'}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );

  // My requests tab
  const renderMyRequests = () => (
    <Box>
      {myRequests.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6, borderRadius: 3 }}>
          <SendIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No requests created</Typography>
          <Button variant="contained" color="error" startIcon={<SendIcon />} onClick={() => { getCurrentLocation(); setShowRequestDialog(true); }}
            sx={{ mt: 2, borderRadius: 2 }}>
            Create Blood Request
          </Button>
        </Card>
      ) : (
        <Stack spacing={2}>
          {myRequests.map((req) => (
            <Card key={req.id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{req.blood_group} - {req.units_needed} unit{req.units_needed > 1 ? 's' : ''}</Typography>
                    <Typography variant="body2" color="text.secondary">{req.hospital_name}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip size="small" label={req.status.replace('_', ' ').toUpperCase()}
                        color={req.status === 'fulfilled' ? 'success' : req.status === 'open' ? 'warning' : 'default'} />
                      <Chip size="small" label={req.urgency.toUpperCase()} sx={{ bgcolor: urgencyColors[req.urgency], color: 'white' }} />
                      <Chip size="small" label={`${req.units_fulfilled}/${req.units_needed} fulfilled`}
                        color={req.units_fulfilled >= req.units_needed ? 'success' : 'default'} />
                    </Stack>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {req.donors_notified} notified &bull; {req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );

  // Donation history tab
  const renderHistory = () => (
    <Box>
      {history.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 6, borderRadius: 3 }}>
          <HistoryIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No donation history yet</Typography>
          <Typography color="text.secondary">Your donation records will appear here.</Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {history.map((d) => (
            <Card key={d.id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: '#c62828' }}><BloodIcon /></Avatar>
                    <Box>
                      <Typography fontWeight={700}>{d.blood_group} - {d.units_donated} unit{d.units_donated > 1 ? 's' : ''}</Typography>
                      <Typography variant="body2" color="text.secondary">{d.donation_center || 'Not specified'}</Typography>
                    </Box>
                  </Stack>
                  <Stack alignItems="flex-end">
                    <Chip size="small" label={d.donation_status.replace('_', ' ').toUpperCase()}
                      color={d.donation_status === 'completed' ? 'success' : d.donation_status === 'scheduled' ? 'info' : 'default'} />
                    <Typography variant="caption" color="text.secondary">
                      {d.donation_date ? new Date(d.donation_date).toLocaleDateString() : d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );

  // Donors by blood group chart
  const renderBloodGroupStats = () => {
    const groups = stats?.donors_by_blood_group || {};
    return (
      <Card sx={{ borderRadius: 3, mt: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Donors by Blood Group</Typography>
          <Grid container spacing={1}>
            {BLOOD_GROUPS.map((bg) => (
              <Grid item xs={3} key={bg}>
                <Paper sx={{
                  textAlign: 'center', p: 2, borderRadius: 2,
                  background: groups[bg] ? 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' : '#f5f5f5',
                }}>
                  <Typography variant="h5" fontWeight={700} color="error">{bg}</Typography>
                  <Typography variant="h4" fontWeight={800}>{groups[bg] || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">donors</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout title="Blood Donor" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ background: 'linear-gradient(135deg, #c62828, #e53935)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🩸 Blood Donor
            </Typography>
            <Typography color="text.secondary">Save lives by donating blood to those in need</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={loadData}><RefreshIcon /></IconButton>
            {isRegistered && (
              <Badge badgeContent={pendingCount} color="error">
                <IconButton onClick={() => setActiveTab(0)}><AlertIcon /></IconButton>
              </Badge>
            )}
          </Stack>
        </Stack>

        {loading ? <LinearProgress sx={{ mb: 3, borderRadius: 1 }} color="error" /> : null}

        {/* Stats */}
        {renderStats()}

        {/* Donor Profile */}
        {renderDonorProfile()}

        {/* Tabs */}
        {isRegistered && (
          <Box sx={{ mt: 3 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
              textColor="inherit" sx={{ mb: 2, '& .Mui-selected': { color: '#c62828' }, '& .MuiTabs-indicator': { bgcolor: '#c62828' } }}>
              <Tab label={<Badge badgeContent={pendingCount} color="error">Incoming Requests</Badge>} />
              <Tab label="Open Requests" />
              <Tab label="My Requests" />
              <Tab label="Donation History" />
            </Tabs>

            {activeTab === 0 && renderIncoming()}
            {activeTab === 1 && renderOpenRequests()}
            {activeTab === 2 && renderMyRequests()}
            {activeTab === 3 && renderHistory()}
          </Box>
        )}

        {/* Blood Group Stats */}
        {renderBloodGroupStats()}

        {/* ============ Registration Dialog ============ */}
        <Dialog open={showRegisterDialog} onClose={() => setShowRegisterDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>🩸 Register as Blood Donor</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Blood Group *</InputLabel>
                <Select value={regForm.blood_group} label="Blood Group *"
                  onChange={(e) => setRegForm({ ...regForm, blood_group: e.target.value })}>
                  {BLOOD_GROUPS.map(bg => <MenuItem key={bg} value={bg}>{bg}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Weight (kg)" type="number" value={regForm.weight_kg || ''} fullWidth
                onChange={(e) => setRegForm({ ...regForm, weight_kg: parseFloat(e.target.value) || 0 })} />
              <Divider><Chip label="Location" size="small" /></Divider>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button variant="outlined" startIcon={<MyLocationIcon />} onClick={getCurrentLocation} sx={{ borderRadius: 2 }}>
                  Use Current Location
                </Button>
                {regForm.latitude !== 0 && (
                  <Chip icon={<CheckIcon />} label={`${regForm.latitude.toFixed(4)}, ${regForm.longitude.toFixed(4)}`} color="success" size="small" />
                )}
              </Stack>
              <TextField label="City" value={regForm.city} fullWidth onChange={(e) => setRegForm({ ...regForm, city: e.target.value })} />
              <TextField label="State" value={regForm.state} fullWidth onChange={(e) => setRegForm({ ...regForm, state: e.target.value })} />
              <TextField label="Address" value={regForm.address} fullWidth multiline rows={2}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })} />
              <Box>
                <Typography gutterBottom>Max Distance: {regForm.max_distance_km} km</Typography>
                <Slider value={regForm.max_distance_km} onChange={(_, v) => setRegForm({ ...regForm, max_distance_km: v as number })}
                  min={5} max={100} step={5} valueLabelDisplay="auto" color="error" />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRegisterDialog(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleRegister} disabled={!regForm.blood_group}>
              Register
            </Button>
          </DialogActions>
        </Dialog>

        {/* ============ Create Request Dialog ============ */}
        <Dialog open={showRequestDialog} onClose={() => setShowRequestDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>🆘 Create Blood Request</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Blood Group Needed *</InputLabel>
                <Select value={reqForm.blood_group} label="Blood Group Needed *"
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
              <Divider><Chip label="Hospital Details" size="small" /></Divider>
              <TextField label="Hospital Name" value={reqForm.hospital_name} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, hospital_name: e.target.value })} />
              <TextField label="Hospital Address" value={reqForm.hospital_address} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, hospital_address: e.target.value })} />
              <TextField label="Patient Name" value={reqForm.patient_name} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, patient_name: e.target.value })} />
              <TextField label="Contact Phone" value={reqForm.contact_phone} fullWidth
                onChange={(e) => setReqForm({ ...reqForm, contact_phone: e.target.value })} />
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
            <Button onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleCreateRequest} disabled={!reqForm.blood_group}>
              Send Request
            </Button>
          </DialogActions>
        </Dialog>

        {/* ============ Respond Dialog ============ */}
        <Dialog open={!!showRespondDialog} onClose={() => setShowRespondDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>🩸 Respond to Donation Request</DialogTitle>
          <DialogContent>
            {showRespondDialog && (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Alert severity="info">
                  <Typography fontWeight={700}>{showRespondDialog.request?.blood_group} blood needed</Typography>
                  <Typography variant="body2">
                    {showRespondDialog.request?.hospital_name} &bull; {showRespondDialog.distance_km?.toFixed(1)} km away
                    &bull; Urgency: {showRespondDialog.request?.urgency?.toUpperCase()}
                  </Typography>
                </Alert>
                <TextField
                  label="Message (optional)"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  multiline rows={3} fullWidth
                  placeholder="Add a message for the requester..."
                />
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setShowRespondDialog(null); setResponseMessage(''); }}>Cancel</Button>
            <Button variant="outlined" color="error" startIcon={<CancelIcon />}
              onClick={() => showRespondDialog && handleRespond(showRespondDialog.id, false)}>
              Decline
            </Button>
            <Button variant="contained" color="success" startIcon={<CheckIcon />}
              onClick={() => showRespondDialog && handleRespond(showRespondDialog.id, true)}>
              Accept & Donate
            </Button>
          </DialogActions>
        </Dialog>

        {/* ============ Settings Dialog ============ */}
        <Dialog open={showSettingsDialog} onClose={() => setShowSettingsDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>Notification Settings</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControlLabel control={<Switch checked={donor?.notification_enabled ?? true} onChange={async (e) => {
                try {
                  await bloodDonorAPI.updateProfile({ notification_enabled: e.target.checked });
                  loadData();
                } catch {}
              }} />} label="Push Notifications" />
              <FormControlLabel control={<Switch checked={donor?.email_alerts ?? true} onChange={async (e) => {
                try {
                  await bloodDonorAPI.updateProfile({ email_alerts: e.target.checked });
                  loadData();
                } catch {}
              }} />} label="Email Alerts" />
              <FormControlLabel control={<Switch checked={donor?.sms_alerts ?? false} onChange={async (e) => {
                try {
                  await bloodDonorAPI.updateProfile({ sms_alerts: e.target.checked });
                  loadData();
                } catch {}
              }} />} label="SMS Alerts" />
              <Divider />
              <Box>
                <Typography gutterBottom>Max Distance: {donor?.max_distance_km || 25} km</Typography>
                <Slider defaultValue={donor?.max_distance_km || 25}
                  onChangeCommitted={async (_, v) => {
                    try {
                      await bloodDonorAPI.updateProfile({ max_distance_km: v as number });
                      loadData();
                    } catch {}
                  }}
                  min={5} max={100} step={5} valueLabelDisplay="auto" color="error" />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSettingsDialog(false)} variant="contained">Done</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
      </Box>
    </AppLayout>
  );
};

export default BloodDonorPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button,
  AppBar, Toolbar, Stack, Chip, Avatar, IconButton, LinearProgress,
  List, ListItem, ListItemText, ListItemIcon, Divider, Badge, Drawer, ListItemButton,
} from '@mui/material';
import {
  Dashboard as DashIcon, HealthAndSafety as HealthIcon,
  MonitorHeart as HeartIcon, Science as ScienceIcon,
  Notifications as NotifIcon, Person as PersonIcon,
  ExitToApp as LogoutIcon, Menu as MenuIcon,
  Biotech as BiotechIcon, Watch as WatchIcon,
  Assessment as AssessIcon, CalendarMonth as CalendarIcon,
  LocalPharmacy as MedIcon, Warning as WarningIcon,
  TrendingUp as TrendIcon, CheckCircle as CheckIcon,
  FolderShared as RecordsIcon, Shield as ShieldIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { patientsAPI, healthRecordsAPI, cancerDetectionAPI, notificationsAPI } from '../services/api';

const PatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [healthSummary, setHealthSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const summaryRes = await patientsAPI.getHealthSummary();
      setHealthSummary(summaryRes.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      very_low: '#4caf50', low: '#8bc34a', moderate: '#ff9800',
      high: '#f44336', very_high: '#d32f2f', critical: '#b71c1c',
    };
    return colors[level] || '#9e9e9e';
  };

  const getRiskLabel = (level: string) => {
    return level ? level.replace('_', ' ').toUpperCase() : 'NOT ASSESSED';
  };

  const menuItems = [
    { icon: <DashIcon />, label: 'Dashboard', path: '/dashboard' },
    { icon: <AssessIcon />, label: 'Cancer Risk', path: '/cancer-risk' },
    { icon: <RecordsIcon />, label: 'Health Records', path: '/health-records' },
    { icon: <BiotechIcon />, label: 'Blood Tests', path: '/dashboard' },
    { icon: <WatchIcon />, label: 'Smartwatch', path: '/dashboard' },
    { icon: <CalendarIcon />, label: 'Appointments', path: '/dashboard' },
    { icon: <MedIcon />, label: 'Medications', path: '/dashboard' },
    { icon: <PersonIcon />, label: 'Profile', path: '/profile' },
  ];

  const riskScore = healthSummary?.cancer_risk_score ?? 0;
  const riskLevel = healthSummary?.cancer_risk_level ?? 'not_assessed';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Sidebar Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 280, bgcolor: '#0d1b2a', color: 'white' } }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <HealthIcon sx={{ color: '#5e92f3' }} />
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>CancerGuard AI</Typography>
          </Stack>
          <List>
            {menuItems.map((item, index) => (
              <ListItemButton key={index} onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} sx={{ '& .MuiTypography-root': { fontSize: 14 } }} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
            <ListItemButton onClick={logout} sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        {/* Top Bar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
          <Toolbar>
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}><MenuIcon /></IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', flex: 1 }}>Patient Dashboard</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip icon={<ShieldIcon />} label={`Health ID: ${user?.health_id || 'N/A'}`}
                sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
              <IconButton><Badge badgeContent={3} color="error"><NotifIcon /></Badge></IconButton>
              <Avatar sx={{ bgcolor: '#1565c0' }}>{user?.first_name?.[0]}{user?.last_name?.[0]}</Avatar>
            </Stack>
          </Toolbar>
        </AppBar>

        {loading && <LinearProgress />}

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a237e', mb: 1 }}>
              Welcome back, {user?.first_name}! 👋
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's your health overview. Stay proactive about your health.
            </Typography>
          </Box>

          {/* Cancer Risk Card */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{
                p: 4, background: `linear-gradient(135deg, ${getRiskColor(riskLevel)}15, ${getRiskColor(riskLevel)}05)`,
                border: `2px solid ${getRiskColor(riskLevel)}30`,
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Overall Cancer Risk Assessment</Typography>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Typography variant="h2" sx={{ fontWeight: 800, color: getRiskColor(riskLevel) }}>
                        {(riskScore * 100).toFixed(1)}%
                      </Typography>
                      <Chip label={getRiskLabel(riskLevel)}
                        sx={{ bgcolor: getRiskColor(riskLevel), color: 'white', fontWeight: 700 }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Based on blood biomarkers, smartwatch data, lifestyle & genetic factors
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <ScienceIcon sx={{ fontSize: 80, color: getRiskColor(riskLevel), opacity: 0.3 }} />
                    <Button variant="contained" size="small" onClick={() => navigate('/cancer-risk')}
                      sx={{ mt: 2, bgcolor: getRiskColor(riskLevel) }}>
                      View Details
                    </Button>
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Quick Stats</Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <RecordsIcon color="primary" />
                      <Typography variant="body2">Health Records</Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {healthSummary?.total_health_records ?? 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BiotechIcon color="secondary" />
                      <Typography variant="body2">Blood Tests</Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {healthSummary?.total_blood_tests ?? 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MedIcon color="warning" />
                      <Typography variant="body2">Active Medications</Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {healthSummary?.active_medications ?? 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <WatchIcon color="info" />
                      <Typography variant="body2">Smartwatch</Typography>
                    </Stack>
                    <Chip label={healthSummary?.smartwatch_connected ? 'Connected' : 'Not Connected'}
                      size="small" color={healthSummary?.smartwatch_connected ? 'success' : 'default'} />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
              <Grid container spacing={2}>
                {[
                  { icon: <AssessIcon />, title: 'Run AI Risk Assessment', color: '#1565c0', desc: 'Get latest cancer risk prediction' },
                  { icon: <BiotechIcon />, title: 'Upload Blood Test', color: '#00897b', desc: 'Add new blood test results' },
                  { icon: <WatchIcon />, title: 'Connect Smartwatch', color: '#7b1fa2', desc: 'Sync your wearable device' },
                  { icon: <CalendarIcon />, title: 'Book Appointment', color: '#f57c00', desc: 'Schedule a consultation' },
                ].map((action, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card sx={{
                      p: 3, cursor: 'pointer', transition: 'all 0.3s', border: '1px solid transparent',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4, borderColor: action.color },
                    }}>
                      <Box sx={{ mb: 2, color: action.color }}>{React.cloneElement(action.icon, { sx: { fontSize: 40 } })}</Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{action.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{action.desc}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Health ID Info */}
            <Grid item xs={12}>
              <Card sx={{ p: 3, background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Your Health ID</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1565c0', letterSpacing: 2 }}>
                      {user?.health_id || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Share this ID with hospitals and doctors to access your complete health records securely.
                    </Typography>
                  </Box>
                  <ShieldIcon sx={{ fontSize: 80, color: '#1565c0', opacity: 0.3 }} />
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default PatientDashboard;

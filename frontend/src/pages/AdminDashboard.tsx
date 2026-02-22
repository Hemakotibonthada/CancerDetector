import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, AppBar, Toolbar,
  Stack, Chip, Avatar, IconButton, Badge, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon, HealthAndSafety as HealthIcon,
  People as PeopleIcon, LocalHospital as HospitalIcon,
  Science as ScienceIcon, Notifications as NotifIcon, Menu as MenuIcon,
  ExitToApp as LogoutIcon, Dashboard as DashIcon,
  Assessment as AssessIcon, Settings as SettingsIcon,
  Warning as WarningIcon, TrendingUp as TrendIcon,
  Storage as StorageIcon, Security as SecurityIcon,
  Analytics as AnalyticsIcon, Biotech as BiotechIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { adminAPI, analyticsAPI } from '../services/api';
import { DashboardStats } from '../types';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [riskDistribution, setRiskDistribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      const [statsRes, analyticsRes, riskRes] = await Promise.all([
        adminAPI.getDashboard().catch(() => ({ data: {} })),
        analyticsAPI.getOverview().catch(() => ({ data: {} })),
        adminAPI.getRiskDistribution().catch(() => ({ data: { data: {} } })),
      ]);
      setStats(statsRes.data);
      setAnalyticsData(analyticsRes.data);
      setRiskDistribution(riskRes.data?.data || {});
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: <PeopleIcon />, label: 'Total Patients', value: stats?.total_patients || 0, color: '#1565c0' },
    { icon: <HospitalIcon />, label: 'Hospitals', value: stats?.total_hospitals || 0, color: '#00897b' },
    { icon: <ScienceIcon />, label: 'Total Doctors', value: stats?.total_doctors || 0, color: '#7b1fa2' },
    { icon: <BiotechIcon />, label: 'Screenings', value: stats?.total_screenings || 0, color: '#f57c00' },
    { icon: <AssessIcon />, label: 'AI Predictions', value: stats?.total_predictions || 0, color: '#0277bd' },
    { icon: <WarningIcon />, label: 'High Risk Patients', value: stats?.high_risk_patients || 0, color: '#c62828' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 280, bgcolor: '#1b1b2f', color: 'white' } }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <AdminIcon sx={{ color: '#ff6f00' }} />
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Admin Panel</Typography>
          </Stack>
          <List>
            {[
              { icon: <DashIcon />, label: 'Dashboard' },
              { icon: <PeopleIcon />, label: 'Users Management' },
              { icon: <HospitalIcon />, label: 'Hospitals' },
              { icon: <ScienceIcon />, label: 'AI Models' },
              { icon: <AnalyticsIcon />, label: 'Analytics' },
              { icon: <AssessIcon />, label: 'Reports' },
              { icon: <SecurityIcon />, label: 'Security' },
              { icon: <StorageIcon />, label: 'System Health' },
              { icon: <SettingsIcon />, label: 'Settings' },
            ].map((item, index) => (
              <ListItemButton key={index} sx={{ borderRadius: 2, mb: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' } }}>
                <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
            <ListItemButton onClick={logout} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1 }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
          <Toolbar>
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}><MenuIcon /></IconButton>
            <AdminIcon sx={{ color: '#ff6f00', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1b1b2f', flex: 1 }}>System Administration</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label="SUPER ADMIN" color="warning" size="small" sx={{ fontWeight: 700 }} />
              <IconButton><Badge badgeContent={12} color="error"><NotifIcon /></Badge></IconButton>
              <Avatar sx={{ bgcolor: '#ff6f00' }}>{user?.first_name?.[0]}</Avatar>
            </Stack>
          </Toolbar>
        </AppBar>

        {loading && <LinearProgress />}

        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1b1b2f', mb: 4 }}>
            System Overview
          </Typography>

          {/* Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statCards.map((stat, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                <Card sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      bgcolor: `${stat.color}15`, color: stat.color,
                    }}>{stat.icon}</Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Risk Distribution */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Cancer Risk Distribution</Typography>
                {riskDistribution && Object.keys(riskDistribution).length > 0 ? (
                  <Stack spacing={2}>
                    {Object.entries(riskDistribution).map(([level, count]: [string, any]) => {
                      const total = Object.values(riskDistribution).reduce((a: any, b: any) => a + b, 0) as number;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const color = level.includes('high') || level === 'critical' ? '#d32f2f' :
                                   level === 'moderate' ? '#f57c00' : '#4caf50';
                      return (
                        <Box key={level}>
                          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{level.replace('_', ' ').toUpperCase()}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{count} ({percentage.toFixed(1)}%)</Typography>
                          </Stack>
                          <LinearProgress variant="determinate" value={percentage}
                            sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 } }} />
                        </Box>
                      );
                    })}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">No risk data available yet</Typography>
                )}
              </Card>
            </Grid>

            {/* Analytics Summary */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Platform Analytics</Typography>
                <Stack spacing={2}>
                  {[
                    { label: 'Total Users', value: analyticsData?.total_users || 0 },
                    { label: 'Total Patients', value: analyticsData?.total_patients || 0 },
                    { label: 'Total Screenings', value: analyticsData?.total_screenings || 0 },
                    { label: 'Blood Samples Analyzed', value: analyticsData?.total_blood_samples || 0 },
                    { label: 'AI Risk Assessments', value: analyticsData?.total_risk_assessments || 0 },
                    { label: 'Cancer Detections', value: analyticsData?.cancer_detected_count || 0 },
                    { label: 'Detection Rate', value: `${((analyticsData?.detection_rate || 0) * 100).toFixed(2)}%` },
                  ].map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>

            {/* System Health */}
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>System Status</Typography>
                <Grid container spacing={2}>
                  {[
                    { label: 'API Server', status: 'Healthy', color: '#4caf50' },
                    { label: 'Database', status: 'Connected', color: '#4caf50' },
                    { label: 'AI Models', status: 'Loaded v1.0.0', color: '#4caf50' },
                    { label: 'Cache (Redis)', status: 'Disabled', color: '#ff9800' },
                    { label: 'Email Service', status: 'Disabled', color: '#9e9e9e' },
                    { label: 'SMS Service', status: 'Disabled', color: '#9e9e9e' },
                  ].map((service, index) => (
                    <Grid item xs={6} md={2} key={index}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: service.color, mx: 'auto', mb: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{service.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{service.status}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default AdminDashboard;

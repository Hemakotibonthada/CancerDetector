import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardContent, Button, AppBar, Toolbar,
  Stack, Chip, Avatar, IconButton, TextField, InputAdornment, Badge,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, 
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider, LinearProgress,
} from '@mui/material';
import {
  LocalHospital as HospitalIcon, HealthAndSafety as HealthIcon,
  Search as SearchIcon, People as PeopleIcon, Person as PersonIcon,
  Science as ScienceIcon, Notifications as NotifIcon, Menu as MenuIcon,
  ExitToApp as LogoutIcon, Dashboard as DashIcon, MedicalServices as MedIcon,
  Assessment as AssessIcon, CalendarMonth as CalendarIcon,
  Warning as WarningIcon, TrendingUp as TrendIcon,
  Biotech as BiotechIcon, Hotel as BedIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { patientsAPI } from '../services/api';

const HospitalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchHealthId, setSearchHealthId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearchPatient = async () => {
    if (!searchHealthId) return;
    setLoading(true);
    setSearchError('');
    setSearchResult(null);
    try {
      const res = await patientsAPI.getByHealthId(searchHealthId);
      setSearchResult(res.data);
    } catch (err: any) {
      setSearchError(err.response?.data?.detail || 'Patient not found');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: <PeopleIcon />, label: 'Total Patients', value: '1,234', color: '#1565c0' },
    { icon: <PersonIcon />, label: 'Active Doctors', value: '48', color: '#00897b' },
    { icon: <BedIcon />, label: 'Available Beds', value: '126', color: '#7b1fa2' },
    { icon: <CalendarIcon />, label: "Today's Appointments", value: '87', color: '#f57c00' },
    { icon: <WarningIcon />, label: 'High Risk Patients', value: '23', color: '#d32f2f' },
    { icon: <ScienceIcon />, label: 'AI Predictions Today', value: '156', color: '#00695c' },
  ];

  const recentPatients = [
    { name: 'Jane Doe', healthId: 'CG-A1B2-C3D4-EF', risk: 'moderate', lastVisit: '2026-02-21' },
    { name: 'John Smith', healthId: 'CG-X1Y2-Z3W4-AB', risk: 'high', lastVisit: '2026-02-20' },
    { name: 'Alice Johnson', healthId: 'CG-M1N2-O3P4-QR', risk: 'low', lastVisit: '2026-02-19' },
    { name: 'Bob Williams', healthId: 'CG-E1F2-G3H4-IJ', risk: 'very_high', lastVisit: '2026-02-18' },
    { name: 'Diana Brown', healthId: 'CG-K1L2-M3N4-OP', risk: 'low', lastVisit: '2026-02-17' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 280, bgcolor: '#1a237e', color: 'white' } }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 4 }}>
            <HospitalIcon sx={{ color: '#82b1ff' }} />
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Hospital Portal</Typography>
          </Stack>
          <List>
            {[
              { icon: <DashIcon />, label: 'Dashboard' },
              { icon: <PeopleIcon />, label: 'Patients' },
              { icon: <PersonIcon />, label: 'Doctors' },
              { icon: <CalendarIcon />, label: 'Appointments' },
              { icon: <BiotechIcon />, label: 'Lab Results' },
              { icon: <ScienceIcon />, label: 'AI Predictions' },
              { icon: <AssessIcon />, label: 'Reports' },
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
            <HospitalIcon sx={{ color: '#1a237e', mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', flex: 1 }}>Hospital Dashboard</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label={user?.role?.replace('_', ' ').toUpperCase()} color="primary" size="small" />
              <IconButton><Badge badgeContent={5} color="error"><NotifIcon /></Badge></IconButton>
              <Avatar sx={{ bgcolor: '#1a237e' }}>{user?.first_name?.[0]}</Avatar>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* Search Patient by Health ID */}
          <Card sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #e8eaf6, #f3e5f5)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Search Patient by Health ID</Typography>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth placeholder="Enter Health ID (e.g., CG-XXXX-XXXX-XX)"
                value={searchHealthId} onChange={(e) => setSearchHealthId(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchPatient()}
              />
              <Button variant="contained" onClick={handleSearchPatient} disabled={loading}
                sx={{ px: 4, bgcolor: '#1a237e' }}>Search</Button>
            </Stack>
            {searchError && <Typography color="error" sx={{ mt: 2 }}>{searchError}</Typography>}
            {searchResult && (
              <Card sx={{ mt: 2, p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Patient Found</Typography>
                <Typography>Health ID: {searchResult.health_id}</Typography>
                <Typography>Risk Level: <Chip label={searchResult.overall_cancer_risk || 'N/A'} size="small" /></Typography>
                <Typography>Smartwatch: {searchResult.has_smartwatch ? 'Connected' : 'Not Connected'}</Typography>
              </Card>
            )}
          </Card>

          {/* Stats Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {stats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                <Card sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      bgcolor: `${stat.color}15`, color: stat.color,
                    }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{stat.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Recent Patients Table */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Recent Patients</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Patient Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Health ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cancer Risk</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Visit</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentPatients.map((patient, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{patient.name}</TableCell>
                      <TableCell><Chip label={patient.healthId} size="small" variant="outlined" /></TableCell>
                      <TableCell>
                        <Chip label={patient.risk.replace('_', ' ')} size="small" sx={{
                          bgcolor: patient.risk === 'high' || patient.risk === 'very_high' ? '#ffebee' : 
                                  patient.risk === 'moderate' ? '#fff3e0' : '#e8f5e9',
                          color: patient.risk === 'high' || patient.risk === 'very_high' ? '#c62828' :
                                 patient.risk === 'moderate' ? '#e65100' : '#2e7d32',
                          fontWeight: 600,
                        }} />
                      </TableCell>
                      <TableCell>{patient.lastVisit}</TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined">View Records</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Container>
      </Box>
    </Box>
  );
};

export default HospitalDashboard;

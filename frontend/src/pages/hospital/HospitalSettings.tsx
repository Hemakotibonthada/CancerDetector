import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, TextField, Switch,
  FormControlLabel, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Avatar, List, ListItem, ListItemIcon,
  ListItemText, ListItemSecondaryAction, CircularProgress,
} from '@mui/material';
import {
  Settings, LocalHospital, People, Timer, Assignment,
  Notifications, Security, ColorLens, Language, AttachMoney,
  Schedule, LocationOn, Wifi, Storage, Description, Add, Edit, Delete,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { SectionHeader, StatusBadge } from '../../components/common/SharedComponents';
import { hospitalsAPI, integrationAPI } from '../../services/api';

const HospitalSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showDeptDialog, setShowDeptDialog] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [feeSchedule, setFeeSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [hospitalsRes, integrationsRes] = await Promise.all([
        hospitalsAPI.list(),
        integrationAPI.getIntegrations(),
      ]);
      const hospitalsData = hospitalsRes.data ?? hospitalsRes;
      const integrationsData = integrationsRes.data ?? integrationsRes;

      const hospitalList = Array.isArray(hospitalsData) ? hospitalsData : hospitalsData.hospitals ?? [];
      setDepartments(hospitalList[0]?.departments ?? hospitalsData.departments ?? []);
      setFeeSchedule(hospitalList[0]?.fee_schedule ?? hospitalsData.fee_schedule ?? hospitalsData.feeSchedule ?? []);
      setIntegrations(Array.isArray(integrationsData) ? integrationsData : integrationsData.integrations ?? []);
    } catch (err: any) {
      console.error('Failed to load settings data:', err);
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load settings data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppLayout title="Hospital Settings" subtitle="Configuration and management" navItems={hospitalNavItems} portalType="hospital">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (<>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="General" icon={<Settings sx={{ fontSize: 16 }} />} iconPosition="start" />
        <Tab label="Departments" icon={<LocalHospital sx={{ fontSize: 16 }} />} iconPosition="start" />
        <Tab label="Fee Schedule" icon={<AttachMoney sx={{ fontSize: 16 }} />} iconPosition="start" />
        <Tab label="Integrations" icon={<Wifi sx={{ fontSize: 16 }} />} iconPosition="start" />
        <Tab label="Notifications" icon={<Notifications sx={{ fontSize: 16 }} />} iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Hospital Information" />
              <Stack spacing={2}>
                <TextField label="Hospital Name" fullWidth size="small" defaultValue="CancerGuard Medical Center" />
                <TextField label="Registration Number" fullWidth size="small" defaultValue="HOS-2024-001" />
                <TextField label="Address" fullWidth size="small" defaultValue="123 Medical Center Drive" />
                <Grid container spacing={2}>
                  <Grid item xs={6}><TextField label="City" fullWidth size="small" defaultValue="San Francisco" /></Grid>
                  <Grid item xs={3}><TextField label="State" fullWidth size="small" defaultValue="CA" /></Grid>
                  <Grid item xs={3}><TextField label="ZIP" fullWidth size="small" defaultValue="94102" /></Grid>
                </Grid>
                <TextField label="Phone" fullWidth size="small" defaultValue="+1-555-0100" />
                <TextField label="Email" fullWidth size="small" defaultValue="admin@cancerguard.org" />
                <TextField label="Website" fullWidth size="small" defaultValue="https://cancerguard.org" />
              </Stack>
              <Button variant="contained" sx={{ mt: 2 }}>Save Changes</Button>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, mb: 2 }}>
              <SectionHeader title="Operating Hours" />
              <Stack spacing={1.5}>
                {[
                  { day: 'Mon - Fri', hours: '8:00 AM - 8:00 PM' },
                  { day: 'Saturday', hours: '9:00 AM - 5:00 PM' },
                  { day: 'Sunday', hours: '10:00 AM - 2:00 PM' },
                  { day: 'Emergency', hours: '24/7' },
                ].map(h => (
                  <Stack key={h.day} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f0f0f0' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{h.day}</Typography>
                    <Typography sx={{ fontSize: 13 }}>{h.hours}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="System Preferences" />
              <Stack spacing={1}>
                <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 13 }}>Auto-notify on critical results</Typography>} />
                <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 13 }}>AI-powered risk assessment</Typography>} />
                <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 13 }}>Real-time bed tracking</Typography>} />
                <FormControlLabel control={<Switch />} label={<Typography sx={{ fontSize: 13 }}>Maintenance mode</Typography>} />
                <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 13 }}>User portal access</Typography>} />
                <FormControlLabel control={<Switch defaultChecked />} label={<Typography sx={{ fontSize: 13 }}>Telemedicine enabled</Typography>} />
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowDeptDialog(true)}>Add Department</Button>
          </Stack>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                    {['Department', 'Department Head', 'Beds', 'Staff', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.map((d) => (
                    <TableRow key={d.name} hover>
                      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{d.name}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{d.head}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{d.beds}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{d.staff}</TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Button size="small" startIcon={<Edit sx={{ fontSize: 12 }} />} sx={{ fontSize: 10 }}>Edit</Button>
                          <Button size="small" color="error" startIcon={<Delete sx={{ fontSize: 12 }} />} sx={{ fontSize: 10 }}>Remove</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {activeTab === 2 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Fee Schedule</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<Add />}>Add Service</Button>
                <Button size="small" variant="outlined" startIcon={<Edit />}>Bulk Edit</Button>
              </Stack>
            </Stack>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Service', 'Category', 'Fee', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {feeSchedule.map((f) => (
                  <TableRow key={f.service} hover>
                    <TableCell sx={{ fontSize: 13 }}>{f.service}</TableCell>
                    <TableCell><Chip label={f.category} size="small" sx={{ fontSize: 10 }} /></TableCell>
                    <TableCell sx={{ fontSize: 14, fontWeight: 700 }}>{f.fee}</TableCell>
                    <TableCell><Button size="small" startIcon={<Edit sx={{ fontSize: 12 }} />} sx={{ fontSize: 10 }}>Edit</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          {integrations.map((int) => (
            <Grid item xs={12} sm={6} md={4} key={int.name}>
              <Card sx={{ p: 2.5, borderLeft: `3px solid ${int.status === 'connected' ? '#4caf50' : int.status === 'warning' ? '#ff9800' : '#d32f2f'}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{int.name}</Typography>
                    <Chip label={int.type} size="small" variant="outlined" sx={{ fontSize: 10, mt: 0.5 }} />
                  </Box>
                  <StatusBadge status={int.status} />
                </Stack>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 1.5 }}>Last sync: {int.lastSync}</Typography>
                <Stack direction="row" spacing={1}>
                  {int.status === 'disconnected' ? (
                    <Button size="small" variant="contained">Connect</Button>
                  ) : (
                    <>
                      <Button size="small" variant="outlined">Configure</Button>
                      <Button size="small" variant="outlined">Test</Button>
                    </>
                  )}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 4 && (
        <Card sx={{ p: 3 }}>
          <SectionHeader title="Notification Settings" />
          <Stack spacing={2}>
            {[
              { label: 'Critical lab results', desc: 'Instant notification for critical values', enabled: true },
              { label: 'New patient admission', desc: 'Alert when new patient is admitted', enabled: true },
              { label: 'Bed availability change', desc: 'When bed status changes', enabled: true },
              { label: 'Equipment maintenance due', desc: 'Scheduled maintenance reminders', enabled: true },
              { label: 'Staff shift changes', desc: 'When staff schedule is modified', enabled: false },
              { label: 'AI high-risk prediction', desc: 'When AI identifies high-risk patient', enabled: true },
              { label: 'Appointment no-shows', desc: 'Patient missed appointment alerts', enabled: true },
              { label: 'Inventory low stock', desc: 'Supply inventory below threshold', enabled: false },
              { label: 'Compliance deadlines', desc: 'Upcoming compliance requirements', enabled: true },
              { label: 'System health alerts', desc: 'When system performance degrades', enabled: true },
            ].map((n) => (
              <Stack key={n.label} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: '1px solid #f0f0f0' }}>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{n.label}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{n.desc}</Typography>
                </Box>
                <Switch defaultChecked={n.enabled} />
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
      </>)}

      {/* Add Department Dialog */}
      <Dialog open={showDeptDialog} onClose={() => setShowDeptDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Department</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Department Name" fullWidth size="small" />
            <TextField label="Department Head" fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Number of Beds" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Staff Count" type="number" fullWidth size="small" /></Grid>
            </Grid>
            <TextField label="Location / Floor" fullWidth size="small" />
            <TextField label="Contact Extension" fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeptDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowDeptDialog(false)}>Add Department</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default HospitalSettings;

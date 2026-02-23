import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Avatar, Divider, Alert, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Tooltip, CircularProgress,
} from '@mui/material';
import {
  Medication as MedIcon, Add, AccessTime, CheckCircle, Warning,
  LocalPharmacy, History, Info, Refresh, Delete, Edit, Search,
  NotificationsActive, Autorenew, Science, WarningAmber,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { StatCard } from '../../components/common/SharedComponents';
import { pharmacyAPI } from '../../services/api';

const MedicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInteractionDialog, setShowInteractionDialog] = useState(false);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMedications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pharmacyAPI.getPrescriptions();
      const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      const meds = data.map((p: any) => ({
        id: p.id || p.prescription_id,
        name: p.medication_name || p.medication?.name || 'Unknown',
        dosage: p.dosage || '',
        frequency: p.frequency || 'As directed',
        timeOfDay: p.frequency?.toLowerCase().includes('twice') ? ['Morning', 'Evening'] : ['Morning'],
        purpose: p.instructions || p.medication?.purpose || '',
        prescribedBy: p.prescribed_by_name || p.doctor_name || 'Doctor',
        startDate: p.start_date || p.prescribed_date || '',
        endDate: p.end_date || '',
        refillsLeft: p.refills_remaining ?? p.refills ?? 0,
        sideEffects: p.side_effects ? (Array.isArray(p.side_effects) ? p.side_effects : [p.side_effects]) : [],
        adherence: p.adherence ?? 85,
        nextDose: '',
        taken: false,
        category: p.category || p.medication?.category || 'General',
      }));
      setMedications(meds);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load medications:', err);
      setError('Failed to load medications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMedications(); }, [loadMedications]);

  const interactions: any[] = [];
  const schedule = medications.length > 0 ? [
    { time: '8:00 AM', meds: medications.filter(m => m.timeOfDay.includes('Morning')).map(m => `${m.name} ${m.dosage}`), period: 'Morning' },
    { time: '6:00 PM', meds: medications.filter(m => m.timeOfDay.includes('Evening')).map(m => `${m.name} ${m.dosage}`), period: 'Evening' },
  ].filter(s => s.meds.length > 0) : [];
  const refillHistory: any[] = [];

  const getCategoryColor = (cat: string) => {
    const m: Record<string, string> = { Diabetes: '#1565c0', Cardiovascular: '#c62828', Supplement: '#2e7d32' };
    return m[cat] || '#616161';
  };

  return (
    <AppLayout title="Medications" subtitle="Track your medications and schedules" navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<MedIcon />} label="Active Meds" value={medications.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Avg. Adherence" value={medications.length > 0 ? `${Math.round(medications.reduce((a, m) => a + m.adherence, 0) / medications.length)}%` : '0%'} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Low Refills" value={medications.filter(m => m.refillsLeft <= 2).length} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<WarningAmber />} label="Interactions" value={interactions.length} color="#c62828" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="My Medications" />
        <Tab label="Daily Schedule" />
        <Tab label="Interactions" />
        <Tab label="Refill History" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowAddDialog(true)}>Add Medication</Button>
          </Box>
          {medications.length === 0 ? (
            <Card sx={{ p: 6, textAlign: 'center' }}>
              <MedIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No medications found</Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>Your prescriptions will appear here</Typography>
            </Card>
          ) : (
          <Grid container spacing={2}>
            {medications.map((med) => (
              <Grid item xs={12} md={6} key={med.id}>
                <Card sx={{ p: 2.5, transition: 'all 0.2s', '&:hover': { boxShadow: 4 }, borderLeft: `4px solid ${getCategoryColor(med.category)}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{med.name}</Typography>
                        <Chip label={med.category} size="small" sx={{ fontSize: 10, bgcolor: `${getCategoryColor(med.category)}15`, color: getCategoryColor(med.category) }} />
                      </Stack>
                      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{med.dosage} • {med.frequency}</Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small"><Edit sx={{ fontSize: 16 }} /></IconButton>
                      <IconButton size="small"><Delete sx={{ fontSize: 16 }} /></IconButton>
                    </Stack>
                  </Stack>

                  <Grid container spacing={1} sx={{ mt: 1.5 }}>
                    <Grid item xs={6}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Purpose</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{med.purpose}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Prescribed by</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{med.prescribedBy}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Time of Day</Typography>
                      <Stack direction="row" spacing={0.5}>{med.timeOfDay.map(t => <Chip key={t} label={t} size="small" sx={{ fontSize: 10 }} />)}</Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Next Dose</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: med.taken ? '#4caf50' : '#f57c00' }}>
                        {med.taken ? '✓ Taken' : med.nextDose}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Adherence</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{med.adherence}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={med.adherence}
                      sx={{
                        height: 6, borderRadius: 3,
                        bgcolor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': { bgcolor: med.adherence > 90 ? '#4caf50' : med.adherence > 70 ? '#f57c00' : '#c62828', borderRadius: 3 }
                      }}
                    />
                  </Box>

                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: med.refillsLeft <= 2 ? '#c62828' : 'text.secondary' }}>
                        {med.refillsLeft} refills remaining {med.refillsLeft <= 2 && '⚠️'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {!med.taken && <Button size="small" variant="contained" color="success" sx={{ fontSize: 11 }}>Take Now</Button>}
                      {med.refillsLeft <= 2 && <Button size="small" variant="outlined" color="warning" sx={{ fontSize: 11 }}>Refill</Button>}
                    </Stack>
                  </Stack>

                  {med.sideEffects.length > 0 && (
                    <Box sx={{ mt: 1.5, p: 1, bgcolor: '#fff3e0', borderRadius: 1 }}>
                      <Typography sx={{ fontSize: 11, color: '#f57c00', fontWeight: 600 }}>Possible Side Effects:</Typography>
                      <Typography sx={{ fontSize: 11, color: '#e65100' }}>{med.sideEffects.join(', ')}</Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
          )}
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {schedule.map((slot) => (
            <Grid item xs={12} md={4} key={slot.period}>
              <Card sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: slot.period === 'Morning' ? '#fff3e0' : slot.period === 'Evening' ? '#e3f2fd' : '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccessTime sx={{ color: slot.period === 'Morning' ? '#f57c00' : slot.period === 'Evening' ? '#1565c0' : '#7b1fa2' }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{slot.period}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{slot.time}</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                  {slot.meds.map((med, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocalPharmacy sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography sx={{ fontSize: 13 }}>{med}</Typography>
                      </Stack>
                      <Chip label="Take" size="small" color="primary" variant="outlined" clickable sx={{ fontSize: 10, height: 24 }} />
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {interactions.map((inter, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Card sx={{ p: 2.5, borderLeft: `4px solid ${inter.severity === 'moderate' ? '#f57c00' : '#ffb74d'}` }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <WarningAmber sx={{ fontSize: 20, color: inter.severity === 'moderate' ? '#f57c00' : '#ffb74d' }} />
                  <Chip label={inter.severity.toUpperCase()} size="small" sx={{ fontSize: 10, bgcolor: inter.severity === 'moderate' ? '#fff3e0' : '#fff8e1', color: inter.severity === 'moderate' ? '#f57c00' : '#f9a825' }} />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  {inter.drugs.map((d, j) => (
                    <React.Fragment key={d}>
                      <Chip label={d} size="small" variant="outlined" />
                      {j < inter.drugs.length - 1 && <Typography sx={{ alignSelf: 'center', color: 'text.secondary' }}>+</Typography>}
                    </React.Fragment>
                  ))}
                </Stack>
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{inter.description}</Typography>
              </Card>
            </Grid>
          ))}
          <Grid item xs={12}>
            <Alert severity="info" sx={{ mt: 1 }}>
              Drug interaction data is for informational purposes. Always consult your healthcare provider about potential interactions.
            </Alert>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Medication</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Pharmacy</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {refillHistory.map((r, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 13 }}>{r.date}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{r.medication}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{r.pharmacy}</TableCell>
                    <TableCell><Chip label="Picked Up" size="small" color="success" sx={{ fontSize: 10 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      </>}

      {/* Add Medication Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Medication</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Medication Name" fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Dosage" fullWidth size="small" placeholder="e.g., 500mg" /></Grid>
              <Grid item xs={6}><TextField label="Frequency" fullWidth size="small" placeholder="e.g., Twice daily" /></Grid>
            </Grid>
            <TextField label="Purpose" fullWidth size="small" />
            <TextField label="Prescribed By" fullWidth size="small" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Start Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="End Date (optional)" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <TextField label="Side Effects" fullWidth size="small" placeholder="Comma-separated" />
            <FormControlLabel control={<Switch />} label="Set refill reminders" />
            <FormControlLabel control={<Switch defaultChecked />} label="Set dose reminders" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowAddDialog(false)}>Add Medication</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default MedicationsPage;

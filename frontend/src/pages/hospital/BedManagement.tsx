import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  FormControl, InputLabel, Tabs, Tab, LinearProgress, Tooltip, Avatar,
  Divider, IconButton, Alert,
} from '@mui/material';
import {
  Hotel, Person, LocalHospital, Warning, Add, SwapHoriz,
  MeetingRoom, CleaningServices, CheckCircle, Block,
  Male, Female, MonitorHeart, Timer,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, StatusBadge } from '../../components/common/SharedComponents';
import { hospitalsAPI } from '../../services/api';

const BedManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const bedsRes = await hospitalsAPI.listBeds();
      const data = bedsRes.data || [];
      setBeds(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setBeds([]);
      setError('Failed to load beds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  type BedStatus = 'occupied' | 'available' | 'maintenance' | 'reserved' | 'discharge_pending';

  const wards: any[] = Object.values(beds.reduce((acc: Record<string, any>, bed) => {
    const name = bed.ward || 'Unassigned';
    if (!acc[name]) acc[name] = { name, floor: '', color: '#1565c0', total: 0, occupied: 0, available: 0, maintenance: 0 };
    acc[name].total += 1;
    if (bed.status === 'occupied' || bed.status === 'discharge_pending') acc[name].occupied += 1;
    else if (bed.status === 'available') acc[name].available += 1;
    else if (bed.status === 'maintenance') acc[name].maintenance += 1;
    return acc;
  }, {}));

  const totalBeds = beds.length;
  const totalOccupied = beds.filter(b => b.status === 'occupied' || b.status === 'discharge_pending').length;
  const totalAvail = beds.filter(b => b.status === 'available').length;
  const occupancyRate = totalBeds ? Math.round((totalOccupied / totalBeds) * 100) : 0;
  const transfers = beds.filter(b => b.transfer_status && b.transfer_status !== 'completed');

  const getBedColor = (s: BedStatus) => {
    const m: Record<string, string> = { occupied: '#d32f2f', available: '#4caf50', maintenance: '#9e9e9e', reserved: '#ff9800', discharge_pending: '#2196f3' };
    return m[s] || '#9e9e9e';
  };

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <AppLayout title="Bed Management" subtitle="Ward & bed occupancy tracking" navItems={hospitalNavItems} portalType="hospital">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {occupancyRate > 85 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <strong>High Occupancy Alert:</strong> Hospital at {occupancyRate}% capacity. {totalAvail} beds available.
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Hotel />} label="Total Beds" value={totalBeds} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Person />} label="Occupied" value={totalOccupied} color="#d32f2f" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Available" value={totalAvail} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<MonitorHeart />} label="Occupancy" value={`${occupancyRate}%`} color="#f57c00" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Ward Overview" />
        <Tab label="Bed Map" />
        <Tab label="Discharge Planning" />
        <Tab label="Transfer Queue" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          {wards.map((w) => (
            <Grid item xs={12} sm={6} md={4} key={w.name}>
              <Card sx={{ p: 2.5, borderTop: `3px solid ${w.color}`, transition: 'all 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{w.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{w.floor}</Typography>
                  </Box>
                  <Chip label={`${w.total ? Math.round((w.occupied / w.total) * 100) : 0}%`} size="small" color={w.total && w.occupied / w.total > 0.85 ? 'error' : w.total && w.occupied / w.total > 0.6 ? 'warning' : 'success'} sx={{ fontWeight: 700, fontSize: 11 }} />
                </Stack>
                <LinearProgress variant="determinate" value={w.total ? (w.occupied / w.total) * 100 : 0} sx={{ height: 8, borderRadius: 4, mb: 2 }} color={w.total && w.occupied / w.total > 0.85 ? 'error' : w.total && w.occupied / w.total > 0.6 ? 'warning' : 'success'} />
                <Grid container spacing={1}>
                  <Grid item xs={3}><Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: 18, fontWeight: 700 }}>{w.total}</Typography><Typography sx={{ fontSize: 9, color: 'text.secondary' }}>Total</Typography></Box></Grid>
                  <Grid item xs={3}><Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: 18, fontWeight: 700, color: '#d32f2f' }}>{w.occupied}</Typography><Typography sx={{ fontSize: 9, color: 'text.secondary' }}>Occupied</Typography></Box></Grid>
                  <Grid item xs={3}><Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: 18, fontWeight: 700, color: '#4caf50' }}>{w.available}</Typography><Typography sx={{ fontSize: 9, color: 'text.secondary' }}>Available</Typography></Box></Grid>
                  <Grid item xs={3}><Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: 18, fontWeight: 700, color: '#9e9e9e' }}>{w.maintenance}</Typography><Typography sx={{ fontSize: 9, color: 'text.secondary' }}>Maint.</Typography></Box></Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
            {[
              { label: 'Occupied', color: '#d32f2f' },
              { label: 'Available', color: '#4caf50' },
              { label: 'Maintenance', color: '#9e9e9e' },
              { label: 'Reserved', color: '#ff9800' },
              { label: 'Discharge Pending', color: '#2196f3' },
            ].map(l => (
              <Stack key={l.label} direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: l.color }} />
                <Typography sx={{ fontSize: 11 }}>{l.label}</Typography>
              </Stack>
            ))}
          </Stack>
          <Grid container spacing={1.5}>
            {beds.map((b) => (
              <Grid item xs={4} sm={3} md={2} key={b.id}>
                <Tooltip title={b.patient ? `${b.patient} - ${b.diagnosis}` : b.status.replace('_', ' ')} arrow>
                  <Card sx={{ p: 1.5, bgcolor: `${getBedColor(b.status)}12`, border: `2px solid ${getBedColor(b.status)}40`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', '&:hover': { borderColor: getBedColor(b.status), transform: 'scale(1.05)' } }}
                    onClick={() => b.status === 'occupied' && setSelectedBed(b)}>
                    <Hotel sx={{ fontSize: 20, color: getBedColor(b.status), mb: 0.5 }} />
                    <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{b.id}</Typography>
                    {b.patient && <Typography sx={{ fontSize: 9, color: 'text.secondary', mt: 0.5 }}>{b.patient.split(' ')[0]}</Typography>}
                    {b.acuity && <Chip label={b.acuity} size="small" sx={{ fontSize: 8, height: 16, mt: 0.5, textTransform: 'capitalize' }} />}
                  </Card>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {beds.filter(b => b.status === 'discharge_pending' || (b.status === 'occupied' && b.acuity === 'low')).map((b) => (
            <Grid item xs={12} sm={6} key={b.id}>
              <Card sx={{ p: 2, borderLeft: `3px solid ${b.status === 'discharge_pending' ? '#2196f3' : '#ff9800'}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{b.patient}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{b.id} • {b.ward} • Admitted {b.admitDate}</Typography>
                    <Typography sx={{ fontSize: 12, mt: 0.5 }}>{b.diagnosis}</Typography>
                  </Box>
                  <StatusBadge status={b.status === 'discharge_pending' ? 'ready for discharge' : 'can be discharged'} />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button size="small" variant="contained">Process Discharge</Button>
                  <Button size="small" variant="outlined" startIcon={<SwapHoriz />}>Transfer</Button>
                  <Button size="small" variant="outlined">Extend Stay</Button>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 18, mb: 2 }}>Transfer Requests</Typography>
          {transfers.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>No transfer requests are recorded.</Alert>}
          {transfers.map((t) => (
            <Card key={t.record_id || t.id} sx={{ p: 2, mb: 1.5, bgcolor: '#f8f9ff' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{t.patient || 'Unassigned'}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={t.id} size="small" color="error" variant="outlined" sx={{ fontSize: 10 }} />
                    <SwapHoriz sx={{ fontSize: 16 }} />
                    <Chip label={t.transfer_to_ward || '—'} size="small" color="success" variant="outlined" sx={{ fontSize: 10 }} />
                  </Stack>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{t.transfer_reason || t.transfer_status}{t.doctor ? ` • ${t.doctor}` : ''}</Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained">Approve</Button>
                  <Button size="small" variant="outlined" color="error">Deny</Button>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Card>
      )}

      {/* Bed Detail Dialog */}
      <Dialog open={!!selectedBed} onClose={() => setSelectedBed(null)} maxWidth="sm" fullWidth>
        {selectedBed && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>Bed {selectedBed.id} - Patient Details</DialogTitle>
            <DialogContent>
              <Stack spacing={1.5}>
                {[
                  { l: 'Patient', v: selectedBed.patient },
                  { l: 'Patient ID', v: selectedBed.patientId },
                  { l: 'Ward', v: selectedBed.ward },
                  { l: 'Admitted', v: selectedBed.admitDate },
                  { l: 'Diagnosis', v: selectedBed.diagnosis },
                  { l: 'Attending', v: selectedBed.doctor },
                  { l: 'Acuity', v: selectedBed.acuity },
                ].map(item => (
                  <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{item.v}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedBed(null)}>Close</Button>
              <Button variant="outlined" startIcon={<SwapHoriz />} onClick={() => { setShowTransfer(true); setSelectedBed(null); }}>Transfer</Button>
              <Button variant="contained">Discharge</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransfer} onClose={() => setShowTransfer(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Request Patient Transfer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Patient" fullWidth size="small" />
            <FormControl fullWidth size="small"><InputLabel>From Ward</InputLabel><Select label="From Ward">{wards.map(w => <MenuItem key={w.name} value={w.name}>{w.name}</MenuItem>)}</Select></FormControl>
            <FormControl fullWidth size="small"><InputLabel>To Ward</InputLabel><Select label="To Ward">{wards.map(w => <MenuItem key={w.name} value={w.name}>{w.name} ({w.available} available)</MenuItem>)}</Select></FormControl>
            <TextField label="Reason for Transfer" fullWidth multiline rows={2} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransfer(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowTransfer(false)}>Submit Transfer</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default BedManagement;

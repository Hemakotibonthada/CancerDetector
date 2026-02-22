import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Avatar,
  LinearProgress, Alert, Stepper, Step, StepLabel, IconButton,
} from '@mui/material';
import {
  Science, Search, Add, Biotech, Assignment, CheckCircle,
  Warning, Refresh, LocalShipping, Timer, TrendingUp,
  ErrorOutline, VerifiedUser, Download, Visibility,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, StatusBadge } from '../../components/common/SharedComponents';

const LabManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);

  const labOrders = [
    { id: 'LAB-5001', patient: 'Alice Johnson', patientId: 'P-1234', doctor: 'Dr. Smith', type: 'Complete Blood Count', priority: 'routine', status: 'completed', collected: '09:15 AM', result: 'Normal', turnaroundTime: '2h 15m', department: 'Hematology', tech: 'Carlos R.', critical: false },
    { id: 'LAB-5002', patient: 'Bob Williams', patientId: 'P-2345', doctor: 'Dr. Lee', type: 'Tumor Markers Panel', priority: 'urgent', status: 'in_progress', collected: '10:30 AM', result: 'Pending', turnaroundTime: '-', department: 'Oncology', tech: 'Lisa P.', critical: false },
    { id: 'LAB-5003', patient: 'Carmen Davis', patientId: 'P-3456', doctor: 'Dr. Chen', type: 'CSF Analysis', priority: 'stat', status: 'pending_collection', collected: '-', result: '-', turnaroundTime: '-', department: 'Neurology', tech: '-', critical: true },
    { id: 'LAB-5004', patient: 'David Martinez', patientId: 'P-4567', doctor: 'Dr. Smith', type: 'Biopsy - Breast Tissue', priority: 'urgent', status: 'pending_review', collected: 'Yesterday', result: 'Abnormal', turnaroundTime: '24h', department: 'Pathology', tech: 'Lisa P.', critical: true },
    { id: 'LAB-5005', patient: 'Elena Foster', patientId: 'P-5678', doctor: 'Dr. Wilson', type: 'Lipid Panel', priority: 'routine', status: 'completed', collected: '08:45 AM', result: 'Normal', turnaroundTime: '3h', department: 'Chemistry', tech: 'Carlos R.', critical: false },
    { id: 'LAB-5006', patient: 'Frank Green', patientId: 'P-6789', doctor: 'Dr. Park', type: 'Urinalysis', priority: 'routine', status: 'in_progress', collected: '11:00 AM', result: 'Pending', turnaroundTime: '-', department: 'Clinical', tech: 'James W.', critical: false },
    { id: 'LAB-5007', patient: 'Grace Kim', patientId: 'P-7890', doctor: 'Dr. Lee', type: 'Cardiac Enzymes', priority: 'stat', status: 'completed', collected: '07:00 AM', result: 'Abnormal', turnaroundTime: '45m', department: 'Chemistry', tech: 'Carlos R.', critical: true },
    { id: 'LAB-5008', patient: 'Henry Liu', patientId: 'P-8901', doctor: 'Dr. Smith', type: 'Genetic Testing - BRCA', priority: 'routine', status: 'sent_external', collected: '3 days ago', result: 'Pending', turnaroundTime: '5-7 days', department: 'Genetics', tech: '-', critical: false },
  ];

  const sampleTracking = [
    { step: 'Order Placed', completed: true },
    { step: 'Sample Collected', completed: true },
    { step: 'Processing', completed: true },
    { step: 'Analysis', completed: false },
    { step: 'Review', completed: false },
    { step: 'Results Ready', completed: false },
  ];

  const equipment = [
    { name: 'Hematology Analyzer', model: 'Sysmex XN-1000', status: 'operational', lastCal: '2 hrs ago', tests: 89, uptime: 99.2 },
    { name: 'Chemistry Analyzer', model: 'Roche Cobas 6000', status: 'operational', lastCal: '4 hrs ago', tests: 156, uptime: 98.5 },
    { name: 'Immunoassay System', model: 'Abbott Architect', status: 'maintenance', lastCal: 'In progress', tests: 0, uptime: 95.1 },
    { name: 'Blood Gas Analyzer', model: 'Radiometer ABL90', status: 'operational', lastCal: '1 hr ago', tests: 34, uptime: 99.8 },
    { name: 'Coagulation Analyzer', model: 'Stago STA-R', status: 'operational', lastCal: '6 hrs ago', tests: 45, uptime: 97.3 },
  ];

  const qcResults = [
    { test: 'CBC QC Level 1', result: 'Pass', shift: 'Morning', tech: 'Carlos R.', time: '06:30 AM' },
    { test: 'CBC QC Level 2', result: 'Pass', shift: 'Morning', tech: 'Carlos R.', time: '06:35 AM' },
    { test: 'Chemistry QC Normal', result: 'Pass', shift: 'Morning', tech: 'Lisa P.', time: '06:45 AM' },
    { test: 'Chemistry QC Abnormal', result: 'Flag', shift: 'Morning', tech: 'Lisa P.', time: '06:50 AM' },
    { test: 'Coag QC Level 1', result: 'Pass', shift: 'Morning', tech: 'James W.', time: '07:00 AM' },
  ];

  return (
    <AppLayout title="Lab Management" subtitle="Laboratory orders, tracking & results" navItems={hospitalNavItems} portalType="hospital">
      {labOrders.some(o => o.critical && o.status !== 'completed') && (
        <Alert severity="error" sx={{ mb: 2 }} icon={<Warning />}>
          <strong>Critical Results Pending:</strong> {labOrders.filter(o => o.critical && o.status !== 'completed').length} critical lab result(s) require immediate attention
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Science />} label="Today's Orders" value={labOrders.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Timer />} label="Avg Turnaround" value="2.5h" color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Completed" value={labOrders.filter(o => o.status === 'completed').length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<ErrorOutline />} label="Critical" value={labOrders.filter(o => o.critical).length} color="#d32f2f" /></Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField placeholder="Search orders..." size="small" sx={{ flex: 1, minWidth: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>Priority</InputLabel><Select label="Priority" defaultValue="all"><MenuItem value="all">All</MenuItem><MenuItem value="stat">STAT</MenuItem><MenuItem value="urgent">Urgent</MenuItem><MenuItem value="routine">Routine</MenuItem></Select></FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}><InputLabel>Status</InputLabel><Select label="Status" defaultValue="all"><MenuItem value="all">All</MenuItem><MenuItem value="pending">Pending</MenuItem><MenuItem value="in_progress">Processing</MenuItem><MenuItem value="completed">Completed</MenuItem></Select></FormControl>
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowNewOrder(true)}>New Order</Button>
        </Stack>
      </Card>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Orders" />
        <Tab label="Sample Tracking" />
        <Tab label="Equipment" />
        <Tab label="Quality Control" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Order ID', 'Patient', 'Test', 'Priority', 'Status', 'Collected', 'Result', 'TAT', 'Tech'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {labOrders.map((o) => (
                  <TableRow key={o.id} hover sx={{ cursor: 'pointer', bgcolor: o.critical ? '#fff3e020' : 'inherit' }} onClick={() => setSelectedOrder(o)}>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography sx={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}>{o.id}</Typography>
                        {o.critical && <Warning sx={{ fontSize: 14, color: '#d32f2f' }} />}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{o.patient}</Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{o.doctor}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{o.type}</TableCell>
                    <TableCell>
                      <Chip label={o.priority.toUpperCase()} size="small" color={o.priority === 'stat' ? 'error' : o.priority === 'urgent' ? 'warning' : 'default'} sx={{ fontSize: 10, fontWeight: 700, height: 22 }} />
                    </TableCell>
                    <TableCell><StatusBadge status={o.status.replace(/_/g, ' ')} /></TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{o.collected}</TableCell>
                    <TableCell>
                      <Chip label={o.result} size="small" color={o.result === 'Abnormal' ? 'error' : o.result === 'Normal' ? 'success' : 'default'} variant="outlined" sx={{ fontSize: 10, height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{o.turnaroundTime}</TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{o.tech}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {labOrders.filter(o => o.status !== 'completed').map((o) => (
            <Grid item xs={12} sm={6} key={o.id}>
              <Card sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{o.id} - {o.type}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{o.patient} • {o.doctor}</Typography>
                  </Box>
                  <Chip label={o.priority.toUpperCase()} size="small" color={o.priority === 'stat' ? 'error' : o.priority === 'urgent' ? 'warning' : 'default'} sx={{ fontSize: 10, fontWeight: 700 }} />
                </Stack>
                <Stepper activeStep={o.status === 'pending_collection' ? 0 : o.status === 'in_progress' ? 2 : o.status === 'pending_review' ? 4 : 1} alternativeLabel>
                  {sampleTracking.map((s) => (
                    <Step key={s.step}><StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: 9 } }}>{s.step}</StepLabel></Step>
                  ))}
                </Stepper>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {equipment.map((eq) => (
            <Grid item xs={12} sm={6} md={4} key={eq.name}>
              <Card sx={{ p: 2, borderTop: `3px solid ${eq.status === 'operational' ? '#43a047' : '#f57c00'}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{eq.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{eq.model}</Typography>
                  </Box>
                  <StatusBadge status={eq.status} />
                </Stack>
                <Grid container spacing={1} sx={{ mt: 1.5 }}>
                  <Grid item xs={4}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Tests Today</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{eq.tests}</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Uptime</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{eq.uptime}%</Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Last Cal</Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{eq.lastCal}</Typography>
                  </Grid>
                </Grid>
                <LinearProgress variant="determinate" value={eq.uptime} sx={{ mt: 1.5, height: 4, borderRadius: 2 }} color={eq.uptime > 97 ? 'success' : 'warning'} />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>All morning QC checks completed. 1 flag requires investigation.</Alert>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['QC Test', 'Result', 'Shift', 'Technician', 'Time'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {qcResults.map((qc, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 12 }}>{qc.test}</TableCell>
                    <TableCell>
                      <Chip label={qc.result} size="small" color={qc.result === 'Pass' ? 'success' : 'warning'} sx={{ fontSize: 10, fontWeight: 700, height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{qc.shift}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{qc.tech}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{qc.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Order Detail */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>Lab Order: {selectedOrder.id}</DialogTitle>
            <DialogContent>
              <Stack spacing={1.5}>
                {[
                  { l: 'Patient', v: `${selectedOrder.patient} (${selectedOrder.patientId})` },
                  { l: 'Ordering Doctor', v: selectedOrder.doctor },
                  { l: 'Test Type', v: selectedOrder.type },
                  { l: 'Department', v: selectedOrder.department },
                  { l: 'Priority', v: selectedOrder.priority.toUpperCase() },
                  { l: 'Status', v: selectedOrder.status.replace(/_/g, ' ') },
                  { l: 'Collected', v: selectedOrder.collected },
                  { l: 'Result', v: selectedOrder.result },
                  { l: 'Turnaround', v: selectedOrder.turnaroundTime },
                  { l: 'Technician', v: selectedOrder.tech },
                ].map(item => (
                  <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{item.v}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedOrder(null)}>Close</Button>
              <Button variant="outlined" startIcon={<Download />}>Download Report</Button>
              {selectedOrder.status === 'pending_review' && <Button variant="contained" startIcon={<VerifiedUser />}>Verify & Release</Button>}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* New Order Dialog */}
      <Dialog open={showNewOrder} onClose={() => setShowNewOrder(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Lab Order</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Patient Name / ID" fullWidth size="small" InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
            <TextField label="Ordering Physician" fullWidth size="small" />
            <FormControl fullWidth size="small"><InputLabel>Test Type</InputLabel><Select label="Test Type">
              <MenuItem value="cbc">Complete Blood Count</MenuItem><MenuItem value="tumor">Tumor Markers</MenuItem><MenuItem value="lipid">Lipid Panel</MenuItem><MenuItem value="biopsy">Biopsy</MenuItem><MenuItem value="genetic">Genetic Test</MenuItem><MenuItem value="urinalysis">Urinalysis</MenuItem>
            </Select></FormControl>
            <FormControl fullWidth size="small"><InputLabel>Priority</InputLabel><Select label="Priority"><MenuItem value="routine">Routine</MenuItem><MenuItem value="urgent">Urgent</MenuItem><MenuItem value="stat">STAT</MenuItem></Select></FormControl>
            <TextField label="Clinical Notes" fullWidth multiline rows={2} size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewOrder(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowNewOrder(false)}>Place Order</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default LabManagement;

import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Switch, FormControlLabel,
} from '@mui/material';
import {
  Storage, CloudDone, BackupTable, TrendingUp, CheckCircle, Schedule,
  DeleteForever, Archive, DataUsage, Speed, CloudUpload, Download,
  Warning,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { adminNavItems } from './AdminDashboard';

const BACKUPS = [
  { id: 'BK-001', type: 'Full', size: '45.2 GB', status: 'completed', started: '2024-12-18 02:00', completed: '2024-12-18 03:45', retention: '90 days', location: 'Primary Cloud', encrypted: true },
  { id: 'BK-002', type: 'Incremental', size: '2.8 GB', status: 'completed', started: '2024-12-18 06:00', completed: '2024-12-18 06:15', retention: '30 days', location: 'Primary Cloud', encrypted: true },
  { id: 'BK-003', type: 'Full', size: '44.8 GB', status: 'completed', started: '2024-12-17 02:00', completed: '2024-12-17 03:40', retention: '90 days', location: 'Secondary DR', encrypted: true },
  { id: 'BK-004', type: 'Differential', size: '8.5 GB', status: 'completed', started: '2024-12-17 14:00', completed: '2024-12-17 14:30', retention: '30 days', location: 'Primary Cloud', encrypted: true },
  { id: 'BK-005', type: 'Full', size: '43.9 GB', status: 'in_progress', started: '2024-12-18 14:00', completed: '', retention: '90 days', location: 'DR Site', encrypted: true },
];

const STORAGE_BREAKDOWN = [
  { name: 'Patient Records', value: 35, fill: '#5e92f3' },
  { name: 'Imaging (DICOM)', value: 30, fill: '#ae52d4' },
  { name: 'Lab Results', value: 15, fill: '#4caf50' },
  { name: 'System Logs', value: 10, fill: '#ff9800' },
  { name: 'Analytics Data', value: 10, fill: '#f44336' },
];

const STORAGE_TREND = [
  { month: 'Jul', used: 120, capacity: 200 }, { month: 'Aug', used: 128, capacity: 200 },
  { month: 'Sep', used: 135, capacity: 200 }, { month: 'Oct', used: 142, capacity: 200 },
  { month: 'Nov', used: 150, capacity: 250 }, { month: 'Dec', used: 158, capacity: 250 },
];

const RETENTION_POLICIES = [
  { type: 'Patient Health Records', retention: '10 years', regulation: 'HIPAA', autoDelete: false, encrypted: true, compressed: true },
  { type: 'Imaging Studies (DICOM)', retention: '7 years', regulation: 'State Law', autoDelete: false, encrypted: true, compressed: true },
  { type: 'Lab Results', retention: '10 years', regulation: 'CLIA', autoDelete: false, encrypted: true, compressed: true },
  { type: 'Audit Logs', retention: '6 years', regulation: 'SOC 2', autoDelete: true, encrypted: true, compressed: false },
  { type: 'System Logs', retention: '1 year', regulation: 'Internal', autoDelete: true, encrypted: false, compressed: true },
  { type: 'Temporary / Session', retention: '30 days', regulation: 'Internal', autoDelete: true, encrypted: false, compressed: false },
];

const DataManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const totalGB = 158;
  const capacityGB = 250;

  return (
    <AppLayout title="Data Management" navItems={adminNavItems} portalType="admin" subtitle="Backup, storage & data governance">
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Storage />} label="Storage Used" value={`${totalGB} GB`} color="#5e92f3" subtitle={`of ${capacityGB} GB capacity`} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CloudDone />} label="Last Backup" value="6:15 AM" change="Success" color="#4caf50" subtitle="Incremental, 2.8 GB" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<BackupTable />} label="Total Backups" value={BACKUPS.length.toString()} color="#ff9800" subtitle="This week" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<DataUsage />} label="Storage Usage" value={`${Math.round((totalGB / capacityGB) * 100)}%`} color={totalGB / capacityGB > 0.8 ? '#f44336' : '#4caf50'} subtitle={totalGB / capacityGB > 0.8 ? 'Consider upgrading' : 'Healthy'} />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<CloudDone />} label="Backups" iconPosition="start" />
            <Tab icon={<Storage />} label="Storage" iconPosition="start" />
            <Tab icon={<Archive />} label="Retention" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Backup History" icon={<CloudDone />}
              action={<Button startIcon={<CloudUpload />} variant="contained" size="small" onClick={() => setShowBackupDialog(true)}>Run Backup</Button>}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Size</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Started</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Completed</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Retention</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {BACKUPS.map((bk, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Chip label={bk.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} /></TableCell>
                      <TableCell>
                        <Chip label={bk.type} size="small" sx={{
                          bgcolor: bk.type === 'Full' ? '#e3f2fd' : bk.type === 'Incremental' ? '#e8f5e9' : '#fff3e0',
                          color: bk.type === 'Full' ? '#1565c0' : bk.type === 'Incremental' ? '#2e7d32' : '#e65100',
                          fontWeight: 600, fontSize: 10,
                        }} />
                      </TableCell>
                      <TableCell><Typography fontSize={12}>{bk.size}</Typography></TableCell>
                      <TableCell><Typography fontSize={11} fontFamily="monospace">{bk.started}</Typography></TableCell>
                      <TableCell><Typography fontSize={11} fontFamily="monospace">{bk.completed || '...'}</Typography></TableCell>
                      <TableCell><Typography fontSize={11}>{bk.location}</Typography></TableCell>
                      <TableCell><Typography fontSize={11}>{bk.retention}</Typography></TableCell>
                      <TableCell>
                        {bk.status === 'in_progress' ? (
                          <Stack spacing={0.5}>
                            <Typography fontSize={10} color="primary">In Progress...</Typography>
                            <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
                          </Stack>
                        ) : (
                          <StatusBadge status={bk.status} />
                        )}
                      </TableCell>
                      <TableCell>
                        {bk.status === 'completed' && (
                          <Stack direction="row" spacing={0.5}>
                            <Button size="small" startIcon={<Download />} sx={{ fontSize: 9 }}>Restore</Button>
                          </Stack>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Storage Breakdown" icon={<DataUsage />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={STORAGE_BREAKDOWN} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                      {STORAGE_BREAKDOWN.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Storage Growth Trend" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={STORAGE_TREND}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="capacity" stroke="#e0e0e0" fill="#f5f5f5" name="Capacity (GB)" />
                    <Area type="monotone" dataKey="used" stroke="#5e92f3" fill="#bbdefb" strokeWidth={2} name="Used (GB)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Storage Health" icon={<Speed />} />
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography fontWeight={600}>Overall Storage Usage</Typography>
                    <Typography fontWeight={700} color={totalGB / capacityGB > 0.8 ? '#f44336' : '#4caf50'}>{Math.round((totalGB / capacityGB) * 100)}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={(totalGB / capacityGB) * 100} sx={{
                    height: 16, borderRadius: 8, bgcolor: '#f0f0f0',
                    '& .MuiLinearProgress-bar': { borderRadius: 8, bgcolor: totalGB / capacityGB > 0.8 ? '#f44336' : '#4caf50' },
                  }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>{totalGB} GB used of {capacityGB} GB • {capacityGB - totalGB} GB available</Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Data Retention Policies" icon={<Archive />} />
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Retention policies are configured per regulatory requirements. Auto-delete will archive data before permanent deletion.</Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Data Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Retention Period</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Regulation</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Auto-Delete</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Encrypted</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Compressed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {RETENTION_POLICIES.map((p, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Typography fontWeight={600} fontSize={13}>{p.type}</Typography></TableCell>
                      <TableCell><Chip label={p.retention} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 11 }} /></TableCell>
                      <TableCell><Chip label={p.regulation} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontSize: 10 }} /></TableCell>
                      <TableCell><Switch checked={p.autoDelete} size="small" disabled /></TableCell>
                      <TableCell>{p.encrypted ? <CheckCircle sx={{ color: '#4caf50', fontSize: 18 }} /> : <Warning sx={{ color: '#ff9800', fontSize: 18 }} />}</TableCell>
                      <TableCell>{p.compressed ? <CheckCircle sx={{ color: '#4caf50', fontSize: 18 }} /> : <Typography fontSize={12} color="text.secondary">—</Typography>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Backup Dialog */}
        <Dialog open={showBackupDialog} onClose={() => setShowBackupDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Run Manual Backup</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Backup Type" fullWidth defaultValue="full">
                <MenuItem value="full">Full Backup</MenuItem>
                <MenuItem value="incremental">Incremental</MenuItem>
                <MenuItem value="differential">Differential</MenuItem>
              </TextField>
              <TextField select label="Destination" fullWidth defaultValue="primary">
                <MenuItem value="primary">Primary Cloud</MenuItem>
                <MenuItem value="secondary">Secondary DR Site</MenuItem>
                <MenuItem value="both">Both Locations</MenuItem>
              </TextField>
              <TextField select label="Retention" fullWidth defaultValue="90">
                <MenuItem value="30">30 Days</MenuItem>
                <MenuItem value="90">90 Days</MenuItem>
                <MenuItem value="365">1 Year</MenuItem>
                <MenuItem value="0">Permanent</MenuItem>
              </TextField>
              <FormControlLabel control={<Switch defaultChecked />} label="Encrypt Backup" />
              <FormControlLabel control={<Switch defaultChecked />} label="Compress Data" />
              <Alert severity="warning" sx={{ borderRadius: 2 }}>Full backups may take 1-2 hours and impact system performance.</Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBackupDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowBackupDialog(false)}>Start Backup</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default DataManagementPage;

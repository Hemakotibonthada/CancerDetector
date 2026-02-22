import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  InputAdornment, Pagination, Avatar,
} from '@mui/material';
import {
  History, Search, FilterList, Download, Visibility,
  Person, Edit, Delete, Add, Login, Logout, Settings,
  Security, VpnKey, Storage, Assessment, Warning,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';

const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [page, setPage] = useState(1);

  const auditLogs = [
    { id: 'AUD-001', timestamp: '2024-12-30 14:32:15', user: 'Dr. Sarah Wilson', role: 'doctor', action: 'VIEW', resource: 'Patient Record', resourceId: 'PAT-1024', details: 'Viewed patient health record and cancer risk assessment', ip: '10.0.0.45', location: 'New York, US', device: 'Chrome / Windows', status: 'success' },
    { id: 'AUD-002', timestamp: '2024-12-30 14:28:03', user: 'Admin John', role: 'admin', action: 'UPDATE', resource: 'System Config', resourceId: 'CFG-001', details: 'Updated session timeout from 30min to 45min', ip: '10.0.0.12', location: 'New York, US', device: 'Firefox / macOS', status: 'success' },
    { id: 'AUD-003', timestamp: '2024-12-30 14:15:22', user: 'Nurse Kelly', role: 'staff', action: 'CREATE', resource: 'Lab Order', resourceId: 'LAB-5567', details: 'Created new blood test order for patient PAT-1089', ip: '10.0.0.88', location: 'Boston, US', device: 'Edge / Windows', status: 'success' },
    { id: 'AUD-004', timestamp: '2024-12-30 14:10:45', user: 'System', role: 'system', action: 'EXECUTE', resource: 'AI Model', resourceId: 'MDL-001', details: 'Executed cancer risk prediction for 120 patients (batch job)', ip: '10.0.0.1', location: 'AWS us-east-1', device: 'Server', status: 'success' },
    { id: 'AUD-005', timestamp: '2024-12-30 13:55:18', user: 'unknown', role: 'unknown', action: 'LOGIN_FAILED', resource: 'Auth', resourceId: '-', details: 'Failed login attempt with invalid credentials (attempt 3/5)', ip: '192.168.1.45', location: 'Unknown', device: 'Chrome / Linux', status: 'failed' },
    { id: 'AUD-006', timestamp: '2024-12-30 13:42:30', user: 'Dr. Michael Chen', role: 'doctor', action: 'EXPORT', resource: 'Report', resourceId: 'RPT-445', details: 'Exported patient screening report as PDF (12 patients)', ip: '10.0.0.67', location: 'Chicago, US', device: 'Safari / macOS', status: 'success' },
    { id: 'AUD-007', timestamp: '2024-12-30 13:30:00', user: 'Admin John', role: 'admin', action: 'DELETE', resource: 'User Account', resourceId: 'USR-089', details: 'Deactivated user account for former staff member', ip: '10.0.0.12', location: 'New York, US', device: 'Firefox / macOS', status: 'success' },
    { id: 'AUD-008', timestamp: '2024-12-30 13:15:44', user: 'Patient Jane Doe', role: 'patient', action: 'UPDATE', resource: 'Profile', resourceId: 'PAT-2055', details: 'Updated emergency contact information', ip: '72.45.123.89', location: 'Dallas, US', device: 'Mobile Safari / iOS', status: 'success' },
    { id: 'AUD-009', timestamp: '2024-12-30 12:50:12', user: 'System', role: 'system', action: 'BACKUP', resource: 'Database', resourceId: 'DB-001', details: 'Automated daily backup completed successfully (size: 45.2 GB)', ip: '10.0.0.1', location: 'AWS us-east-1', device: 'Server', status: 'success' },
    { id: 'AUD-010', timestamp: '2024-12-30 12:30:00', user: 'Dr. Emily Parker', role: 'doctor', action: 'PRESCRIBE', resource: 'Medication', resourceId: 'MED-334', details: 'Prescribed Tamoxifen 20mg daily for patient PAT-1024', ip: '10.0.0.55', location: 'New York, US', device: 'Chrome / Windows', status: 'success' },
    { id: 'AUD-011', timestamp: '2024-12-30 12:15:33', user: 'unknown', role: 'unknown', action: 'API_ABUSE', resource: 'API', resourceId: '-', details: 'Rate limit exceeded: 500 requests in 60 seconds from single IP', ip: '203.45.67.89', location: 'Unknown', device: 'Bot/Automated', status: 'blocked' },
    { id: 'AUD-012', timestamp: '2024-12-30 11:45:00', user: 'Admin John', role: 'admin', action: 'DEPLOY', resource: 'AI Model', resourceId: 'MDL-004', details: 'Deployed CNN model v1.4 to staging environment', ip: '10.0.0.12', location: 'New York, US', device: 'Firefox / macOS', status: 'success' },
  ];

  const actionColors: any = {
    VIEW: '#1565c0', CREATE: '#4caf50', UPDATE: '#ff9800', DELETE: '#d32f2f',
    EXPORT: '#9c27b0', LOGIN_FAILED: '#d32f2f', EXECUTE: '#00796b',
    BACKUP: '#795548', PRESCRIBE: '#e91e63', API_ABUSE: '#d32f2f', DEPLOY: '#3f51b5',
  };

  const actionIcons: any = {
    VIEW: <Visibility fontSize="small" />, CREATE: <Add fontSize="small" />,
    UPDATE: <Edit fontSize="small" />, DELETE: <Delete fontSize="small" />,
    EXPORT: <Download fontSize="small" />, LOGIN_FAILED: <Warning fontSize="small" />,
    EXECUTE: <Settings fontSize="small" />, BACKUP: <Storage fontSize="small" />,
    PRESCRIBE: <Assessment fontSize="small" />, API_ABUSE: <Security fontSize="small" />,
    DEPLOY: <VpnKey fontSize="small" />,
  };

  const userActivity = [
    { user: 'Admin John', actions: 156, lastAction: '14:28', topAction: 'UPDATE', role: 'admin' },
    { user: 'Dr. Sarah Wilson', actions: 98, lastAction: '14:32', topAction: 'VIEW', role: 'doctor' },
    { user: 'Dr. Michael Chen', actions: 87, lastAction: '13:42', topAction: 'EXPORT', role: 'doctor' },
    { user: 'Nurse Kelly', actions: 74, lastAction: '14:15', topAction: 'CREATE', role: 'staff' },
    { user: 'Dr. Emily Parker', actions: 65, lastAction: '12:30', topAction: 'PRESCRIBE', role: 'doctor' },
    { user: 'System', actions: 342, lastAction: '14:10', topAction: 'EXECUTE', role: 'system' },
  ];

  const filteredLogs = auditLogs.filter(l =>
    (search === '' || l.user.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase())) &&
    (typeFilter === 'all' || l.action === typeFilter)
  );

  return (
    <AppLayout title="Audit Logs" subtitle="Comprehensive platform audit trail" navItems={adminNavItems} portalType="admin">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<History />} label="Total Events" value="12,458" color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Failed Actions" value="23" color="#d32f2f" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Person />} label="Active Users" value="48" color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Security />} label="Security Events" value="5" color="#f57c00" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="All Logs" />
        <Tab label="User Activity" />
        <Tab label="Security Events" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField size="small" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Action Type</InputLabel>
                <Select value={typeFilter} label="Action Type" onChange={(e) => setTypeFilter(e.target.value)}>
                  <MenuItem value="all">All Actions</MenuItem>
                  {Object.keys(actionColors).map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="outlined" size="small" startIcon={<Download />}>Export</Button>
            </Stack>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['ID', 'Timestamp', 'User', 'Action', 'Resource', 'Details', 'IP Address', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map(l => (
                  <TableRow key={l.id} hover sx={{ cursor: 'pointer', bgcolor: l.status === 'failed' ? '#fff3f3' : l.status === 'blocked' ? '#fff8e1' : 'inherit' }}
                    onClick={() => setSelectedLog(l)}>
                    <TableCell sx={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{l.id}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.timestamp}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Avatar sx={{ width: 22, height: 22, fontSize: 10, bgcolor: l.role === 'admin' ? '#d32f2f' : l.role === 'doctor' ? '#1565c0' : l.role === 'system' ? '#795548' : l.role === 'patient' ? '#4caf50' : '#9e9e9e' }}>
                          {l.user.charAt(0)}
                        </Avatar>
                        <Typography sx={{ fontSize: 11 }}>{l.user}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip icon={actionIcons[l.action]} label={l.action} size="small" sx={{ fontSize: 9, fontWeight: 700, bgcolor: `${actionColors[l.action]}15`, color: actionColors[l.action] }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{l.resource}</TableCell>
                    <TableCell sx={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details}</TableCell>
                    <TableCell sx={{ fontSize: 11, fontFamily: 'monospace' }}>{l.ip}</TableCell>
                    <TableCell>
                      <Chip label={l.status} size="small" color={l.status === 'success' ? 'success' : l.status === 'blocked' ? 'warning' : 'error'} sx={{ fontSize: 9, fontWeight: 700, textTransform: 'capitalize' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={50} page={page} onChange={(_, p) => setPage(p)} color="primary" size="small" />
          </Box>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>User Activity Summary (Today)</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['User', 'Role', 'Total Actions', 'Last Active', 'Top Action'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {userActivity.map(u => (
                  <TableRow key={u.user} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11 }}>{u.user.charAt(0)}</Avatar>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{u.user}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={u.role} size="small" sx={{ fontSize: 10, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>{u.actions}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{u.lastAction}</TableCell>
                    <TableCell>
                      <Chip label={u.topAction} size="small" sx={{ fontSize: 10, fontWeight: 700, bgcolor: `${actionColors[u.topAction]}15`, color: actionColors[u.topAction] }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Security-Related Events</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fff3f3' }}>
                  {['ID', 'Time', 'Event', 'Source', 'Details', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.filter(l => ['LOGIN_FAILED', 'API_ABUSE'].includes(l.action) || l.status === 'failed' || l.status === 'blocked').map(l => (
                  <TableRow key={l.id} hover sx={{ bgcolor: '#fff8f8' }}>
                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{l.id}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{l.timestamp}</TableCell>
                    <TableCell>
                      <Chip icon={actionIcons[l.action]} label={l.action} size="small" sx={{ fontSize: 10, bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{l.ip}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{l.details}</TableCell>
                    <TableCell>
                      <Chip label={l.status} size="small" color={l.status === 'blocked' ? 'warning' : 'error'} sx={{ fontSize: 10 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onClose={() => setSelectedLog(null)} maxWidth="sm" fullWidth>
        {selectedLog && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontWeight: 700 }}>Audit Log: {selectedLog.id}</Typography>
                <Chip label={selectedLog.action} sx={{ bgcolor: `${actionColors[selectedLog.action]}15`, color: actionColors[selectedLog.action], fontWeight: 700 }} />
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {[
                  { l: 'Timestamp', v: selectedLog.timestamp },
                  { l: 'User', v: selectedLog.user },
                  { l: 'Role', v: selectedLog.role },
                  { l: 'Action', v: selectedLog.action },
                  { l: 'Resource', v: `${selectedLog.resource} (${selectedLog.resourceId})` },
                  { l: 'Details', v: selectedLog.details },
                  { l: 'IP Address', v: selectedLog.ip },
                  { l: 'Location', v: selectedLog.location },
                  { l: 'Device', v: selectedLog.device },
                  { l: 'Status', v: selectedLog.status },
                ].map(item => (
                  <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500, minWidth: 100 }}>{item.l}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: '65%', textTransform: item.l === 'Status' || item.l === 'Role' ? 'capitalize' : 'none' }}>{item.v}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
              <Button variant="outlined" startIcon={<Download />}>Export</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </AppLayout>
  );
};

export default AuditLogs;

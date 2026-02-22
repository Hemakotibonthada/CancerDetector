import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Avatar,
  Switch, FormControlLabel, Checkbox, IconButton, Alert, Divider,
} from '@mui/material';
import {
  People, Search, PersonAdd, Edit, Delete, Block, CheckCircle,
  Visibility, VpnKey, History, AdminPanelSettings, FilterList,
  Download, Upload, MoreVert, Security, Email,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';

const UserManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [roleFilter, setRoleFilter] = useState('all');

  const users = [
    { id: 1, name: 'John Morrison', email: 'john.m@email.com', role: 'patient', status: 'active', lastLogin: '2 min ago', joined: '2023-06-15', twoFA: true, sessions: 1, avatar: 'JM', healthId: 'HID-001234' },
    { id: 2, name: 'Dr. Sarah Smith', email: 'sarah.s@hospital.org', role: 'doctor', status: 'active', lastLogin: '15 min ago', joined: '2022-03-20', twoFA: true, sessions: 2, avatar: 'SS', hospital: 'CancerGuard MC' },
    { id: 3, name: 'Dr. James Lee', email: 'james.l@hospital.org', role: 'doctor', status: 'active', lastLogin: '1 hr ago', joined: '2022-05-10', twoFA: true, sessions: 1, avatar: 'JL', hospital: 'CancerGuard MC' },
    { id: 4, name: 'Amanda Foster', email: 'a.foster@hospital.org', role: 'staff', status: 'active', lastLogin: '30 min ago', joined: '2023-01-15', twoFA: false, sessions: 1, avatar: 'AF', hospital: 'CancerGuard MC' },
    { id: 5, name: 'Admin User', email: 'admin@cancerguard.org', role: 'admin', status: 'active', lastLogin: 'Just now', joined: '2022-01-01', twoFA: true, sessions: 3, avatar: 'AU' },
    { id: 6, name: 'Bob Williams', email: 'bob.w@email.com', role: 'patient', status: 'active', lastLogin: '3 hrs ago', joined: '2023-09-20', twoFA: false, sessions: 0, avatar: 'BW', healthId: 'HID-002345' },
    { id: 7, name: 'Carmen Davis', email: 'carmen.d@email.com', role: 'patient', status: 'suspended', lastLogin: '5 days ago', joined: '2023-07-12', twoFA: false, sessions: 0, avatar: 'CD', healthId: 'HID-003456' },
    { id: 8, name: 'David Kim', email: 'd.kim@hospital.org', role: 'staff', status: 'active', lastLogin: '2 hrs ago', joined: '2023-04-01', twoFA: true, sessions: 1, avatar: 'DK', hospital: 'Metro Health' },
    { id: 9, name: 'Elena Foster', email: 'elena.f@email.com', role: 'patient', status: 'inactive', lastLogin: '30 days ago', joined: '2023-02-28', twoFA: false, sessions: 0, avatar: 'EF', healthId: 'HID-004567' },
    { id: 10, name: 'Frank Green', email: 'frank.g@email.com', role: 'patient', status: 'locked', lastLogin: 'Never', joined: '2024-01-05', twoFA: false, sessions: 0, avatar: 'FG', healthId: 'HID-005678' },
  ];

  const loginHistory = [
    { user: 'Admin User', ip: '192.168.1.100', location: 'San Francisco, CA', device: 'Chrome/Windows', time: 'Just now', status: 'success' },
    { user: 'Dr. Sarah Smith', ip: '10.0.0.45', location: 'San Francisco, CA', device: 'Safari/macOS', time: '15 min ago', status: 'success' },
    { user: 'Carmen Davis', ip: '172.16.0.22', location: 'New York, NY', device: 'Chrome/Android', time: '5 days ago', status: 'failed' },
    { user: 'Unknown', ip: '45.133.200.15', location: 'Moscow, RU', device: 'Bot', time: '2 days ago', status: 'blocked' },
    { user: 'Frank Green', ip: '192.168.2.50', location: 'Chicago, IL', device: 'Firefox/Linux', time: '1 day ago', status: 'locked' },
  ];

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout title="User Management" subtitle="Manage platform users and access" navItems={adminNavItems} portalType="admin">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<People />} label="Total Users" value={users.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Active" value={users.filter(u => u.status === 'active').length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Block />} label="Suspended/Locked" value={users.filter(u => u.status === 'suspended' || u.status === 'locked').length} color="#d32f2f" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Security />} label="2FA Enabled" value={users.filter(u => u.twoFA).length} color="#7b1fa2" /></Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="small" sx={{ flex: 1, minWidth: 200 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <MenuItem value="all">All Roles</MenuItem><MenuItem value="patient">Patient</MenuItem><MenuItem value="doctor">Doctor</MenuItem><MenuItem value="staff">Staff</MenuItem><MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" defaultValue="all">
              <MenuItem value="all">All Status</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem><MenuItem value="suspended">Suspended</MenuItem><MenuItem value="locked">Locked</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Download />}>Export</Button>
          <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setShowAddUser(true)}>Add User</Button>
        </Stack>
      </Card>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="All Users" />
        <Tab label="Login History" />
        <Tab label="Roles & Permissions" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['User', 'Role', 'Status', 'Last Login', '2FA', 'Sessions', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedUser(u)}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: u.role === 'admin' ? '#f3e5f5' : u.role === 'doctor' ? '#e8f5e9' : u.role === 'staff' ? '#fff3e0' : '#e3f2fd', color: u.role === 'admin' ? '#7b1fa2' : u.role === 'doctor' ? '#2e7d32' : u.role === 'staff' ? '#f57c00' : '#1565c0', fontWeight: 600 }}>{u.avatar}</Avatar>
                        <Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{u.name}</Typography><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{u.email}</Typography></Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={u.role} size="small" color={u.role === 'admin' ? 'secondary' : u.role === 'doctor' ? 'success' : u.role === 'staff' ? 'warning' : 'primary'} sx={{ fontSize: 10, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell><StatusBadge status={u.status} /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{u.lastLogin}</TableCell>
                    <TableCell>{u.twoFA ? <CheckCircle sx={{ fontSize: 18, color: '#4caf50' }} /> : <Block sx={{ fontSize: 18, color: '#bdbdbd' }} />}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{u.sessions}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small"><Edit sx={{ fontSize: 16 }} /></IconButton>
                        {u.status === 'active' ? <IconButton size="small"><Block sx={{ fontSize: 16, color: '#f57c00' }} /></IconButton> : <IconButton size="small"><CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} /></IconButton>}
                        <IconButton size="small"><VpnKey sx={{ fontSize: 16 }} /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['User', 'IP Address', 'Location', 'Device', 'Time', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loginHistory.map((l, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{l.user}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{l.ip}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{l.location}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{l.device}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{l.time}</TableCell>
                    <TableCell>
                      <Chip label={l.status} size="small" color={l.status === 'success' ? 'success' : l.status === 'failed' ? 'error' : l.status === 'blocked' ? 'error' : 'warning'} sx={{ fontSize: 10, fontWeight: 600 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {[
            { role: 'Admin', permissions: ['Full system access', 'User management', 'Hospital management', 'AI model management', 'System configuration', 'Security settings', 'Audit logs', 'All reports'], count: 3 },
            { role: 'Doctor', permissions: ['View patients', 'Edit medical records', 'Order lab tests', 'Prescribe medications', 'AI risk analysis', 'Schedule appointments', 'Clinical notes'], count: 35 },
            { role: 'Staff', permissions: ['View patient list', 'Schedule management', 'Lab sample processing', 'Bed management', 'Basic reporting', 'Attendance'], count: 68 },
            { role: 'Patient', permissions: ['View own records', 'Book appointments', 'Message doctors', 'View risk assessment', 'Manage profile', 'Smartwatch sync', 'Health goals'], count: 4800 },
          ].map((r) => (
            <Grid item xs={12} sm={6} key={r.role}>
              <Card sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{r.role}</Typography>
                  <Chip label={`${r.count} users`} size="small" sx={{ fontWeight: 600 }} />
                </Stack>
                <Stack spacing={0.5}>
                  {r.permissions.map(p => (
                    <Stack key={p} direction="row" spacing={1} alignItems="center">
                      <CheckCircle sx={{ fontSize: 14, color: '#4caf50' }} />
                      <Typography sx={{ fontSize: 12 }}>{p}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Button size="small" variant="outlined" sx={{ mt: 2 }}>Edit Permissions</Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onClose={() => setSelectedUser(null)} maxWidth="sm" fullWidth>
        {selectedUser && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }}>{selectedUser.avatar}</Avatar>
                <Box><Typography sx={{ fontWeight: 700, fontSize: 18 }}>{selectedUser.name}</Typography><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{selectedUser.email}</Typography></Box>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1.5}>
                {[
                  { l: 'Role', v: selectedUser.role },
                  { l: 'Status', v: selectedUser.status },
                  { l: 'Joined', v: selectedUser.joined },
                  { l: 'Last Login', v: selectedUser.lastLogin },
                  { l: '2FA Enabled', v: selectedUser.twoFA ? 'Yes' : 'No' },
                  { l: 'Active Sessions', v: selectedUser.sessions },
                  ...(selectedUser.healthId ? [{ l: 'Health ID', v: selectedUser.healthId }] : []),
                  ...(selectedUser.hospital ? [{ l: 'Hospital', v: selectedUser.hospital }] : []),
                ].map(item => (
                  <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{item.v}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedUser(null)}>Close</Button>
              <Button variant="outlined" color="warning" startIcon={<VpnKey />}>Reset Password</Button>
              <Button variant="contained" startIcon={<Edit />}>Edit User</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onClose={() => setShowAddUser(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="First Name" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Last Name" fullWidth size="small" /></Grid>
            </Grid>
            <TextField label="Email" fullWidth size="small" type="email" />
            <TextField label="Phone" fullWidth size="small" />
            <FormControl fullWidth size="small"><InputLabel>Role</InputLabel><Select label="Role"><MenuItem value="patient">Patient</MenuItem><MenuItem value="doctor">Doctor</MenuItem><MenuItem value="staff">Staff</MenuItem><MenuItem value="admin">Admin</MenuItem></Select></FormControl>
            <TextField label="Temporary Password" fullWidth size="small" type="password" />
            <FormControlLabel control={<Checkbox />} label={<Typography sx={{ fontSize: 13 }}>Require password change on first login</Typography>} />
            <FormControlLabel control={<Checkbox />} label={<Typography sx={{ fontSize: 13 }}>Enable two-factor authentication</Typography>} />
            <FormControlLabel control={<Checkbox defaultChecked />} label={<Typography sx={{ fontSize: 13 }}>Send welcome email</Typography>} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddUser(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowAddUser(false)}>Create User</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default UserManagement;

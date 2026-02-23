import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, TextField,
  InputAdornment, Avatar, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Select, MenuItem,
  FormControl, InputLabel, Tabs, Tab, Badge, Switch, FormControlLabel,
  CircularProgress, Alert,
} from '@mui/material';
import {
  People, Search, PersonAdd, Badge as BadgeIcon, LocalHospital,
  Phone, Email, Event, AccessTime, Groups, WorkHistory,
  Assignment, School, Verified,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, StatusBadge } from '../../components/common/SharedComponents';
import { workforceAPI } from '../../services/api';

const StaffDirectory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [deptFilter, setDeptFilter] = useState('all');
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [staffRes, shiftsRes] = await Promise.all([
        workforceAPI.getStaff(),
        workforceAPI.getShifts(),
      ]);
      const staffData = staffRes.data ?? staffRes;
      const shiftsData = shiftsRes.data ?? shiftsRes;
      setStaffMembers(Array.isArray(staffData) ? staffData : staffData.staff ?? []);
      setShifts(Array.isArray(shiftsData) ? shiftsData : shiftsData.shifts ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = staffMembers.filter(s =>
    (deptFilter === 'all' || s.department.toLowerCase() === deptFilter) &&
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <AppLayout title="Staff Directory" subtitle="Manage all hospital staff" navItems={hospitalNavItems} portalType="hospital">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Staff Directory" subtitle="Manage all hospital staff" navItems={hospitalNavItems} portalType="hospital">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<People />} label="Total Staff" value={staffMembers.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Groups />} label="On Duty" value={staffMembers.filter(s => s.status === 'on_duty').length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<AccessTime />} label="On Leave" value={staffMembers.filter(s => s.status === 'on_leave').length} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Verified />} label="Avg Attendance" value="95%" color="#7b1fa2" /></Grid>
      </Grid>

      <Card sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} size="small" sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Department</InputLabel>
            <Select label="Department" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value as string)}>
              <MenuItem value="all">All Departments</MenuItem>
              <MenuItem value="oncology">Oncology</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
              <MenuItem value="icu">ICU</MenuItem>
              <MenuItem value="surgery">Surgery</MenuItem>
              <MenuItem value="pathology">Pathology</MenuItem>
              <MenuItem value="radiology">Radiology</MenuItem>
              <MenuItem value="pharmacy">Pharmacy</MenuItem>
              <MenuItem value="rehab">Rehab</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" startIcon={<PersonAdd />}>Add Staff</Button>
        </Stack>
      </Card>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="All Staff" />
        <Tab label="Shift Management" />
        <Tab label="Credentials" />
        <Tab label="Attendance" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Staff Member</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Shift</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Years</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 32, height: 32, fontSize: 12, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }}>{s.avatar}</Avatar>
                        <Box><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{s.name}</Typography><Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{s.id}</Typography></Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{s.role}</TableCell>
                    <TableCell><Chip label={s.department} size="small" sx={{ fontSize: 10, height: 22 }} /></TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{s.shift}</TableCell>
                    <TableCell><StatusBadge status={s.status.replace('_', ' ')} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Chip icon={<Phone sx={{ fontSize: 12 }} />} label={s.phone} size="small" variant="outlined" sx={{ fontSize: 9 }} />
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{s.yearsService}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {shifts.map((s) => (
            <Grid item xs={12} md={4} key={s.name}>
              <Card sx={{ p: 3, borderTop: `3px solid ${s.color}` }}>
                <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{s.name} Shift</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>{s.time}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>{s.staff} Staff Members</Typography>
                <Stack spacing={1}>
                  {staffMembers.filter(m => m.shift === s.name).map(m => (
                    <Stack key={m.id} direction="row" spacing={1} alignItems="center" sx={{ p: 1, bgcolor: '#f8f9ff', borderRadius: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: 10, bgcolor: `${s.color}22`, color: s.color }}>{m.avatar}</Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{m.name}</Typography>
                        <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{m.role} - {m.department}</Typography>
                      </Box>
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
          {staffMembers.map((s) => (
            <Grid item xs={12} sm={6} md={4} key={s.id}>
              <Card sx={{ p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, fontSize: 13, bgcolor: '#e8f5e9', color: '#2e7d32' }}>{s.avatar}</Avatar>
                  <Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{s.name}</Typography><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{s.role}</Typography></Box>
                </Stack>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 1 }}>Certifications</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {s.credentials.map(c => <Chip key={c} label={c} size="small" icon={<Verified sx={{ fontSize: 12 }} />} sx={{ fontSize: 10, height: 24, mb: 0.5 }} color="success" variant="outlined" />)}
                </Stack>
                <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 1 }}>Hired: {s.hireDate}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Staff</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Attendance %</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Days Present</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Leave Taken</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Late Arrivals</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staffMembers.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: 11, bgcolor: '#e3f2fd', color: '#1565c0' }}>{s.avatar}</Avatar>
                        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{s.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={`${s.attendance}%`} size="small" color={s.attendance >= 95 ? 'success' : s.attendance >= 90 ? 'warning' : 'error'} sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{Math.round(s.attendance * 2.6)}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{260 - Math.round(s.attendance * 2.6)}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{Math.max(0, 5 - Math.floor(s.attendance / 20))}</TableCell>
                    <TableCell><StatusBadge status={s.attendance >= 95 ? 'excellent' : s.attendance >= 90 ? 'good' : 'needs improvement'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </AppLayout>
  );
};

export default StaffDirectory;

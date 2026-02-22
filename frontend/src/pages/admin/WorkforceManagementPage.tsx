import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Avatar,
} from '@mui/material';
import {
  People as StaffIcon, Schedule as ShiftIcon,
  EventBusy as LeaveIcon, Verified as CredIcon,
  Assessment as PerfIcon, WorkHistory as WFIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { workforceAPI } from '../../services/api';

const WorkforceManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [leave, setLeave] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, sh, lv, cr, pf] = await Promise.all([
        workforceAPI.getStaff().catch(() => ({ data: [] })),
        workforceAPI.getShifts().catch(() => ({ data: [] })),
        workforceAPI.getLeaveRequests().catch(() => ({ data: [] })),
        workforceAPI.getCredentialing().catch(() => ({ data: [] })),
        workforceAPI.getPerformanceReviews().catch(() => ({ data: [] })),
      ]);
      setStaff(st.data || []);
      setShifts(sh.data || []);
      setLeave(lv.data || []);
      setCredentials(cr.data || []);
      setPerformance(pf.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Workforce Management" navItems={adminNavItems} portalType="admin">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Active Staff', value: staff.filter(s => s.status === 'active').length, icon: <StaffIcon />, color: '#2196f3' },
            { label: "Today's Shifts", value: shifts.filter(s => new Date(s.shift_date).toDateString() === new Date().toDateString()).length, icon: <ShiftIcon />, color: '#4caf50' },
            { label: 'Leave Pending', value: leave.filter(l => l.status === 'pending').length, icon: <LeaveIcon />, color: '#ff9800' },
            { label: 'Expiring Credentials', value: credentials.filter(c => { const d = new Date(c.expiry_date); const now = new Date(); return d.getTime() - now.getTime() < 30*24*60*60*1000; }).length, icon: <CredIcon />, color: '#f44336' },
          ].map((s, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>{s.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Staff Profiles" icon={<StaffIcon />} iconPosition="start" />
          <Tab label="Shift Schedules" icon={<ShiftIcon />} iconPosition="start" />
          <Tab label="Leave Requests" icon={<LeaveIcon />} iconPosition="start" />
          <Tab label="Credentialing" icon={<CredIcon />} iconPosition="start" />
          <Tab label="Performance Reviews" icon={<PerfIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {staff.map((s: any) => (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#1976d2', width: 48, height: 48 }}>{(s.name || 'S')[0]}</Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#fff' }}>{s.name}</Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{s.role || 'Staff'}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={s.department || 'General'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={s.employment_type || 'Full-time'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                      <Chip label={s.status || 'active'} size="small"
                        sx={{ bgcolor: s.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: s.status === 'active' ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                      Hired: {s.hire_date ? new Date(s.hire_date).toLocaleDateString() : '-'} • License: {s.license_number || '-'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {staff.length === 0 && <Grid item xs={12}><Alert severity="info">No staff profiles.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Staff Member</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Shift</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Start</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>End</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Department</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ color: '#fff' }}>{s.staff_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(s.shift_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={s.shift_type || 'Day'} size="small"
                        sx={{ bgcolor: s.shift_type === 'Night' ? 'rgba(156,39,176,0.3)' : s.shift_type === 'Evening' ? 'rgba(255,152,0,0.3)' : 'rgba(33,150,243,0.3)',
                              color: s.shift_type === 'Night' ? '#ce93d8' : s.shift_type === 'Evening' ? '#ffb74d' : '#90caf9' }} />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.start_time}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.end_time}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.department}</TableCell>
                    <TableCell>
                      <Chip label={s.status || 'scheduled'} size="small"
                        sx={{ bgcolor: s.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)',
                              color: s.status === 'completed' ? '#81c784' : '#90caf9' }} />
                    </TableCell>
                  </TableRow>
                ))}
                {shifts.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No shifts scheduled</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {leave.map((l: any) => (
              <Card key={l.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{l.staff_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {l.leave_type || 'PTO'} • {new Date(l.start_date).toLocaleDateString()} to {new Date(l.end_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Reason: {l.reason || 'Personal'}</Typography>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={l.status} size="small"
                        sx={{ bgcolor: l.status === 'approved' ? 'rgba(76,175,80,0.3)' : l.status === 'rejected' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                              color: l.status === 'approved' ? '#81c784' : l.status === 'rejected' ? '#ef5350' : '#ffb74d' }} />
                      {l.status === 'pending' && (
                        <Stack direction="row" spacing={1}>
                          <Button variant="contained" size="small" sx={{ bgcolor: '#4caf50', fontSize: 12 }}>Approve</Button>
                          <Button variant="outlined" size="small" sx={{ color: '#f44336', borderColor: '#f44336', fontSize: 12 }}>Deny</Button>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {leave.length === 0 && <Alert severity="info">No leave requests.</Alert>}
          </Stack>
        )}

        {activeTab === 3 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Staff Member</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Credential Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>License/Cert #</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Issue Date</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Expiry Date</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {credentials.map((c: any) => {
                  const isExpiring = c.expiry_date && (new Date(c.expiry_date).getTime() - Date.now()) < 30*24*60*60*1000;
                  const isExpired = c.expiry_date && new Date(c.expiry_date) < new Date();
                  return (
                    <TableRow key={c.id} sx={{ bgcolor: isExpired ? 'rgba(244,67,54,0.08)' : isExpiring ? 'rgba(255,152,0,0.08)' : 'transparent' }}>
                      <TableCell sx={{ color: '#fff' }}>{c.staff_name}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{c.credential_type}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{c.license_number || c.cert_number}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(c.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ color: isExpired ? '#f44336' : isExpiring ? '#ff9800' : 'rgba(255,255,255,0.7)' }}>
                        {new Date(c.expiry_date).toLocaleDateString()}
                        {isExpiring && !isExpired && ' ⚠️'}
                        {isExpired && ' ❌'}
                      </TableCell>
                      <TableCell>
                        <Chip label={isExpired ? 'Expired' : c.status || 'Active'} size="small"
                          sx={{ bgcolor: isExpired ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)',
                                color: isExpired ? '#ef5350' : '#81c784' }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {credentials.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No credentials</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {performance.map((p: any) => (
              <Card key={p.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{p.staff_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Review Period: {p.review_period} • Reviewer: {p.reviewer_name}
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        {[
                          { l: 'Clinical Skills', v: p.clinical_score },
                          { l: 'Communication', v: p.communication_score },
                          { l: 'Teamwork', v: p.teamwork_score },
                          { l: 'Professionalism', v: p.professionalism_score },
                        ].filter(x => x.v !== undefined).map((score, i) => (
                          <Grid item xs={6} sm={3} key={i}>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{score.l}</Typography>
                            <LinearProgress variant="determinate" value={(score.v / 5) * 100}
                              sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)',
                                    '& .MuiLinearProgress-bar': { bgcolor: score.v >= 4 ? '#4caf50' : score.v >= 3 ? '#ff9800' : '#f44336' } }} />
                            <Typography variant="caption" sx={{ color: '#fff' }}>{score.v}/5</Typography>
                          </Grid>
                        ))}
                      </Grid>
                      {p.feedback && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>{p.feedback}</Typography>}
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={`Overall: ${p.overall_rating || '-'}/5`} size="small"
                        sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9', fontWeight: 700 }} />
                      <Chip label={p.status || 'completed'} size="small"
                        sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {performance.length === 0 && <Alert severity="info">No performance reviews.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default WorkforceManagementPage;

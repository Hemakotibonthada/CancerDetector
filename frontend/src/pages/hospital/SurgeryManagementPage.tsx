import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Divider, IconButton, CircularProgress,
} from '@mui/material';
import {
  LocalHospital, EventNote, Schedule, People, Add, MedicalServices,
  CheckCircle, Warning, Timer, TrendingUp, Assignment, Favorite,
  AirlineSeatFlat, Healing,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge } from '../../components/common/SharedComponents';
import { hospitalNavItems } from './HospitalDashboard';
import { surgeryAPI } from '../../services/api';

const statusColors: Record<string, string> = {
  scheduled: '#5e92f3', pre_op: '#ff9800', in_progress: '#4caf50', post_op: '#ae52d4', completed: '#2e7d32', cancelled: '#f44336',
};
const orStatusColors: Record<string, string> = {
  'In Use': '#f44336', 'Preparing': '#ff9800', 'Cleaning': '#5e92f3', 'Available': '#4caf50', 'Maintenance': '#9e9e9e',
};

const SurgeryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [orStatus, setOrStatus] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [typeDistribution, setTypeDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [listRes, orRes] = await Promise.all([
        surgeryAPI.list(),
        surgeryAPI.getORSchedule(),
      ]);
      const listData = listRes.data ?? listRes;
      const orData = orRes.data ?? orRes;
      setSurgeries(Array.isArray(listData) ? listData : listData.surgeries ?? []);
      setOrStatus(Array.isArray(orData) ? orData : orData.or_status ?? orData.orStatus ?? []);
      setWeeklyStats(listData.weekly_stats ?? listData.weeklyStats ?? []);
      setTypeDistribution(listData.type_distribution ?? listData.typeDistribution ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load surgery data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <AppLayout title="Surgery Management" navItems={hospitalNavItems} portalType="hospital" subtitle="Operating room scheduling & tracking">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Surgery Management" navItems={hospitalNavItems} portalType="hospital" subtitle="Operating room scheduling & tracking">
      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<LocalHospital />} label="Today's Surgeries" value="6" change="+2" color="#5e92f3" subtitle="3 cancer-related" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Timer />} label="Avg Duration" value="2.5h" change="-10%" color="#4caf50" subtitle="This week" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AirlineSeatFlat />} label="OR Utilization" value="67%" change="+5%" color="#ff9800" subtitle="4/6 rooms active" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircle />} label="Success Rate" value="98.5%" change="+0.2%" color="#4caf50" subtitle="Last 30 days" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<EventNote />} label="Surgery Schedule" iconPosition="start" />
            <Tab icon={<LocalHospital />} label="OR Status" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Today's Surgery Schedule" icon={<EventNote />}
              action={<Button startIcon={<Add />} variant="contained" size="small" onClick={() => setShowScheduleDialog(true)}>Schedule Surgery</Button>}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Procedure</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Surgeon</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>OR / Time</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {surgeries.map((surgery, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: surgery.status === 'in_progress' ? '#e8f5e920' : 'transparent' }}>
                      <TableCell><Chip label={surgery.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={600} fontSize={13}>{surgery.patient}</Typography>
                          {surgery.cancer && <Chip label="Cancer" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontSize: 9, height: 18 }} />}
                        </Stack>
                      </TableCell>
                      <TableCell><Typography fontSize={12}>{surgery.type}</Typography></TableCell>
                      <TableCell><Typography fontSize={12}>{surgery.surgeon}</Typography></TableCell>
                      <TableCell>
                        <Typography fontSize={12} fontWeight={600}>{surgery.or}</Typography>
                        <Typography variant="caption" color="text.secondary">{surgery.date.split(' ')[1]}</Typography>
                      </TableCell>
                      <TableCell><Typography fontSize={12}>{surgery.duration}h</Typography></TableCell>
                      <TableCell>
                        <Chip label={surgery.priority} size="small" sx={{
                          bgcolor: surgery.priority === 'Emergency' ? '#ffebee' : surgery.priority === 'Urgent' ? '#fff3e0' : '#e8f5e9',
                          color: surgery.priority === 'Emergency' ? '#c62828' : surgery.priority === 'Urgent' ? '#e65100' : '#2e7d32',
                          fontWeight: 700, fontSize: 10,
                        }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={surgery.status.replace('_', ' ').toUpperCase()} size="small" sx={{ bgcolor: `${statusColors[surgery.status]}15`, color: statusColors[surgery.status], fontWeight: 700, fontSize: 10 }} />
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
            {orStatus.map((or, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card sx={{ p: 2.5, borderLeft: `4px solid ${orStatusColors[or.status]}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="h6" fontWeight={800}>{or.room}</Typography>
                    <Chip label={or.status} size="small" sx={{ bgcolor: `${orStatusColors[or.status]}15`, color: orStatusColors[or.status], fontWeight: 700 }} />
                  </Stack>
                  {or.patient !== '-' && (
                    <>
                      <Typography variant="body2" fontWeight={600}>{or.patient}</Typography>
                      <Typography variant="caption" color="text.secondary">{or.surgeon}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={`Start: ${or.start}`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                        <Chip label={`Est. End: ${or.estimated_end}`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                      </Stack>
                    </>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Weekly Surgery Volume" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Bar dataKey="surgeries" fill="#5e92f3" name="Total Surgeries" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cancerRelated" fill="#f44336" name="Cancer-Related" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Surgery Types" icon={<Assignment />} />
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }: any) => `${value}%`}>
                      {typeDistribution.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
                {typeDistribution.map((item, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.fill }} />
                    <Typography variant="caption">{item.name}: {item.value}%</Typography>
                  </Stack>
                ))}
              </Card>
            </Grid>
          </Grid>
        )}

        <Dialog open={showScheduleDialog} onClose={() => setShowScheduleDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Surgery</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Patient Name" fullWidth />
              <TextField label="Procedure" fullWidth />
              <TextField select label="Surgeon" fullWidth defaultValue="">
                <MenuItem value="miller">Dr. James Miller</MenuItem>
                <MenuItem value="roberts">Dr. Emily Roberts</MenuItem>
                <MenuItem value="smith">Dr. Smith</MenuItem>
              </TextField>
              <TextField select label="Operating Room" fullWidth defaultValue="">
                {orStatus.filter(or => or.status === 'Available').map(or => (
                  <MenuItem key={or.room} value={or.room}>{or.room}</MenuItem>
                ))}
              </TextField>
              <TextField label="Date & Time" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Estimated Duration (hours)" type="number" fullWidth />
              <TextField select label="Priority" fullWidth defaultValue="elective">
                <MenuItem value="elective">Elective</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="emergency">Emergency</MenuItem>
              </TextField>
              <TextField select label="Anesthesia" fullWidth defaultValue="general">
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="regional">Regional</MenuItem>
                <MenuItem value="local">Local</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowScheduleDialog(false)}>Schedule</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default SurgeryManagementPage;

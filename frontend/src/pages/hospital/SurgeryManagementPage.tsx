import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Divider, IconButton,
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

const SURGERIES = [
  { id: 'SRG-001', patient: 'Alice Thompson', surgeon: 'Dr. James Miller', type: 'Lumpectomy', or: 'OR-3', date: '2024-12-18 08:00', duration: 2.5, status: 'scheduled', priority: 'Elective', cancer: true, anesthesia: 'General', team: ['Dr. Miller', 'Dr. Singh', 'Nurse Johnson', 'Anesthesiologist'] },
  { id: 'SRG-002', patient: 'Bob Williams', surgeon: 'Dr. Emily Roberts', type: 'Colectomy', or: 'OR-1', date: '2024-12-18 10:30', duration: 3, status: 'pre_op', priority: 'Urgent', cancer: true, anesthesia: 'General', team: ['Dr. Roberts', 'Dr. Chen', 'Nurse Davis'] },
  { id: 'SRG-003', patient: 'Carol Davis', surgeon: 'Dr. James Miller', type: 'Thyroidectomy', or: 'OR-5', date: '2024-12-18 14:00', duration: 2, status: 'scheduled', priority: 'Elective', cancer: true, anesthesia: 'General', team: ['Dr. Miller', 'Nurse Brown'] },
  { id: 'SRG-004', patient: 'David Lee', surgeon: 'Dr. Smith', type: 'Appendectomy', or: 'OR-2', date: '2024-12-18 07:30', duration: 1.5, status: 'in_progress', priority: 'Emergency', cancer: false, anesthesia: 'General', team: ['Dr. Smith', 'Dr. Patel'] },
  { id: 'SRG-005', patient: 'Eva Martinez', surgeon: 'Dr. Emily Roberts', type: 'Mastectomy', or: 'OR-4', date: '2024-12-17 09:00', duration: 3.5, status: 'completed', priority: 'Elective', cancer: true, anesthesia: 'General', team: ['Dr. Roberts', 'Dr. Wilson'], outcome: 'Successful' },
  { id: 'SRG-006', patient: 'Frank Chen', surgeon: 'Dr. James Miller', type: 'Prostatectomy', or: 'OR-1', date: '2024-12-17 13:00', duration: 4, status: 'post_op', priority: 'Elective', cancer: true, anesthesia: 'General', team: ['Dr. Miller'], outcome: 'Monitoring' },
];

const OR_STATUS = [
  { room: 'OR-1', status: 'In Use', patient: 'Bob Williams', surgeon: 'Dr. Roberts', start: '10:30', estimated_end: '13:30' },
  { room: 'OR-2', status: 'In Use', patient: 'David Lee', surgeon: 'Dr. Smith', start: '07:30', estimated_end: '09:00' },
  { room: 'OR-3', status: 'Preparing', patient: 'Alice Thompson', surgeon: 'Dr. Miller', start: '08:00', estimated_end: '10:30' },
  { room: 'OR-4', status: 'Cleaning', patient: '-', surgeon: '-', start: '-', estimated_end: '-' },
  { room: 'OR-5', status: 'Available', patient: '-', surgeon: '-', start: '-', estimated_end: '-' },
  { room: 'OR-6', status: 'Maintenance', patient: '-', surgeon: '-', start: '-', estimated_end: '-' },
];

const WEEKLY_STATS = [
  { day: 'Mon', surgeries: 8, cancerRelated: 5, complications: 0 },
  { day: 'Tue', surgeries: 10, cancerRelated: 7, complications: 1 },
  { day: 'Wed', surgeries: 9, cancerRelated: 6, complications: 0 },
  { day: 'Thu', surgeries: 7, cancerRelated: 4, complications: 0 },
  { day: 'Fri', surgeries: 11, cancerRelated: 8, complications: 1 },
];

const TYPE_DISTRIBUTION = [
  { name: 'Cancer Surgery', value: 65, fill: '#f44336' },
  { name: 'General Surgery', value: 20, fill: '#5e92f3' },
  { name: 'Emergency', value: 10, fill: '#ff9800' },
  { name: 'Diagnostic', value: 5, fill: '#4caf50' },
];

const statusColors: Record<string, string> = {
  scheduled: '#5e92f3', pre_op: '#ff9800', in_progress: '#4caf50', post_op: '#ae52d4', completed: '#2e7d32', cancelled: '#f44336',
};
const orStatusColors: Record<string, string> = {
  'In Use': '#f44336', 'Preparing': '#ff9800', 'Cleaning': '#5e92f3', 'Available': '#4caf50', 'Maintenance': '#9e9e9e',
};

const SurgeryManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);

  return (
    <AppLayout title="Surgery Management" navItems={hospitalNavItems} portalType="hospital" subtitle="Operating room scheduling & tracking">
      <Box sx={{ p: 3 }}>
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
                  {SURGERIES.map((surgery, idx) => (
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
            {OR_STATUS.map((or, idx) => (
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
                  <BarChart data={WEEKLY_STATS}>
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
                    <Pie data={TYPE_DISTRIBUTION} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }: any) => `${value}%`}>
                      {TYPE_DISTRIBUTION.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
                {TYPE_DISTRIBUTION.map((item, i) => (
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
                {OR_STATUS.filter(or => or.status === 'Available').map(or => (
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

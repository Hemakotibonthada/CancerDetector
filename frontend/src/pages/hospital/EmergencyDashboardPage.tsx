import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Badge, CircularProgress,
} from '@mui/material';
import {
  LocalHospital, Warning, Timer, Person, Favorite, Speed,
  TrendingUp, Assignment, MedicalServices, MonitorHeart,
  CheckCircle, PriorityHigh, ArrowUpward,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { hospitalNavItems } from './HospitalDashboard';
import { emergencyAPI } from '../../services/api';

const triageColors: Record<string, string> = {
  'Immediate': '#d32f2f', 'Emergency': '#f57c00', 'Urgent': '#fbc02d', 'Semi-Urgent': '#4caf50', 'Non-Urgent': '#2196f3',
};
const triageLevels = ['Immediate', 'Emergency', 'Urgent', 'Semi-Urgent', 'Non-Urgent'];

const EmergencyDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showTriageDialog, setShowTriageDialog] = useState(false);
  const [emergencyCases, setEmergencyCases] = useState<any[]>([]);
  const [triageDistribution, setTriageDistribution] = useState<any[]>([]);
  const [hourlyArrivals, setHourlyArrivals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [casesRes, dashRes] = await Promise.all([
        emergencyAPI.getCases().catch(() => ({ data: [] })),
        emergencyAPI.getDashboard().catch(() => ({ data: {} })),
      ]);
      const casesData = casesRes.data || [];
      setEmergencyCases(casesData.map((c: any) => ({
        id: c.id ?? c.case_id ?? '',
        patient: c.patient ?? c.patient_name ?? '',
        age: c.age ?? 0,
        triage: c.triage ?? c.triage_level ?? 'Non-Urgent',
        chief: c.chief ?? c.chief_complaint ?? '',
        vitals: c.vitals ?? { hr: 0, bp: 'N/A', spo2: 0, temp: 0 },
        time: c.time ?? c.arrival_time ?? '',
        status: c.status ?? 'waiting',
        assigned: c.assigned ?? c.assigned_doctor ?? '',
        bed: c.bed ?? c.bed_number ?? '',
      })));

      const dashData = dashRes.data || {};
      if (dashData.triage_distribution) {
        setTriageDistribution(dashData.triage_distribution);
      } else {
        // Derive from cases
        const triageCounts: Record<string, number> = {};
        casesData.forEach((c: any) => {
          const triage = c.triage ?? c.triage_level ?? 'Unknown';
          triageCounts[triage] = (triageCounts[triage] || 0) + 1;
        });
        setTriageDistribution(Object.entries(triageCounts).map(([name, count]) => ({
          name, count, fill: triageColors[name] ?? '#999',
        })));
      }

      if (dashData.hourly_arrivals) {
        setHourlyArrivals(dashData.hourly_arrivals);
      } else {
        setHourlyArrivals([{ hour: 'N/A', arrivals: 0 }]);
      }

      setError('');
    } catch {
      setError('Failed to load emergency data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const criticalCount = emergencyCases.filter(c => c.triage === 'Immediate' || c.triage === 'Emergency').length;

  const getVitalColor = (type: string, value: number) => {
    if (type === 'hr') return value > 100 ? '#f44336' : value < 60 ? '#ff9800' : '#4caf50';
    if (type === 'spo2') return value < 90 ? '#f44336' : value < 95 ? '#ff9800' : '#4caf50';
    if (type === 'temp') return value > 38 ? '#f44336' : value > 37.5 ? '#ff9800' : '#4caf50';
    return '#4caf50';
  };

  return (
    <AppLayout title="Emergency" navItems={hospitalNavItems} portalType="hospital" subtitle="Oncology emergency & triage management">
      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {criticalCount > 0 && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3, fontWeight: 600 }} icon={<PriorityHigh />}>
            {criticalCount} critical patient(s) require immediate attention!
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<LocalHospital />} label="Active Cases" value={emergencyCases.length.toString()} color="#f44336" subtitle="In emergency dept" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Warning />} label="Critical" value={criticalCount.toString()} color="#d32f2f" subtitle="Immediate attention" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Timer />} label="Avg Wait Time" value="12 min" change="-3 min" color="#ff9800" subtitle="For triage" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<MonitorHeart />} label="Beds Available" value="4/12" color="#4caf50" subtitle="Emergency bays" />
          </Grid>
        </Grid>

        {loading && <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>}
        {!loading && (<>
        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<MedicalServices />} label="Active Cases" iconPosition="start" />
            <Tab icon={<MonitorHeart />} label="Vitals Monitor" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Emergency Cases" icon={<LocalHospital />}
              action={<Button startIcon={<Person />} variant="contained" size="small" color="error" onClick={() => setShowTriageDialog(true)}>New Triage</Button>}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Case</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Triage</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Chief Complaint</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Bed</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assigned</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emergencyCases.map((c, idx) => (
                    <TableRow key={idx} sx={{
                      animation: c.triage === 'Immediate' ? 'pulse 2s infinite' : 'none',
                      bgcolor: c.triage === 'Immediate' ? '#fff5f5' : c.triage === 'Emergency' ? '#fff8e1' : 'transparent',
                    }}>
                      <TableCell><Chip label={c.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} /></TableCell>
                      <TableCell>
                        <Stack>
                          <Typography fontWeight={600} fontSize={13}>{c.patient}</Typography>
                          <Typography variant="caption" color="text.secondary">Age: {c.age}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip label={c.triage} size="small" sx={{
                          bgcolor: triageColors[c.triage] + '20',
                          color: triageColors[c.triage],
                          fontWeight: 700, fontSize: 10, border: `1px solid ${triageColors[c.triage]}40`,
                        }} />
                      </TableCell>
                      <TableCell><Typography fontSize={12} sx={{ maxWidth: 250 }}>{c.chief}</Typography></TableCell>
                      <TableCell><Typography fontSize={12} fontWeight={600}>{c.bed || '—'}</Typography></TableCell>
                      <TableCell><Typography fontSize={12}>{c.assigned || 'Pending'}</Typography></TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                      <TableCell><Typography fontSize={12} fontFamily="monospace">{c.time}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            {emergencyCases.filter(c => c.status !== 'waiting').map((c, idx) => (
              <Grid item xs={12} md={6} key={idx}>
                <Card sx={{ p: 2.5, border: `2px solid ${triageColors[c.triage]}30`, borderRadius: 3 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ bgcolor: triageColors[c.triage], width: 36, height: 36 }}>{c.patient.charAt(0)}</Avatar>
                      <Box>
                        <Typography fontWeight={700} fontSize={14}>{c.patient}</Typography>
                        <Typography variant="caption" color="text.secondary">{c.bed} • {c.assigned}</Typography>
                      </Box>
                    </Stack>
                    <Chip label={c.triage} size="small" sx={{ bgcolor: triageColors[c.triage] + '20', color: triageColors[c.triage], fontWeight: 700, fontSize: 10 }} />
                  </Stack>
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'Heart Rate', value: `${c.vitals.hr} bpm`, type: 'hr', numVal: c.vitals.hr },
                      { label: 'Blood Pressure', value: c.vitals.bp, type: 'bp', numVal: 0 },
                      { label: 'SpO2', value: `${c.vitals.spo2}%`, type: 'spo2', numVal: c.vitals.spo2 },
                      { label: 'Temperature', value: `${c.vitals.temp}°C`, type: 'temp', numVal: c.vitals.temp },
                    ].map((v, vi) => (
                      <Grid item xs={6} key={vi}>
                        <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: `1px solid ${v.type !== 'bp' ? getVitalColor(v.type, v.numVal) : '#e0e0e0'}20` }}>
                          <Typography variant="caption" color="text.secondary" fontSize={10}>{v.label}</Typography>
                          <Typography fontWeight={700} fontSize={16} sx={{ color: v.type !== 'bp' ? getVitalColor(v.type, v.numVal) : 'text.primary' }}>{v.value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Triage Distribution" icon={<Assignment />} />
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={triageDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="count" label={({ name, count }: any) => `${name}: ${count}`}>
                      {triageDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Hourly Arrivals" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={hourlyArrivals}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <RTooltip />
                    <Area type="monotone" dataKey="arrivals" stroke="#f44336" fill="#ffcdd2" strokeWidth={2} name="Arrivals" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}
        </>)}

        {/* Triage Dialog */}
        <Dialog open={showTriageDialog} onClose={() => setShowTriageDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ color: '#d32f2f' }}>New Emergency Triage</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Patient Name" fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Age" type="number" fullWidth /></Grid>
                <Grid item xs={6}>
                  <TextField select label="Triage Level" fullWidth defaultValue="">
                    {triageLevels.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
              <TextField label="Chief Complaint" multiline rows={2} fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Heart Rate (bpm)" type="number" fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Blood Pressure" fullWidth /></Grid>
                <Grid item xs={6}><TextField label="SpO2 (%)" type="number" fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Temperature (°C)" type="number" fullWidth /></Grid>
              </Grid>
              <TextField select label="Assign To" fullWidth defaultValue="">
                <MenuItem value="rivera">Dr. Rivera</MenuItem>
                <MenuItem value="kumar">Dr. Kumar</MenuItem>
                <MenuItem value="chen">Dr. Chen</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowTriageDialog(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={() => setShowTriageDialog(false)}>Register & Triage</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default EmergencyDashboardPage;

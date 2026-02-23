import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton,
  Switch, FormControlLabel, Checkbox, LinearProgress, CircularProgress, Alert,
} from '@mui/material';
import {
  Assessment, Download, Schedule, Add, Description,
  PictureAsPdf, TableChart, BarChart as BarChartIcon,
  Email, Print, Delete, Edit, PlayArrow, Pause,
  CalendarMonth, FilterList,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, Tooltip,
} from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';
import { analyticsAPI } from '../../services/api';

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showBuilder, setShowBuilder] = useState(false);
  const [platformReports, setPlatformReports] = useState<any[]>([]);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [reportCategories, setReportCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getOverview();
      const data = res.data ?? res;
      setPlatformReports(data.reports ?? data.platform_reports ?? []);
      setScheduledReports(data.scheduled ?? data.scheduled_reports ?? []);
      setReportCategories(data.categories ?? data.report_categories ?? []);
      setError('');
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const typeColors: any = { summary: '#1565c0', activity: '#4caf50', ai: '#9c27b0', compliance: '#00796b', medical: '#e91e63', financial: '#ff9800', security: '#d32f2f', system: '#795548' };

  return (
    <AppLayout title="Reports" subtitle="Platform reports and analytics exports" navItems={adminNavItems} portalType="admin">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Assessment />} label="Total Reports" value="38" color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Schedule />} label="Scheduled" value="5" color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Download />} label="Downloads (Month)" value="156" color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Email />} label="Auto-Sent" value="42" color="#9c27b0" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="All Reports" />
        <Tab label="Scheduled Reports" />
        <Tab label="Report Builder" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {reportCategories.map(c => (
              <Grid item xs={6} sm={4} md={2} key={c.name}>
                <Card sx={{ p: 1.5, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }, borderTop: `3px solid ${c.color}` }}>
                  <Box sx={{ color: c.color, mb: 0.5 }}>{c.icon}</Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{c.name}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{c.count} reports</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                    {['Report', 'Type', 'Frequency', 'Last Generated', 'Size', 'Format', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {platformReports.map(r => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{r.name}</Typography>
                        <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{r.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={r.type} size="small" sx={{ fontSize: 10, bgcolor: `${typeColors[r.type]}15`, color: typeColors[r.type], fontWeight: 600, textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, textTransform: 'capitalize' }}>{r.frequency}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.lastGenerated}</TableCell>
                      <TableCell sx={{ fontSize: 12 }}>{r.size}</TableCell>
                      <TableCell>
                        <Chip label={r.format} size="small" variant="outlined" sx={{ fontSize: 10 }} icon={r.format === 'PDF' ? <PictureAsPdf sx={{ fontSize: '14px !important' }} /> : <TableChart sx={{ fontSize: '14px !important' }} />} />
                      </TableCell>
                      <TableCell>
                        {r.status === 'generating' ? (
                          <Stack spacing={0.3}>
                            <Typography sx={{ fontSize: 10 }}>Generating...</Typography>
                            <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
                          </Stack>
                        ) : <StatusBadge status={r.status} />}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton size="small" color="primary"><Download fontSize="small" /></IconButton>
                          <IconButton size="small"><Email fontSize="small" /></IconButton>
                          <IconButton size="small"><Print fontSize="small" /></IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}

      {activeTab === 1 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Scheduled Reports</Typography>
              <Button variant="contained" size="small" startIcon={<Add />}>Add Schedule</Button>
            </Stack>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Report Name', 'Schedule', 'Next Run', 'Format', 'Enabled', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduledReports.map((s, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{s.name}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{s.schedule}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{s.next}</TableCell>
                    <TableCell><Chip label={s.format} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                    <TableCell><Switch checked={s.enabled} size="small" color="success" /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small"><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="primary"><PlayArrow fontSize="small" /></IconButton>
                        <IconButton size="small" color="error"><Delete fontSize="small" /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 2 && (
        <Card sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Custom Report Builder</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size="small" label="Report Name" placeholder="My Custom Report" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Report Type</InputLabel>
                <Select label="Report Type" defaultValue="">
                  <MenuItem value="summary">Platform Summary</MenuItem>
                  <MenuItem value="user">User Analytics</MenuItem>
                  <MenuItem value="hospital">Hospital Performance</MenuItem>
                  <MenuItem value="ai">AI Model Report</MenuItem>
                  <MenuItem value="financial">Financial Report</MenuItem>
                  <MenuItem value="compliance">Compliance Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select label="Date Range" defaultValue="30d">
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                  <MenuItem value="1y">Last Year</MenuItem>
                  <MenuItem value="custom">Custom Range</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Output Format</InputLabel>
                <Select label="Output Format" defaultValue="pdf">
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="xlsx">Excel (XLSX)</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                  <MenuItem value="json">JSON</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <SectionHeader title="Include Sections" />
              <Grid container spacing={1}>
                {['Executive Summary', 'User Statistics', 'Hospital Metrics', 'AI Performance', 'Financial Data', 'Security Events', 'Compliance Status', 'Charts & Graphs', 'Detailed Tables', 'Recommendations'].map(s => (
                  <Grid item xs={6} sm={4} md={3} key={s}>
                    <FormControlLabel control={<Checkbox defaultChecked size="small" />} label={<Typography sx={{ fontSize: 12 }}>{s}</Typography>} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <SectionHeader title="Distribution" />
              <Grid container spacing={1}>
                {['Email to admins', 'Save to reports library', 'Schedule recurring', 'Send Slack notification'].map(s => (
                  <Grid item xs={6} sm={3} key={s}>
                    <FormControlLabel control={<Checkbox size="small" defaultChecked={s.includes('Save')} />} label={<Typography sx={{ fontSize: 12 }}>{s}</Typography>} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" startIcon={<Assessment />}>Generate Report</Button>
                <Button variant="outlined">Save as Template</Button>
                <Button variant="outlined" color="secondary">Preview</Button>
              </Stack>
            </Grid>
          </Grid>
        </Card>
      )}
      </>}
    </AppLayout>
  );
};

export default AdminReports;

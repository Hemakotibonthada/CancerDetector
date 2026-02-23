import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Switch, FormControlLabel, IconButton,
} from '@mui/material';
import {
  Hub, Api, Cloud, CheckCircle, Warning, Sync, Cable,
  TrendingUp, Settings, VpnKey, Speed, Error, ContentCopy,
  Refresh, PowerSettingsNew,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { adminNavItems } from './AdminDashboard';
import { integrationAPI } from '../../services/api';

const statusColors: Record<string, string> = { connected: '#4caf50', error: '#f44336', disconnected: '#9e9e9e' };
const statusIcons: Record<string, React.ReactNode> = { connected: <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />, error: <Error sx={{ fontSize: 16, color: '#f44336' }} />, disconnected: <PowerSettingsNew sx={{ fontSize: 16, color: '#9e9e9e' }} /> };

const IntegrationHubPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [apiCallsTrend, setApiCallsTrend] = useState<any[]>([]);
  const [typeDistribution, setTypeDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await integrationAPI.getIntegrations();
      setIntegrations(res.data?.integrations ?? res.data ?? []);
      setApiCallsTrend(res.data?.api_calls_trend ?? []);
      setTypeDistribution(res.data?.type_distribution ?? []);
    } catch (err) {
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const connected = integrations.filter(i => i.status === 'connected').length;
  const errors = integrations.filter(i => i.status === 'error').length;
  const totalRecords = integrations.reduce((s, i) => s + (i.records ?? 0), 0);

  return (
    <AppLayout title="Integrations" navItems={adminNavItems} portalType="admin" subtitle="Third-party integration & API management hub">
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {errors > 0 && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {errors} integration(s) have errors and require attention!
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Hub />} label="Total Integrations" value={integrations.length.toString()} color="#5e92f3" subtitle="Configured" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircle />} label="Connected" value={connected.toString()} color="#4caf50" subtitle="Healthy connections" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Sync />} label="Records Synced" value={totalRecords.toLocaleString()} change="+1.2K" color="#ae52d4" subtitle="Total data points" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Speed />} label="Avg Uptime" value="99.1%" color="#ff9800" subtitle="All integrations" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<Cable />} label="Integrations" iconPosition="start" />
            <Tab icon={<Api />} label="API Keys" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Integration Hub" icon={<Hub />}
              action={<Button startIcon={<Cable />} variant="contained" size="small" onClick={() => setShowAddDialog(true)}>Add Integration</Button>}
            />
            <Grid container spacing={2}>
              {integrations.map((integ, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Box sx={{
                    p: 2.5, borderRadius: 3, border: `1px solid ${integ.status === 'error' ? '#ffcdd2' : integ.status === 'disconnected' ? '#e0e0e0' : '#c8e6c9'}`,
                    bgcolor: integ.status === 'error' ? '#fff5f5' : integ.status === 'disconnected' ? '#fafafa' : '#f0fdf4',
                    opacity: integ.status === 'disconnected' ? 0.7 : 1,
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Cloud sx={{ color: statusColors[integ.status], fontSize: 28 }} />
                        <Box>
                          <Typography fontWeight={700} fontSize={14}>{integ.name}</Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={integ.type} size="small" variant="outlined" sx={{ fontSize: 9 }} />
                            {statusIcons[integ.status]}
                            <Typography fontSize={10} color={statusColors[integ.status]} fontWeight={600}>{integ.status}</Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small"><Refresh sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small"><Settings sx={{ fontSize: 16 }} /></IconButton>
                      </Stack>
                    </Stack>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" fontSize={9}>Sync Freq</Typography>
                        <Typography fontSize={11} fontWeight={600}>{integ.syncFreq}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" fontSize={9}>Records</Typography>
                        <Typography fontSize={11} fontWeight={600}>{integ.records.toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" fontSize={9}>Uptime</Typography>
                        <Typography fontSize={11} fontWeight={600} color={integ.uptime >= 99 ? '#2e7d32' : integ.uptime >= 95 ? '#e65100' : '#c62828'}>{integ.uptime}%</Typography>
                      </Grid>
                    </Grid>
                    {integ.status === 'error' && (
                      <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2, py: 0 }}>
                        <Typography fontSize={11}>Connection timeout. Last successful sync: {integ.lastSync}</Typography>
                      </Alert>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}

        {activeTab === 1 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="API Keys" icon={<VpnKey />} />
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>API keys are partially masked for security. Full keys are only shown once upon generation.</Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Integration</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>API Key</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Enabled</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {integrations.map((integ, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Typography fontWeight={600} fontSize={13}>{integ.name}</Typography></TableCell>
                      <TableCell><Chip label={integ.type} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell>
                        <Chip label={integ.apiKey} size="small" sx={{ fontFamily: 'monospace', fontSize: 10, bgcolor: '#f5f5f5' }} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {statusIcons[integ.status]}
                          <Typography fontSize={11} color={statusColors[integ.status]} fontWeight={600}>{integ.status}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Switch checked={integ.enabled} size="small" /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Button size="small" startIcon={<Refresh />} sx={{ fontSize: 9 }}>Rotate</Button>
                          <IconButton size="small"><ContentCopy sx={{ fontSize: 14 }} /></IconButton>
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
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="API Call Volume" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={apiCallsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Bar dataKey="calls" fill="#5e92f3" name="API Calls" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="errors" fill="#f44336" name="Errors" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Integration Types" icon={<Hub />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={typeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name }: any) => name}>
                      {typeDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        </>
        )}

        {/* Add Integration Dialog */}
        <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Integration</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Integration Name" fullWidth />
              <TextField select label="Type" fullWidth defaultValue="">
                <MenuItem value="ehr">EHR System</MenuItem>
                <MenuItem value="imaging">Imaging (PACS/DICOM)</MenuItem>
                <MenuItem value="lab">Laboratory</MenuItem>
                <MenuItem value="interop">Interoperability (HL7/FHIR)</MenuItem>
                <MenuItem value="comm">Communication</MenuItem>
                <MenuItem value="payment">Payment Gateway</MenuItem>
                <MenuItem value="crm">CRM</MenuItem>
              </TextField>
              <TextField label="API Endpoint URL" fullWidth placeholder="https://api.example.com/v1" />
              <TextField label="API Key" fullWidth />
              <TextField select label="Sync Frequency" fullWidth defaultValue="15">
                <MenuItem value="realtime">Real-time</MenuItem>
                <MenuItem value="5">Every 5 minutes</MenuItem>
                <MenuItem value="15">Every 15 minutes</MenuItem>
                <MenuItem value="30">Every 30 minutes</MenuItem>
                <MenuItem value="60">Every hour</MenuItem>
              </TextField>
              <FormControlLabel control={<Switch defaultChecked />} label="Enable immediately" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowAddDialog(false)}>Connect</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default IntegrationHubPage;

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead,
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
import { dataManagementAPI } from '../../services/api';

const DataManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [storageBreakdown, setStorageBreakdown] = useState<any[]>([]);
  const [storageTrend, setStorageTrend] = useState<any[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [backupsRes, storageRes, retentionRes] = await Promise.all([
        dataManagementAPI.getBackups(),
        dataManagementAPI.getStorageStats(),
        dataManagementAPI.getRetentionPolicies(),
      ]);
      setBackups(backupsRes.data?.backups ?? backupsRes.data ?? []);
      setStorageBreakdown(storageRes.data?.breakdown ?? storageRes.data?.storage_breakdown ?? []);
      setStorageTrend(storageRes.data?.trend ?? storageRes.data?.storage_trend ?? []);
      setRetentionPolicies(retentionRes.data?.policies ?? retentionRes.data ?? []);
    } catch (err) {
      setError('Failed to load data management information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout title="Data Management" navItems={adminNavItems} portalType="admin" subtitle="Backup, storage & data governance">
      <Box sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Storage />} label="Storage Used" value="—" color="#5e92f3" subtitle="Capacity is not measured" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CloudDone />} label="Last Export" value={backups[0]?.completed ? 'Recorded' : 'None'} color="#4caf50" subtitle={backups[0]?.completed || 'No export yet'} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<BackupTable />} label="Exports" value={backups.length.toString()} color="#ff9800" subtitle="JSON downloads" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<DataUsage />} label="Storage Usage" value="—" color="#4caf50" subtitle="Not measured" />
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
              action={<Button startIcon={<CloudUpload />} variant="contained" size="small" onClick={() => setShowBackupDialog(true)}>Download export</Button>}
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
                  {backups.map((bk, idx) => (
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
                    <Pie data={storageBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                      {storageBreakdown.map((e, i) => <Cell key={i} fill={e.fill} />)}
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
                  <AreaChart data={storageTrend}>
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
                  <Typography fontWeight={600}>Overall Storage Usage</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Database capacity is not measured inside the application.</Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Data Retention Policies" icon={<Archive />} />
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>No retention policies are stored. Nothing is auto-deleted from this screen.</Alert>
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
                  {retentionPolicies.map((p, idx) => (
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

        </>
        )}

        {/* Backup Dialog */}
        <Dialog open={showBackupDialog} onClose={() => setShowBackupDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Download database export</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Super admins can download a JSON copy of database rows. Passwords, secrets, and API key hashes are left out. The file is not stored on the server, and this does not copy the database to a cloud destination.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBackupDialog(false)}>Cancel</Button>
            <Button variant="contained" disabled={saving} onClick={async () => {
              try {
                setSaving(true);
                setError(null);
                const res = await dataManagementAPI.createBackup();
                const blob = new Blob([res.data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'cancerguard-export.json';
                link.click();
                URL.revokeObjectURL(url);
                setShowBackupDialog(false);
                await loadData();
              } catch (err: any) {
                let detail = err?.response?.data?.detail || err.message || 'Export failed';
                const data = err?.response?.data;
                if (data && typeof data.text === 'function') {
                  const text = await data.text();
                  try { detail = JSON.parse(text).detail || text; } catch { detail = text || detail; }
                }
                setError(typeof detail === 'string' ? detail : 'Export failed');
              } finally {
                setSaving(false);
              }
            }}>Download export</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default DataManagementPage;

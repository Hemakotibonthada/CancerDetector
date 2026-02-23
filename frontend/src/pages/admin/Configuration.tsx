import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Switch, FormControlLabel, Divider, Alert, Select,
  MenuItem, FormControl, InputLabel, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Slider, LinearProgress, CircularProgress,
} from '@mui/material';
import {
  Settings, Email, Sms, Notifications, Code, Language,
  Palette, Storage, Backup, RestoreFromTrash, Speed,
  Security, Flag, Api, IntegrationInstructions,
  CloudSync, DarkMode, LightMode, Save, Add, Edit,
  Delete, ContentCopy, ToggleOn, ToggleOff,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, SectionHeader, StatusBadge } from '../../components/common/SharedComponents';
import { adminAPI, integrationAPI } from '../../services/api';

const Configuration: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showTemplate, setShowTemplate] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, intRes] = await Promise.all([
        adminAPI.getDashboard(),
        integrationAPI.getIntegrations(),
      ]);
      const dash = dashRes.data;
      setSystemSettings(dash.system_settings ?? dash.systemSettings ?? []);
      setEmailTemplates(dash.email_templates ?? dash.emailTemplates ?? []);
      setFeatureFlags(dash.feature_flags ?? dash.featureFlags ?? []);
      setIntegrations(intRes.data?.integrations ?? intRes.data ?? []);
    } catch {
      setError('Failed to load configuration data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const envColors: any = { production: '#4caf50', staging: '#ff9800', development: '#1565c0' };

  if (loading) {
    return (
      <AppLayout title="Configuration" subtitle="System settings and integrations" navItems={adminNavItems} portalType="admin">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Configuration" subtitle="System settings and integrations" navItems={adminNavItems} portalType="admin">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Settings />} label="Settings" value="22" color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Flag />} label="Feature Flags" value={featureFlags.filter(f => f.enabled).length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Email />} label="Templates" value={emailTemplates.length} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<IntegrationInstructions />} label="Integrations" value={integrations.filter(i => i.status === 'connected').length} color="#9c27b0" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="System Settings" />
        <Tab label="Email Templates" />
        <Tab label="Feature Flags" />
        <Tab label="Integrations" />
        <Tab label="Backup & Storage" />
      </Tabs>

      {activeTab === 0 && (
        <Stack spacing={2}>
          {systemSettings.map(cat => (
            <Card key={cat.category} sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2, color: 'primary.main' }}>{cat.category}</Typography>
              <Grid container spacing={2}>
                {cat.settings.map(s => (
                  <Grid item xs={12} sm={6} key={s.name}>
                    {s.type === 'toggle' ? (
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.5 }}>
                        <Typography sx={{ fontSize: 13 }}>{s.name}</Typography>
                        <Switch defaultChecked={s.value as boolean} size="small" color="success" />
                      </Stack>
                    ) : s.type === 'select' ? (
                      <TextField fullWidth size="small" label={s.name} defaultValue={s.value} select>
                        <MenuItem value={s.value as string}>{s.value as string}</MenuItem>
                      </TextField>
                    ) : (
                      <TextField fullWidth size="small" label={s.name} defaultValue={s.value} type={s.type === 'number' ? 'number' : 'text'} />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Card>
          ))}
          <Button variant="contained" startIcon={<Save />} sx={{ alignSelf: 'flex-start' }}>Save All Settings</Button>
        </Stack>
      )}

      {activeTab === 1 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Email & SMS Templates</Typography>
              <Button variant="contained" size="small" startIcon={<Add />}>New Template</Button>
            </Stack>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Template', 'Subject', 'Trigger', 'Last Edited', 'Active', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {emailTemplates.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{t.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{t.id}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{t.subject}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{t.trigger}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{t.lastEdited}</TableCell>
                    <TableCell><Switch checked={t.active} size="small" color="success" /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small"><Edit fontSize="small" /></IconButton>
                        <IconButton size="small"><ContentCopy fontSize="small" /></IconButton>
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
        <Grid container spacing={2}>
          {featureFlags.map(f => (
            <Grid item xs={12} sm={6} key={f.name}>
              <Card sx={{ p: 2, borderLeft: `3px solid ${f.enabled ? envColors[f.environment] : '#9e9e9e'}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>{f.name}</Typography>
                      <Chip label={f.environment} size="small" sx={{ fontSize: 9, bgcolor: `${envColors[f.environment]}15`, color: envColors[f.environment], fontWeight: 700 }} />
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.3 }}>{f.description}</Typography>
                  </Box>
                  <Switch checked={f.enabled} size="small" color="success" />
                </Stack>
                {f.enabled && (
                  <Box sx={{ mt: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Rollout</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{f.rollout}%</Typography>
                    </Stack>
                    <Slider value={f.rollout} size="small" sx={{ py: 0.5 }} valueLabelDisplay="auto" />
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          {integrations.map(int => (
            <Grid item xs={12} sm={6} md={4} key={int.name}>
              <Card sx={{ p: 2.5, borderLeft: `3px solid ${int.status === 'connected' ? '#4caf50' : int.status === 'partial' ? '#ff9800' : '#d32f2f'}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{int.name}</Typography>
                    <Chip label={int.type} size="small" sx={{ fontSize: 9, mt: 0.3 }} />
                  </Box>
                  <StatusBadge status={int.status} />
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={0.5}>
                  {Object.entries(int.config ?? {}).map(([k, v]) => (
                    <Stack key={k} direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: 11, color: 'text.secondary', textTransform: 'capitalize' }}>{k}</Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 500, fontFamily: 'monospace' }}>{String(v)}</Typography>
                    </Stack>
                  ))}
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Last Sync</Typography>
                    <Typography sx={{ fontSize: 11, fontWeight: 500 }}>{int.lastSync}</Typography>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                  <Button size="small" variant="outlined" fullWidth>Configure</Button>
                  <Button size="small" variant="outlined" fullWidth startIcon={<CloudSync />}>Sync</Button>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5 }}>
              <SectionHeader title="Backup Management" />
              <Stack spacing={2}>
                {[
                  { name: 'Full Database Backup', last: 'Dec 30, 2024 - 3:00 AM', size: '45.2 GB', status: 'success', auto: true },
                  { name: 'Incremental Backup', last: 'Dec 30, 2024 - 12:00 PM', size: '2.1 GB', status: 'success', auto: true },
                  { name: 'AI Models Backup', last: 'Dec 28, 2024', size: '12.8 GB', status: 'success', auto: false },
                  { name: 'File Storage Backup', last: 'Dec 29, 2024', size: '8.5 GB', status: 'success', auto: true },
                ].map(b => (
                  <Box key={b.name} sx={{ p: 1.5, bgcolor: '#f8f9ff', borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{b.name}</Typography>
                        <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{b.last} • {b.size}</Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {b.auto && <Chip label="Auto" size="small" sx={{ fontSize: 9 }} color="primary" />}
                        <StatusBadge status={b.status} />
                      </Stack>
                    </Stack>
                  </Box>
                ))}
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" startIcon={<Backup />}>Backup Now</Button>
                  <Button variant="outlined" startIcon={<RestoreFromTrash />}>Restore</Button>
                </Stack>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2.5 }}>
              <SectionHeader title="Storage Usage" />
              <Stack spacing={2}>
                {[
                  { name: 'Database', used: 45.2, total: 100, color: '#1565c0' },
                  { name: 'File Storage', used: 28.5, total: 50, color: '#4caf50' },
                  { name: 'AI Models', used: 12.8, total: 20, color: '#9c27b0' },
                  { name: 'Backups', used: 55.8, total: 100, color: '#ff9800' },
                  { name: 'Logs', used: 8.2, total: 25, color: '#795548' },
                ].map(s => (
                  <Box key={s.name}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{s.name}</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{s.used} / {s.total} GB</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={(s.used / s.total) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: s.color } }} />
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}
    </AppLayout>
  );
};

export default Configuration;

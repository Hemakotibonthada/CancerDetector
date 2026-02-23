import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, Divider, Alert, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Select,
  MenuItem, FormControl, InputLabel, Checkbox, CircularProgress,
} from '@mui/material';
import {
  Notifications, NotificationsActive, Email, Sms, Campaign,
  Send, Schedule, People, FilterList, Add, Edit, Delete,
  Warning, Info, CheckCircle, Error, Announcement,
  NotificationsOff, TrendingUp, Settings,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';
import { notificationsAPI } from '../../services/api';

const AdminNotifications: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [notificationRules, setNotificationRules] = useState<any[]>([]);
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);
  const [notificationStats, setNotificationStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list();
      const data = res.data ?? res;
      const items = Array.isArray(data) ? data : (data.notifications ?? data.items ?? []);
      setNotificationRules(data.rules ?? data.notification_rules ?? items);
      setRecentBroadcasts(data.broadcasts ?? data.recent_broadcasts ?? []);
      setNotificationStats(data.stats ?? data.notification_stats ?? []);
      setError('');
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const priorityColors: any = { critical: '#d32f2f', high: '#f57c00', medium: '#ff9800', low: '#4caf50' };

  return (
    <AppLayout title="Notifications" subtitle="Manage notification rules and broadcasts" navItems={adminNavItems} portalType="admin">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<NotificationsActive />} label="Active Rules" value={notificationRules.filter(r => r.enabled).length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Send />} label="Sent Today" value="1,248" color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<TrendingUp />} label="Open Rate" value="68.5%" color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Campaign />} label="Broadcasts" value={recentBroadcasts.length} color="#9c27b0" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Notification Rules" />
        <Tab label="Broadcasts" />
        <Tab label="Analytics" />
        <Tab label="Channel Settings" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Alert Rules</Typography>
              <Button variant="contained" size="small" startIcon={<Add />}>New Rule</Button>
            </Stack>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Rule Name', 'Trigger', 'Channels', 'Recipients', 'Priority', 'Enabled', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {notificationRules.map(r => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{r.name}</Typography>
                      <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{r.id}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, maxWidth: 180 }}>{r.trigger}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.3} flexWrap="wrap" gap={0.3}>
                        {r.channels.map(c => (
                          <Chip key={c} label={c} size="small" sx={{ fontSize: 9, height: 20 }}
                            icon={c === 'Email' ? <Email sx={{ fontSize: '12px !important' }} /> : c === 'SMS' ? <Sms sx={{ fontSize: '12px !important' }} /> : c === 'Push' ? <Notifications sx={{ fontSize: '12px !important' }} /> : <Campaign sx={{ fontSize: '12px !important' }} />} />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{r.recipients}</TableCell>
                    <TableCell>
                      <Chip label={r.priority} size="small" sx={{ fontSize: 9, fontWeight: 700, bgcolor: `${priorityColors[r.priority]}15`, color: priorityColors[r.priority], textTransform: 'uppercase' }} />
                    </TableCell>
                    <TableCell><Switch checked={r.enabled} size="small" color="success" /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small"><Edit fontSize="small" /></IconButton>
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

      {activeTab === 1 && (
        <>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Recent Broadcasts</Typography>
            <Button variant="contained" startIcon={<Campaign />} onClick={() => setShowBroadcast(true)}>New Broadcast</Button>
          </Stack>
          <Grid container spacing={2}>
            {recentBroadcasts.map(b => (
              <Grid item xs={12} sm={6} key={b.id}>
                <Card sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{b.title}</Typography>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{b.message}</Typography>
                    </Box>
                    <StatusBadge status={b.status} />
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={0.5}>
                    <Chip label={`${b.recipients.toLocaleString()} recipients`} size="small" icon={<People sx={{ fontSize: '14px !important' }} />} sx={{ fontSize: 10 }} />
                    {b.channels.map(c => <Chip key={c} label={c} size="small" variant="outlined" sx={{ fontSize: 10 }} />)}
                    <Chip label={b.sentAt} size="small" icon={<Schedule sx={{ fontSize: '14px !important' }} />} sx={{ fontSize: 10 }} />
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {activeTab === 2 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Notification Analytics</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Channel', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Failed', 'Delivery Rate', 'Open Rate'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {notificationStats.map(s => (
                  <TableRow key={s.channel} hover>
                    <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{s.channel}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{s.sent.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{s.delivered.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{s.opened.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{s.clicked.toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: 13, color: s.failed > 0 ? '#d32f2f' : '#4caf50', fontWeight: 600 }}>{s.failed}</TableCell>
                    <TableCell>
                      <Chip label={`${((s.delivered / s.sent) * 100).toFixed(1)}%`} size="small" color={s.delivered / s.sent > 0.95 ? 'success' : 'warning'} sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={`${((s.opened / s.delivered) * 100).toFixed(1)}%`} size="small" sx={{ fontWeight: 700, bgcolor: s.opened / s.delivered > 0.5 ? '#e8f5e9' : '#fff3e0', color: s.opened / s.delivered > 0.5 ? '#2e7d32' : '#e65100' }} />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 800, fontSize: 13 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{notificationStats.reduce((a, s) => a + s.sent, 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{notificationStats.reduce((a, s) => a + s.delivered, 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{notificationStats.reduce((a, s) => a + s.opened, 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13 }}>{notificationStats.reduce((a, s) => a + s.clicked, 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 13, color: '#d32f2f' }}>{notificationStats.reduce((a, s) => a + s.failed, 0)}</TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          {[
            { name: 'Email (SendGrid)', icon: <Email />, enabled: true, stats: '12,450 sent', cost: '$45.20', config: ['API Key: ****xyz', 'From: noreply@cancerguard.ai', 'Rate: 500/hr'] },
            { name: 'SMS (Twilio)', icon: <Sms />, enabled: true, stats: '3,200 sent', cost: '$128.00', config: ['Account: ****abc', 'From: +1-XXX-XXX-XXXX', 'Rate: 100/min'] },
            { name: 'Push Notifications', icon: <Notifications />, enabled: true, stats: '8,900 sent', cost: 'Free tier', config: ['FCM: Configured', 'APNS: Configured', 'Topic: cancerguard'] },
            { name: 'Slack Integration', icon: <Campaign />, enabled: true, stats: '1,200 sent', cost: 'Free', config: ['Workspace: CancerGuard', 'Channels: #alerts, #system, #oncall', 'Bot: CancerGuard Bot'] },
          ].map(ch => (
            <Grid item xs={12} sm={6} key={ch.name}>
              <Card sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ color: 'primary.main' }}>{ch.icon}</Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{ch.name}</Typography>
                  </Stack>
                  <Switch checked={ch.enabled} color="success" />
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Messages Sent</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{ch.stats}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Monthly Cost</Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{ch.cost}</Typography>
                  </Stack>
                  <Divider />
                  {ch.config.map((c, i) => (
                    <Typography key={i} sx={{ fontSize: 11, fontFamily: 'monospace', color: 'text.secondary' }}>{c}</Typography>
                  ))}
                </Stack>
                <Button variant="outlined" size="small" fullWidth sx={{ mt: 1.5 }} startIcon={<Settings />}>Configure</Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      </>}

      {/* Broadcast Dialog */}
      <Dialog open={showBroadcast} onClose={() => setShowBroadcast(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Broadcast Message</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField fullWidth size="small" label="Title" placeholder="Broadcast title" />
            <TextField fullWidth size="small" label="Message" placeholder="Broadcast message content..." multiline rows={4} />
            <FormControl fullWidth size="small">
              <InputLabel>Target Audience</InputLabel>
              <Select label="Target Audience" defaultValue="all">
                <MenuItem value="all">All Users (7,070)</MenuItem>
                <MenuItem value="patients">Patients Only (6,100)</MenuItem>
                <MenuItem value="doctors">Doctors Only (350)</MenuItem>
                <MenuItem value="staff">Staff Only (620)</MenuItem>
                <MenuItem value="admins">Admins Only (15)</MenuItem>
              </Select>
            </FormControl>
            <SectionHeader title="Channels" />
            <Stack direction="row" spacing={2}>
              <FormControlLabel control={<Checkbox defaultChecked size="small" />} label="Email" />
              <FormControlLabel control={<Checkbox defaultChecked size="small" />} label="Push" />
              <FormControlLabel control={<Checkbox size="small" />} label="SMS" />
            </Stack>
            <FormControl fullWidth size="small">
              <InputLabel>Schedule</InputLabel>
              <Select label="Schedule" defaultValue="now">
                <MenuItem value="now">Send Immediately</MenuItem>
                <MenuItem value="scheduled">Schedule for Later</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBroadcast(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Send />}>Send Broadcast</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default AdminNotifications;

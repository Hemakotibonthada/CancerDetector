import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, IconButton, TextField, Divider,
} from '@mui/material';
import {
  Chat as ChatIcon, Group as GroupIcon, Send as SendIcon,
  PersonAdd as InviteIcon, SwapHoriz as ReferIcon,
  Notifications as NotifIcon, Phone as PhoneIcon,
  AttachFile as AttachIcon, Star as StarIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { communicationAPI } from '../../services/api';

const CommunicationHubPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const [careTeams, setCareTeams] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [msg, teams, ref, pref] = await Promise.all([
        communicationAPI.getAllMessages().catch(() => ({ data: [] })),
        communicationAPI.getCareTeams().catch(() => ({ data: [] })),
        communicationAPI.getReferrals().catch(() => ({ data: [] })),
        communicationAPI.getPreferences().catch(() => ({ data: null })),
      ]);
      setMessages(msg.data || []);
      setCareTeams(teams.data || []);
      setReferrals(ref.data || []);
      setPreferences(pref.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await communicationAPI.sendMessage({ content: newMessage, subject: 'Quick Message' });
      setNewMessage('');
      loadData();
    } catch (e) { console.error(e); }
  };

  return (
    <AppLayout title="Communication Hub" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Messages', value: messages.length, icon: <ChatIcon />, color: '#2196f3' },
            { label: 'Unread', value: unreadCount, icon: <NotifIcon />, color: '#f44336' },
            { label: 'Care Teams', value: careTeams.length, icon: <GroupIcon />, color: '#4caf50' },
            { label: 'Referrals', value: referrals.length, icon: <ReferIcon />, color: '#ff9800' },
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

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Messages" icon={<ChatIcon />} iconPosition="start" />
          <Tab label="Care Teams" icon={<GroupIcon />} iconPosition="start" />
          <Tab label="Referrals" icon={<ReferIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                <Stack direction="row" spacing={1}>
                  <TextField fullWidth size="small" placeholder="Type a message..." value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    sx={{ '& .MuiInputBase-root': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' } }} />
                  <IconButton sx={{ color: '#90caf9' }}><AttachIcon /></IconButton>
                  <Button variant="contained" endIcon={<SendIcon />} onClick={sendMessage}
                    sx={{ bgcolor: '#2196f3', minWidth: 100 }}>Send</Button>
                </Stack>
              </CardContent>
            </Card>

            <List>
              {messages.map((msg: any) => (
                <React.Fragment key={msg.id}>
                  <ListItem sx={{ bgcolor: !msg.is_read ? 'rgba(33,150,243,0.1)' : 'transparent', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: msg.is_from_patient ? '#4caf50' : '#2196f3' }}>
                        {msg.sender_name?.[0] || 'D'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography sx={{ color: '#fff', fontWeight: !msg.is_read ? 700 : 400 }}>{msg.subject}</Typography>}
                      secondary={
                        <Stack>
                          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{msg.content?.substring(0, 100)}...</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            {msg.sender_name} • {new Date(msg.created_at).toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                    />
                    {msg.is_urgent && <Chip label="Urgent" size="small" sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350' }} />}
                    {!msg.is_read && (
                      <Button size="small" onClick={async () => { await communicationAPI.markAsRead(msg.id); loadData(); }}
                        sx={{ color: '#90caf9', ml: 1 }}>Mark Read</Button>
                    )}
                  </ListItem>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                </React.Fragment>
              ))}
              {messages.length === 0 && <Alert severity="info">No messages yet. Send a message to your care team!</Alert>}
            </List>
          </Box>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2}>
            {careTeams.map((team: any) => (
              <Grid item xs={12} md={6} key={team.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{team.name}</Typography>
                      <Chip label={team.is_active ? 'Active' : 'Inactive'} size="small"
                        sx={{ bgcolor: team.is_active ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: team.is_active ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{team.description}</Typography>
                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                    <Typography variant="subtitle2" sx={{ color: '#90caf9', mb: 1 }}>Team Members</Typography>
                    <Stack spacing={1}>
                      {(team.members || []).map((m: any, i: number) => (
                        <Stack key={i} direction="row" alignItems="center" spacing={1}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#2196f3', fontSize: 14 }}>{m.name?.[0]}</Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ color: '#fff' }}>{m.name}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{m.role}</Typography>
                          </Box>
                          {m.is_lead && <StarIcon sx={{ color: '#ffd700', fontSize: 16 }} />}
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {careTeams.length === 0 && <Grid item xs={12}><Alert severity="info">No care teams assigned.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {referrals.map((ref: any) => (
              <Card key={ref.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{ref.referral_type || 'Specialist Referral'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        From: {ref.referring_provider} → To: {ref.referred_to_provider}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Reason: {ref.reason}</Typography>
                    </Box>
                    <Stack direction="column" alignItems="flex-end" spacing={1}>
                      <Chip label={ref.status} size="small"
                        sx={{ bgcolor: ref.status === 'completed' ? 'rgba(76,175,80,0.3)' : ref.status === 'pending' ? 'rgba(255,152,0,0.3)' : 'rgba(33,150,243,0.3)',
                              color: ref.status === 'completed' ? '#81c784' : ref.status === 'pending' ? '#ffb74d' : '#90caf9' }} />
                      {ref.priority && <Chip label={ref.priority} size="small" variant="outlined"
                        sx={{ borderColor: ref.priority === 'urgent' ? '#f44336' : '#90caf9', color: ref.priority === 'urgent' ? '#f44336' : '#90caf9' }} />}
                    </Stack>
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                    Created: {new Date(ref.created_at).toLocaleDateString()}
                    {ref.scheduled_date && ` • Scheduled: ${new Date(ref.scheduled_date).toLocaleDateString()}`}
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {referrals.length === 0 && <Alert severity="info">No referrals.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default CommunicationHubPage;

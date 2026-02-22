import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Avatar, List, ListItem,
  ListItemText, IconButton,
} from '@mui/material';
import {
  VideoCall as VideoIcon, Schedule as SchedIcon,
  MonitorHeart as MonitorIcon, MedicalServices as RxIcon,
  Chat as ChatIcon, Videocam as CamIcon, People as WaitIcon,
  PlayArrow as PlayIcon, Stop as StopIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { telehealthEnhancedAPI } from '../../services/api';

const TelehealthPatientPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [waitingRoom, setWaitingRoom] = useState<any[]>([]);
  const [monitoring, setMonitoring] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sess, wait, mon, rx, ch] = await Promise.all([
        telehealthEnhancedAPI.getVideoSessions().catch(() => ({ data: [] })),
        telehealthEnhancedAPI.getWaitingRoom().catch(() => ({ data: [] })),
        telehealthEnhancedAPI.getMonitoringPlans().catch(() => ({ data: [] })),
        telehealthEnhancedAPI.getEPrescriptions().catch(() => ({ data: [] })),
        telehealthEnhancedAPI.getChatMessages('').catch(() => ({ data: [] })),
      ]);
      setSessions(sess.data || []);
      setWaitingRoom(wait.data || []);
      setMonitoring(mon.data || []);
      setPrescriptions(rx.data || []);
      setChats(ch.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');

  return (
    <AppLayout title="Telehealth" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Upcoming Sessions', value: upcomingSessions.length, icon: <VideoIcon />, color: '#2196f3' },
            { label: 'In Waiting Room', value: waitingRoom.length, icon: <WaitIcon />, color: '#ff9800' },
            { label: 'Monitoring Plans', value: monitoring.length, icon: <MonitorIcon />, color: '#4caf50' },
            { label: 'E-Prescriptions', value: prescriptions.length, icon: <RxIcon />, color: '#9c27b0' },
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
          <Tab label="Video Sessions" icon={<VideoIcon />} iconPosition="start" />
          <Tab label="Waiting Room" icon={<WaitIcon />} iconPosition="start" />
          <Tab label="Remote Monitoring" icon={<MonitorIcon />} iconPosition="start" />
          <Tab label="E-Prescriptions" icon={<RxIcon />} iconPosition="start" />
          <Tab label="Chat" icon={<ChatIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {sessions.map((s: any) => (
              <Card key={s.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <CamIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#2196f3' }} />
                        {s.session_type || 'Video Consultation'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Dr. {s.provider_name} • {new Date(s.scheduled_at).toLocaleString()}
                      </Typography>
                      {s.reason && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>Reason: {s.reason}</Typography>}
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={s.status} size="small"
                        sx={{ bgcolor: s.status === 'scheduled' ? 'rgba(33,150,243,0.3)' : s.status === 'in_progress' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)',
                              color: s.status === 'scheduled' ? '#90caf9' : s.status === 'in_progress' ? '#81c784' : '#9e9e9e' }} />
                      {s.status === 'scheduled' && (
                        <Button variant="contained" startIcon={<PlayIcon />}
                          sx={{ bgcolor: '#4caf50' }}
                          onClick={async () => { await telehealthEnhancedAPI.startSession(s.id); loadData(); }}>
                          Join
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  {s.duration_minutes && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                      Duration: {s.duration_minutes} min
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
            {sessions.length === 0 && <Alert severity="info">No video sessions scheduled.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <Box>
            {waitingRoom.length > 0 ? (
              <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)', p: 3, textAlign: 'center' }}>
                <CardContent>
                  <WaitIcon sx={{ fontSize: 64, color: '#ff9800', mb: 2 }} />
                  <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>You're in the Virtual Waiting Room</Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                    Position: {waitingRoom[0]?.position || 1} • Estimated wait: {waitingRoom[0]?.estimated_wait || '5-10'} minutes
                  </Typography>
                  <LinearProgress variant="indeterminate" sx={{ mb: 2, height: 8, borderRadius: 4 }} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Your provider will admit you shortly. Please ensure your camera and microphone are ready.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">You are not currently in any waiting room.</Alert>
            )}
          </Box>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {monitoring.map((plan: any) => (
              <Grid item xs={12} md={6} key={plan.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{plan.plan_name || 'Monitoring Plan'}</Typography>
                      <Chip label={plan.status} size="small" sx={{ bgcolor: plan.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: plan.status === 'active' ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                      Metrics: {(plan.metrics || []).join(', ') || 'Vitals, Weight, Blood Pressure'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Frequency: {plan.frequency || 'Daily'} • Since: {plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '-'}
                    </Typography>
                    {plan.last_reading && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(76,175,80,0.1)', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ color: '#81c784' }}>Last Reading: {plan.last_reading}</Typography>
                      </Box>
                    )}
                    <Button size="small" sx={{ color: '#90caf9', mt: 1 }}>Submit Reading</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {monitoring.length === 0 && <Grid item xs={12}><Alert severity="info">No remote monitoring plans.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {prescriptions.map((rx: any) => (
              <Card key={rx.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{rx.medication_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {rx.dosage} • {rx.frequency} • {rx.duration}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Prescribed by: Dr. {rx.prescriber_name} • {new Date(rx.prescribed_date).toLocaleDateString()}
                      </Typography>
                      {rx.pharmacy && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Pharmacy: {rx.pharmacy}</Typography>}
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={rx.status} size="small"
                        sx={{ bgcolor: rx.status === 'filled' ? 'rgba(76,175,80,0.3)' : rx.status === 'pending' ? 'rgba(255,152,0,0.3)' : 'rgba(33,150,243,0.3)',
                              color: rx.status === 'filled' ? '#81c784' : rx.status === 'pending' ? '#ffb74d' : '#90caf9' }} />
                      {rx.refills_remaining !== undefined && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          Refills: {rx.refills_remaining}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {prescriptions.length === 0 && <Alert severity="info">No e-prescriptions.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {chats.map((chat: any) => (
              <Card key={chat.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{chat.provider_name || 'Care Team Chat'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{chat.last_message?.substring(0, 80) || 'No messages yet'}</Typography>
                    </Box>
                    <Stack alignItems="flex-end">
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        {chat.updated_at ? new Date(chat.updated_at).toLocaleString() : '-'}
                      </Typography>
                      {chat.unread_count > 0 && (
                        <Avatar sx={{ width: 24, height: 24, bgcolor: '#f44336', fontSize: 12 }}>{chat.unread_count}</Avatar>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {chats.length === 0 && <Alert severity="info">No active chats.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default TelehealthPatientPage;

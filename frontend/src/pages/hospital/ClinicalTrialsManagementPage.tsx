import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  Science as TrialIcon, LocationOn as SiteIcon, People as PartIcon,
  Event as VisitIcon, Warning as AEIcon, Assignment as FormIcon,
  ErrorOutline as DevIcon, CheckCircle as EnrollIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { clinicalTrialsV2API } from '../../services/api';

const ClinicalTrialsManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [adverseEvents, setAdverseEvents] = useState<any[]>([]);
  const [deviations, setDeviations] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pr, st, pt, vs, ae, dv] = await Promise.all([
        clinicalTrialsV2API.getProtocols().catch(() => ({ data: [] })),
        clinicalTrialsV2API.getSites('').catch(() => ({ data: [] })),
        clinicalTrialsV2API.getParticipants().catch(() => ({ data: [] })),
        clinicalTrialsV2API.getVisits('').catch(() => ({ data: [] })),
        clinicalTrialsV2API.getTrialAdverseEvents().catch(() => ({ data: [] })),
        clinicalTrialsV2API.getProtocolDeviations().catch(() => ({ data: [] })),
      ]);
      setProtocols(pr.data || []);
      setSites(st.data || []);
      setParticipants(pt.data || []);
      setVisits(vs.data || []);
      setAdverseEvents(ae.data || []);
      setDeviations(dv.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Clinical Trials Management" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Protocols', value: protocols.length, icon: <TrialIcon />, color: '#2196f3' },
            { label: 'Active Sites', value: sites.filter(s => s.status === 'active').length, icon: <SiteIcon />, color: '#4caf50' },
            { label: 'Participants', value: participants.length, icon: <PartIcon />, color: '#ff9800' },
            { label: 'Adverse Events', value: adverseEvents.length, icon: <AEIcon />, color: '#f44336' },
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

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Protocols" icon={<TrialIcon />} iconPosition="start" />
          <Tab label="Sites" icon={<SiteIcon />} iconPosition="start" />
          <Tab label="Participants" icon={<PartIcon />} iconPosition="start" />
          <Tab label="Visits" icon={<VisitIcon />} iconPosition="start" />
          <Tab label="Adverse Events" icon={<AEIcon />} iconPosition="start" />
          <Tab label="Deviations" icon={<DevIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {protocols.map((p: any) => (
              <Grid item xs={12} md={6} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{p.protocol_number}</Typography>
                      <Chip label={p.phase} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>{p.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
                      PI: {p.principal_investigator} • Sponsor: {p.sponsor}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={p.status} size="small" sx={{ bgcolor: p.status === 'recruiting' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)', color: p.status === 'recruiting' ? '#81c784' : '#ffb74d' }} />
                      <Chip label={`${p.enrolled || 0}/${p.target_enrollment || 0} enrolled`} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)' }} />
                    </Stack>
                    <LinearProgress variant="determinate" value={p.target_enrollment ? ((p.enrolled || 0) / p.target_enrollment) * 100 : 0}
                      sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {protocols.length === 0 && <Grid item xs={12}><Alert severity="info">No protocols.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2}>
            {sites.map((s: any) => (
              <Grid item xs={12} md={6} lg={4} key={s.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{s.site_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      <SiteIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> {s.location}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>PI: {s.site_pi}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={s.status} size="small" sx={{ bgcolor: s.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: s.status === 'active' ? '#81c784' : '#9e9e9e' }} />
                      <Chip label={`${s.enrolled || 0} enrolled`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {sites.length === 0 && <Grid item xs={12}><Alert severity="info">No trial sites.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 2 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Subject ID</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Protocol</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Site</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Enrolled</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Arm</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>{p.subject_id}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{p.protocol_number}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{p.site_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(p.enrollment_date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{p.treatment_arm}</TableCell>
                    <TableCell><Chip label={p.status} size="small"
                      sx={{ bgcolor: p.status === 'active' ? 'rgba(76,175,80,0.3)' : p.status === 'withdrawn' ? 'rgba(244,67,54,0.3)' : 'rgba(158,158,158,0.3)',
                            color: p.status === 'active' ? '#81c784' : p.status === 'withdrawn' ? '#ef5350' : '#9e9e9e' }} /></TableCell>
                  </TableRow>
                ))}
                {participants.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No participants</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {visits.map((v: any) => (
              <Card key={v.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{v.visit_name} - {v.subject_id}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Window: {v.window_start ? new Date(v.window_start).toLocaleDateString() : '-'} to {v.window_end ? new Date(v.window_end).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Chip label={v.status} size="small"
                      sx={{ bgcolor: v.status === 'completed' ? 'rgba(76,175,80,0.3)' : v.status === 'scheduled' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)',
                            color: v.status === 'completed' ? '#81c784' : v.status === 'scheduled' ? '#90caf9' : '#ffb74d' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {visits.length === 0 && <Alert severity="info">No trial visits.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {adverseEvents.map((ae: any) => (
              <Card key={ae.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${ae.is_serious ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{ae.event_term}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Subject: {ae.subject_id} • Grade: {ae.grade} • {new Date(ae.onset_date).toLocaleDateString()}
                      </Typography>
                      {ae.relationship && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Relationship: {ae.relationship}</Typography>}
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      {ae.is_serious && <Chip label="SAE" size="small" sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350' }} />}
                      <Chip label={`Grade ${ae.grade}`} size="small"
                        sx={{ bgcolor: ae.grade >= 3 ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                              color: ae.grade >= 3 ? '#ef5350' : '#ffb74d' }} />
                      <Chip label={ae.outcome || ae.status} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {adverseEvents.length === 0 && <Alert severity="success">No adverse events reported.</Alert>}
          </Stack>
        )}

        {activeTab === 5 && (
          <Stack spacing={2}>
            {deviations.map((d: any) => (
              <Card key={d.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>Protocol Deviation #{d.id}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{d.deviation_type}: {d.description}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Subject: {d.subject_id} • {new Date(d.deviation_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={d.severity} size="small"
                        sx={{ bgcolor: d.severity === 'major' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                              color: d.severity === 'major' ? '#ef5350' : '#ffb74d' }} />
                      <Chip label={d.status} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                  </Stack>
                  {d.corrective_action && <Typography variant="body2" sx={{ color: '#81c784', mt: 1 }}>CAPA: {d.corrective_action}</Typography>}
                </CardContent>
              </Card>
            ))}
            {deviations.length === 0 && <Alert severity="success">No protocol deviations.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default ClinicalTrialsManagementPage;

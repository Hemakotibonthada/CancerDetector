import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress,
} from '@mui/material';
import {
  Public as PopIcon, Assessment as RegIcon, MonitorHeart as ChronicIcon,
  ErrorOutline as GapIcon, Balance as EquityIcon, Campaign as CampIcon,
  Warning as AlertIcon, Groups as CommIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { populationHealthAPI } from '../../services/api';

const PopulationHealthPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [registries, setRegistries] = useState<any[]>([]);
  const [chronicPrograms, setChronicPrograms] = useState<any[]>([]);
  const [careGaps, setCareGaps] = useState<any[]>([]);
  const [equityMetrics, setEquityMetrics] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reg, cp, cg, eq, camp, al] = await Promise.all([
        populationHealthAPI.getRegistries().catch(() => ({ data: [] })),
        populationHealthAPI.getChronicPrograms().catch(() => ({ data: [] })),
        populationHealthAPI.getCareGaps().catch(() => ({ data: [] })),
        populationHealthAPI.getEquityMetrics().catch(() => ({ data: [] })),
        populationHealthAPI.getScreeningCampaigns().catch(() => ({ data: [] })),
        populationHealthAPI.getPublicHealthAlerts().catch(() => ({ data: [] })),
      ]);
      setRegistries(reg.data || []);
      setChronicPrograms(cp.data || []);
      setCareGaps(cg.data || []);
      setEquityMetrics(eq.data || []);
      setCampaigns(camp.data || []);
      setAlerts(al.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openGaps = careGaps.filter(g => g.status === 'open');

  return (
    <AppLayout title="Population Health" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Registries', value: registries.length, icon: <RegIcon />, color: '#2196f3' },
            { label: 'Chronic Programs', value: chronicPrograms.length, icon: <ChronicIcon />, color: '#4caf50' },
            { label: 'Care Gaps', value: openGaps.length, icon: <GapIcon />, color: '#f44336' },
            { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length, icon: <CampIcon />, color: '#ff9800' },
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

        {alerts.filter(a => a.severity === 'critical').length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {alerts.filter(a => a.severity === 'critical').length} critical public health alert(s) require attention!
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Registries" icon={<RegIcon />} iconPosition="start" />
          <Tab label="Chronic Care" icon={<ChronicIcon />} iconPosition="start" />
          <Tab label="Care Gaps" icon={<GapIcon />} iconPosition="start" />
          <Tab label="Health Equity" icon={<EquityIcon />} iconPosition="start" />
          <Tab label="Campaigns" icon={<CampIcon />} iconPosition="start" />
          <Tab label="Public Health Alerts" icon={<AlertIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {registries.map((r: any) => (
              <Grid item xs={12} md={6} key={r.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{r.registry_name}</Typography>
                      <Chip label={r.status} size="small" sx={{ bgcolor: r.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: r.status === 'active' ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{r.description}</Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, flex: 1 }}>
                        <Typography variant="h5" sx={{ color: '#2196f3' }}>{r.patient_count || 0}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Patients</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, flex: 1 }}>
                        <Typography variant="h5" sx={{ color: '#4caf50' }}>{r.compliance_rate || 0}%</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Compliance</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {registries.length === 0 && <Grid item xs={12}><Alert severity="info">No disease registries.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2}>
            {chronicPrograms.map((p: any) => (
              <Grid item xs={12} md={6} lg={4} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{p.program_name}</Typography>
                    <Chip label={p.disease_type} size="small" sx={{ mt: 1, bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                      Enrolled: {p.enrolled_count || 0} • Outcome: {p.outcome_measure || '-'}
                    </Typography>
                    <LinearProgress variant="determinate" value={p.engagement_rate || 0}
                      sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{p.engagement_rate || 0}% engagement</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {chronicPrograms.length === 0 && <Grid item xs={12}><Alert severity="info">No chronic care programs.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {careGaps.map((g: any) => (
              <Card key={g.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${g.priority === 'high' ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{g.gap_type}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {g.patient_name} • Due: {g.due_date ? new Date(g.due_date).toLocaleDateString() : '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{g.description}</Typography>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={g.priority} size="small"
                        sx={{ bgcolor: g.priority === 'high' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                              color: g.priority === 'high' ? '#ef5350' : '#ffb74d' }} />
                      <Chip label={g.status} size="small"
                        sx={{ bgcolor: g.status === 'closed' ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)',
                              color: g.status === 'closed' ? '#81c784' : '#90caf9' }} />
                      {g.status === 'open' && (
                        <Button size="small" variant="outlined" sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                          onClick={async () => { await populationHealthAPI.closeCareGap(g.id); loadData(); }}>Close Gap</Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {careGaps.length === 0 && <Alert severity="success">No open care gaps!</Alert>}
          </Stack>
        )}

        {activeTab === 3 && (
          <Grid container spacing={2}>
            {equityMetrics.map((m: any) => (
              <Grid item xs={12} md={6} key={m.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{m.metric_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{m.category} • {m.demographic_group}</Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h5" sx={{ color: '#2196f3' }}>{m.current_value}{m.unit || '%'}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Current</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h5" sx={{ color: '#4caf50' }}>{m.target_value}{m.unit || '%'}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Target</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', flex: 1 }}>
                        <Typography variant="h5" sx={{ color: m.disparity_index > 1.2 ? '#f44336' : '#4caf50' }}>{m.disparity_index}</Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Disparity</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {equityMetrics.length === 0 && <Grid item xs={12}><Alert severity="info">No health equity metrics.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 4 && (
          <Grid container spacing={2}>
            {campaigns.map((c: any) => (
              <Grid item xs={12} md={6} key={c.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{c.campaign_name}</Typography>
                      <Chip label={c.status} size="small" sx={{ bgcolor: c.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: c.status === 'active' ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{c.description}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Target: {c.target_population} • Screened: {c.screened_count || 0}/{c.target_count || 0}
                    </Typography>
                    <LinearProgress variant="determinate" value={c.target_count ? ((c.screened_count || 0) / c.target_count) * 100 : 0}
                      sx={{ mt: 1, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#ff9800' } }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {campaigns.length === 0 && <Grid item xs={12}><Alert severity="info">No screening campaigns.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 5 && (
          <Stack spacing={2}>
            {alerts.map((a: any) => (
              <Alert key={a.id} severity={a.severity === 'critical' ? 'error' : a.severity === 'high' ? 'warning' : 'info'}>
                <Typography variant="h6">{a.alert_title}</Typography>
                <Typography variant="body2">{a.description}</Typography>
                <Typography variant="caption">
                  Issued: {new Date(a.issued_date).toLocaleDateString()} • Region: {a.affected_region}
                </Typography>
              </Alert>
            ))}
            {alerts.length === 0 && <Alert severity="success">No public health alerts.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default PopulationHealthPage;

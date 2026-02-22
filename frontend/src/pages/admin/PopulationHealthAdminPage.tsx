import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress,
} from '@mui/material';
import {
  HealthAndSafety as PopIcon, Groups as RegistryIcon,
  Campaign as CampaignIcon, Equalizer as EquityIcon,
  Assessment as MetricsIcon, TrendingUp as TrendIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { populationHealthAPI } from '../../services/api';

const PopulationHealthAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [registries, setRegistries] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [equityMetrics, setEquityMetrics] = useState<any[]>([]);
  const [healthOutcomes, setHealthOutcomes] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rg, cm, em, ho] = await Promise.all([
        populationHealthAPI.getRegistries().catch(() => ({ data: [] })),
        populationHealthAPI.getScreeningCampaigns().catch(() => ({ data: [] })),
        populationHealthAPI.getEquityMetrics().catch(() => ({ data: [] })),
        populationHealthAPI.getDashboardStats().catch(() => ({ data: [] })),
      ]);
      setRegistries(rg.data || []);
      setCampaigns(cm.data || []);
      setEquityMetrics(em.data || []);
      setHealthOutcomes(ho.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Population Health Administration" navItems={adminNavItems} portalType="admin">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Active Registries', value: registries.filter(r => r.status === 'active').length, icon: <RegistryIcon />, color: '#2196f3' },
            { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length, icon: <CampaignIcon />, color: '#4caf50' },
            { label: 'Equity Metrics', value: equityMetrics.length, icon: <EquityIcon />, color: '#ff9800' },
            { label: 'Health Outcomes', value: healthOutcomes.length, icon: <TrendIcon />, color: '#9c27b0' },
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
          <Tab label="Registries" icon={<RegistryIcon />} iconPosition="start" />
          <Tab label="Screening Campaigns" icon={<CampaignIcon />} iconPosition="start" />
          <Tab label="Health Equity" icon={<EquityIcon />} iconPosition="start" />
          <Tab label="Outcomes Dashboard" icon={<MetricsIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {registries.map((r: any) => (
              <Grid item xs={12} md={6} key={r.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{r.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{r.description}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={`${r.patient_count || 0} patients`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={r.cancer_type || 'All'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                      <Chip label={r.status} size="small" sx={{ bgcolor: r.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)', color: r.status === 'active' ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                      Created: {new Date(r.created_at).toLocaleDateString()} • Last Updated: {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '-'}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>View Patients</Button>
                      <Button variant="outlined" size="small" sx={{ color: '#81c784', borderColor: 'rgba(129,199,132,0.3)' }}>Export</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {registries.length === 0 && <Grid item xs={12}><Alert severity="info">No registries.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {campaigns.map((c: any) => (
              <Card key={c.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{c.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {c.screening_type} • Target: {c.target_population || 'General'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Period: {new Date(c.start_date).toLocaleDateString()} - {new Date(c.end_date).toLocaleDateString()}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          Screened: {c.screened || 0}/{c.target_count || 0} ({c.target_count ? Math.round((c.screened / c.target_count) * 100) : 0}%)
                        </Typography>
                        <LinearProgress variant="determinate" value={c.target_count ? (c.screened / c.target_count) * 100 : 0}
                          sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
                      </Box>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#81c784' }}>Positive: {c.positive_count || 0}</Typography>
                        <Typography variant="body2" sx={{ color: '#90caf9' }}>Follow-up: {c.followup_count || 0}</Typography>
                      </Stack>
                    </Box>
                    <Chip label={c.status} size="small"
                      sx={{ bgcolor: c.status === 'active' ? 'rgba(76,175,80,0.3)' : c.status === 'completed' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)',
                            color: c.status === 'active' ? '#81c784' : c.status === 'completed' ? '#90caf9' : '#ffb74d' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {campaigns.length === 0 && <Alert severity="info">No screening campaigns.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {equityMetrics.map((m: any) => (
              <Grid item xs={12} sm={6} md={4} key={m.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{m.metric_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{m.demographic_group}</Typography>
                    <Box sx={{ mt: 1 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Disparity Index</Typography>
                        <Typography variant="h5" sx={{ color: m.disparity_index > 1.5 ? '#f44336' : m.disparity_index > 1.2 ? '#ff9800' : '#4caf50', fontWeight: 700 }}>
                          {m.disparity_index?.toFixed(2) || '-'}
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.min((m.disparity_index || 1) * 50, 100)}
                        sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': { bgcolor: m.disparity_index > 1.5 ? '#f44336' : m.disparity_index > 1.2 ? '#ff9800' : '#4caf50' } }} />
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={`Target: ${m.target_value || '-'}`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={`Current: ${m.current_value || '-'}`} size="small"
                        sx={{ bgcolor: m.current_value >= m.target_value ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: m.current_value >= m.target_value ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {equityMetrics.length === 0 && <Grid item xs={12}><Alert severity="info">No equity metrics.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Grid container spacing={2}>
            {healthOutcomes.map((o: any) => (
              <Grid item xs={12} md={6} key={o.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{o.outcome_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Cancer Type: {o.cancer_type || 'All'} • Population: {o.population_size || '-'}
                    </Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {o.survival_rate !== undefined && (
                        <Grid item xs={4}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>5-Year Survival</Typography>
                          <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>{o.survival_rate}%</Typography>
                        </Grid>
                      )}
                      {o.readmission_rate !== undefined && (
                        <Grid item xs={4}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Readmission</Typography>
                          <Typography variant="h5" sx={{ color: o.readmission_rate > 15 ? '#f44336' : '#4caf50', fontWeight: 700 }}>{o.readmission_rate}%</Typography>
                        </Grid>
                      )}
                      {o.mortality_rate !== undefined && (
                        <Grid item xs={4}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Mortality</Typography>
                          <Typography variant="h5" sx={{ color: '#f44336', fontWeight: 700 }}>{o.mortality_rate}%</Typography>
                        </Grid>
                      )}
                    </Grid>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={o.trend === 'improving' ? '↑ Improving' : o.trend === 'declining' ? '↓ Declining' : '→ Stable'} size="small"
                        sx={{ bgcolor: o.trend === 'improving' ? 'rgba(76,175,80,0.3)' : o.trend === 'declining' ? 'rgba(244,67,54,0.3)' : 'rgba(33,150,243,0.3)',
                              color: o.trend === 'improving' ? '#81c784' : o.trend === 'declining' ? '#ef5350' : '#90caf9' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {healthOutcomes.length === 0 && <Grid item xs={12}><Alert severity="info">No health outcomes data.</Alert></Grid>}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
};

export default PopulationHealthAdminPage;

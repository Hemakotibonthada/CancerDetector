import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress,
} from '@mui/material';
import {
  VerifiedUser as QualityIcon, Security as SafetyIcon,
  Assessment as BenchIcon, TrendingUp as TrendIcon,
  BarChart as ChartIcon, Flag as FlagIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { qualitySafetyAPI } from '../../services/api';

const QualityDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [measures, setMeasures] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [safetyMetrics, setSafetyMetrics] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ms, ic, bm, sm] = await Promise.all([
        qualitySafetyAPI.getQualityMeasures().catch(() => ({ data: [] })),
        qualitySafetyAPI.getIncidentReports().catch(() => ({ data: [] })),
        qualitySafetyAPI.getRCAs().catch(() => ({ data: [] })),
        qualitySafetyAPI.getSafetyChecklists().catch(() => ({ data: [] })),
      ]);
      setMeasures(ms.data || []);
      setIncidents(ic.data || []);
      setBenchmarks(bm.data || []);
      setSafetyMetrics(sm.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const meetingTarget = measures.filter(m => m.current_value >= m.target_value).length;

  return (
    <AppLayout title="Quality Dashboard" navItems={adminNavItems} portalType="admin">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Quality Measures', value: measures.length, icon: <QualityIcon />, color: '#2196f3' },
            { label: 'Meeting Target', value: meetingTarget, icon: <TrendIcon />, color: '#4caf50' },
            { label: 'Open Incidents', value: incidents.filter(i => i.status === 'open').length, icon: <FlagIcon />, color: '#f44336' },
            { label: 'Safety Score', value: safetyMetrics.length > 0 ? `${Math.round(safetyMetrics.reduce((a: number, b: any) => a + (b.score || 0), 0) / safetyMetrics.length)}%` : 'N/A', icon: <SafetyIcon />, color: '#ff9800' },
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
          <Tab label="Quality Measures" icon={<QualityIcon />} iconPosition="start" />
          <Tab label="Incident Trends" icon={<FlagIcon />} iconPosition="start" />
          <Tab label="Benchmarks" icon={<BenchIcon />} iconPosition="start" />
          <Tab label="Safety Metrics" icon={<SafetyIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {measures.map((m: any) => {
              const meetsTarget = m.current_value >= m.target_value;
              const percentOfTarget = m.target_value ? (m.current_value / m.target_value) * 100 : 0;
              return (
                <Grid item xs={12} sm={6} md={4} key={m.id}>
                  <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    border: `1px solid ${meetsTarget ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}` }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ color: '#fff', fontSize: 14 }}>{m.measure_name}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{m.category}</Typography>
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="h3" sx={{ color: meetsTarget ? '#4caf50' : '#f44336', fontWeight: 700 }}>
                          {m.current_value?.toFixed(1)}
                          <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            /{m.target_value}
                          </Typography>
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{m.unit || '%'}</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={Math.min(percentOfTarget, 100)}
                        sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': { bgcolor: meetsTarget ? '#4caf50' : percentOfTarget > 80 ? '#ff9800' : '#f44336' } }} />
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Chip label={meetsTarget ? 'On Target' : 'Below Target'} size="small"
                          sx={{ bgcolor: meetsTarget ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)',
                                color: meetsTarget ? '#81c784' : '#ef5350' }} />
                        {m.trend && <Chip label={m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'} size="small"
                          sx={{ bgcolor: m.trend === 'up' ? 'rgba(76,175,80,0.3)' : m.trend === 'down' ? 'rgba(244,67,54,0.3)' : 'rgba(33,150,243,0.3)',
                                color: m.trend === 'up' ? '#81c784' : m.trend === 'down' ? '#ef5350' : '#90caf9' }} />}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
            {measures.length === 0 && <Grid item xs={12}><Alert severity="info">No quality measures.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {incidents.map((i: any) => (
              <Card key={i.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{i.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Type: {i.incident_type} • Location: {i.location} • {new Date(i.reported_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>{i.description}</Typography>
                      {i.root_cause && <Typography variant="body2" sx={{ color: '#ffb74d', mt: 0.5 }}>Root Cause: {i.root_cause}</Typography>}
                      {i.corrective_action && <Typography variant="body2" sx={{ color: '#81c784', mt: 0.5 }}>Corrective Action: {i.corrective_action}</Typography>}
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={i.severity || 'moderate'} size="small"
                        sx={{ bgcolor: i.severity === 'critical' ? 'rgba(244,67,54,0.3)' : i.severity === 'high' ? 'rgba(255,152,0,0.3)' : 'rgba(33,150,243,0.3)',
                              color: i.severity === 'critical' ? '#ef5350' : i.severity === 'high' ? '#ffb74d' : '#90caf9' }} />
                      <Chip label={i.status} size="small"
                        sx={{ bgcolor: i.status === 'resolved' ? 'rgba(76,175,80,0.3)' : i.status === 'investigating' ? 'rgba(255,152,0,0.3)' : 'rgba(244,67,54,0.3)',
                              color: i.status === 'resolved' ? '#81c784' : i.status === 'investigating' ? '#ffb74d' : '#ef5350' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {incidents.length === 0 && <Alert severity="success">No incidents reported.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {benchmarks.map((b: any) => (
              <Grid item xs={12} md={6} key={b.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{b.metric_name}</Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Our Score</Typography>
                        <Typography variant="h5" sx={{ color: '#90caf9', fontWeight: 700 }}>{b.our_value?.toFixed(1)}</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>National Avg</Typography>
                        <Typography variant="h5" sx={{ color: '#ffb74d', fontWeight: 700 }}>{b.national_avg?.toFixed(1)}</Typography>
                      </Grid>
                      <Grid item xs={4} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Top 10%</Typography>
                        <Typography variant="h5" sx={{ color: '#81c784', fontWeight: 700 }}>{b.top_decile?.toFixed(1)}</Typography>
                      </Grid>
                    </Grid>
                    <Chip label={b.our_value >= b.top_decile ? 'Top Performer' : b.our_value >= b.national_avg ? 'Above Average' : 'Below Average'}
                      size="small" sx={{ mt: 1,
                        bgcolor: b.our_value >= b.top_decile ? 'rgba(76,175,80,0.3)' : b.our_value >= b.national_avg ? 'rgba(33,150,243,0.3)' : 'rgba(244,67,54,0.3)',
                        color: b.our_value >= b.top_decile ? '#81c784' : b.our_value >= b.national_avg ? '#90caf9' : '#ef5350' }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {benchmarks.length === 0 && <Grid item xs={12}><Alert severity="info">No benchmarks configured.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Grid container spacing={2}>
            {safetyMetrics.map((s: any) => (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', fontSize: 14 }}>{s.metric_name}</Typography>
                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ color: s.score >= 90 ? '#4caf50' : s.score >= 70 ? '#ff9800' : '#f44336', fontWeight: 700 }}>
                        {s.score}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={s.score}
                      sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.1)',
                            '& .MuiLinearProgress-bar': { bgcolor: s.score >= 90 ? '#4caf50' : s.score >= 70 ? '#ff9800' : '#f44336' } }} />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={s.category || 'General'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={s.period || 'Monthly'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {safetyMetrics.length === 0 && <Grid item xs={12}><Alert severity="info">No safety metrics.</Alert></Grid>}
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
};

export default QualityDashboardPage;

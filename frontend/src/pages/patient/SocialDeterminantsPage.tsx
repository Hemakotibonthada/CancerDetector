import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress,
} from '@mui/material';
import {
  Home as HomeIcon, DirectionsBus as TransIcon,
  Restaurant as FoodInsIcon, Assessment as AssessIcon,
  VolunteerActivism as ProgIcon, LocationOn as LocIcon,
  Warning as RiskIcon, Handshake as HelpIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { socialDeterminantsAPI } from '../../services/api';

const SocialDeterminantsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [transport, setTransport] = useState<any[]>([]);
  const [housing, setHousing] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asmt, rsk, prg, ref, trn, hou] = await Promise.all([
        socialDeterminantsAPI.getAssessments().catch(() => ({ data: [] })),
        socialDeterminantsAPI.getSocialRisks().catch(() => ({ data: [] })),
        socialDeterminantsAPI.getCommunityPrograms().catch(() => ({ data: [] })),
        socialDeterminantsAPI.getReferrals().catch(() => ({ data: [] })),
        socialDeterminantsAPI.getTransportationNeeds().catch(() => ({ data: [] })),
        socialDeterminantsAPI.getHousingAssessments().catch(() => ({ data: [] })),
      ]);
      setAssessments(asmt.data || []);
      setRisks(rsk.data || []);
      setPrograms(prg.data || []);
      setReferrals(ref.data || []);
      setTransport(trn.data || []);
      setHousing(hou.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const activeRisks = risks.filter(r => r.status === 'active' || r.is_active);

  return (
    <AppLayout title="Social Determinants of Health" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Assessments', value: assessments.length, icon: <AssessIcon />, color: '#2196f3' },
            { label: 'Active Risks', value: activeRisks.length, icon: <RiskIcon />, color: '#f44336' },
            { label: 'Programs', value: programs.length, icon: <ProgIcon />, color: '#4caf50' },
            { label: 'Referrals', value: referrals.length, icon: <HelpIcon />, color: '#ff9800' },
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

        {activeRisks.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You have {activeRisks.length} active social risk(s). Resources are available to help — explore community programs below.
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Assessments" icon={<AssessIcon />} iconPosition="start" />
          <Tab label="Social Risks" icon={<RiskIcon />} iconPosition="start" />
          <Tab label="Community Programs" icon={<ProgIcon />} iconPosition="start" />
          <Tab label="Transportation" icon={<TransIcon />} iconPosition="start" />
          <Tab label="Housing" icon={<HomeIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {assessments.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>SDOH Assessment</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(a.assessment_date).toLocaleDateString()} • Score: {a.overall_score || '-'}
                      </Typography>
                    </Box>
                    <Chip label={a.risk_level || 'Low'} size="small"
                      sx={{ bgcolor: a.risk_level === 'high' ? 'rgba(244,67,54,0.3)' : a.risk_level === 'moderate' ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                            color: a.risk_level === 'high' ? '#ef5350' : a.risk_level === 'moderate' ? '#ffb74d' : '#81c784' }} />
                  </Stack>
                  {a.domains && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                      {Object.entries(a.domains).map(([k, v]: any) => (
                        <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined"
                          sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }} />
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ))}
            {assessments.length === 0 && <Alert severity="info">No SDOH assessments completed.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {risks.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: `1px solid ${r.severity === 'high' ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{r.risk_type || r.category}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{r.description}</Typography>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={r.severity || 'moderate'} size="small"
                        sx={{ bgcolor: r.severity === 'high' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                              color: r.severity === 'high' ? '#ef5350' : '#ffb74d' }} />
                      <Chip label={r.status || 'active'} size="small"
                        sx={{ bgcolor: r.status === 'resolved' ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)',
                              color: r.status === 'resolved' ? '#81c784' : '#90caf9' }} />
                    </Stack>
                  </Stack>
                  {r.intervention && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>Intervention: {r.intervention}</Typography>}
                </CardContent>
              </Card>
            ))}
            {risks.length === 0 && <Alert severity="success">No social risks identified.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {programs.map((p: any) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                  <CardContent>
                    <ProgIcon sx={{ color: '#4caf50', fontSize: 32 }} />
                    <Typography variant="h6" sx={{ color: '#fff', mt: 1 }}>{p.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>{p.description?.substring(0, 100)}</Typography>
                    <Chip label={p.category} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.2)', color: '#90caf9', mb: 1 }} />
                    {p.location && (
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        <LocIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> {p.location}
                      </Typography>
                    )}
                    {p.contact_info && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Contact: {p.contact_info}</Typography>}
                    <Button size="small" variant="outlined" sx={{ mt: 1, color: '#4caf50', borderColor: '#4caf50' }}
                      onClick={async () => { await socialDeterminantsAPI.createReferral({ program_id: p.id }); loadData(); }}>
                      Request Referral
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {programs.length === 0 && <Alert severity="info">No community programs available.</Alert>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {transport.map((t: any) => (
              <Card key={t.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <TransIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#ff9800' }} />
                        {t.transport_type || 'Medical Transport'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {t.pickup_location} → {t.dropoff_location}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(t.scheduled_date).toLocaleDateString()} at {t.scheduled_time}
                      </Typography>
                    </Box>
                    <Chip label={t.status} size="small"
                      sx={{ bgcolor: t.status === 'completed' ? 'rgba(76,175,80,0.3)' : t.status === 'scheduled' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)',
                            color: t.status === 'completed' ? '#81c784' : t.status === 'scheduled' ? '#90caf9' : '#ffb74d' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {transport.length === 0 && <Alert severity="info">No transportation needs recorded.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {housing.map((h: any) => (
              <Card key={h.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <HomeIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#2196f3' }} />
                        Housing Assessment
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Type: {h.housing_type} • Stability: {h.stability_status}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(h.assessment_date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip label={h.risk_level || 'stable'} size="small"
                      sx={{ bgcolor: h.risk_level === 'high' ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)',
                            color: h.risk_level === 'high' ? '#ef5350' : '#81c784' }} />
                  </Stack>
                  {h.concerns && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>Concerns: {h.concerns}</Typography>}
                </CardContent>
              </Card>
            ))}
            {housing.length === 0 && <Alert severity="info">No housing assessments.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default SocialDeterminantsPage;

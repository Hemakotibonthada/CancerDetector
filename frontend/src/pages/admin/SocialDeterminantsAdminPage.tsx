import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  House as HousingIcon, DirectionsBus as TransIcon,
  VolunteerActivism as ProgramIcon, Assessment as AssessIcon,
  Flag as RiskIcon, Handshake as ReferralIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { socialDeterminantsAPI } from '../../services/api';

const SocialDeterminantsAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [programs, setPrograms] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [assessmentSummary, setAssessmentSummary] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pg, rf, as_, iv] = await Promise.all([
        socialDeterminantsAPI.getCommunityPrograms().catch(() => ({ data: [] })),
        socialDeterminantsAPI.getReferrals ? socialDeterminantsAPI.getReferrals().catch(() => ({ data: [] })) : { data: [] },
        socialDeterminantsAPI.getAssessments().catch(() => ({ data: [] })),
        socialDeterminantsAPI.getSocialRisks().catch(() => ({ data: [] })),
      ]);
      setPrograms(pg.data || []);
      setReferrals(rf.data || []);
      setAssessmentSummary(as_.data || []);
      setInterventions(iv.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const domainColors: Record<string, string> = {
    food: '#4caf50', housing: '#2196f3', transportation: '#ff9800',
    employment: '#9c27b0', education: '#00bcd4', safety: '#f44336',
    financial: '#ffd54f', social: '#e91e63',
  };

  return (
    <AppLayout title="Social Determinants Administration" navItems={adminNavItems} portalType="admin">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Community Programs', value: programs.filter(p => p.status === 'active').length, icon: <ProgramIcon />, color: '#4caf50' },
            { label: 'Active Referrals', value: referrals.filter(r => r.status === 'active' || r.status === 'pending').length, icon: <ReferralIcon />, color: '#2196f3' },
            { label: 'High Risk Patients', value: assessmentSummary.filter(a => a.risk_level === 'high').length, icon: <RiskIcon />, color: '#f44336' },
            { label: 'Interventions', value: interventions.length, icon: <AssessIcon />, color: '#ff9800' },
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
          <Tab label="Community Programs" icon={<ProgramIcon />} iconPosition="start" />
          <Tab label="Referral Tracking" icon={<ReferralIcon />} iconPosition="start" />
          <Tab label="SDOH Assessments" icon={<AssessIcon />} iconPosition="start" />
          <Tab label="Interventions" icon={<RiskIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {programs.map((p: any) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{p.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>{p.description}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={p.domain || 'General'} size="small"
                        sx={{ bgcolor: `${domainColors[p.domain?.toLowerCase()] || '#2196f3'}33`,
                              color: domainColors[p.domain?.toLowerCase()] || '#90caf9' }} />
                      <Chip label={p.status || 'active'} size="small"
                        sx={{ bgcolor: p.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: p.status === 'active' ? '#81c784' : '#ffb74d' }} />
                      <Chip label={`${p.capacity || '-'} capacity`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                      Provider: {p.provider_name || '-'} • Location: {p.location || '-'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      Referrals: {p.referral_count || 0} • Served: {p.served_count || 0}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>Edit</Button>
                      <Button variant="contained" size="small" sx={{ bgcolor: '#1976d2' }}>Refer Patient</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {programs.length === 0 && <Grid item xs={12}><Alert severity="info">No community programs.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Patient</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Program</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Domain</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Referred Date</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Outcome</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {referrals.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell sx={{ color: '#fff' }}>{r.patient_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{r.program_name}</TableCell>
                    <TableCell>
                      <Chip label={r.domain || 'General'} size="small"
                        sx={{ bgcolor: `${domainColors[r.domain?.toLowerCase()] || '#2196f3'}33`,
                              color: domainColors[r.domain?.toLowerCase()] || '#90caf9' }} />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(r.referred_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small"
                        sx={{ bgcolor: r.status === 'completed' ? 'rgba(76,175,80,0.3)' : r.status === 'active' ? 'rgba(33,150,243,0.3)' : r.status === 'pending' ? 'rgba(255,152,0,0.3)' : 'rgba(244,67,54,0.3)',
                              color: r.status === 'completed' ? '#81c784' : r.status === 'active' ? '#90caf9' : r.status === 'pending' ? '#ffb74d' : '#ef5350' }} />
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{r.outcome || '-'}</TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>Follow Up</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {referrals.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No referrals</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {assessmentSummary.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: `1px solid ${a.risk_level === 'high' ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{a.patient_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Assessment Date: {new Date(a.assessment_date).toLocaleDateString()} • Tool: {a.screening_tool || 'AHC-HRSN'}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {(a.identified_needs || []).map((need: string, i: number) => (
                          <Chip key={i} label={need} size="small"
                            sx={{ bgcolor: `${domainColors[need?.toLowerCase()] || '#2196f3'}33`,
                                  color: domainColors[need?.toLowerCase()] || '#90caf9', fontSize: 10 }} />
                        ))}
                      </Stack>
                      {a.total_score !== undefined && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>Total Score: {a.total_score}</Typography>}
                    </Box>
                    <Chip label={a.risk_level || 'low'} size="small"
                      sx={{ bgcolor: a.risk_level === 'high' ? 'rgba(244,67,54,0.3)' : a.risk_level === 'medium' ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                            color: a.risk_level === 'high' ? '#ef5350' : a.risk_level === 'medium' ? '#ffb74d' : '#81c784', fontWeight: 700 }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {assessmentSummary.length === 0 && <Alert severity="info">No SDOH assessments.</Alert>}
          </Stack>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {interventions.map((iv: any) => (
              <Card key={iv.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{iv.intervention_type} - {iv.patient_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Domain: {iv.domain} • Started: {new Date(iv.start_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{iv.description}</Typography>
                      {iv.outcome && <Typography variant="body2" sx={{ color: '#81c784', mt: 0.5 }}>Outcome: {iv.outcome}</Typography>}
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={iv.status || 'active'} size="small"
                        sx={{ bgcolor: iv.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)',
                              color: iv.status === 'completed' ? '#81c784' : '#90caf9' }} />
                      <Chip label={iv.effectiveness || '-'} size="small"
                        sx={{ bgcolor: iv.effectiveness === 'effective' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: iv.effectiveness === 'effective' ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {interventions.length === 0 && <Alert severity="info">No interventions recorded.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default SocialDeterminantsAdminPage;

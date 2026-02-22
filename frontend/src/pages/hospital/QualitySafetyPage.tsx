import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  Security as SafeIcon, Warning as IncIcon, BugReport as InfIcon,
  Checklist as CheckIcon, Analytics as QualIcon, Report as ReportIcon,
  HealthAndSafety as FallIcon, Healing as PressIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { qualitySafetyAPI } from '../../services/api';

const QualitySafetyPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [adverseEvents, setAdverseEvents] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [qualityMeasures, setQualityMeasures] = useState<any[]>([]);
  const [infections, setInfections] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [fallRisks, setFallRisks] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ae, inc, qm, inf, chk, fall] = await Promise.all([
        qualitySafetyAPI.getAdverseEvents().catch(() => ({ data: [] })),
        qualitySafetyAPI.getIncidentReports().catch(() => ({ data: [] })),
        qualitySafetyAPI.getQualityMeasures().catch(() => ({ data: [] })),
        qualitySafetyAPI.getInfectionControl().catch(() => ({ data: [] })),
        qualitySafetyAPI.getSafetyChecklists().catch(() => ({ data: [] })),
        qualitySafetyAPI.getFallRiskAssessments().catch(() => ({ data: [] })),
      ]);
      setAdverseEvents(ae.data || []);
      setIncidents(inc.data || []);
      setQualityMeasures(qm.data || []);
      setInfections(inf.data || []);
      setChecklists(chk.data || []);
      setFallRisks(fall.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const openIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed');

  return (
    <AppLayout title="Quality & Safety" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Adverse Events', value: adverseEvents.length, icon: <ReportIcon />, color: '#f44336' },
            { label: 'Open Incidents', value: openIncidents.length, icon: <IncIcon />, color: '#ff9800' },
            { label: 'Quality Measures', value: qualityMeasures.length, icon: <QualIcon />, color: '#4caf50' },
            { label: 'Infection Cases', value: infections.filter(i => i.status === 'active').length, icon: <InfIcon />, color: '#9c27b0' },
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
          <Tab label="Adverse Events" icon={<ReportIcon />} iconPosition="start" />
          <Tab label="Incidents" icon={<IncIcon />} iconPosition="start" />
          <Tab label="Quality Measures" icon={<QualIcon />} iconPosition="start" />
          <Tab label="Infection Control" icon={<InfIcon />} iconPosition="start" />
          <Tab label="Safety Checklists" icon={<CheckIcon />} iconPosition="start" />
          <Tab label="Fall Risk" icon={<FallIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {adverseEvents.map((ae: any) => (
              <Card key={ae.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${ae.severity === 'severe' ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{ae.event_type || 'Adverse Event'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{ae.description}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Patient: {ae.patient_name} • {new Date(ae.event_date).toLocaleDateString()} • Reported by: {ae.reporter_name}
                      </Typography>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={ae.severity} size="small"
                        sx={{ bgcolor: ae.severity === 'severe' ? 'rgba(244,67,54,0.3)' : ae.severity === 'moderate' ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                              color: ae.severity === 'severe' ? '#ef5350' : ae.severity === 'moderate' ? '#ffb74d' : '#81c784' }} />
                      <Chip label={ae.status} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                  </Stack>
                  {ae.corrective_action && <Typography variant="body2" sx={{ color: '#81c784', mt: 1 }}>Action: {ae.corrective_action}</Typography>}
                </CardContent>
              </Card>
            ))}
            {adverseEvents.length === 0 && <Alert severity="success">No adverse events reported.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>ID</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Description</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Severity</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Location</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidents.map((inc: any) => (
                  <TableRow key={inc.id}>
                    <TableCell sx={{ color: '#fff' }}>#{inc.id}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{inc.incident_type}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{inc.description?.substring(0, 60)}...</TableCell>
                    <TableCell><Chip label={inc.severity} size="small"
                      sx={{ bgcolor: inc.severity === 'critical' ? 'rgba(244,67,54,0.3)' : inc.severity === 'high' ? 'rgba(255,152,0,0.3)' : 'rgba(33,150,243,0.3)',
                            color: inc.severity === 'critical' ? '#ef5350' : inc.severity === 'high' ? '#ffb74d' : '#90caf9' }} /></TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{inc.location}</TableCell>
                    <TableCell><Chip label={inc.status} size="small"
                      sx={{ bgcolor: inc.status === 'resolved' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                            color: inc.status === 'resolved' ? '#81c784' : '#ffb74d' }} /></TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(inc.incident_date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {incidents.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No incidents</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {qualityMeasures.map((qm: any) => (
              <Grid item xs={12} md={6} lg={4} key={qm.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{qm.measure_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{qm.category}</Typography>
                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Performance</Typography>
                        <Typography variant="body2" sx={{ color: qm.current_value >= qm.target_value ? '#4caf50' : '#ff9800', fontWeight: 700 }}>
                          {qm.current_value}% / {qm.target_value}%
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.min(qm.current_value || 0, 100)}
                        sx={{ mt: 1, height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.1)',
                              '& .MuiLinearProgress-bar': { bgcolor: qm.current_value >= qm.target_value ? '#4caf50' : '#ff9800' } }} />
                    </Box>
                    {qm.benchmark && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>Benchmark: {qm.benchmark}%</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {qualityMeasures.length === 0 && <Grid item xs={12}><Alert severity="info">No quality measures configured.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {infections.map((inf: any) => (
              <Card key={inf.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{inf.infection_type}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {inf.patient_name} • Location: {inf.unit} • Organism: {inf.organism}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Onset: {new Date(inf.onset_date).toLocaleDateString()} • Precautions: {inf.precautions}
                      </Typography>
                    </Box>
                    <Chip label={inf.status} size="small"
                      sx={{ bgcolor: inf.status === 'active' ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)',
                            color: inf.status === 'active' ? '#ef5350' : '#81c784' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {infections.length === 0 && <Alert severity="success">No active infection cases.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {checklists.map((cl: any) => (
              <Card key={cl.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{cl.checklist_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {cl.checklist_type} • {cl.department} • {cl.completed_items}/{cl.total_items} items
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end">
                      <Chip label={cl.status} size="small"
                        sx={{ bgcolor: cl.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: cl.status === 'completed' ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                  </Stack>
                  <LinearProgress variant="determinate" value={cl.total_items ? (cl.completed_items / cl.total_items) * 100 : 0}
                    sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />
                </CardContent>
              </Card>
            ))}
            {checklists.length === 0 && <Alert severity="info">No safety checklists.</Alert>}
          </Stack>
        )}

        {activeTab === 5 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Patient</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Score</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Risk Level</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Unit</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Interventions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fallRisks.map((fr: any) => (
                  <TableRow key={fr.id}>
                    <TableCell sx={{ color: '#fff' }}>{fr.patient_name}</TableCell>
                    <TableCell sx={{ color: fr.score >= 45 ? '#f44336' : fr.score >= 25 ? '#ff9800' : '#4caf50', fontWeight: 700 }}>{fr.score}</TableCell>
                    <TableCell><Chip label={fr.risk_level} size="small"
                      sx={{ bgcolor: fr.risk_level === 'high' ? 'rgba(244,67,54,0.3)' : fr.risk_level === 'moderate' ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                            color: fr.risk_level === 'high' ? '#ef5350' : fr.risk_level === 'moderate' ? '#ffb74d' : '#81c784' }} /></TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{fr.unit}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(fr.assessment_date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{fr.interventions || '-'}</TableCell>
                  </TableRow>
                ))}
                {fallRisks.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No fall risk assessments</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </AppLayout>
  );
};

export default QualitySafetyPage;

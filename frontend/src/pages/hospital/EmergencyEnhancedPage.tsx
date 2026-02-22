import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  EmergencyShare as EmgIcon, Thermostat as SepsIcon,
  Psychology as StrokeIcon, Favorite as CodeIcon,
  LocalHospital as TraumaIcon, Group as RRTIcon,
  Timer as TimerIcon, Warning as TriageIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { emergencyEnhancedAPI } from '../../services/api';

const EmergencyEnhancedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [triage, setTriage] = useState<any[]>([]);
  const [sepsis, setSepsis] = useState<any[]>([]);
  const [stroke, setStroke] = useState<any[]>([]);
  const [codeEvents, setCodeEvents] = useState<any[]>([]);
  const [trauma, setTrauma] = useState<any[]>([]);
  const [rrt, setRrt] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tr, sp, st, ce, tm, rt] = await Promise.all([
        emergencyEnhancedAPI.getTriageAssessments().catch(() => ({ data: [] })),
        emergencyEnhancedAPI.getSepsisScreenings().catch(() => ({ data: [] })),
        emergencyEnhancedAPI.getStrokeAssessments().catch(() => ({ data: [] })),
        emergencyEnhancedAPI.getCodeEvents().catch(() => ({ data: [] })),
        emergencyEnhancedAPI.getTraumaAssessments().catch(() => ({ data: [] })),
        emergencyEnhancedAPI.getRapidResponseTeams().catch(() => ({ data: [] })),
      ]);
      setTriage(tr.data || []);
      setSepsis(sp.data || []);
      setStroke(st.data || []);
      setCodeEvents(ce.data || []);
      setTrauma(tm.data || []);
      setRrt(rt.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const triageColors: Record<string, string> = { '1': '#d32f2f', '2': '#f44336', '3': '#ff9800', '4': '#4caf50', '5': '#2196f3' };
  const triageLabels: Record<string, string> = { '1': 'Resuscitation', '2': 'Emergent', '3': 'Urgent', '4': 'Less Urgent', '5': 'Non-Urgent' };

  return (
    <AppLayout title="Emergency Department Enhanced" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Triage Queue', value: triage.filter(t => t.status === 'waiting').length, icon: <TriageIcon />, color: '#f44336' },
            { label: 'Sepsis Alerts', value: sepsis.filter(s => s.is_positive).length, icon: <SepsIcon />, color: '#ff9800' },
            { label: 'Stroke Alerts', value: stroke.filter(s => s.is_active).length, icon: <StrokeIcon />, color: '#9c27b0' },
            { label: 'Active Codes', value: codeEvents.filter(c => c.status === 'active').length, icon: <CodeIcon />, color: '#d32f2f' },
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
          <Tab label="Triage" icon={<TriageIcon />} iconPosition="start" />
          <Tab label="Sepsis" icon={<SepsIcon />} iconPosition="start" />
          <Tab label="Stroke" icon={<StrokeIcon />} iconPosition="start" />
          <Tab label="Code Events" icon={<CodeIcon />} iconPosition="start" />
          <Tab label="Trauma" icon={<TraumaIcon />} iconPosition="start" />
          <Tab label="Rapid Response" icon={<RRTIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>ESI Level</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Patient</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Chief Complaint</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Vitals</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Wait Time</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {triage.map((t: any) => (
                  <TableRow key={t.id} sx={{ bgcolor: t.esi_level <= 2 ? 'rgba(244,67,54,0.1)' : 'transparent' }}>
                    <TableCell>
                      <Chip label={`ESI ${t.esi_level} - ${triageLabels[t.esi_level] || ''}`} size="small"
                        sx={{ bgcolor: `${triageColors[t.esi_level]}33`, color: triageColors[t.esi_level], fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ color: '#fff' }}>{t.patient_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{t.chief_complaint}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                      HR: {t.heart_rate} BP: {t.blood_pressure} SpO2: {t.spo2}%
                    </TableCell>
                    <TableCell sx={{ color: t.wait_minutes > 30 ? '#f44336' : 'rgba(255,255,255,0.7)' }}>
                      {t.wait_minutes ? `${t.wait_minutes} min` : '-'}
                    </TableCell>
                    <TableCell><Chip label={t.status} size="small"
                      sx={{ bgcolor: t.status === 'waiting' ? 'rgba(255,152,0,0.3)' : t.status === 'in_treatment' ? 'rgba(33,150,243,0.3)' : 'rgba(76,175,80,0.3)',
                            color: t.status === 'waiting' ? '#ffb74d' : t.status === 'in_treatment' ? '#90caf9' : '#81c784' }} /></TableCell>
                  </TableRow>
                ))}
                {triage.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No triage assessments</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {sepsis.map((s: any) => (
              <Card key={s.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: `1px solid ${s.is_positive ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        {s.screening_tool || 'qSOFA'} - {s.patient_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Score: {s.score}/{s.max_score} • {new Date(s.screened_at).toLocaleString()}
                      </Typography>
                      {s.lactate && <Typography variant="body2" sx={{ color: s.lactate > 2 ? '#f44336' : 'rgba(255,255,255,0.5)' }}>Lactate: {s.lactate} mmol/L</Typography>}
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={s.is_positive ? 'POSITIVE' : 'Negative'} size="small"
                        sx={{ bgcolor: s.is_positive ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)',
                              color: s.is_positive ? '#ef5350' : '#81c784', fontWeight: 700 }} />
                      {s.bundle_started && <Chip label="Bundle Started" size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {sepsis.length === 0 && <Alert severity="info">No sepsis screenings.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {stroke.map((s: any) => (
              <Card key={s.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: `1px solid ${s.is_active ? 'rgba(156,39,176,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{s.stroke_type || 'Stroke Assessment'} - {s.patient_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        NIHSS: {s.nihss_score} • Last Known Well: {s.last_known_well ? new Date(s.last_known_well).toLocaleString() : '-'}
                      </Typography>
                      {s.door_to_ct_minutes && <Typography variant="body2" sx={{ color: s.door_to_ct_minutes <= 25 ? '#4caf50' : '#f44336' }}>
                        Door-to-CT: {s.door_to_ct_minutes} min
                      </Typography>}
                      {s.door_to_needle_minutes && <Typography variant="body2" sx={{ color: s.door_to_needle_minutes <= 60 ? '#4caf50' : '#f44336' }}>
                        Door-to-Needle: {s.door_to_needle_minutes} min
                      </Typography>}
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={s.tpa_eligible ? 'tPA Eligible' : 'Not Eligible'} size="small"
                        sx={{ bgcolor: s.tpa_eligible ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)',
                              color: s.tpa_eligible ? '#81c784' : '#ef5350' }} />
                      <Chip label={s.status || 'active'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {stroke.length === 0 && <Alert severity="info">No stroke assessments.</Alert>}
          </Stack>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {codeEvents.map((c: any) => (
              <Card key={c.id} sx={{ background: c.status === 'active' ? 'linear-gradient(135deg, #1a1a2e 0%, #b71c1c 30%)' : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: `1px solid ${c.status === 'active' ? 'rgba(244,67,54,0.5)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <CodeIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#f44336' }} />
                        {c.code_type} - {c.location}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {c.patient_name} • Started: {new Date(c.start_time).toLocaleString()}
                      </Typography>
                      {c.duration_minutes && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Duration: {c.duration_minutes} min</Typography>}
                      {c.outcome && <Typography variant="body2" sx={{ color: c.outcome === 'ROSC' ? '#4caf50' : '#f44336', fontWeight: 700 }}>Outcome: {c.outcome}</Typography>}
                    </Box>
                    <Chip label={c.status} size="small"
                      sx={{ bgcolor: c.status === 'active' ? 'rgba(244,67,54,0.5)' : 'rgba(76,175,80,0.3)',
                            color: c.status === 'active' ? '#fff' : '#81c784', fontWeight: 700, animation: c.status === 'active' ? 'pulse 1s infinite' : 'none' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {codeEvents.length === 0 && <Alert severity="success">No code events.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {trauma.map((t: any) => (
              <Card key={t.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <TraumaIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        {t.mechanism_of_injury} - {t.patient_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        ISS: {t.injury_severity_score} • GCS: {t.gcs_score} • Trauma Level: {t.trauma_level}
                      </Typography>
                      {t.injuries && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Injuries: {t.injuries}</Typography>}
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={`Level ${t.trauma_level}`} size="small"
                        sx={{ bgcolor: t.trauma_level === 1 ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                              color: t.trauma_level === 1 ? '#ef5350' : '#ffb74d' }} />
                      <Chip label={t.status} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {trauma.length === 0 && <Alert severity="info">No trauma assessments.</Alert>}
          </Stack>
        )}

        {activeTab === 5 && (
          <Stack spacing={2}>
            {rrt.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <RRTIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#ff9800' }} />
                        Rapid Response - {r.location}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {r.patient_name} • Trigger: {r.trigger_reason}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Called: {new Date(r.called_at).toLocaleString()} • Response: {r.response_minutes} min
                      </Typography>
                      {r.disposition && <Typography variant="body2" sx={{ color: '#81c784' }}>Disposition: {r.disposition}</Typography>}
                    </Box>
                    <Chip label={r.status} size="small"
                      sx={{ bgcolor: r.status === 'active' ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                            color: r.status === 'active' ? '#ffb74d' : '#81c784' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {rrt.length === 0 && <Alert severity="info">No rapid response activations.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default EmergencyEnhancedPage;

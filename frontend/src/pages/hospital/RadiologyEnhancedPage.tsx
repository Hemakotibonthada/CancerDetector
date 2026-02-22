import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  BiotechOutlined as RadIcon, SmartToy as AIIcon, Straighten as MeasIcon,
  RadioButtonChecked as DoseIcon, Description as RepIcon,
  Settings as ProtoIcon, Warning as ReactIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { radiologyEnhancedAPI } from '../../services/api';

const RadiologyEnhancedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [aiReadings, setAiReadings] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [doseRecords, setDoseRecords] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [reactions, setReactions] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ai, meas, dose, rep, proto, react] = await Promise.all([
        radiologyEnhancedAPI.getAIReadings().catch(() => ({ data: [] })),
        radiologyEnhancedAPI.getTumorMeasurements().catch(() => ({ data: [] })),
        radiologyEnhancedAPI.getRadiationDoses().catch(() => ({ data: [] })),
        radiologyEnhancedAPI.getStructuredReports().catch(() => ({ data: [] })),
        radiologyEnhancedAPI.getImagingProtocols().catch(() => ({ data: [] })),
        radiologyEnhancedAPI.getContrastReactions().catch(() => ({ data: [] })),
      ]);
      setAiReadings(ai.data || []);
      setMeasurements(meas.data || []);
      setDoseRecords(dose.data || []);
      setReports(rep.data || []);
      setProtocols(proto.data || []);
      setReactions(react.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Radiology Enhanced" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'AI Readings', value: aiReadings.length, icon: <AIIcon />, color: '#2196f3' },
            { label: 'Tumor Measurements', value: measurements.length, icon: <MeasIcon />, color: '#f44336' },
            { label: 'Dose Records', value: doseRecords.length, icon: <DoseIcon />, color: '#ff9800' },
            { label: 'Reports', value: reports.length, icon: <RepIcon />, color: '#4caf50' },
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
          <Tab label="AI Readings" icon={<AIIcon />} iconPosition="start" />
          <Tab label="Tumor Measurements" icon={<MeasIcon />} iconPosition="start" />
          <Tab label="Radiation Doses" icon={<DoseIcon />} iconPosition="start" />
          <Tab label="Structured Reports" icon={<RepIcon />} iconPosition="start" />
          <Tab label="Protocols" icon={<ProtoIcon />} iconPosition="start" />
          <Tab label="Contrast Reactions" icon={<ReactIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {aiReadings.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <AIIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#2196f3' }} />
                        {r.modality} - {r.study_description}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {r.patient_name} • AI Model: {r.ai_model} • Confidence: {r.confidence}%
                      </Typography>
                      {r.findings && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>Findings: {r.findings}</Typography>}
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={r.abnormality_detected ? 'Abnormal' : 'Normal'} size="small"
                        sx={{ bgcolor: r.abnormality_detected ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)',
                              color: r.abnormality_detected ? '#ef5350' : '#81c784' }} />
                      <Chip label={`${r.confidence}% conf`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      {r.radiologist_agreement !== undefined && (
                        <Chip label={r.radiologist_agreement ? 'Agreed' : 'Disagreed'} size="small"
                          sx={{ bgcolor: r.radiologist_agreement ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                                color: r.radiologist_agreement ? '#81c784' : '#ffb74d' }} />
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {aiReadings.length === 0 && <Alert severity="info">No AI readings.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Patient</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Lesion</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Size (mm)</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Prior (mm)</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Change</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>RECIST</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {measurements.map((m: any) => {
                  const change = m.prior_size ? ((m.current_size - m.prior_size) / m.prior_size * 100).toFixed(1) : null;
                  return (
                    <TableRow key={m.id}>
                      <TableCell sx={{ color: '#fff' }}>{m.patient_name}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{m.lesion_location}</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 700 }}>{m.current_size}</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{m.prior_size || '-'}</TableCell>
                      <TableCell sx={{ color: change && parseFloat(change) > 0 ? '#f44336' : '#4caf50', fontWeight: 700 }}>
                        {change ? `${parseFloat(change) > 0 ? '+' : ''}${change}%` : '-'}
                      </TableCell>
                      <TableCell><Chip label={m.recist_category || '-'} size="small"
                        sx={{ bgcolor: m.recist_category === 'PD' ? 'rgba(244,67,54,0.3)' : m.recist_category === 'CR' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: m.recist_category === 'PD' ? '#ef5350' : m.recist_category === 'CR' ? '#81c784' : '#ffb74d' }} /></TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(m.measurement_date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
                {measurements.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No tumor measurements</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {doseRecords.map((d: any) => (
              <Card key={d.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${d.dose_exceeds_reference ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{d.modality} - {d.exam_type}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Patient: {d.patient_name} • {new Date(d.exam_date).toLocaleDateString()}</Typography>
                    </Box>
                    <Stack alignItems="flex-end">
                      <Typography variant="h5" sx={{ color: d.dose_exceeds_reference ? '#f44336' : '#4caf50', fontWeight: 700 }}>
                        {d.dose_value} {d.dose_unit}
                      </Typography>
                      {d.dose_exceeds_reference && <Chip label="Exceeds Reference" size="small" sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350' }} />}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {doseRecords.length === 0 && <Alert severity="info">No radiation dose records.</Alert>}
          </Stack>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {reports.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{r.study_description}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {r.patient_name} • Radiologist: {r.radiologist_name}
                      </Typography>
                      {r.impression && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>Impression: {r.impression}</Typography>}
                    </Box>
                    <Chip label={r.status} size="small"
                      sx={{ bgcolor: r.status === 'finalized' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                            color: r.status === 'finalized' ? '#81c784' : '#ffb74d' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {reports.length === 0 && <Alert severity="info">No structured reports.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Grid container spacing={2}>
            {protocols.map((p: any) => (
              <Grid item xs={12} md={6} lg={4} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{p.protocol_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Modality: {p.modality} • Body Part: {p.body_region}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={p.contrast ? 'With Contrast' : 'Without Contrast'} size="small"
                        sx={{ bgcolor: p.contrast ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                              color: p.contrast ? '#ffb74d' : '#81c784' }} />
                      <Chip label={p.status || 'active'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {protocols.length === 0 && <Grid item xs={12}><Alert severity="info">No imaging protocols.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 5 && (
          <Stack spacing={2}>
            {reactions.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${r.severity === 'severe' ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>Contrast Reaction</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {r.patient_name} • Agent: {r.contrast_agent} • {new Date(r.reaction_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Symptoms: {r.symptoms}</Typography>
                      {r.treatment && <Typography variant="body2" sx={{ color: '#81c784' }}>Treatment: {r.treatment}</Typography>}
                    </Box>
                    <Chip label={r.severity} size="small"
                      sx={{ bgcolor: r.severity === 'severe' ? 'rgba(244,67,54,0.3)' : r.severity === 'moderate' ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                            color: r.severity === 'severe' ? '#ef5350' : r.severity === 'moderate' ? '#ffb74d' : '#81c784' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {reactions.length === 0 && <Alert severity="success">No contrast reactions recorded.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default RadiologyEnhancedPage;

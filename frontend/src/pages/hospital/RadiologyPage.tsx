import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, IconButton, CircularProgress,
} from '@mui/material';
import {
  CameraAlt, Science, Psychology, CheckCircle, Warning, Schedule,
  Visibility, TrendingUp, Assignment, Timer, Download, CloudUpload,
  Image, MedicalServices,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { hospitalNavItems } from './HospitalDashboard';
import { radiologyAPI } from '../../services/api';

const modalityIcons: Record<string, string> = {
  CT: '🔬', MRI: '🧲', 'X-Ray': '📷', Ultrasound: '🔊', PET: '☢️', Mammography: '🎯',
};

const RadiologyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [imagingStudies, setImagingStudies] = useState<any[]>([]);
  const [modalityStats, setModalityStats] = useState<any[]>([]);
  const [aiAccuracyTrend, setAiAccuracyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const studiesRes = await radiologyAPI.getStudies();
      const studies = studiesRes.data ?? studiesRes;
      setImagingStudies(Array.isArray(studies) ? studies : studies.studies ?? []);
      setModalityStats(studies.modality_stats ?? studies.modalityStats ?? []);
      setAiAccuracyTrend(studies.ai_accuracy_trend ?? studies.aiAccuracyTrend ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load radiology data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const completedStudies = imagingStudies.filter(s => s.status === 'completed' || s.status === 'reported');
  const aiAnalyzed = imagingStudies.filter(s => s.ai_status === 'completed');

  if (loading) {
    return (
      <AppLayout title="Radiology" navItems={hospitalNavItems} portalType="hospital" subtitle="Imaging management & AI-powered analysis">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Radiology" navItems={hospitalNavItems} portalType="hospital" subtitle="Imaging management & AI-powered analysis">
      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CameraAlt />} label="Today's Studies" value={imagingStudies.length.toString()} change="+3" color="#5e92f3" subtitle="All modalities" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Psychology />} label="AI Analyzed" value={aiAnalyzed.length.toString()} color="#ae52d4" subtitle={`${Math.round(aiAnalyzed.reduce((s, i) => s + i.ai_confidence, 0) / aiAnalyzed.length)}% avg confidence`} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Warning />} label="Suspicious Findings" value="1" color="#f44336" subtitle="Requires follow-up" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Timer />} label="Avg Report Time" value="2.5h" change="-18%" color="#4caf50" subtitle="Improving" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<Assignment />} label="Studies" iconPosition="start" />
            <Tab icon={<Psychology />} label="AI Analysis" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Imaging Studies" icon={<CameraAlt />}
              action={<Button startIcon={<CloudUpload />} variant="contained" size="small" onClick={() => setShowOrderDialog(true)}>Order Study</Button>}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Patient</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Modality</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Body Part</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>AI Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {imagingStudies.map((study, idx) => (
                    <TableRow key={idx} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }} onClick={() => setSelectedStudy(study)}>
                      <TableCell><Chip label={study.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} /></TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={600} fontSize={13}>{study.patient}</Typography>
                          {study.screening && <Chip label="Screening" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontSize: 9, height: 18 }} />}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography fontSize={16}>{modalityIcons[study.modality] || '📋'}</Typography>
                          <Typography fontSize={12}>{study.modality}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography fontSize={12}>{study.body_part}</Typography></TableCell>
                      <TableCell>
                        <Chip label={study.priority} size="small" sx={{
                          bgcolor: study.priority === 'Urgent' ? '#ffebee' : study.priority === 'Stat' ? '#ffcdd2' : '#e8f5e9',
                          color: study.priority === 'Urgent' ? '#c62828' : study.priority === 'Stat' ? '#b71c1c' : '#2e7d32',
                          fontWeight: 700, fontSize: 10,
                        }} />
                      </TableCell>
                      <TableCell><StatusBadge status={study.status.replace('_', ' ')} /></TableCell>
                      <TableCell>
                        {study.ai_status === 'completed' ? (
                          <Chip label={`AI: ${study.ai_confidence}%`} size="small" sx={{ bgcolor: study.ai_confidence >= 90 ? '#e8f5e9' : '#fff3e0', color: study.ai_confidence >= 90 ? '#2e7d32' : '#e65100', fontWeight: 700, fontSize: 10 }} />
                        ) : study.ai_status === 'analyzing' ? (
                          <Chip label="Analyzing..." size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontSize: 10 }} />
                        ) : (
                          <Chip label="Pending" size="small" variant="outlined" sx={{ fontSize: 10 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        {study.ai_status !== 'completed' && study.status !== 'scheduled' && (
                          <Button size="small" variant="outlined" startIcon={<Psychology />} sx={{ fontSize: 10 }}>Run AI</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="AI-Analyzed Results" subtitle="Automated findings powered by deep learning" icon={<Psychology />} />
                {imagingStudies.filter(s => s.ai_status === 'completed').map((study, idx) => (
                  <Box key={idx} sx={{ mb: 2, p: 2.5, bgcolor: study.ai_findings.includes('Suspicious') ? '#fff5f5' : '#f8fafc', borderRadius: 3, border: `1px solid ${study.ai_findings.includes('Suspicious') ? '#ffcdd2' : '#f0f0f0'}` }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography fontSize={24}>{modalityIcons[study.modality]}</Typography>
                        <Box>
                          <Typography fontWeight={700}>{study.patient} — {study.modality} ({study.body_part})</Typography>
                          <Typography variant="caption" color="text.secondary">{study.id} • {study.ordered}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <MetricGauge value={study.ai_confidence} size={60} color={study.ai_confidence >= 90 ? '#4caf50' : '#ff9800'} />
                      </Stack>
                    </Stack>
                    <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #f0f0f0' }}>
                      <Typography variant="body2" fontSize={13}>
                        <strong>AI Findings:</strong> {study.ai_findings}
                      </Typography>
                    </Box>
                    {study.ai_findings.includes('Suspicious') && (
                      <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                        <strong>Action Required:</strong> AI detected potential malignancy. Recommend biopsy and oncology consultation.
                      </Alert>
                    )}
                  </Box>
                ))}
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Studies by Modality" icon={<CameraAlt />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={modalityStats} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                      {modalityStats.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="AI Analysis Accuracy" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aiAccuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[85, 100]} />
                    <RTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#4caf50" strokeWidth={3} name="Accuracy %" dot={{ fill: '#4caf50', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* AI Study Detail Dialog */}
        <Dialog open={!!selectedStudy} onClose={() => setSelectedStudy(null)} maxWidth="md" fullWidth>
          <DialogTitle>Study Details — {selectedStudy?.id}</DialogTitle>
          <DialogContent>
            {selectedStudy && (
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={1.5}>
                    <Typography fontWeight={600}>Patient: {selectedStudy.patient}</Typography>
                    <Typography variant="body2">Modality: {selectedStudy.modality}</Typography>
                    <Typography variant="body2">Body Part: {selectedStudy.body_part}</Typography>
                    <Typography variant="body2">Radiologist: {selectedStudy.radiologist || 'Not assigned'}</Typography>
                    <Typography variant="body2">Ordered: {selectedStudy.ordered}</Typography>
                    <StatusBadge status={selectedStudy.status.replace('_', ' ')} />
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  {selectedStudy.ai_status === 'completed' && (
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                      <Typography fontWeight={700} sx={{ mb: 1 }}>AI Analysis Results</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>Confidence: <strong>{selectedStudy.ai_confidence}%</strong></Typography>
                      <Typography variant="body2">{selectedStudy.ai_findings}</Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedStudy(null)}>Close</Button>
            <Button variant="outlined" startIcon={<Download />}>Download Report</Button>
          </DialogActions>
        </Dialog>

        {/* Order Study Dialog */}
        <Dialog open={showOrderDialog} onClose={() => setShowOrderDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Order Imaging Study</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Patient Name" fullWidth />
              <TextField select label="Modality" fullWidth defaultValue="">
                <MenuItem value="ct">CT Scan</MenuItem>
                <MenuItem value="mri">MRI</MenuItem>
                <MenuItem value="xray">X-Ray</MenuItem>
                <MenuItem value="ultrasound">Ultrasound</MenuItem>
                <MenuItem value="pet">PET Scan</MenuItem>
                <MenuItem value="mammography">Mammography</MenuItem>
              </TextField>
              <TextField label="Body Part" fullWidth />
              <TextField select label="Priority" fullWidth defaultValue="routine">
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="stat">Stat</MenuItem>
              </TextField>
              <TextField label="Clinical Indication" multiline rows={2} fullWidth />
              <Alert severity="info" sx={{ borderRadius: 2 }}>AI analysis will automatically run on completed studies.</Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowOrderDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowOrderDialog(false)}>Order Study</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default RadiologyPage;

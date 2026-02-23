import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Alert, Switch, FormControlLabel, Divider, Slider,
  CircularProgress,
} from '@mui/material';
import {
  Psychology, Science, TrendingUp, Speed, PlayArrow, Stop,
  Refresh, Upload, Download, Compare, Warning, CheckCircle,
  Code, Settings, Timer, DataUsage, Assessment, BugReport,
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';
import { adminAPI } from '../../services/api';

const AIModelManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [showDeploy, setShowDeploy] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [trainingHistory, setTrainingHistory] = useState<any[]>([]);
  const [accuracyTrend, setAccuracyTrend] = useState<any[]>([]);
  const [dataDrift, setDataDrift] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDashboard();
      const data = res.data ?? res;
      setModels(data.models ?? data.ai_models ?? []);
      setTrainingHistory(data.trainingHistory ?? data.training_history ?? []);
      setAccuracyTrend(data.accuracyTrend ?? data.accuracy_trend ?? []);
      setDataDrift(data.dataDrift ?? data.data_drift ?? []);
      setError('');
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout title="AI Model Management" subtitle="Manage and monitor AI/ML models" navItems={adminNavItems} portalType="admin">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Psychology />} label="Active Models" value={models.filter(m => m.status === 'production').length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Speed />} label="Best Accuracy" value="94.7%" color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Timer />} label="Avg Inference" value="105ms" color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<DataUsage />} label="Training Data" value="1.2M" color="#7b1fa2" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Model Registry" />
        <Tab label="Training History" />
        <Tab label="Accuracy Trends" />
        <Tab label="Data Drift" />
        <Tab label="A/B Testing" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          {models.map((m) => (
            <Grid item xs={12} sm={6} key={m.id}>
              <Card sx={{ p: 2.5, borderLeft: `3px solid ${m.status === 'production' ? '#4caf50' : m.status === 'staging' ? '#ff9800' : '#9e9e9e'}`, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }}
                onClick={() => setSelectedModel(m)}>
                <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{m.name}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{m.type} • {m.version}</Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <StatusBadge status={m.status} />
                    {m.gpu && <Chip label="GPU" size="small" color="secondary" sx={{ fontSize: 9, height: 20 }} />}
                  </Stack>
                </Stack>
                <Grid container spacing={1}>
                  {[
                    { l: 'Accuracy', v: `${m.accuracy}%`, c: m.accuracy > 93 ? '#4caf50' : m.accuracy > 90 ? '#ff9800' : '#f44336' },
                    { l: 'AUC-ROC', v: m.auc.toString(), c: '#1565c0' },
                    { l: 'F1 Score', v: m.f1.toString(), c: '#9c27b0' },
                    { l: 'Inference', v: m.inferenceTime, c: '#00796b' },
                  ].map(s => (
                    <Grid item xs={3} key={s.l}>
                      <Box sx={{ textAlign: 'center', p: 0.5, bgcolor: `${s.c}08`, borderRadius: 1 }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</Typography>
                        <Typography sx={{ fontSize: 9, color: 'text.secondary' }}>{s.l}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
                  <Chip label={`Trained: ${m.lastTrained}`} size="small" sx={{ fontSize: 9 }} />
                  <Chip label={m.size} size="small" variant="outlined" sx={{ fontSize: 9 }} />
                  <Chip label={m.trainedOn} size="small" variant="outlined" sx={{ fontSize: 9 }} />
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Training Runs - CancerGuard Ensemble</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Date', 'Accuracy', 'Loss', 'Epochs', 'Dataset Size', 'Duration', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {trainingHistory.map((t, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>{t.date}</TableCell>
                    <TableCell>
                      <Chip label={`${t.accuracy}%`} size="small" color={t.accuracy > 93 ? 'success' : 'warning'} sx={{ fontWeight: 700, fontSize: 11 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{t.loss}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{t.epoch}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{t.dataset}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{t.duration}</TableCell>
                    <TableCell><StatusBadge status="completed" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 2 && (
        <Card sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Model Accuracy Over Time</Typography>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={accuracyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="ensemble" stroke="#1565c0" strokeWidth={3} dot={{ r: 5 }} name="Ensemble" />
              <Line type="monotone" dataKey="rf" stroke="#4caf50" strokeWidth={2} dot={{ r: 4 }} name="Random Forest" />
              <Line type="monotone" dataKey="gb" stroke="#ff9800" strokeWidth={2} dot={{ r: 4 }} name="Gradient Boost" />
              <Line type="monotone" dataKey="cnn" stroke="#9c27b0" strokeWidth={2} dot={{ r: 4 }} name="CNN" />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Alert severity={dataDrift.some(d => d.status === 'alert') ? 'warning' : 'success'} sx={{ mb: 2 }}>
              {dataDrift.some(d => d.status === 'alert')
                ? `Data drift detected in ${dataDrift.filter(d => d.status === 'alert').length} feature(s). Model retraining may be needed.`
                : 'All features within acceptable drift thresholds.'}
            </Alert>
          </Grid>
          {dataDrift.map((d) => (
            <Grid item xs={12} sm={6} md={4} key={d.feature}>
              <Card sx={{ p: 2.5, borderLeft: `3px solid ${d.status === 'normal' ? '#4caf50' : d.status === 'warning' ? '#ff9800' : '#d32f2f'}` }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>{d.feature}</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Drift Score</Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: d.status === 'alert' ? '#d32f2f' : d.status === 'warning' ? '#ff9800' : '#4caf50' }}>{d.drift}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={(d.drift / d.threshold) * 100} sx={{ height: 8, borderRadius: 4, mb: 1 }} color={d.status === 'alert' ? 'error' : d.status === 'warning' ? 'warning' : 'success'} />
                <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Threshold: {d.threshold}%</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 4 && (
        <Card sx={{ p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>A/B Testing Results</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>Currently testing: Ensemble v3.2 (Control) vs CNN v1.4 (Variant) - 80/20 traffic split</Alert>
          <Grid container spacing={2}>
            {[
              { name: 'Control: Ensemble v3.2', traffic: 80, accuracy: 94.7, latency: '250ms', predictions: 6480, color: '#1565c0' },
              { name: 'Variant: CNN v1.4', traffic: 20, accuracy: 93.5, latency: '180ms', predictions: 1620, color: '#9c27b0' },
            ].map(v => (
              <Grid item xs={12} sm={6} key={v.name}>
                <Box sx={{ p: 2, bgcolor: `${v.color}08`, borderRadius: 2, border: `1px solid ${v.color}20` }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, color: v.color }}>{v.name}</Typography>
                  <Chip label={`${v.traffic}% traffic`} size="small" sx={{ my: 1 }} />
                  <Stack spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 12 }}>Accuracy</Typography><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{v.accuracy}%</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 12 }}>Avg Latency</Typography><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{v.latency}</Typography></Stack>
                    <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 12 }}>Predictions</Typography><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{v.predictions.toLocaleString()}</Typography></Stack>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained">Promote Variant</Button>
            <Button variant="outlined">Adjust Split</Button>
            <Button variant="outlined" color="error">Stop Test</Button>
          </Stack>
        </Card>
      )}
      </>}

      {/* Model Detail Dialog */}
      <Dialog open={!!selectedModel} onClose={() => setSelectedModel(null)} maxWidth="md" fullWidth>
        {selectedModel && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 18 }}>{selectedModel.name}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{selectedModel.id} • {selectedModel.type}</Typography>
                </Box>
                <StatusBadge status={selectedModel.status} />
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <SectionHeader title="Performance Metrics" />
                  <Stack spacing={1}>
                    {[
                      { l: 'Accuracy', v: `${selectedModel.accuracy}%` },
                      { l: 'AUC-ROC', v: selectedModel.auc },
                      { l: 'F1 Score', v: selectedModel.f1 },
                      { l: 'Precision', v: `${selectedModel.precision}%` },
                      { l: 'Recall', v: `${selectedModel.recall}%` },
                    ].map(item => (
                      <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.v}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <SectionHeader title="Deployment Info" />
                  <Stack spacing={1}>
                    {[
                      { l: 'Version', v: selectedModel.version },
                      { l: 'Environment', v: selectedModel.environment },
                      { l: 'Model Size', v: selectedModel.size },
                      { l: 'Inference Time', v: selectedModel.inferenceTime },
                      { l: 'Training Data', v: selectedModel.trainedOn },
                      { l: 'Last Trained', v: selectedModel.lastTrained },
                      { l: 'GPU Required', v: selectedModel.gpu ? 'Yes' : 'No' },
                    ].map(item => (
                      <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{item.l}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{item.v}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedModel(null)}>Close</Button>
              <Button variant="outlined" startIcon={<Refresh />}>Retrain</Button>
              {selectedModel.status === 'staging' && <Button variant="contained" color="success" startIcon={<PlayArrow />}>Deploy to Production</Button>}
              {selectedModel.status === 'production' && <Button variant="outlined" color="error" startIcon={<Stop />}>Rollback</Button>}
            </DialogActions>
          </>
        )}
      </Dialog>
    </AppLayout>
  );
};

export default AIModelManagement;

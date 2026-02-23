import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  LinearProgress, CircularProgress, Alert, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Select, MenuItem,
  FormControl, InputLabel, Tooltip,
} from '@mui/material';
import {
  Psychology, TrendingUp, Groups, Assessment, Biotech,
  Speed, Warning, CheckCircle, Timeline, ShowChart,
  BarChart as BarChartIcon, PieChart as PieChartIcon,
  Refresh, Download, Science,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { StatCard, GlassCard, SectionHeader } from '../../components/common/SharedComponents';
import { analyticsAPI } from '../../services/api';

const AIAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [riskDistribution, setRiskDistribution] = useState<any[]>([]);
  const [predictionAccuracy, setPredictionAccuracy] = useState<any[]>([]);
  const [cancerTypeDetection, setCancerTypeDetection] = useState<any[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  const [populationHealth, setPopulationHealth] = useState<any[]>([]);
  const [featureImportance, setFeatureImportance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, trendsRes] = await Promise.all([
        analyticsAPI.getOverview().catch(() => ({ data: {} })),
        analyticsAPI.getRiskTrends().catch(() => ({ data: [] })),
      ]);
      const overview = overviewRes.data || {};
      const trends = trendsRes.data || [];
      setRiskDistribution(overview.risk_distribution ?? overview.riskDistribution ?? []);
      setPredictionAccuracy(Array.isArray(trends) ? trends : trends.prediction_accuracy ?? trends.predictionAccuracy ?? []);
      setCancerTypeDetection(overview.cancer_type_detection ?? overview.cancerTypeDetection ?? []);
      setModelPerformance(overview.model_performance ?? overview.modelPerformance ?? []);
      setPopulationHealth(overview.population_health ?? overview.populationHealth ?? []);
      setFeatureImportance(overview.feature_importance ?? overview.featureImportance ?? []);
      setError('');
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <AppLayout title="AI & Analytics" subtitle="AI-powered predictions and insights" navItems={hospitalNavItems} portalType="hospital">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Psychology />} label="Model Accuracy" value="94.7%" color="#1565c0" change="+1.2%" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Groups />} label="Patients Screened" value="1,660" color="#4caf50" change="+15%" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Science />} label="Predictions Today" value="89" color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="High Risk Found" value="27" color="#d32f2f" /></Grid>
      </Grid>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab label="Overview" />
          <Tab label="Model Performance" />
          <Tab label="Cancer Detection" />
          <Tab label="Population Health" />
          <Tab label="Feature Analysis" />
        </Tabs>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <MenuItem value="7d">7 Days</MenuItem><MenuItem value="30d">30 Days</MenuItem><MenuItem value="90d">90 Days</MenuItem><MenuItem value="1y">1 Year</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Prediction Accuracy Trend</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={predictionAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="accuracy" stroke="#1565c0" strokeWidth={2} dot={{ r: 4 }} name="Accuracy" />
                  <Line type="monotone" dataKey="sensitivity" stroke="#4caf50" strokeWidth={2} dot={{ r: 4 }} name="Sensitivity" />
                  <Line type="monotone" dataKey="specificity" stroke="#f57c00" strokeWidth={2} dot={{ r: 4 }} name="Specificity" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Risk Distribution</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({name, value}) => `${name}: ${value}%`} labelLine={false}>
                    {riskDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {riskDistribution.map(r => (
                  <Stack key={r.name} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.color }} />
                      <Typography sx={{ fontSize: 11 }}>{r.name}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{r.value}%</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>AI Insights Summary</Typography>
              <Grid container spacing={2}>
                {[
                  { title: 'Early Detection Rate', value: '87.3%', change: '+5.2%', desc: 'Cancers detected at Stage I/II', icon: <CheckCircle />, color: '#4caf50' },
                  { title: 'False Positive Rate', value: '3.2%', change: '-0.8%', desc: 'Reduced unnecessary procedures', icon: <TrendingUp />, color: '#2196f3' },
                  { title: 'Prediction Confidence', value: '92.1%', change: '+1.5%', desc: 'Average model confidence score', icon: <Psychology />, color: '#9c27b0' },
                  { title: 'Risk Stratification', value: '96.5%', change: '+2.1%', desc: 'Correct risk level assignment', icon: <Assessment />, color: '#f57c00' },
                ].map(item => (
                  <Grid item xs={12} sm={6} md={3} key={item.title}>
                    <Box sx={{ p: 2, bgcolor: `${item.color}08`, borderRadius: 2, border: `1px solid ${item.color}20` }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: `${item.color}15`, color: item.color }}>{item.icon}</Avatar>
                        <Typography sx={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{item.title}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip label={item.change} size="small" color={item.change.startsWith('+') ? 'success' : 'error'} sx={{ fontSize: 9, height: 18 }} />
                        <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{item.desc}</Typography>
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Model', 'Version', 'Accuracy', 'AUC-ROC', 'F1 Score', 'Status', 'Last Trained'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {modelPerformance.map((m) => (
                  <TableRow key={m.name} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Psychology sx={{ fontSize: 18, color: m.status === 'production' ? '#4caf50' : m.status === 'staging' ? '#ff9800' : '#9e9e9e' }} />
                        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{m.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><Chip label={m.version} size="small" variant="outlined" sx={{ fontSize: 10, fontFamily: 'monospace' }} /></TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: m.accuracy > 93 ? '#4caf50' : m.accuracy > 90 ? '#ff9800' : '#f44336' }}>{m.accuracy}%</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{m.auc}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{m.f1}</TableCell>
                    <TableCell>
                      <Chip label={m.status} size="small" color={m.status === 'production' ? 'success' : m.status === 'staging' ? 'warning' : 'default'} sx={{ fontSize: 10, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{m.lastTrained}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                      {['Cancer Type', 'Detected', 'False Positives', 'False Negatives', 'Accuracy', 'Trend'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cancerTypeDetection.map((c) => (
                      <TableRow key={c.type} hover>
                        <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{c.type}</TableCell>
                        <TableCell sx={{ fontSize: 13, fontWeight: 700 }}>{c.detected}</TableCell>
                        <TableCell><Chip label={c.falsePos} size="small" color="warning" sx={{ fontSize: 10, fontWeight: 700 }} /></TableCell>
                        <TableCell><Chip label={c.falseNeg} size="small" color="error" sx={{ fontSize: 10, fontWeight: 700 }} /></TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{c.accuracy}%</Typography>
                            <LinearProgress variant="determinate" value={c.accuracy} sx={{ height: 6, borderRadius: 3, width: 60 }} />
                          </Stack>
                        </TableCell>
                        <TableCell><Chip label={c.trend} size="small" color="success" sx={{ fontSize: 10 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Detection by Cancer Type</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cancerTypeDetection}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Bar dataKey="detected" fill="#1565c0" radius={[4, 4, 0, 0]} name="Detected" />
                  <Bar dataKey="falsePos" fill="#ff9800" radius={[4, 4, 0, 0]} name="False Positive" />
                  <Bar dataKey="falseNeg" fill="#f44336" radius={[4, 4, 0, 0]} name="False Negative" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Population Health by Age Group</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={populationHealth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Bar dataKey="patients" fill="#e3f2fd" name="Total Patients" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="screened" fill="#1565c0" name="Screened" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="highRisk" fill="#ff9800" name="High Risk" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="detected" fill="#f44336" name="Cancer Detected" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 4 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Feature Importance Ranking</Typography>
              {featureImportance.map((f) => (
                <Stack key={f.feature} direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 500, width: 160 }}>{f.feature}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress variant="determinate" value={f.importance} sx={{ height: 12, borderRadius: 6, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { borderRadius: 6, background: `linear-gradient(90deg, #1565c0, ${f.importance > 80 ? '#4caf50' : f.importance > 60 ? '#ff9800' : '#9e9e9e'})` } }} />
                  </Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, width: 40 }}>{f.importance}%</Typography>
                </Stack>
              ))}
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Model Explainability</Typography>
              <Stack spacing={2}>
                {[
                  { title: 'SHAP Values', desc: 'Feature contribution to individual predictions', status: 'active' },
                  { title: 'LIME Explanations', desc: 'Local interpretable model explanations', status: 'active' },
                  { title: 'Partial Dependence', desc: 'Marginal effect of features on prediction', status: 'active' },
                  { title: 'Bias Detection', desc: 'Fairness audit across demographics', status: 'passed' },
                  { title: 'Data Drift Monitor', desc: 'Input distribution shift detection', status: 'monitoring' },
                ].map(item => (
                  <Box key={item.title} sx={{ p: 1.5, bgcolor: '#f8f9ff', borderRadius: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.title}</Typography>
                      <Chip label={item.status} size="small" color={item.status === 'active' ? 'success' : item.status === 'passed' ? 'primary' : 'warning'} sx={{ fontSize: 9, height: 18 }} />
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.desc}</Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}
    </AppLayout>
  );
};

export default AIAnalytics;

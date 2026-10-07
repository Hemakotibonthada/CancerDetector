import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Rating, CircularProgress,
} from '@mui/material';
import {
  VerifiedUser, TrendingUp, Assignment, CheckCircle, Star, Speed,
  Warning, ThumbUp, MedicalServices, Timeline, BarChart as BarChartIcon,
  EmojiEvents, Error,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, MetricGauge } from '../../components/common/SharedComponents';
import { hospitalNavItems } from './HospitalDashboard';
import { qualityAPI } from '../../services/api';

const QualityMetricsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [qualityMetrics, setQualityMetrics] = useState<any[]>([]);
  const [satisfactionTrend, setSatisfactionTrend] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [categoryScores, setCategoryScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsRes, satisfactionRes, outcomesRes, benchmarksRes] = await Promise.all([
        qualityAPI.getMetrics(),
        qualityAPI.getPatientSatisfaction(),
        qualityAPI.getOutcomes(),
        qualityAPI.getBenchmarks(),
      ]);
      const metricsData = metricsRes.data ?? metricsRes ?? [];
      const satData = satisfactionRes.data ?? satisfactionRes ?? [];
      const outData = outcomesRes.data ?? outcomesRes ?? [];
      const benchData = benchmarksRes.data ?? benchmarksRes ?? [];

      // Quality metrics
      const mRows = (Array.isArray(metricsData) ? metricsData : []).map((m: any) => ({
        category: m.category ?? '-',
        metric: m.metric ?? m.name ?? '-',
        value: m.value ?? 0,
        target: m.target ?? 0,
        unit: m.unit ?? '',
        trend: m.trend ?? 'stable',
        benchmark: m.benchmark ?? 0,
      }));
      setQualityMetrics(mRows);

      // Satisfaction trend
      const satRows = (Array.isArray(satData) ? satData : []).map((s: any) => ({
        month: s.month ?? '-',
        score: s.score ?? s.value ?? 0,
        responses: s.responses ?? s.count ?? 0,
      }));
      setSatisfactionTrend(satRows);

      // Radar data from benchmarks
      const rData = (Array.isArray(benchData) ? benchData : []).map((b: any) => ({
        subject: b.subject ?? b.category ?? '-',
        current: b.current ?? b.score ?? 0,
        benchmark: b.benchmark ?? 0,
      }));
      setRadarData(rData);

      // Category scores from outcomes
      const colors = ['#4caf50', '#5e92f3', '#ae52d4', '#ff9800', '#e91e63'];
      const cData = (Array.isArray(outData) ? outData : []).map((o: any, i: number) => ({
        name: o.name ?? o.category ?? '-',
        score: o.score ?? o.value ?? 0,
        fill: o.fill ?? colors[i % colors.length],
      }));
      setCategoryScores(cData);
    } catch (err: any) {
      console.error('Failed to load quality data:', err);
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load quality metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const meetingTarget = qualityMetrics.filter(m => {
    if ((m.metric ?? '').includes('Error') || (m.metric ?? '').includes('Infection') || (m.metric ?? '').includes('Readmission') || (m.metric ?? '').includes('Wait') || (m.metric ?? '').includes('Burnout'))
      return m.value <= m.target;
    return m.value >= m.target;
  });
  const overallScore = radarData.length > 0 ? Math.round(radarData.reduce((s, d) => s + (d.current ?? 0), 0) / radarData.length) : 0;

  if (loading) {
    return (
      <AppLayout title="Quality Metrics" navItems={hospitalNavItems} portalType="hospital" subtitle="Quality assurance & performance benchmarks">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Quality Metrics" navItems={hospitalNavItems} portalType="hospital" subtitle="Quality assurance & performance benchmarks">
      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EmojiEvents />} label="Quality Score" value={`${overallScore}%`} color="#4caf50" subtitle="Overall performance" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircle />} label="Targets Met" value={`${meetingTarget.length}/${qualityMetrics.length}`} color="#5e92f3" subtitle="Key performance indicators" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Star />} label="User Satisfaction" value="Not available" color="#ff9800" subtitle="No survey score stored" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ThumbUp />} label="NPS Score" value="Not available" color="#ae52d4" subtitle="Not calculated" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<BarChartIcon />} label="Metrics" iconPosition="start" />
            <Tab icon={<Star />} label="Satisfaction" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Benchmarks" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Grid container spacing={2.5}>
            {['Patient Safety', 'Clinical Outcomes', 'Patient Experience', 'Operational', 'Staff'].map((cat, ci) => (
              <Grid item xs={12} key={ci}>
                <Card sx={{ p: 3 }}>
                  <SectionHeader title={cat} icon={ci === 0 ? <VerifiedUser /> : ci === 1 ? <MedicalServices /> : ci === 2 ? <Star /> : ci === 3 ? <Speed /> : <ThumbUp />} />
                  <Grid container spacing={2}>
                    {qualityMetrics.filter(m => m.category === cat).map((m, mi) => {
                      const isLower = m.metric.includes('Error') || m.metric.includes('Infection') || m.metric.includes('Readmission') || m.metric.includes('Wait') || m.metric.includes('Burnout');
                      const meetTarget = isLower ? m.value <= m.target : m.value >= m.target;
                      const progress = isLower ? Math.max(0, 100 - (m.value / m.target) * 100 + 100) : (m.value / m.target) * 100;

                      return (
                        <Grid item xs={12} md={6} key={mi}>
                          <Box sx={{ p: 2, bgcolor: meetTarget ? '#f0fdf4' : '#fff5f5', borderRadius: 2, border: `1px solid ${meetTarget ? '#bbf7d0' : '#fecaca'}` }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography fontWeight={600} fontSize={13}>{m.metric}</Typography>
                              {meetTarget ? <CheckCircle sx={{ color: '#4caf50', fontSize: 18 }} /> : <Warning sx={{ color: '#f44336', fontSize: 18 }} />}
                            </Stack>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                              <Typography fontWeight={700} fontSize={22} color={meetTarget ? '#2e7d32' : '#c62828'}>{m.value}{m.unit}</Typography>
                              <Chip label={`Target: ${m.target}${m.unit}`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                              <Chip label={`Benchmark: ${m.benchmark}${m.unit}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontSize: 10 }} />
                            </Stack>
                            <LinearProgress variant="determinate" value={Math.min(progress, 100)} sx={{
                              height: 6, borderRadius: 3, bgcolor: '#f0f0f0',
                              '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: meetTarget ? '#4caf50' : '#f44336' },
                            }} />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                              Trend: {m.trend === 'improving' ? '📈 Improving' : '➡️ Stable'}
                            </Typography>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="User Satisfaction Trend" icon={<Star />} />
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={satisfactionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[3.5, 5]} />
                    <RTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#ff9800" strokeWidth={3} name="Satisfaction Score" dot={{ fill: '#ff9800', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Category Scores" icon={<BarChartIcon />} />
                <Stack spacing={2}>
                  {categoryScores.map((cat, idx) => (
                    <Box key={idx}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography fontSize={12} fontWeight={600}>{cat.name}</Typography>
                        <Typography fontSize={12} fontWeight={700} color={cat.fill}>{cat.score}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={cat.score} sx={{
                        height: 8, borderRadius: 4, bgcolor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: cat.fill },
                      }} />
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Performance vs Benchmarks" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" fontSize={11} />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar name="Our Hospital" dataKey="current" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} strokeWidth={2} />
                    <Radar name="Benchmark" dataKey="benchmark" stroke="#ff9800" fill="#ff9800" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                    <Legend />
                    <RTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Category Performance" icon={<BarChartIcon />} />
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={categoryScores} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                    <RTooltip />
                    <Bar dataKey="score" name="Score" radius={[0, 8, 8, 0]}>
                      {categoryScores.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </AppLayout>
  );
};

export default QualityMetricsPage;

import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Rating,
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

const QUALITY_METRICS = [
  { category: 'Patient Safety', metric: 'Medication Error Rate', value: 0.8, target: 1.0, unit: '%', trend: 'improving', benchmark: 1.2 },
  { category: 'Patient Safety', metric: 'Hospital-Acquired Infections', value: 1.2, target: 1.5, unit: 'per 1000 days', trend: 'stable', benchmark: 2.0 },
  { category: 'Clinical Outcomes', metric: '30-Day Readmission Rate', value: 8.5, target: 10.0, unit: '%', trend: 'improving', benchmark: 12.0 },
  { category: 'Clinical Outcomes', metric: 'Cancer Treatment Success Rate', value: 78, target: 75, unit: '%', trend: 'improving', benchmark: 72 },
  { category: 'Patient Experience', metric: 'Overall Satisfaction', value: 4.6, target: 4.5, unit: '/5', trend: 'improving', benchmark: 4.2 },
  { category: 'Patient Experience', metric: 'Net Promoter Score', value: 72, target: 65, unit: '', trend: 'improving', benchmark: 58 },
  { category: 'Operational', metric: 'Avg Wait Time (ED)', value: 18, target: 20, unit: 'min', trend: 'stable', benchmark: 25 },
  { category: 'Operational', metric: 'Bed Occupancy Rate', value: 82, target: 85, unit: '%', trend: 'stable', benchmark: 80 },
  { category: 'Staff', metric: 'Staff Satisfaction', value: 4.2, target: 4.0, unit: '/5', trend: 'improving', benchmark: 3.8 },
  { category: 'Staff', metric: 'Physician Burnout Rate', value: 22, target: 25, unit: '%', trend: 'improving', benchmark: 35 },
];

const SATISFACTION_TREND = [
  { month: 'Jul', score: 4.2, responses: 85 }, { month: 'Aug', score: 4.3, responses: 92 },
  { month: 'Sep', score: 4.4, responses: 88 }, { month: 'Oct', score: 4.5, responses: 95 },
  { month: 'Nov', score: 4.5, responses: 102 }, { month: 'Dec', score: 4.6, responses: 78 },
];

const RADAR_DATA = [
  { subject: 'Safety', current: 92, benchmark: 80 },
  { subject: 'Outcomes', current: 88, benchmark: 75 },
  { subject: 'Satisfaction', current: 90, benchmark: 82 },
  { subject: 'Efficiency', current: 85, benchmark: 78 },
  { subject: 'Staff', current: 86, benchmark: 76 },
  { subject: 'Innovation', current: 82, benchmark: 70 },
];

const CATEGORY_SCORES = [
  { name: 'Patient Safety', score: 92, fill: '#4caf50' },
  { name: 'Clinical Outcomes', score: 88, fill: '#5e92f3' },
  { name: 'Patient Experience', score: 90, fill: '#ae52d4' },
  { name: 'Operational', score: 85, fill: '#ff9800' },
  { name: 'Staff Wellness', score: 86, fill: '#e91e63' },
];

const QualityMetricsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const meetingTarget = QUALITY_METRICS.filter(m => {
    if (m.metric.includes('Error') || m.metric.includes('Infection') || m.metric.includes('Readmission') || m.metric.includes('Wait') || m.metric.includes('Burnout'))
      return m.value <= m.target;
    return m.value >= m.target;
  });
  const overallScore = Math.round(RADAR_DATA.reduce((s, d) => s + d.current, 0) / RADAR_DATA.length);

  return (
    <AppLayout title="Quality Metrics" navItems={hospitalNavItems} portalType="hospital" subtitle="Quality assurance & performance benchmarks">
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EmojiEvents />} label="Quality Score" value={`${overallScore}%`} color="#4caf50" subtitle="Overall performance" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircle />} label="Targets Met" value={`${meetingTarget.length}/${QUALITY_METRICS.length}`} color="#5e92f3" subtitle="Key performance indicators" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Star />} label="Patient Satisfaction" value="4.6/5" change="+0.1" color="#ff9800" subtitle="This month" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ThumbUp />} label="NPS Score" value="72" change="+5" color="#ae52d4" subtitle="Net Promoter Score" />
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
                    {QUALITY_METRICS.filter(m => m.category === cat).map((m, mi) => {
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
                <SectionHeader title="Patient Satisfaction Trend" icon={<Star />} />
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={SATISFACTION_TREND}>
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
                  {CATEGORY_SCORES.map((cat, idx) => (
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
                  <RadarChart data={RADAR_DATA}>
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
                  <BarChart data={CATEGORY_SCORES} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={120} fontSize={11} />
                    <RTooltip />
                    <Bar dataKey="score" name="Score" radius={[0, 8, 8, 0]}>
                      {CATEGORY_SCORES.map((e, i) => <Cell key={i} fill={e.fill} />)}
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

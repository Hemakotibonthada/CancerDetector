import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  LinearProgress, TextField, InputAdornment, IconButton, Select, MenuItem,
  FormControl, InputLabel, Divider, Alert, Badge, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Pagination,
} from '@mui/material';
import {
  Assessment as AssessIcon, TrendingUp, TrendingDown, Warning as WarningIcon,
  Science as ScienceIcon, Biotech as BiotechIcon, Psychology as BrainIcon,
  Shield as ShieldIcon, Refresh as RefreshIcon, Download as DownloadIcon,
  Info as InfoIcon, Timeline as TimelineIcon, ArrowForward,
  CheckCircle, Cancel, Help, Lightbulb as TipIcon,
  FitnessCenter, Restaurant, SmokeFree, LocalBar,
  Bloodtype, FamilyRestroom, HealthAndSafety,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { StatCard, MetricGauge, SectionHeader, StatusBadge, ProgressCard, GlassCard } from '../../components/common/SharedComponents';
import { cancerDetectionAPI } from '../../services/api';

const CancerRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCancer, setSelectedCancer] = useState<any>(null);

  const riskScore = 15.3;
  const riskLevel = 'low';
  const modelConfidence = 94.7;
  const riskColor = '#8bc34a';

  const cancerTypeRisks = [
    { type: 'Lung Cancer', risk: 8.2, level: 'very_low', change: -2.1, factors: ['Non-smoker', 'Good air quality'], icon: '🫁' },
    { type: 'Breast Cancer', risk: 12.5, level: 'low', change: -0.5, factors: ['Regular screening', 'No family history'], icon: '🎀' },
    { type: 'Colorectal Cancer', risk: 18.4, level: 'moderate', change: 1.2, factors: ['Low fiber diet', 'Sedentary lifestyle'], icon: '🔬' },
    { type: 'Prostate Cancer', risk: 22.1, level: 'moderate', change: 0.8, factors: ['Age factor', 'PSA elevated'], icon: '🩺' },
    { type: 'Skin Cancer', risk: 11.3, level: 'low', change: -1.5, factors: ['Sunscreen use', 'Regular checks'], icon: '☀️' },
    { type: 'Liver Cancer', risk: 6.7, level: 'very_low', change: -0.3, factors: ['Normal liver function', 'Low alcohol'], icon: '🫀' },
    { type: 'Pancreatic Cancer', risk: 5.1, level: 'very_low', change: 0.0, factors: ['No family history', 'Normal glucose'], icon: '🏥' },
    { type: 'Leukemia', risk: 3.8, level: 'very_low', change: -0.2, factors: ['Normal blood counts', 'No exposure'], icon: '🩸' },
    { type: 'Thyroid Cancer', risk: 7.9, level: 'very_low', change: 0.1, factors: ['Normal TSH', 'No nodules'], icon: '🦋' },
    { type: 'Bladder Cancer', risk: 9.4, level: 'low', change: -0.7, factors: ['Non-smoker', 'Good hydration'], icon: '💧' },
  ];

  const riskFactors = [
    { name: 'Age (45+)', impact: 'moderate', modifiable: false, score: 35, category: 'demographic', detail: 'Age is a non-modifiable risk factor. Risk increases after 45.' },
    { name: 'Physical Activity', impact: 'low', modifiable: true, score: 20, category: 'lifestyle', detail: '30 mins of daily exercise reduces cancer risk by 20-30%.' },
    { name: 'Diet Quality', impact: 'moderate', modifiable: true, score: 45, category: 'lifestyle', detail: 'Increase fiber, fruits, and vegetables intake.' },
    { name: 'Smoking Status', impact: 'very_low', modifiable: true, score: 5, category: 'lifestyle', detail: 'Non-smoker. Continue to avoid tobacco products.' },
    { name: 'Alcohol Consumption', impact: 'low', modifiable: true, score: 15, category: 'lifestyle', detail: 'Moderate alcohol use. Consider reducing intake.' },
    { name: 'BMI', impact: 'low', modifiable: true, score: 22, category: 'health', detail: 'BMI 24.5 - Within normal range. Maintain healthy weight.' },
    { name: 'Family History', impact: 'moderate', modifiable: false, score: 40, category: 'genetic', detail: 'Father had prostate cancer at age 68.' },
    { name: 'Genetic Markers', impact: 'low', modifiable: false, score: 12, category: 'genetic', detail: 'No high-risk genetic mutations detected (BRCA1/2 negative).' },
    { name: 'Sun Exposure', impact: 'low', modifiable: true, score: 18, category: 'lifestyle', detail: 'Regular sunscreen use. Avoid peak UV hours.' },
    { name: 'Blood Biomarkers', impact: 'low', modifiable: false, score: 15, category: 'health', detail: 'All tumor markers within normal range.' },
    { name: 'Sleep Quality', impact: 'low', modifiable: true, score: 10, category: 'lifestyle', detail: 'Good sleep pattern. 7+ hours per night.' },
    { name: 'Stress Level', impact: 'moderate', modifiable: true, score: 35, category: 'lifestyle', detail: 'Moderate stress detected. Consider stress management.' },
  ];

  const recommendations = [
    { title: 'Increase Daily Fiber Intake', desc: 'Add 10g more fiber daily through vegetables and whole grains. This can reduce colorectal cancer risk by 10%.', priority: 'high', category: 'diet', impact: '-3.2% risk' },
    { title: 'Schedule Colonoscopy', desc: 'Your colonoscopy screening is overdue. Schedule within the next 30 days for early detection.', priority: 'high', category: 'screening', impact: 'Early detection' },
    { title: 'Increase Physical Activity', desc: 'Add 20 minutes of moderate exercise 3 times per week. Walking, cycling, or swimming recommended.', priority: 'medium', category: 'exercise', impact: '-2.8% risk' },
    { title: 'Monitor PSA Levels', desc: 'PSA slightly elevated at 3.8 ng/mL. Retest in 3 months for trending analysis.', priority: 'medium', category: 'monitoring', impact: 'Track trend' },
    { title: 'Reduce Processed Meat', desc: 'Limit processed meat to less than 2 servings per week to reduce colorectal cancer risk.', priority: 'medium', category: 'diet', impact: '-2.1% risk' },
    { title: 'Stress Management', desc: 'Practice mindfulness meditation for 15 minutes daily. Consider yoga or deep breathing exercises.', priority: 'low', category: 'wellness', impact: '-1.5% risk' },
    { title: 'Annual Skin Check', desc: 'Schedule annual dermatology appointment for full-body skin cancer screening.', priority: 'low', category: 'screening', impact: 'Early detection' },
    { title: 'Maintain Vitamin D', desc: 'Continue Vitamin D supplementation (2000 IU daily). Adequate levels may reduce cancer risk.', priority: 'low', category: 'supplement', impact: '-1.0% risk' },
  ];

  const assessmentHistory = [
    { date: 'Feb 22, 2026', score: 15.3, level: 'low', change: -0.8, confidence: 94.7, sources: 5 },
    { date: 'Jan 15, 2026', score: 16.1, level: 'low', change: -1.2, confidence: 93.8, sources: 5 },
    { date: 'Dec 10, 2025', score: 17.3, level: 'low', change: -0.5, confidence: 92.1, sources: 4 },
    { date: 'Nov 05, 2025', score: 17.8, level: 'low', change: 0.3, confidence: 91.5, sources: 4 },
    { date: 'Oct 01, 2025', score: 17.5, level: 'low', change: -2.1, confidence: 90.2, sources: 3 },
    { date: 'Sep 01, 2025', score: 19.6, level: 'moderate', change: -1.4, confidence: 88.5, sources: 3 },
  ];

  return (
    <AppLayout title="Cancer Risk Assessment" subtitle="AI-powered comprehensive risk analysis" navItems={patientNavItems} portalType="patient">
      {/* Top Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, background: `linear-gradient(135deg, ${riskColor}15, ${riskColor}05)`, border: `2px solid ${riskColor}30`, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
              Overall Cancer Risk Score
            </Typography>
            <MetricGauge value={riskScore} color={riskColor} size={150} unit="%" />
            <Chip label={riskLevel.replace(/_/g, ' ').toUpperCase()} sx={{ mt: 2, bgcolor: riskColor, color: 'white', fontWeight: 700, px: 2 }} />
            <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ mt: 1 }}>
              <TrendingDown sx={{ fontSize: 16, color: '#4caf50' }} />
              <Typography sx={{ fontSize: 12, color: '#4caf50', fontWeight: 600 }}>-0.8% from last assessment</Typography>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
              Model Performance
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Model Confidence</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1565c0' }}>{modelConfidence}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={modelConfidence} sx={{ height: 8, borderRadius: 4, bgcolor: '#e3f2fd', '& .MuiLinearProgress-bar': { bgcolor: '#1565c0', borderRadius: 4 } }} />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Model Version</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>v1.0.0</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Cancer Types Analyzed</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>17+</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Features Used</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>130+</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Data Sources</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Blood, Smartwatch, Lifestyle, Genetic</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Last Assessment</Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Feb 22, 2026</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
              Data Completeness
            </Typography>
            <Stack spacing={1.5}>
              {[
                { source: 'Blood Biomarkers', percent: 92, count: '55/60 markers', color: '#00897b' },
                { source: 'Smartwatch Data', percent: 85, count: '30/35 metrics', color: '#1565c0' },
                { source: 'Lifestyle Factors', percent: 100, count: '12/12 factors', color: '#8bc34a' },
                { source: 'Genetic Data', percent: 75, count: '6/8 markers', color: '#7b1fa2' },
                { source: 'Medical History', percent: 88, count: '16/18 fields', color: '#f57c00' },
              ].map((src, i) => (
                <Box key={i}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 500 }}>{src.source}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{src.count}</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={src.percent} sx={{ height: 6, borderRadius: 3, bgcolor: `${src.color}15`, '& .MuiLinearProgress-bar': { bgcolor: src.color, borderRadius: 3 } }} />
                </Box>
              ))}
            </Stack>
            <Button variant="contained" fullWidth sx={{ mt: 2 }} startIcon={<RefreshIcon />}>
              Run New Assessment
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Cancer Type Risks" />
        <Tab label="Risk Factors" />
        <Tab label="Recommendations" />
        <Tab label="Assessment History" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          {cancerTypeRisks.map((cancer, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card
                onClick={() => { setSelectedCancer(cancer); setShowDetailDialog(true); }}
                sx={{
                  p: 2.5, cursor: 'pointer', transition: 'all 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
                  borderLeft: `4px solid ${cancer.level === 'very_low' ? '#4caf50' : cancer.level === 'low' ? '#8bc34a' : cancer.level === 'moderate' ? '#ff9800' : '#f44336'}`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography sx={{ fontSize: 24, mb: 0.5 }}>{cancer.icon}</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{cancer.type}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 24, color: cancer.level === 'very_low' ? '#4caf50' : cancer.level === 'low' ? '#8bc34a' : '#ff9800' }}>
                      {cancer.risk}%
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                      {cancer.change < 0 ? <TrendingDown sx={{ fontSize: 14, color: '#4caf50' }} /> : cancer.change > 0 ? <TrendingUp sx={{ fontSize: 14, color: '#f44336' }} /> : null}
                      <Typography sx={{ fontSize: 11, color: cancer.change < 0 ? '#4caf50' : cancer.change > 0 ? '#f44336' : 'text.secondary', fontWeight: 600 }}>
                        {cancer.change > 0 ? '+' : ''}{cancer.change}%
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
                <StatusBadge status={cancer.level} />
                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }} flexWrap="wrap">
                  {cancer.factors.map((f, j) => (
                    <Chip key={j} label={f} size="small" variant="outlined" sx={{ fontSize: 10, height: 20, mt: 0.5 }} />
                  ))}
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Risk Factor Analysis" subtitle="Your modifiable and non-modifiable risk factors" />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Risk Factor</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Impact Level</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Score</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Modifiable</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {riskFactors.map((factor, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600, fontSize: 13 }}>{factor.name}</TableCell>
                        <TableCell>
                          <Chip label={factor.category} size="small" variant="outlined" sx={{ fontSize: 10, textTransform: 'capitalize' }} />
                        </TableCell>
                        <TableCell><StatusBadge status={factor.impact} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress variant="determinate" value={factor.score} sx={{ flex: 1, height: 6, borderRadius: 3 }} />
                            <Typography sx={{ fontSize: 11, fontWeight: 600, minWidth: 25 }}>{factor.score}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {factor.modifiable ? <CheckCircle sx={{ color: '#4caf50', fontSize: 20 }} /> : <Cancel sx={{ color: '#bdbdbd', fontSize: 20 }} />}
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: 'text.secondary', maxWidth: 200 }}>{factor.detail}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {recommendations.map((rec, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Card sx={{
                p: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateX(4px)' },
                borderLeft: `4px solid ${rec.priority === 'high' ? '#f44336' : rec.priority === 'medium' ? '#ff9800' : '#4caf50'}`,
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{rec.title}</Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Chip label={rec.priority} size="small" sx={{
                      fontWeight: 700, fontSize: 10,
                      bgcolor: rec.priority === 'high' ? '#ffebee' : rec.priority === 'medium' ? '#fff3e0' : '#e8f5e9',
                      color: rec.priority === 'high' ? '#c62828' : rec.priority === 'medium' ? '#e65100' : '#2e7d32',
                    }} />
                    <Chip label={rec.impact} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                  </Stack>
                </Stack>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>{rec.desc}</Typography>
                <Chip label={rec.category} size="small" variant="outlined" sx={{ fontSize: 10, textTransform: 'capitalize' }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Card sx={{ p: 3 }}>
          <SectionHeader title="Assessment History" subtitle="Track how your risk has changed over time" />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Risk Score</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Risk Level</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Change</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Confidence</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Data Sources</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessmentHistory.map((h, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{h.date}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{h.score}%</TableCell>
                    <TableCell><StatusBadge status={h.level} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {h.change < 0 ? <TrendingDown sx={{ fontSize: 16, color: '#4caf50' }} /> : <TrendingUp sx={{ fontSize: 16, color: '#f44336' }} />}
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: h.change < 0 ? '#4caf50' : '#f44336' }}>
                          {h.change > 0 ? '+' : ''}{h.change}%
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{h.confidence}%</TableCell>
                    <TableCell>{h.sources} sources</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Cancer Detail Dialog */}
      <Dialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{selectedCancer?.icon} {selectedCancer?.type} Risk Details</DialogTitle>
        <DialogContent>
          {selectedCancer && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box sx={{ textAlign: 'center' }}>
                <MetricGauge value={selectedCancer.risk} color={selectedCancer.level === 'very_low' ? '#4caf50' : selectedCancer.level === 'low' ? '#8bc34a' : '#ff9800'} size={120} unit="%" />
              </Box>
              <Alert severity={selectedCancer.risk < 10 ? 'success' : selectedCancer.risk < 20 ? 'info' : 'warning'}>
                Your risk for {selectedCancer.type} is {selectedCancer.level.replace(/_/g, ' ')}.
                {selectedCancer.change < 0 ? ' Trending downward - keep up the good work!' : ' Monitor and follow recommendations.'}
              </Alert>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Key Factors:</Typography>
              {selectedCancer.factors.map((f: string, i: number) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 18, color: '#4caf50' }} />
                  <Typography sx={{ fontSize: 13 }}>{f}</Typography>
                </Box>
              ))}
              <Typography sx={{ fontWeight: 600, fontSize: 14, mt: 1 }}>Recommended Screenings:</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                Schedule regular screening tests as recommended by your healthcare provider for early detection.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
          <Button variant="contained">Schedule Screening</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default CancerRiskPage;

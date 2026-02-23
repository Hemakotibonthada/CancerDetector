import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  LinearProgress, TextField, InputAdornment, IconButton, Select, MenuItem,
  FormControl, InputLabel, Divider, Alert, Badge, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Pagination, CircularProgress,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCancer, setSelectedCancer] = useState<any>(null);

  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState('low');
  const [modelConfidence, setModelConfidence] = useState(0);
  const [cancerTypeRisks, setCancerTypeRisks] = useState<any[]>([]);
  const [riskFactors, setRiskFactors] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<any[]>([]);

  const getRiskColor = (level: string) => {
    if (level === 'very_low') return '#4caf50';
    if (level === 'low') return '#8bc34a';
    if (level === 'moderate') return '#ff9800';
    return '#f44336';
  };
  const riskColor = getRiskColor(riskLevel);

  const iconMap: Record<string, string> = {
    lung: '🫁', breast: '🎀', colorectal: '🔬', prostate: '🩺', skin: '☀️',
    liver: '🫀', pancreatic: '🏥', leukemia: '🩸', thyroid: '🦋', bladder: '💧',
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [riskRes, historyRes] = await Promise.all([
        cancerDetectionAPI.predictRisk('me').catch(() => null),
        cancerDetectionAPI.getRiskHistory('me').catch(() => null),
      ]);

      if (riskRes?.data) {
        const d = riskRes.data;
        setRiskScore(d.overall_risk_score ?? d.risk_score ?? 0);
        setRiskLevel(d.risk_level ?? 'low');
        setModelConfidence(d.model_confidence ?? d.confidence ?? 0);

        if (Array.isArray(d.cancer_type_risks)) {
          setCancerTypeRisks(d.cancer_type_risks.map((c: any) => ({
            type: c.cancer_type ?? c.type ?? 'Unknown',
            risk: c.risk_score ?? c.risk ?? 0,
            level: c.risk_level ?? c.level ?? 'low',
            change: c.change ?? 0,
            factors: c.factors ?? c.contributing_factors ?? [],
            icon: iconMap[String(c.cancer_type ?? c.type ?? '').toLowerCase().split(' ')[0]] ?? '🔬',
          })));
        }

        if (Array.isArray(d.risk_factors)) {
          setRiskFactors(d.risk_factors.map((f: any) => ({
            name: f.name ?? f.factor_name ?? '',
            impact: f.impact ?? f.impact_level ?? 'low',
            modifiable: f.modifiable ?? f.is_modifiable ?? false,
            score: f.score ?? f.risk_score ?? 0,
            category: f.category ?? 'general',
            detail: f.detail ?? f.description ?? '',
          })));
        }

        if (Array.isArray(d.recommendations)) {
          setRecommendations(d.recommendations.map((r: any) => ({
            title: r.title ?? r.recommendation ?? '',
            desc: r.description ?? r.desc ?? '',
            priority: r.priority ?? 'medium',
            category: r.category ?? 'general',
            impact: r.impact ?? '',
          })));
        }
      }

      if (historyRes?.data) {
        const items = Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data.assessments ?? historyRes.data.history ?? []);
        setAssessmentHistory(items.map((h: any) => ({
          date: h.date ?? h.assessment_date ?? h.created_at ?? '',
          score: h.risk_score ?? h.score ?? 0,
          level: h.risk_level ?? h.level ?? 'low',
          change: h.change ?? 0,
          confidence: h.confidence ?? h.model_confidence ?? 0,
          sources: h.data_sources ?? h.sources ?? 0,
        })));
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load risk data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout title="Cancer Risk Assessment" subtitle="AI-powered comprehensive risk analysis" navItems={patientNavItems} portalType="patient">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button onClick={loadData}>Retry</Button>}>{error}</Alert>
      ) : riskScore === 0 && cancerTypeRisks.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>No Risk Assessment Yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>Run your first risk assessment to get personalized cancer risk analysis.</Typography>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadData}>Run Assessment</Button>
        </Card>
      ) : (<>
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

      </>)}

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

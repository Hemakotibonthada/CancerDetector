import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  IconButton, TextField, Select, MenuItem, FormControl, InputLabel,
  Alert, Divider, Tooltip,
} from '@mui/material';
import {
  Biotech as BiotechIcon, Science, TrendingUp, TrendingDown,
  Warning, CheckCircle, Info, Download, Refresh, FilterList,
  ArrowForward, Visibility, Add, Timeline,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { SectionHeader, StatusBadge, StatCard, MetricGauge, ProgressCard } from '../../components/common/SharedComponents';

const BloodTestsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [showBiomarkerDialog, setShowBiomarkerDialog] = useState(false);

  const bloodSamples = [
    { id: '1', sample_number: 'BS-2026-001', test_type: 'Complete Blood Count', collection_date: '2026-02-20', status: 'completed', total_tests: 15, normal: 13, abnormal: 2, critical: 0, ai_analyzed: true, ai_risk: 'low', lab: 'City Lab Corp' },
    { id: '2', sample_number: 'BS-2026-002', test_type: 'Tumor Marker Panel', collection_date: '2026-02-15', status: 'completed', total_tests: 8, normal: 7, abnormal: 1, critical: 0, ai_analyzed: true, ai_risk: 'moderate', lab: 'Cancer Research Lab' },
    { id: '3', sample_number: 'BS-2026-003', test_type: 'Metabolic Panel', collection_date: '2026-02-10', status: 'completed', total_tests: 14, normal: 14, abnormal: 0, critical: 0, ai_analyzed: true, ai_risk: 'very_low', lab: 'City Lab Corp' },
    { id: '4', sample_number: 'BS-2026-004', test_type: 'Lipid Panel', collection_date: '2026-02-05', status: 'processing', total_tests: 6, normal: 0, abnormal: 0, critical: 0, ai_analyzed: false, ai_risk: 'pending', lab: 'QuickTest Labs' },
    { id: '5', sample_number: 'BS-2025-012', test_type: 'Inflammatory Markers', collection_date: '2025-12-18', status: 'completed', total_tests: 5, normal: 4, abnormal: 1, critical: 0, ai_analyzed: true, ai_risk: 'low', lab: 'City Lab Corp' },
  ];

  const biomarkers = [
    { name: 'WBC Count', value: 7.2, unit: 'K/uL', min: 4.0, max: 11.0, category: 'CBC', status: 'normal', trend: 'stable' },
    { name: 'RBC Count', value: 4.8, unit: 'M/uL', min: 4.2, max: 5.8, category: 'CBC', status: 'normal', trend: 'stable' },
    { name: 'Hemoglobin', value: 14.2, unit: 'g/dL', min: 12.0, max: 17.5, category: 'CBC', status: 'normal', trend: 'up' },
    { name: 'Platelets', value: 245, unit: 'K/uL', min: 150, max: 400, category: 'CBC', status: 'normal', trend: 'stable' },
    { name: 'PSA', value: 3.8, unit: 'ng/mL', min: 0, max: 4.0, category: 'Tumor Marker', status: 'borderline', trend: 'up' },
    { name: 'CEA', value: 2.1, unit: 'ng/mL', min: 0, max: 3.0, category: 'Tumor Marker', status: 'normal', trend: 'down' },
    { name: 'AFP', value: 5.2, unit: 'ng/mL', min: 0, max: 10, category: 'Tumor Marker', status: 'normal', trend: 'stable' },
    { name: 'CA-125', value: 18, unit: 'U/mL', min: 0, max: 35, category: 'Tumor Marker', status: 'normal', trend: 'down' },
    { name: 'CA 19-9', value: 12, unit: 'U/mL', min: 0, max: 37, category: 'Tumor Marker', status: 'normal', trend: 'stable' },
    { name: 'CRP', value: 4.5, unit: 'mg/L', min: 0, max: 3.0, category: 'Inflammatory', status: 'abnormal', trend: 'up' },
    { name: 'ESR', value: 18, unit: 'mm/hr', min: 0, max: 20, category: 'Inflammatory', status: 'normal', trend: 'stable' },
    { name: 'Glucose', value: 102, unit: 'mg/dL', min: 70, max: 100, category: 'Metabolic', status: 'borderline', trend: 'up' },
    { name: 'Creatinine', value: 1.0, unit: 'mg/dL', min: 0.7, max: 1.3, category: 'Metabolic', status: 'normal', trend: 'stable' },
    { name: 'ALT', value: 28, unit: 'U/L', min: 7, max: 56, category: 'Liver', status: 'normal', trend: 'stable' },
    { name: 'Vitamin D', value: 38, unit: 'ng/mL', min: 30, max: 100, category: 'Vitamin', status: 'normal', trend: 'up' },
    { name: 'Iron', value: 85, unit: 'ug/dL', min: 60, max: 170, category: 'Mineral', status: 'normal', trend: 'stable' },
  ];

  const getMarkerColor = (status: string) => {
    if (status === 'normal') return '#4caf50';
    if (status === 'borderline') return '#ff9800';
    if (status === 'abnormal') return '#f44336';
    return '#9e9e9e';
  };

  return (
    <AppLayout title="Blood Tests & Biomarkers" subtitle="Comprehensive blood analysis dashboard" navItems={patientNavItems} portalType="patient">
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<BiotechIcon />} label="Total Samples" value={bloodSamples.length} color="#00897b" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Normal Results" value={38} color="#4caf50" change={5} /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Abnormal Values" value={4} color="#f44336" change={-1} /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Science />} label="AI Analyzed" value={4} color="#1565c0" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Blood Samples" />
        <Tab label="Biomarker Dashboard" />
        <Tab label="Tumor Markers" />
        <Tab label="Trends" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Sample #</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Test Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Lab</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Results</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>AI Risk</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bloodSamples.map((sample) => (
                  <TableRow key={sample.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600 }}>{sample.sample_number}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontWeight: 500 }}>{sample.test_type}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{sample.collection_date}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{sample.lab}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Chip label={`${sample.normal} Normal`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontSize: 10, height: 22 }} />
                        {sample.abnormal > 0 && <Chip label={`${sample.abnormal} Abnormal`} size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontSize: 10, height: 22 }} />}
                      </Stack>
                    </TableCell>
                    <TableCell><StatusBadge status={sample.ai_risk} /></TableCell>
                    <TableCell><StatusBadge status={sample.status} /></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => { setSelectedSample(sample); setShowBiomarkerDialog(true); }}><Visibility sx={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small"><Download sx={{ fontSize: 18 }} /></IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {biomarkers.map((marker, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Card sx={{
                p: 2, borderLeft: `4px solid ${getMarkerColor(marker.status)}`,
                transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{marker.name}</Typography>
                    <Chip label={marker.category} size="small" variant="outlined" sx={{ fontSize: 9, height: 18, mt: 0.3 }} />
                  </Box>
                  {marker.trend === 'up' ? <TrendingUp sx={{ fontSize: 18, color: marker.status === 'normal' ? '#4caf50' : '#f44336' }} /> :
                   marker.trend === 'down' ? <TrendingDown sx={{ fontSize: 18, color: '#4caf50' }} /> : null}
                </Stack>
                <Typography sx={{ fontWeight: 800, fontSize: 24, color: getMarkerColor(marker.status) }}>
                  {marker.value} <Typography component="span" sx={{ fontSize: 12, fontWeight: 400, color: 'text.secondary' }}>{marker.unit}</Typography>
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.3 }}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Range: {marker.min} - {marker.max}</Typography>
                    <StatusBadge status={marker.status} />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(((marker.value - marker.min) / (marker.max - marker.min)) * 100, 100)}
                    sx={{ height: 4, borderRadius: 2, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: getMarkerColor(marker.status), borderRadius: 2 } }}
                  />
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ p: 3 }}>
              <SectionHeader title="Tumor Marker Analysis" subtitle="AI-analyzed cancer biomarkers with trend data" icon={<Science />} />
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                All tumor markers are within normal limits. PSA is borderline - recommend re-testing in 3 months.
              </Alert>
              <Grid container spacing={2}>
                {biomarkers.filter(m => m.category === 'Tumor Marker').map((marker, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card sx={{ p: 2.5, textAlign: 'center', bgcolor: `${getMarkerColor(marker.status)}08` }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>{marker.name}</Typography>
                      <MetricGauge value={Math.round((marker.value / marker.max) * 100)} color={getMarkerColor(marker.status)} size={100} unit="%" />
                      <Typography sx={{ fontWeight: 800, fontSize: 20, mt: 1, color: getMarkerColor(marker.status) }}>
                        {marker.value} {marker.unit}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Reference: 0 - {marker.max} {marker.unit}</Typography>
                      <StatusBadge status={marker.status} />
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Card sx={{ p: 3 }}>
          <SectionHeader title="Biomarker Trends" subtitle="6-month trend analysis for key markers" />
          <Grid container spacing={3}>
            {['PSA', 'CEA', 'CRP', 'Glucose', 'Hemoglobin', 'WBC Count'].map((name, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>{name} Trend</Typography>
                  <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 80 }}>
                    {[40, 55, 48, 60, 52, 45].map((h, j) => (
                      <Box key={j} sx={{
                        flex: 1, height: `${h}%`, borderRadius: 1,
                        bgcolor: j === 5 ? '#1565c0' : '#e3f2fd',
                        transition: 'height 0.5s',
                      }} />
                    ))}
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Sep</Typography>
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>Feb</Typography>
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {/* Biomarker Detail Dialog */}
      <Dialog open={showBiomarkerDialog} onClose={() => setShowBiomarkerDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Sample Details - {selectedSample?.sample_number}</DialogTitle>
        <DialogContent>
          {selectedSample && (
            <Box>
              <Stack direction="row" spacing={3} sx={{ mb: 3, pt: 1 }}>
                <Box><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Test Type</Typography><Typography sx={{ fontWeight: 600 }}>{selectedSample.test_type}</Typography></Box>
                <Box><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Date</Typography><Typography sx={{ fontWeight: 600 }}>{selectedSample.collection_date}</Typography></Box>
                <Box><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Lab</Typography><Typography sx={{ fontWeight: 600 }}>{selectedSample.lab}</Typography></Box>
                <Box><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>AI Risk</Typography><StatusBadge status={selectedSample.ai_risk} /></Box>
              </Stack>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Marker</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reference Range</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {biomarkers.slice(0, 8).map((m, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 500 }}>{m.name}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: getMarkerColor(m.status) }}>{m.value}</TableCell>
                        <TableCell>{m.unit}</TableCell>
                        <TableCell>{m.min} - {m.max}</TableCell>
                        <TableCell><StatusBadge status={m.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBiomarkerDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>Download Report</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default BloodTestsPage;

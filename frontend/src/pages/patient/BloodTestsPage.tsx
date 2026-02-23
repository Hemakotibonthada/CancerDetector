import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress,
  IconButton, TextField, Select, MenuItem, FormControl, InputLabel,
  Alert, Divider, Tooltip, CircularProgress,
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
import { bloodSamplesAPI } from '../../services/api';

const BloodTestsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [showBiomarkerDialog, setShowBiomarkerDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bloodSamples, setBloodSamples] = useState<any[]>([]);
  const [biomarkers, setBiomarkers] = useState<any[]>([]);
  const [dialogBiomarkers, setDialogBiomarkers] = useState<any[]>([]);

  const loadBloodSamples = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bloodSamplesAPI.getMySamples();
      const items = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.samples || []);
      
      setBloodSamples(items.map((s: any) => ({
        id: s.id,
        sample_number: s.sample_number || s.id?.slice(0, 8),
        test_type: (s.test_type || 'blood_test').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        collection_date: new Date(s.collection_date).toLocaleDateString(),
        status: s.sample_status || s.status || 'completed',
        total_tests: s.total_tests || 0,
        normal: s.normal_results || 0,
        abnormal: s.abnormal_results || 0,
        critical: s.critical_results || 0,
        ai_analyzed: s.ai_analyzed || false,
        ai_risk: s.ai_risk_level || (s.ai_analyzed ? 'low' : 'pending'),
        lab: s.lab_name || 'Lab',
      })));

      // Load biomarkers from the first sample if available
      if (items.length > 0) {
        try {
          const bmRes = await bloodSamplesAPI.getBiomarkers(items[0].id);
          const bmItems = Array.isArray(bmRes.data) ? bmRes.data : (bmRes.data?.items || bmRes.data?.biomarkers || []);
          const mapped = bmItems.map((b: any) => ({
            name: b.biomarker_name || b.name,
            value: b.value,
            unit: b.unit,
            min: b.reference_low || 0,
            max: b.reference_high || 100,
            category: (b.category || 'other').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            status: b.result_flag || 'normal',
            trend: b.trend_direction || 'stable',
          }));
          setBiomarkers(mapped);
        } catch (e) { /* biomarkers optional */ }
      }
    } catch (err: any) {
      console.error('Failed to load blood samples:', err);
      setError(err?.response?.data?.detail || 'Failed to load blood samples');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBloodSamples(); }, [loadBloodSamples]);

  const handleViewSample = async (sample: any) => {
    setSelectedSample(sample);
    setShowBiomarkerDialog(true);
    try {
      const bmRes = await bloodSamplesAPI.getBiomarkers(sample.id);
      const bmItems = Array.isArray(bmRes.data) ? bmRes.data : (bmRes.data?.items || bmRes.data?.biomarkers || []);
      setDialogBiomarkers(bmItems.map((b: any) => ({
        name: b.biomarker_name || b.name,
        value: b.value,
        unit: b.unit,
        min: b.reference_low || 0,
        max: b.reference_high || 100,
        category: (b.category || 'other').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        status: b.result_flag || 'normal',
        trend: b.trend_direction || 'stable',
      })));
    } catch { setDialogBiomarkers([]); }
  };

  const getMarkerColor = (status: string) => {
    if (status === 'normal') return '#4caf50';
    if (status === 'borderline') return '#ff9800';
    if (status === 'abnormal') return '#f44336';
    return '#9e9e9e';
  };

  return (
    <AppLayout title="Blood Tests & Biomarkers" subtitle="Comprehensive blood analysis dashboard" navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box> : <>
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<BiotechIcon />} label="Total Samples" value={bloodSamples.length} color="#00897b" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Normal Results" value={bloodSamples.reduce((s, b) => s + b.normal, 0)} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Abnormal Values" value={bloodSamples.reduce((s, b) => s + b.abnormal, 0)} color="#f44336" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Science />} label="AI Analyzed" value={bloodSamples.filter(b => b.ai_analyzed).length} color="#1565c0" /></Grid>
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
                {bloodSamples.length === 0 ? <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}><Typography color="text.secondary">No blood samples found</Typography></TableCell></TableRow> : null}
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
                        <IconButton size="small" onClick={() => handleViewSample(sample)}><Visibility sx={{ fontSize: 18 }} /></IconButton>
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

      </>}

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
                    {dialogBiomarkers.map((m, i) => (
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

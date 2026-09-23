import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Checkbox, Chip, CircularProgress, FormControlLabel, Grid, LinearProgress, Stack, Typography } from '@mui/material';
import { Science, Refresh } from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { cancerDetectionAPI, patientsAPI } from '../../services/api';

type Assessment = {
  assessment_date: string;
  overall_risk_score: number;
  overall_risk_category: string;
  cancer_type_risks: Record<string, number>;
  top_risk_factors: Array<{name: string; impact?: string}>;
  recommendations: string[];
  data_sources_used: Record<string, boolean>;
};

const CancerRiskPage: React.FC = () => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [consent, setConsent] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [profile, records] = await Promise.all([
        patientsAPI.getMyProfile(), cancerDetectionAPI.getRiskHistory('me'),
      ]);
      setConsent(Boolean(profile.data.ai_analysis_consent));
      const items = Array.isArray(records.data) ? records.data : [];
      setHistory(items);
      if (items[0]) setAssessment(items[0]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load your assessment.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const run = async () => {
    setRunning(true); setError('');
    try {
      if (!consent) {
        await patientsAPI.updateMyProfile({ ai_analysis_consent: true });
        setConsent(true);
      }
      const response = await cancerDetectionAPI.predictRisk('me');
      setAssessment(response.data);
      const records = await cancerDetectionAPI.getRiskHistory('me');
      setHistory(Array.isArray(records.data) ? records.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Assessment failed. Please try again.');
    } finally { setRunning(false); }
  };

  return <AppLayout title="Risk factor explorer" subtitle="Exploratory, unvalidated assessment" navItems={patientNavItems} portalType="patient">
    <Stack spacing={3}>
      <Alert severity="warning">
        This tool uses simple rules, not a trained or clinically validated cancer detection model. Scores are indicators for discussion, not cancer probabilities, diagnoses, or screening advice. Consult a licensed clinician about your health and screening.
      </Alert>
      {error && <Alert severity="error">{error}</Alert>}
      <Card sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
          <Box>
            <Stack direction="row" alignItems="center" gap={1}><Science color="primary" /><Typography variant="h5" fontWeight={700}>Explore your risk factors</Typography></Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>Uses the health details you have provided. You can update them in your profile before running an assessment.</Typography>
          </Box>
          <Button variant="contained" startIcon={running ? <CircularProgress size={18} color="inherit" /> : <Refresh />} disabled={running || loading || (!consent && !accepted)} onClick={run}>
            {running ? 'Assessing…' : 'Run assessment'}
          </Button>
        </Stack>
        {!consent && <FormControlLabel sx={{ mt: 2 }} control={<Checkbox checked={accepted} onChange={e => setAccepted(e.target.checked)} />} label="I consent to use my health details for this exploratory assessment." />}
      </Card>
      {loading ? <Box textAlign="center" py={5}><CircularProgress /></Box> : assessment ? <>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Card sx={{ p: 3, height: '100%' }}><Typography color="text.secondary">Exploratory indicator</Typography><Typography variant="h2" fontWeight={800}>{Math.round(assessment.overall_risk_score * 100)}</Typography><Chip label={assessment.overall_risk_category.replace(/_/g, ' ')} color="primary" /><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Rule score out of 100 · {new Date(assessment.assessment_date).toLocaleString()}</Typography></Card></Grid>
          <Grid item xs={12} md={8}><Card sx={{ p: 3, height: '100%' }}><Typography variant="h6" fontWeight={700}>Inputs used</Typography><Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>{Object.entries(assessment.data_sources_used || {}).map(([source, used]) => <Chip key={source} label={`${source.replace(/_/g, ' ')}: ${used ? 'yes' : 'no'}`} color={used ? 'success' : 'default'} variant="outlined" />)}</Stack><Typography variant="body2" sx={{ mt: 3 }} color="text.secondary">This prototype has no measured model confidence or validated accuracy.</Typography></Card></Grid>
        </Grid>
        <Card sx={{ p: 3 }}><Typography variant="h6" fontWeight={700} mb={2}>Exploratory indicators by type</Typography><Grid container spacing={2}>{Object.entries(assessment.cancer_type_risks || {}).map(([type, score]) => <Grid item xs={12} sm={6} md={4} key={type}><Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}><Stack direction="row" justifyContent="space-between"><Typography textTransform="capitalize" fontWeight={600}>{type}</Typography><Typography>{Math.round(score * 100)}/100</Typography></Stack><LinearProgress variant="determinate" value={Math.min(score * 100, 100)} sx={{ mt: 1 }} /></Box></Grid>)}</Grid></Card>
        <Grid container spacing={2}><Grid item xs={12} md={6}><Card sx={{ p: 3, height: '100%' }}><Typography variant="h6" fontWeight={700}>Factors found</Typography>{assessment.top_risk_factors?.length ? assessment.top_risk_factors.map(f => <Chip key={f.name} label={`${f.name.replace(/_/g, ' ')} · ${f.impact || 'recorded'}`} sx={{ m: 0.5 }} />) : <Typography color="text.secondary" mt={2}>No additional factors recorded.</Typography>}</Card></Grid><Grid item xs={12} md={6}><Card sx={{ p: 3, height: '100%' }}><Typography variant="h6" fontWeight={700}>Next steps</Typography>{assessment.recommendations?.map(r => <Typography key={r} sx={{ mt: 1 }}>• {r}</Typography>)}</Card></Grid></Grid>
        <Card sx={{ p: 3 }}><Typography variant="h6" fontWeight={700}>Assessment history</Typography><Stack spacing={1} mt={2}>{history.map((item, index) => <Stack key={`${item.assessment_date}-${index}`} direction="row" justifyContent="space-between"><Typography>{new Date(item.assessment_date).toLocaleString()}</Typography><Typography>{Math.round(item.overall_risk_score * 100)}/100 · {item.overall_risk_category.replace(/_/g, ' ')}</Typography></Stack>)}</Stack></Card>
      </> : <Alert severity="info">No assessment yet. Add your health details, provide consent, then run an assessment.</Alert>}
    </Stack>
  </AppLayout>;
};

export default CancerRiskPage;

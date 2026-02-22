import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, List, ListItem, ListItemText,
  Divider, CircularProgress,
} from '@mui/material';
import {
  Biotech as GenomicsIcon, Science as ScienceIcon,
  Assessment as ReportIcon, Bloodtype as BiopsyIcon,
  LocalPharmacy as PharmaIcon, FamilyRestroom as HereditaryIcon,
  BubbleChart as ExpressionIcon, Timeline as TimelineIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { genomicsAPI } from '../../services/api';

const GenomicsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [sequences, setSequences] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [panels, setGenePanels] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [seq, rep, pan, st] = await Promise.all([
        genomicsAPI.getSequences().catch(() => ({ data: [] })),
        genomicsAPI.getReports().catch(() => ({ data: [] })),
        genomicsAPI.getGenePanels().catch(() => ({ data: [] })),
        genomicsAPI.getDashboardStats().catch(() => ({ data: {} })),
      ]);
      setSequences(seq.data || []);
      setReports(rep.data || []);
      setGenePanels(pan.data || []);
      setStats(st.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { completed: '#4caf50', analyzing: '#ff9800', sequencing: '#2196f3', submitted: '#9e9e9e', failed: '#f44336' };
    return map[s] || '#9e9e9e';
  };

  return (
    <AppLayout title="Genomics & Precision Medicine" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Sequences', value: sequences.length, icon: <GenomicsIcon />, color: '#e91e63' },
            { label: 'Reports', value: reports.length, icon: <ReportIcon />, color: '#2196f3' },
            { label: 'Gene Panels', value: panels.length, icon: <ScienceIcon />, color: '#4caf50' },
            { label: 'Actionable Variants', value: stats?.actionable_variants || 0, icon: <TimelineIcon />, color: '#ff9800' },
          ].map((stat, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: stat.color, mb: 1 }}>{stat.icon}</Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>{stat.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{stat.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Genomic Reports" icon={<ReportIcon />} iconPosition="start" />
          <Tab label="Gene Panels" icon={<ScienceIcon />} iconPosition="start" />
          <Tab label="Liquid Biopsies" icon={<BiopsyIcon />} iconPosition="start" />
          <Tab label="Pharmacogenomics" icon={<PharmaIcon />} iconPosition="start" />
          <Tab label="Hereditary Panels" icon={<HereditaryIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {reports.length === 0 ? (
              <Alert severity="info">No genomic reports available. Ask your oncologist about genomic testing.</Alert>
            ) : reports.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" sx={{ color: '#fff' }}>{r.report_type}</Typography>
                    <Chip label={r.status} size="small" sx={{ bgcolor: `${statusColor(r.status)}30`, color: statusColor(r.status) }} />
                  </Stack>
                  {r.findings_summary && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>{r.findings_summary}</Typography>}
                  {r.actionable_variants !== undefined && (
                    <Chip label={`${r.actionable_variants} Actionable Variants`} size="small" sx={{ mt: 1, bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350' }} />
                  )}
                  {r.recommendations && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>{r.recommendations}</Typography>}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2}>
            {panels.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No gene panels available.</Alert></Grid>
            ) : panels.map((p: any) => (
              <Grid item xs={12} md={6} lg={4} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <ScienceIcon sx={{ color: '#e91e63', fontSize: 36, mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#fff' }}>{p.name}</Typography>
                    <Chip label={p.panel_type} size="small" sx={{ mt: 1, bgcolor: 'rgba(233,30,99,0.3)', color: '#f48fb1' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{p.description}</Typography>
                    {p.turnaround_days && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mt: 1 }}>
                        Turnaround: {p.turnaround_days} days
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 2 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Liquid biopsies track circulating tumor DNA (ctDNA) to monitor treatment response. Your oncology team can order this test.
          </Alert>
        )}

        {activeTab === 3 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Pharmacogenomics analyzes how your genes affect drug metabolism. This helps personalize medication dosing for cancer treatments.
          </Alert>
        )}

        {activeTab === 4 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Hereditary cancer panels test for genetic mutations (BRCA1/2, Lynch syndrome, etc.) that increase cancer risk. Speak with a genetic counselor.
          </Alert>
        )}
      </Box>
    </AppLayout>
  );
};

export default GenomicsPage;

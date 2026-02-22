import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  Biotech as GenIcon, Science as SeqIcon, Description as RepIcon,
  BubbleChart as VarIcon, Bloodtype as LiqIcon, Medication as PharmIcon,
  AccountTree as PanelIcon, FamilyRestroom as HeredIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { genomicsAPI } from '../../services/api';

const GenomicsLabPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [sequences, setSequences] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [panels, setPanels] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [liquidBiopsies, setLiquidBiopsies] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [seq, vr, pn, rp, lb] = await Promise.all([
        genomicsAPI.getSequences().catch(() => ({ data: [] })),
        genomicsAPI.getVariants('').catch(() => ({ data: [] })),
        genomicsAPI.getGenePanels().catch(() => ({ data: [] })),
        genomicsAPI.getReports().catch(() => ({ data: [] })),
        genomicsAPI.getLiquidBiopsies('').catch(() => ({ data: [] })),
      ]);
      setSequences(seq.data || []);
      setVariants(vr.data || []);
      setPanels(pn.data || []);
      setReports(rp.data || []);
      setLiquidBiopsies(lb.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Genomics Laboratory" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Sequences', value: sequences.length, icon: <SeqIcon />, color: '#2196f3' },
            { label: 'Variants', value: variants.length, icon: <VarIcon />, color: '#f44336' },
            { label: 'Gene Panels', value: panels.length, icon: <PanelIcon />, color: '#4caf50' },
            { label: 'Reports', value: reports.length, icon: <RepIcon />, color: '#ff9800' },
          ].map((s, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>{s.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Sequences" icon={<SeqIcon />} iconPosition="start" />
          <Tab label="Variants" icon={<VarIcon />} iconPosition="start" />
          <Tab label="Gene Panels" icon={<PanelIcon />} iconPosition="start" />
          <Tab label="Reports" icon={<RepIcon />} iconPosition="start" />
          <Tab label="Liquid Biopsies" icon={<LiqIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Sample ID</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Patient</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Platform</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Coverage</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sequences.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ color: '#fff' }}>{s.sample_id}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.patient_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.sequence_type}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.platform}</TableCell>
                    <TableCell sx={{ color: '#4caf50' }}>{s.coverage}x</TableCell>
                    <TableCell><Chip label={s.status} size="small"
                      sx={{ bgcolor: s.status === 'completed' ? 'rgba(76,175,80,0.3)' : s.status === 'processing' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)',
                            color: s.status === 'completed' ? '#81c784' : s.status === 'processing' ? '#90caf9' : '#ffb74d' }} /></TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {sequences.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No sequences</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Gene</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Variant</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Significance</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Allele Freq</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Actionable</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variants.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>{v.gene_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{v.variant_name || v.hgvs_notation}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{v.variant_type}</TableCell>
                    <TableCell><Chip label={v.clinical_significance || 'VUS'} size="small"
                      sx={{ bgcolor: v.clinical_significance === 'pathogenic' ? 'rgba(244,67,54,0.3)' : v.clinical_significance === 'benign' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                            color: v.clinical_significance === 'pathogenic' ? '#ef5350' : v.clinical_significance === 'benign' ? '#81c784' : '#ffb74d' }} /></TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{v.allele_frequency ? `${(v.allele_frequency * 100).toFixed(2)}%` : '-'}</TableCell>
                    <TableCell>{v.is_actionable ? <Chip label="Yes" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} /> : <Chip label="No" size="small" sx={{ bgcolor: 'rgba(158,158,158,0.3)', color: '#9e9e9e' }} />}</TableCell>
                  </TableRow>
                ))}
                {variants.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No variants</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {panels.map((p: any) => (
              <Grid item xs={12} md={6} lg={4} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{p.panel_name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{p.description}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={`${p.gene_count || 0} genes`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={p.panel_type} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                    </Stack>
                    {p.turnaround_days && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>TAT: {p.turnaround_days} days</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {panels.length === 0 && <Grid item xs={12}><Alert severity="info">No gene panels configured.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {reports.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>Genomic Report #{r.id}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {r.patient_name} • Panel: {r.panel_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {r.actionable_variants || 0} actionable variants • TMB: {r.tumor_mutational_burden || '-'}
                      </Typography>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={r.status} size="small"
                        sx={{ bgcolor: r.status === 'finalized' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: r.status === 'finalized' ? '#81c784' : '#ffb74d' }} />
                      {r.status !== 'finalized' && (
                        <Button size="small" variant="outlined" sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                          onClick={async () => { await genomicsAPI.createReport({ id: r.id, status: 'finalized' }); loadData(); }}>Finalize</Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {reports.length === 0 && <Alert severity="info">No genomic reports.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {liquidBiopsies.map((lb: any) => (
              <Card key={lb.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <LiqIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#f44336' }} />
                        Liquid Biopsy #{lb.id}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {lb.patient_name} • Sample: {lb.sample_type} • ctDNA: {lb.ctdna_fraction || '-'}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(lb.collection_date).toLocaleDateString()} • Variants found: {lb.variants_found || 0}
                      </Typography>
                    </Box>
                    <Chip label={lb.status} size="small"
                      sx={{ bgcolor: lb.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)',
                            color: lb.status === 'completed' ? '#81c784' : '#90caf9' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {liquidBiopsies.length === 0 && <Alert severity="info">No liquid biopsies.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default GenomicsLabPage;

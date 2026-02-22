import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  Science as StudyIcon, Group as CohortIcon,
  MenuBook as PubIcon, Storage as DatasetIcon,
  Gavel as IRBIcon, Assessment as MetricsIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { researchAPI } from '../../services/api';

const ResearchPortalPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [studies, setStudies] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [irb, setIrb] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, co, pb, ds, ir] = await Promise.all([
        researchAPI.getStudies().catch(() => ({ data: [] })),
        researchAPI.getCohorts('').catch(() => ({ data: [] })),
        researchAPI.getPublications().catch(() => ({ data: [] })),
        researchAPI.getDatasets().catch(() => ({ data: [] })),
        researchAPI.getIRBSubmissions('').catch(() => ({ data: [] })),
      ]);
      setStudies(st.data || []);
      setCohorts(co.data || []);
      setPublications(pb.data || []);
      setDatasets(ds.data || []);
      setIrb(ir.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Research Portal" navItems={adminNavItems} portalType="admin">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Active Studies', value: studies.filter(s => s.status === 'active').length, icon: <StudyIcon />, color: '#2196f3' },
            { label: 'Research Cohorts', value: cohorts.length, icon: <CohortIcon />, color: '#4caf50' },
            { label: 'Publications', value: publications.length, icon: <PubIcon />, color: '#ff9800' },
            { label: 'IRB Pending', value: irb.filter(i => i.status === 'pending').length, icon: <IRBIcon />, color: '#9c27b0' },
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
          <Tab label="Studies" icon={<StudyIcon />} iconPosition="start" />
          <Tab label="Cohorts" icon={<CohortIcon />} iconPosition="start" />
          <Tab label="Publications" icon={<PubIcon />} iconPosition="start" />
          <Tab label="Datasets" icon={<DatasetIcon />} iconPosition="start" />
          <Tab label="IRB Submissions" icon={<IRBIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {studies.map((s: any) => (
              <Card key={s.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{s.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        PI: {s.principal_investigator} • Protocol: {s.protocol_number}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{s.description}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={s.study_type || 'Observational'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                        <Chip label={s.phase || 'Phase II'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                        <Chip label={`${s.enrolled || 0}/${s.target_enrollment || 0} enrolled`} size="small"
                          sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                      </Stack>
                      {s.target_enrollment && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress variant="determinate" value={(s.enrolled / s.target_enrollment) * 100}
                            sx={{ bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
                        </Box>
                      )}
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={s.status} size="small"
                        sx={{ bgcolor: s.status === 'active' ? 'rgba(76,175,80,0.3)' : s.status === 'completed' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)',
                              color: s.status === 'active' ? '#81c784' : s.status === 'completed' ? '#90caf9' : '#ffb74d' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Funding: ${(s.funding_amount || 0).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {studies.length === 0 && <Alert severity="info">No research studies.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2}>
            {cohorts.map((c: any) => (
              <Grid item xs={12} md={6} key={c.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{c.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{c.description}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={`${c.patient_count || 0} patients`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={c.cancer_type || 'All Types'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                      Criteria: {c.inclusion_criteria || 'None specified'}
                    </Typography>
                    <Button variant="outlined" size="small" sx={{ mt: 1, color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>
                      View Cohort
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {cohorts.length === 0 && <Grid item xs={12}><Alert severity="info">No cohorts defined.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {publications.map((p: any) => (
              <Card key={p.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#fff' }}>{p.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Authors: {p.authors} • Journal: {p.journal}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip label={p.publication_type || 'Article'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    <Chip label={`Impact: ${p.impact_factor || '-'}`} size="small" sx={{ bgcolor: 'rgba(255,152,0,0.3)', color: '#ffb74d' }} />
                    <Chip label={p.status} size="small" sx={{ bgcolor: p.status === 'published' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                          color: p.status === 'published' ? '#81c784' : '#ffb74d' }} />
                    {p.citations && <Chip label={`${p.citations} citations`} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />}
                  </Stack>
                  {p.doi && <Typography variant="caption" sx={{ color: '#90caf9', mt: 1, display: 'block' }}>DOI: {p.doi}</Typography>}
                </CardContent>
              </Card>
            ))}
            {publications.length === 0 && <Alert severity="info">No publications.</Alert>}
          </Stack>
        )}

        {activeTab === 3 && (
          <Grid container spacing={2}>
            {datasets.map((d: any) => (
              <Grid item xs={12} md={6} key={d.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>
                      <DatasetIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#4caf50' }} />
                      {d.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{d.description}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={d.data_type || 'Clinical'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={`${d.record_count || 0} records`} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                      <Chip label={d.access_level || 'Restricted'} size="small"
                        sx={{ bgcolor: d.access_level === 'public' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: d.access_level === 'public' ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                      Format: {d.format || 'CSV'} • Size: {d.size_mb || '-'}MB • Updated: {d.updated_at ? new Date(d.updated_at).toLocaleDateString() : '-'}
                    </Typography>
                    <Button variant="outlined" size="small" sx={{ mt: 1, color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>
                      Request Access
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {datasets.length === 0 && <Grid item xs={12}><Alert severity="info">No datasets available.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 4 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Protocol</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Study Title</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>PI</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Submission Date</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Review Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {irb.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell sx={{ color: '#fff' }}>{i.protocol_number}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{i.study_title}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{i.pi_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(i.submission_date).toLocaleDateString()}</TableCell>
                    <TableCell><Chip label={i.review_type || 'Full Board'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} /></TableCell>
                    <TableCell>
                      <Chip label={i.status} size="small"
                        sx={{ bgcolor: i.status === 'approved' ? 'rgba(76,175,80,0.3)' : i.status === 'pending' ? 'rgba(255,152,0,0.3)' : 'rgba(33,150,243,0.3)',
                              color: i.status === 'approved' ? '#81c784' : i.status === 'pending' ? '#ffb74d' : '#90caf9' }} />
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>Review</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {irb.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No IRB submissions</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </AppLayout>
  );
};

export default ResearchPortalPage;

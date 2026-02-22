import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  Biotech as PathIcon, Science as SpecimenIcon,
  Assessment as ReportIcon, Groups as TumorBoardIcon,
  ViewInAr as SlideIcon, Palette as StainIcon,
  Assignment as CytoIcon, Dashboard as DashIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { pathologyAPI } from '../../services/api';

const PathologyManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [specimens, setSpecimens] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [tumorBoards, setTumorBoards] = useState<any[]>([]);
  const [cytology, setCytology] = useState<any[]>([]);
  const [protocols, setProtocols] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showNewSpecimen, setShowNewSpecimen] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sp, rp, tb, cy, pr, st] = await Promise.all([
        pathologyAPI.getSpecimens().catch(() => ({ data: [] })),
        pathologyAPI.getReports().catch(() => ({ data: [] })),
        pathologyAPI.getTumorBoards().catch(() => ({ data: [] })),
        pathologyAPI.getCytology().catch(() => ({ data: [] })),
        pathologyAPI.getStainingProtocols().catch(() => ({ data: [] })),
        pathologyAPI.getDashboardStats().catch(() => ({ data: {} })),
      ]);
      setSpecimens(sp.data || []);
      setReports(rp.data || []);
      setTumorBoards(tb.data || []);
      setCytology(cy.data || []);
      setProtocols(pr.data || []);
      setStats(st.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = { completed: '#4caf50', processing: '#ff9800', received: '#2196f3', collected: '#9e9e9e', final: '#4caf50', preliminary: '#ff9800', draft: '#9e9e9e' };
    return map[s] || '#9e9e9e';
  };

  return (
    <AppLayout title="Pathology Laboratory" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Specimens', value: specimens.length, icon: <SpecimenIcon />, color: '#e91e63' },
            { label: 'Reports', value: reports.length, icon: <ReportIcon />, color: '#2196f3' },
            { label: 'Tumor Boards', value: tumorBoards.length, icon: <TumorBoardIcon />, color: '#4caf50' },
            { label: 'Stain Protocols', value: protocols.length, icon: <StainIcon />, color: '#ff9800' },
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

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
            <Tab label="Specimens" />
            <Tab label="Reports" />
            <Tab label="Tumor Boards" />
            <Tab label="Cytology" />
          </Tabs>
          <Button variant="contained" onClick={() => setShowNewSpecimen(true)} sx={{ bgcolor: '#e91e63' }}>New Specimen</Button>
        </Stack>

        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Accession #</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Collection Site</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {specimens.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell sx={{ color: '#fff' }}>{s.accession_number}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{s.specimen_type}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{s.collection_site}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{s.collection_date ? new Date(s.collection_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell><Chip label={s.status} size="small" sx={{ bgcolor: `${statusColor(s.status)}30`, color: statusColor(s.status) }} /></TableCell>
                  </TableRow>
                ))}
                {specimens.length === 0 && (
                  <TableRow><TableCell colSpan={5} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No specimens found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {reports.length === 0 ? (
              <Alert severity="info">No pathology reports.</Alert>
            ) : reports.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6" sx={{ color: '#fff' }}>{r.diagnosis}</Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip label={r.status} size="small" sx={{ bgcolor: `${statusColor(r.status)}30`, color: statusColor(r.status) }} />
                      {r.status === 'draft' && (
                        <Button size="small" variant="outlined" sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                          onClick={async () => { await pathologyAPI.finalizeReport(r.id); loadData(); }}>
                          Finalize
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  {r.microscopic_findings && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>Microscopic: {r.microscopic_findings}</Typography>}
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {r.stage && <Chip label={`Stage ${r.stage}`} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />}
                    {r.grade && <Chip label={`Grade ${r.grade}`} size="small" sx={{ bgcolor: 'rgba(255,152,0,0.3)', color: '#ffb74d' }} />}
                    {r.margin_status && <Chip label={`Margins: ${r.margin_status}`} size="small" sx={{ bgcolor: r.margin_status === 'negative' ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)', color: r.margin_status === 'negative' ? '#81c784' : '#ef5350' }} />}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {tumorBoards.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No tumor board meetings scheduled.</Alert></Grid>
            ) : tumorBoards.map((tb: any) => (
              <Grid item xs={12} md={6} key={tb.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>Tumor Board</Typography>
                      <Chip label={tb.status} size="small" sx={{ bgcolor: tb.status === 'concluded' ? 'rgba(76,175,80,0.3)' : 'rgba(33,150,243,0.3)', color: tb.status === 'concluded' ? '#81c784' : '#90caf9' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>Date: {new Date(tb.meeting_date).toLocaleDateString()}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Summary: {tb.case_summary}</Typography>
                    {tb.recommendations && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>Recommendations: {tb.recommendations}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {cytology.length === 0 ? (
              <Alert severity="info">No cytology results.</Alert>
            ) : cytology.map((c: any) => (
              <Card key={c.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#fff' }}>Cytology Result</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Details available in full report.</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        <Dialog open={showNewSpecimen} onClose={() => setShowNewSpecimen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1a1a2e', color: '#fff' } }}>
          <DialogTitle>Register New Specimen</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Patient ID" fullWidth InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }} inputProps={{ style: { color: '#fff' } }} />
              <TextField label="Specimen Type" fullWidth InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }} inputProps={{ style: { color: '#fff' } }} />
              <TextField label="Collection Site" fullWidth InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }} inputProps={{ style: { color: '#fff' } }} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowNewSpecimen(false)} sx={{ color: '#90caf9' }}>Cancel</Button>
            <Button variant="contained" sx={{ bgcolor: '#e91e63' }}>Register</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default PathologyManagementPage;

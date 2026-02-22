import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, List, ListItem, ListItemText,
  ListItemIcon, Divider, Paper, CircularProgress, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  AccountTree as PathwayIcon, Warning as WarningIcon,
  CheckCircle as CheckIcon, LocalHospital as HospitalIcon,
  Science as ScienceIcon, Calculate as CalcIcon,
  NotificationsActive as AlertIcon, MenuBook as GuideIcon,
  Timeline as TimelineIcon, Assignment as AssignmentIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { clinicalDecisionAPI } from '../../services/api';

const ClinicalPathwaysPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [pathways, setPathways] = useState<any[]>([]);
  const [guidelines, setGuidelines] = useState<any[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [calculators, setCalculators] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [showCalcDialog, setShowCalcDialog] = useState(false);
  const [selectedCalc, setSelectedCalc] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pw, gl, al, cl, st] = await Promise.all([
        clinicalDecisionAPI.getPathways().catch(() => ({ data: [] })),
        clinicalDecisionAPI.getGuidelines().catch(() => ({ data: [] })),
        clinicalDecisionAPI.getAlerts().catch(() => ({ data: [] })),
        clinicalDecisionAPI.getCalculators().catch(() => ({ data: [] })),
        clinicalDecisionAPI.getDashboardStats().catch(() => ({ data: {} })),
      ]);
      setPathways(pw.data || []);
      setGuidelines(gl.data || []);
      setAlerts(al.data || []);
      setCalculators(cl.data || []);
      setStats(st.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const acknowledgeAlert = async (id: string) => {
    try {
      await clinicalDecisionAPI.acknowledgeAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_acknowledged: true } : a));
    } catch (e) { console.error(e); }
  };

  const severityColor = (s: string) => {
    const map: Record<string, string> = { info: '#2196f3', warning: '#ff9800', critical: '#f44336' };
    return map[s] || '#9e9e9e';
  };

  return (
    <AppLayout title="Clinical Decision Support" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Stats Row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Active Pathways', value: stats?.active_pathways || 0, icon: <PathwayIcon />, color: '#1976d2' },
            { label: 'Pending Alerts', value: alerts.filter(a => !a.is_acknowledged).length, icon: <AlertIcon />, color: '#f44336' },
            { label: 'Guidelines', value: guidelines.length, icon: <GuideIcon />, color: '#4caf50' },
            { label: 'Calculators', value: calculators.length, icon: <CalcIcon />, color: '#9c27b0' },
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
          <Tab label="My Pathways" icon={<PathwayIcon />} iconPosition="start" />
          <Tab label="Clinical Alerts" icon={<AlertIcon />} iconPosition="start" />
          <Tab label="Guidelines" icon={<GuideIcon />} iconPosition="start" />
          <Tab label="Calculators" icon={<CalcIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 0: Pathways */}
        {activeTab === 0 && (
          <Grid container spacing={2}>
            {pathways.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">No active clinical pathways. Your care team may enroll you in relevant pathways.</Alert>
              </Grid>
            ) : pathways.map((p: any) => (
              <Grid item xs={12} md={6} key={p.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{p.name}</Typography>
                      <Chip label={p.status} size="small" sx={{ bgcolor: p.status === 'active' ? '#4caf50' : '#9e9e9e', color: '#fff' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{p.description}</Typography>
                    {p.cancer_type && <Chip label={p.cancer_type} size="small" sx={{ mt: 1, mr: 1, bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />}
                    {p.stage && <Chip label={`Stage ${p.stage}`} size="small" sx={{ mt: 1, bgcolor: 'rgba(255,152,0,0.3)', color: '#ffb74d' }} />}
                    {p.progress_percentage !== undefined && (
                      <Box sx={{ mt: 2 }}>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Progress</Typography>
                          <Typography variant="caption" sx={{ color: '#90caf9' }}>{p.progress_percentage}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={p.progress_percentage} sx={{ mt: 0.5, height: 6, borderRadius: 3 }} />
                      </Box>
                    )}
                    {p.expected_duration_days && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1, display: 'block' }}>
                        Expected duration: {p.expected_duration_days} days
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Clinical Alerts */}
        {activeTab === 1 && (
          <Stack spacing={2}>
            {alerts.length === 0 ? (
              <Alert severity="success">No active clinical alerts.</Alert>
            ) : alerts.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${severityColor(a.severity)}40` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AlertIcon sx={{ color: severityColor(a.severity) }} />
                      <Typography variant="h6" sx={{ color: '#fff' }}>{a.title}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Chip label={a.severity} size="small" sx={{ bgcolor: `${severityColor(a.severity)}30`, color: severityColor(a.severity) }} />
                      {a.is_acknowledged ? (
                        <Chip label="Acknowledged" size="small" icon={<CheckIcon />} sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#4caf50' }} />
                      ) : (
                        <Button size="small" variant="outlined" onClick={() => acknowledgeAlert(a.id)} sx={{ color: '#90caf9', borderColor: '#90caf9' }}>
                          Acknowledge
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>{a.message}</Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Tab 2: Guidelines */}
        {activeTab === 2 && (
          <Grid container spacing={2}>
            {guidelines.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No clinical guidelines available.</Alert></Grid>
            ) : guidelines.map((g: any) => (
              <Grid item xs={12} md={6} lg={4} key={g.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>{g.title}</Typography>
                    <Chip label={g.category} size="small" sx={{ mb: 1, mr: 1, bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                    {g.evidence_grade && <Chip label={`Grade ${g.evidence_grade}`} size="small" sx={{ mb: 1, bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />}
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{g.summary || 'No summary available.'}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mt: 1 }}>
                      Source: {g.source_organization}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 3: Calculators */}
        {activeTab === 3 && (
          <Grid container spacing={2}>
            {calculators.length === 0 ? (
              <Grid item xs={12}><Alert severity="info">No clinical calculators available.</Alert></Grid>
            ) : calculators.map((c: any) => (
              <Grid item xs={12} md={6} lg={4} key={c.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', '&:hover': { borderColor: '#90caf9' } }}
                  onClick={() => { setSelectedCalc(c); setShowCalcDialog(true); }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CalcIcon sx={{ fontSize: 48, color: '#90caf9', mb: 1 }} />
                    <Typography variant="h6" sx={{ color: '#fff' }}>{c.name}</Typography>
                    <Chip label={c.category} size="small" sx={{ mt: 1, bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{c.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Calculator Dialog */}
        <Dialog open={showCalcDialog} onClose={() => setShowCalcDialog(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { bgcolor: '#1a1a2e', color: '#fff' } }}>
          <DialogTitle>{selectedCalc?.name || 'Calculator'}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
              {selectedCalc?.description}
            </Typography>
            <Alert severity="info">
              Clinical calculators are for reference only. Always consult your healthcare provider.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCalcDialog(false)} sx={{ color: '#90caf9' }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default ClinicalPathwaysPage;

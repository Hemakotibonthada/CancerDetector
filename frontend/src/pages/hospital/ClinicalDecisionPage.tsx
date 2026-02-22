import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import {
  MedicalInformation as CDSIcon, Warning as AlertIcon,
  Assessment as OrderIcon, Lightbulb as BPAIcon,
  Timeline as PathwayIcon, Medication as DrugIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { clinicalDecisionAPI } from '../../services/api';

const ClinicalDecisionPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [drugInteractions, setDrugInteractions] = useState<any[]>([]);
  const [orderSets, setOrderSets] = useState<any[]>([]);
  const [bpas, setBpas] = useState<any[]>([]);
  const [pathways, setPathways] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [al, di, os, bp, pw] = await Promise.all([
        clinicalDecisionAPI.getAlerts().catch(() => ({ data: [] })),
        clinicalDecisionAPI.getDrugInteractions().catch(() => ({ data: [] })),
        clinicalDecisionAPI.getOrderSets().catch(() => ({ data: [] })),
        clinicalDecisionAPI.getBPAs().catch(() => ({ data: [] })),
        clinicalDecisionAPI.getPathways().catch(() => ({ data: [] })),
      ]);
      setAlerts(al.data || []);
      setDrugInteractions(di.data || []);
      setOrderSets(os.data || []);
      setBpas(bp.data || []);
      setPathways(pw.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const severityColors: Record<string, string> = { high: '#f44336', medium: '#ff9800', low: '#4caf50', critical: '#d32f2f' };

  return (
    <AppLayout title="Clinical Decision Support" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Active Alerts', value: alerts.filter(a => !a.acknowledged).length, icon: <AlertIcon />, color: '#f44336' },
            { label: 'Drug Interactions', value: drugInteractions.filter(d => d.severity === 'high').length, icon: <DrugIcon />, color: '#ff9800' },
            { label: 'Order Sets', value: orderSets.length, icon: <OrderIcon />, color: '#2196f3' },
            { label: 'Active Pathways', value: pathways.filter(p => p.status === 'active').length, icon: <PathwayIcon />, color: '#4caf50' },
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
          <Tab label="CDS Alerts" icon={<AlertIcon />} iconPosition="start" />
          <Tab label="Drug Interactions" icon={<DrugIcon />} iconPosition="start" />
          <Tab label="Order Sets" icon={<OrderIcon />} iconPosition="start" />
          <Tab label="Best Practice Advisories" icon={<BPAIcon />} iconPosition="start" />
          <Tab label="Clinical Pathways" icon={<PathwayIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {alerts.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: `1px solid ${a.acknowledged ? 'rgba(255,255,255,0.1)' : `${severityColors[a.severity]}44`}`,
                opacity: a.acknowledged ? 0.6 : 1 }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <AlertIcon sx={{ mr: 1, verticalAlign: 'middle', color: severityColors[a.severity] }} />
                        {a.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>{a.message}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 0.5, display: 'block' }}>
                        Patient: {a.patient_name} • Provider: {a.provider_name} • {new Date(a.created_at).toLocaleString()}
                      </Typography>
                      {a.recommendation && (
                        <Alert severity="info" sx={{ mt: 1, py: 0, bgcolor: 'rgba(33,150,243,0.1)' }}>
                          <Typography variant="body2">Recommendation: {a.recommendation}</Typography>
                        </Alert>
                      )}
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={a.severity} size="small"
                        sx={{ bgcolor: `${severityColors[a.severity]}33`, color: severityColors[a.severity], fontWeight: 700 }} />
                      {!a.acknowledged && (
                        <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>
                          Acknowledge
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {alerts.length === 0 && <Alert severity="success">No active CDS alerts.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {drugInteractions.map((d: any) => (
              <Card key={d.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: `1px solid ${severityColors[d.severity] || 'rgba(255,255,255,0.1)'}44` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <DrugIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#ff9800' }} />
                        {d.drug_a} ↔ {d.drug_b}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>{d.interaction_type}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{d.description}</Typography>
                      {d.clinical_significance && (
                        <Typography variant="body2" sx={{ color: '#ffb74d', mt: 0.5 }}>Clinical Significance: {d.clinical_significance}</Typography>
                      )}
                      {d.management && <Typography variant="body2" sx={{ color: '#81c784', mt: 0.5 }}>Management: {d.management}</Typography>}
                    </Box>
                    <Chip label={d.severity} size="small"
                      sx={{ bgcolor: `${severityColors[d.severity]}33`, color: severityColors[d.severity], fontWeight: 700 }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {drugInteractions.length === 0 && <Alert severity="info">No drug interactions found.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {orderSets.map((o: any) => (
              <Grid item xs={12} md={6} key={o.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{o.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>{o.description}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Chip label={o.category} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={`${o.order_count || 0} orders`} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                      <Chip label={o.status} size="small" sx={{ bgcolor: o.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)', color: o.status === 'active' ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>View Orders</Button>
                      <Button variant="contained" size="small" sx={{ bgcolor: '#1976d2' }}>Apply</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {orderSets.length === 0 && <Grid item xs={12}><Alert severity="info">No order sets available.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {bpas.map((b: any) => (
              <Card key={b.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <BPAIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#ffd54f' }} />
                        {b.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{b.description}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Category: {b.category} • Trigger: {b.trigger_condition}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={`Fired: ${b.fire_count || 0}`} size="small" sx={{ bgcolor: 'rgba(255,152,0,0.3)', color: '#ffb74d' }} />
                        <Chip label={`Accepted: ${b.accept_rate || 0}%`} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                        <Chip label={`Override: ${b.override_rate || 0}%`} size="small" sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350' }} />
                      </Stack>
                    </Box>
                    <Chip label={b.status || 'active'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {bpas.length === 0 && <Alert severity="info">No best practice advisories.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {pathways.map((p: any) => (
              <Card key={p.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{p.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{p.description}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Cancer Type: {p.cancer_type} • Stage: {p.stage}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          Progress: {p.current_step}/{p.total_steps} steps
                        </Typography>
                        <LinearProgress variant="determinate"
                          value={p.total_steps ? (p.current_step / p.total_steps) * 100 : 0}
                          sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
                      </Box>
                    </Box>
                    <Stack spacing={1} alignItems="flex-end" sx={{ ml: 2 }}>
                      <Chip label={p.status} size="small"
                        sx={{ bgcolor: p.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: p.status === 'active' ? '#81c784' : '#ffb74d' }} />
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>
                        View Steps
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {pathways.length === 0 && <Alert severity="info">No clinical pathways.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default ClinicalDecisionPage;

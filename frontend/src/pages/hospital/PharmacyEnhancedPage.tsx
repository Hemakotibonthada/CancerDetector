import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  LocalPharmacy as PharmIcon, Medication as MedIcon,
  CompareArrows as RecIcon, Science as CompIcon,
  Lock as CtrlIcon, HealthAndSafety as SteIcon,
  Warning as AdrIcon, Checklist as DURIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { pharmacyEnhancedAPI } from '../../services/api';

const PharmacyEnhancedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [formulary, setFormulary] = useState<any[]>([]);
  const [durReviews, setDurReviews] = useState<any[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [compounded, setCompounded] = useState<any[]>([]);
  const [controlled, setControlled] = useState<any[]>([]);
  const [stewardship, setStewardship] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fm, dur, rec, cmp, ctrl, stw, intv] = await Promise.all([
        pharmacyEnhancedAPI.getFormulary().catch(() => ({ data: [] })),
        pharmacyEnhancedAPI.getDURs().catch(() => ({ data: [] })),
        pharmacyEnhancedAPI.getMedicationReconciliations().catch(() => ({ data: [] })),
        pharmacyEnhancedAPI.getCompoundedMeds().catch(() => ({ data: [] })),
        pharmacyEnhancedAPI.getControlledSubstanceLogs().catch(() => ({ data: [] })),
        pharmacyEnhancedAPI.getAntibioticStewardship().catch(() => ({ data: [] })),
        pharmacyEnhancedAPI.getInterventions().catch(() => ({ data: [] })),
      ]);
      setFormulary(fm.data || []);
      setDurReviews(dur.data || []);
      setReconciliations(rec.data || []);
      setCompounded(cmp.data || []);
      setControlled(ctrl.data || []);
      setStewardship(stw.data || []);
      setInterventions(intv.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Pharmacy Management" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Formulary Items', value: formulary.length, icon: <PharmIcon />, color: '#2196f3' },
            { label: 'DUR Alerts', value: durReviews.filter(d => d.status === 'pending').length, icon: <DURIcon />, color: '#f44336' },
            { label: 'Reconciliations', value: reconciliations.length, icon: <RecIcon />, color: '#ff9800' },
            { label: 'Interventions', value: interventions.length, icon: <MedIcon />, color: '#4caf50' },
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
          <Tab label="Formulary" icon={<PharmIcon />} iconPosition="start" />
          <Tab label="DUR Reviews" icon={<DURIcon />} iconPosition="start" />
          <Tab label="Reconciliation" icon={<RecIcon />} iconPosition="start" />
          <Tab label="Compounding" icon={<CompIcon />} iconPosition="start" />
          <Tab label="Controlled" icon={<CtrlIcon />} iconPosition="start" />
          <Tab label="Stewardship" icon={<SteIcon />} iconPosition="start" />
          <Tab label="Interventions" icon={<MedIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Drug Name</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Generic</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Class</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Tier</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Restrictions</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formulary.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell sx={{ color: '#fff', fontWeight: 700 }}>{f.brand_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{f.generic_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{f.drug_class}</TableCell>
                    <TableCell><Chip label={`Tier ${f.formulary_tier || 1}`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} /></TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{f.restrictions || 'None'}</TableCell>
                    <TableCell><Chip label={f.status || 'active'} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} /></TableCell>
                  </TableRow>
                ))}
                {formulary.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No formulary items</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {durReviews.map((d: any) => (
              <Card key={d.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: `1px solid ${d.alert_level === 'critical' ? 'rgba(244,67,54,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{d.alert_type}: {d.drug_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Patient: {d.patient_name} • {d.description}</Typography>
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={d.alert_level} size="small"
                        sx={{ bgcolor: d.alert_level === 'critical' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                              color: d.alert_level === 'critical' ? '#ef5350' : '#ffb74d' }} />
                      {d.status === 'pending' && (
                        <Button size="small" variant="outlined" sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                          onClick={async () => { await pharmacyEnhancedAPI.createDUR({ id: d.id, status: 'resolved', resolution: 'reviewed' }); loadData(); }}>
                          Resolve
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {durReviews.length === 0 && <Alert severity="success">No DUR alerts.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            {reconciliations.map((r: any) => (
              <Card key={r.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>Med Reconciliation - {r.patient_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Type: {r.reconciliation_type} • Meds: {r.medication_count || 0} • Discrepancies: {r.discrepancies || 0}
                      </Typography>
                    </Box>
                    <Chip label={r.status} size="small"
                      sx={{ bgcolor: r.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                            color: r.status === 'completed' ? '#81c784' : '#ffb74d' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {reconciliations.length === 0 && <Alert severity="info">No medication reconciliations.</Alert>}
          </Stack>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {compounded.map((c: any) => (
              <Card key={c.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{c.compound_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Formula: {c.formula} • BUD: {c.beyond_use_date ? new Date(c.beyond_use_date).toLocaleDateString() : '-'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Compounded by: {c.pharmacist_name} • Lot: {c.lot_number}
                      </Typography>
                    </Box>
                    <Chip label={c.sterility_level || 'Non-sterile'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {compounded.length === 0 && <Alert severity="info">No compounded medications.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Drug</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Schedule</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Action</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Quantity</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Witness</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date/Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {controlled.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell sx={{ color: '#fff' }}>{c.drug_name}</TableCell>
                    <TableCell><Chip label={`Schedule ${c.schedule}`} size="small" sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350' }} /></TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{c.action_type}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{c.quantity} {c.unit}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{c.witness_name || '-'}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(c.logged_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {controlled.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No controlled substance logs</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 5 && (
          <Stack spacing={2}>
            {stewardship.map((s: any) => (
              <Card key={s.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{s.antibiotic_name} - {s.patient_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Indication: {s.indication} • Duration: {s.duration_days} days • DOT: {s.days_of_therapy}
                      </Typography>
                      {s.recommendation && <Typography variant="body2" sx={{ color: '#81c784' }}>Rec: {s.recommendation}</Typography>}
                    </Box>
                    <Chip label={s.appropriateness || 'Under Review'} size="small"
                      sx={{ bgcolor: s.appropriateness === 'appropriate' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                            color: s.appropriateness === 'appropriate' ? '#81c784' : '#ffb74d' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {stewardship.length === 0 && <Alert severity="info">No antibiotic stewardship records.</Alert>}
          </Stack>
        )}

        {activeTab === 6 && (
          <Stack spacing={2}>
            {interventions.map((i: any) => (
              <Card key={i.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{i.intervention_type}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Patient: {i.patient_name} • Drug: {i.drug_name} • Pharmacist: {i.pharmacist_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>{i.description}</Typography>
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={i.outcome || 'Pending'} size="small"
                        sx={{ bgcolor: i.outcome === 'accepted' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: i.outcome === 'accepted' ? '#81c784' : '#ffb74d' }} />
                      {i.cost_savings && <Typography variant="body2" sx={{ color: '#4caf50' }}>Savings: ${i.cost_savings}</Typography>}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {interventions.length === 0 && <Alert severity="info">No pharmacy interventions.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default PharmacyEnhancedPage;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Stack, Chip, Button, IconButton,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Divider, Tooltip, Tab, Tabs, Paper, Switch,
  FormControlLabel, InputAdornment, LinearProgress,
} from '@mui/material';
import {
  Shield, Add, Edit, Delete, CreditCard, AttachMoney, LocalHospital,
  Phone, Email, Business, HealthAndSafety, CloudUpload, Visibility,
  CheckCircle, Warning, Cancel, HourglassEmpty, Description,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { insuranceAPI, documentsAPI } from '../../services/api';

const PLAN_TYPES = [
  { value: 'hmo', label: 'HMO' },
  { value: 'ppo', label: 'PPO' },
  { value: 'epo', label: 'EPO' },
  { value: 'pos', label: 'POS' },
  { value: 'hdhp', label: 'HDHP' },
  { value: 'medicare', label: 'Medicare' },
  { value: 'medicaid', label: 'Medicaid' },
  { value: 'tricare', label: 'TRICARE' },
  { value: 'other', label: 'Other' },
];

const CLAIM_STATUSES: Record<string, { label: string; color: any; icon: React.ReactNode }> = {
  submitted: { label: 'Submitted', color: 'info', icon: <HourglassEmpty /> },
  in_review: { label: 'In Review', color: 'warning', icon: <Warning /> },
  approved: { label: 'Approved', color: 'success', icon: <CheckCircle /> },
  denied: { label: 'Denied', color: 'error', icon: <Cancel /> },
  partially_approved: { label: 'Partial', color: 'warning', icon: <CheckCircle /> },
  appealed: { label: 'Appealed', color: 'info', icon: <HourglassEmpty /> },
};

const InsurancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [policies, setPolicies] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPolicyDialog, setShowPolicyDialog] = useState(false);
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  // Policy form fields
  const [policyForm, setPolicyForm] = useState({
    provider_name: '', plan_name: '', plan_type: 'ppo', policy_number: '',
    group_number: '', member_id: '', subscriber_name: '', subscriber_dob: '',
    relationship_to_subscriber: 'self', effective_date: '', termination_date: '',
    is_primary: true, monthly_premium: '', deductible: '', deductible_met: '',
    out_of_pocket_max: '', out_of_pocket_met: '', copay_primary: '', copay_specialist: '',
    copay_emergency: '', coinsurance_percentage: '', coverage_details: '',
    pharmacy_benefits: '', rx_deductible: '', rx_copay_generic: '',
    rx_copay_preferred: '', rx_copay_specialty: '', provider_phone: '',
    provider_website: '', claims_address: '', notes: '',
  });

  // Claim form fields
  const [claimForm, setClaimForm] = useState({
    insurance_policy_id: '', claim_type: 'medical', service_date: '',
    provider_name: '', diagnosis_code: '', procedure_code: '',
    billed_amount: '', description: '', notes: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [polRes, claimRes, sumRes] = await Promise.all([
        insuranceAPI.getPolicies(),
        insuranceAPI.getClaims(),
        insuranceAPI.getSummary(),
      ]);
      setPolicies(polRes.data.policies || polRes.data || []);
      setClaims(claimRes.data.claims || claimRes.data || []);
      setSummary(sumRes.data || null);
      setError('');
    } catch {
      setError('Failed to load insurance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSavePolicy = async () => {
    try {
      const payload: any = { ...policyForm };
      ['monthly_premium', 'deductible', 'deductible_met', 'out_of_pocket_max', 'out_of_pocket_met',
        'copay_primary', 'copay_specialist', 'copay_emergency', 'coinsurance_percentage',
        'rx_deductible', 'rx_copay_generic', 'rx_copay_preferred', 'rx_copay_specialty'].forEach(f => {
        if (payload[f] === '') delete payload[f]; else payload[f] = parseFloat(payload[f]);
      });
      if (editingPolicy) {
        await insuranceAPI.updatePolicy(editingPolicy.id, payload);
      } else {
        await insuranceAPI.addPolicy(payload);
      }
      setShowPolicyDialog(false);
      resetPolicyForm();
      loadData();
    } catch {
      setError('Failed to save policy');
    }
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      await insuranceAPI.deletePolicy(id);
      loadData();
    } catch {
      setError('Failed to delete policy');
    }
  };

  const handleSubmitClaim = async () => {
    try {
      const payload: any = { ...claimForm };
      if (payload.billed_amount) payload.billed_amount = parseFloat(payload.billed_amount);
      else delete payload.billed_amount;
      await insuranceAPI.submitClaim(payload);
      setShowClaimDialog(false);
      setClaimForm({ insurance_policy_id: '', claim_type: 'medical', service_date: '', provider_name: '', diagnosis_code: '', procedure_code: '', billed_amount: '', description: '', notes: '' });
      loadData();
    } catch {
      setError('Failed to submit claim');
    }
  };

  const resetPolicyForm = () => {
    setPolicyForm({
      provider_name: '', plan_name: '', plan_type: 'ppo', policy_number: '',
      group_number: '', member_id: '', subscriber_name: '', subscriber_dob: '',
      relationship_to_subscriber: 'self', effective_date: '', termination_date: '',
      is_primary: true, monthly_premium: '', deductible: '', deductible_met: '',
      out_of_pocket_max: '', out_of_pocket_met: '', copay_primary: '', copay_specialist: '',
      copay_emergency: '', coinsurance_percentage: '', coverage_details: '',
      pharmacy_benefits: '', rx_deductible: '', rx_copay_generic: '',
      rx_copay_preferred: '', rx_copay_specialty: '', provider_phone: '',
      provider_website: '', claims_address: '', notes: '',
    });
    setEditingPolicy(null);
  };

  const openEditPolicy = (pol: any) => {
    setEditingPolicy(pol);
    const form: any = {};
    Object.keys(policyForm).forEach(k => { form[k] = pol[k] ?? ''; });
    setPolicyForm(form);
    setShowPolicyDialog(true);
  };

  const updateField = (field: string, value: any) => setPolicyForm(prev => ({ ...prev, [field]: value }));

  const deductibleProgress = summary?.deductible ? Math.min(100, ((summary.deductible_met || 0) / summary.deductible) * 100) : 0;
  const oopProgress = summary?.out_of_pocket_max ? Math.min(100, ((summary.out_of_pocket_met || 0) / summary.out_of_pocket_max) * 100) : 0;

  return (
    <AppLayout title="Insurance" subtitle="Manage your insurance policies, claims, and coverage details" navItems={patientNavItems} portalType="patient">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
            <Shield sx={{ fontSize: 32, mb: 0.5 }} />
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{policies.length}</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.9 }}>Active Policies</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #f093fb, #f5576c)', color: 'white' }}>
            <Description sx={{ fontSize: 32, mb: 0.5 }} />
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>{claims.length}</Typography>
            <Typography sx={{ fontSize: 12, opacity: 0.9 }}>Total Claims</Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #4facfe, #00f2fe)', color: 'white' }}>
            <Typography sx={{ fontSize: 12, opacity: 0.9, mb: 0.5 }}>Deductible</Typography>
            <LinearProgress variant="determinate" value={deductibleProgress} sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
              ${summary?.deductible_met?.toFixed(0) || 0} / ${summary?.deductible?.toFixed(0) || 0}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', color: 'white' }}>
            <Typography sx={{ fontSize: 12, opacity: 0.9, mb: 0.5 }}>Out-of-Pocket</Typography>
            <LinearProgress variant="determinate" value={oopProgress} sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.3)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }} />
            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
              ${summary?.out_of_pocket_met?.toFixed(0) || 0} / ${summary?.out_of_pocket_max?.toFixed(0) || 0}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="My Policies" />
        <Tab label="Claims" />
      </Tabs>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : activeTab === 0 ? (
        /* POLICIES TAB */
        <>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => { resetPolicyForm(); setShowPolicyDialog(true); }}
              sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', fontWeight: 700 }}>
              Add Insurance Policy
            </Button>
          </Stack>
          {policies.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Shield sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No insurance policies</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Add your insurance policy to track coverage and submit claims</Typography>
              <Button variant="contained" startIcon={<Add />} onClick={() => { resetPolicyForm(); setShowPolicyDialog(true); }}>Add Policy</Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {policies.map(pol => (
                <Grid item xs={12} md={6} key={pol.id}>
                  <Card sx={{ '&:hover': { boxShadow: 6 }, cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                    onClick={() => { setSelectedPolicy(pol); setShowDetailDialog(true); }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Shield sx={{ color: '#1565c0' }} />
                            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{pol.provider_name}</Typography>
                          </Stack>
                          <Typography sx={{ fontSize: 13, color: 'text.secondary', ml: 4 }}>{pol.plan_name}</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          {pol.is_primary && <Chip label="Primary" size="small" color="primary" />}
                          <Chip label={pol.plan_type?.toUpperCase()} size="small" variant="outlined" />
                        </Stack>
                      </Stack>
                      <Divider sx={{ my: 1.5 }} />
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Policy #</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{pol.policy_number || '—'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Member ID</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{pol.member_id || '—'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Deductible</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>${pol.deductible?.toFixed(0) || '0'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Copay (PCP/Spec)</Typography>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>${pol.copay_primary || 0} / ${pol.copay_specialist || 0}</Typography>
                        </Grid>
                      </Grid>
                      <Stack direction="row" justifyContent="flex-end" spacing={0.5} sx={{ mt: 1 }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={e => { e.stopPropagation(); openEditPolicy(pol); }}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={e => { e.stopPropagation(); handleDeletePolicy(pol.id); }}><Delete sx={{ fontSize: 16, color: '#f44336' }} /></IconButton></Tooltip>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      ) : (
        /* CLAIMS TAB */
        <>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowClaimDialog(true)}
              sx={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', fontWeight: 700 }} disabled={policies.length === 0}>
              Submit New Claim
            </Button>
          </Stack>
          {claims.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <AttachMoney sx={{ fontSize: 60, color: '#bdbdbd', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">No claims yet</Typography>
              <Typography color="text.secondary">Submit a claim to track reimbursements and coverage</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {claims.map(claim => {
                const st = CLAIM_STATUSES[claim.status] || CLAIM_STATUSES.submitted;
                return (
                  <Card key={claim.id}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{claim.description || claim.claim_type}</Typography>
                          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {claim.provider_name} • {new Date(claim.service_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box textAlign="right">
                            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>${(claim.billed_amount || 0).toFixed(2)}</Typography>
                            {claim.approved_amount != null && <Typography sx={{ fontSize: 11, color: 'success.main' }}>Approved: ${claim.approved_amount.toFixed(2)}</Typography>}
                          </Box>
                          <Chip icon={st.icon as React.ReactElement} label={st.label} size="small" color={st.color} variant="outlined" />
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </>
      )}

      {/* Add/Edit Policy Dialog */}
      <Dialog open={showPolicyDialog} onClose={() => { setShowPolicyDialog(false); resetPolicyForm(); }} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editingPolicy ? 'Edit Insurance Policy' : 'Add Insurance Policy'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>Plan Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField label="Insurance Provider *" fullWidth value={policyForm.provider_name} onChange={e => updateField('provider_name', e.target.value)} placeholder="e.g. Blue Cross Blue Shield" /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Plan Name *" fullWidth value={policyForm.plan_name} onChange={e => updateField('plan_name', e.target.value)} placeholder="e.g. Gold PPO 500" /></Grid>
              <Grid item xs={6} sm={3}><TextField select label="Plan Type" fullWidth value={policyForm.plan_type} onChange={e => updateField('plan_type', e.target.value)}>{PLAN_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</TextField></Grid>
              <Grid item xs={6} sm={3}><TextField label="Policy #" fullWidth value={policyForm.policy_number} onChange={e => updateField('policy_number', e.target.value)} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Group #" fullWidth value={policyForm.group_number} onChange={e => updateField('group_number', e.target.value)} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Member ID" fullWidth value={policyForm.member_id} onChange={e => updateField('member_id', e.target.value)} /></Grid>
            </Grid>

            <Typography sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>Subscriber</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><TextField label="Subscriber Name" fullWidth value={policyForm.subscriber_name} onChange={e => updateField('subscriber_name', e.target.value)} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Subscriber DOB" type="date" fullWidth InputLabelProps={{ shrink: true }} value={policyForm.subscriber_dob} onChange={e => updateField('subscriber_dob', e.target.value)} /></Grid>
              <Grid item xs={6} sm={4}>
                <TextField select label="Relationship" fullWidth value={policyForm.relationship_to_subscriber} onChange={e => updateField('relationship_to_subscriber', e.target.value)}>
                  <MenuItem value="self">Self</MenuItem><MenuItem value="spouse">Spouse</MenuItem><MenuItem value="child">Child</MenuItem><MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Typography sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>Coverage Dates</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Effective Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={policyForm.effective_date} onChange={e => updateField('effective_date', e.target.value)} /></Grid>
              <Grid item xs={6}><TextField label="Termination Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={policyForm.termination_date} onChange={e => updateField('termination_date', e.target.value)} /></Grid>
            </Grid>
            <FormControlLabel control={<Switch checked={policyForm.is_primary} onChange={e => updateField('is_primary', e.target.checked)} />} label="Primary Insurance" />

            <Typography sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>Cost Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}><TextField label="Monthly Premium" type="number" fullWidth value={policyForm.monthly_premium} onChange={e => updateField('monthly_premium', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Deductible" type="number" fullWidth value={policyForm.deductible} onChange={e => updateField('deductible', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Out-of-Pocket Max" type="number" fullWidth value={policyForm.out_of_pocket_max} onChange={e => updateField('out_of_pocket_max', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Coinsurance %" type="number" fullWidth value={policyForm.coinsurance_percentage} onChange={e => updateField('coinsurance_percentage', e.target.value)} InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} /></Grid>
            </Grid>

            <Typography sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>Copays</Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}><TextField label="Primary Care" type="number" fullWidth value={policyForm.copay_primary} onChange={e => updateField('copay_primary', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              <Grid item xs={4}><TextField label="Specialist" type="number" fullWidth value={policyForm.copay_specialist} onChange={e => updateField('copay_specialist', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              <Grid item xs={4}><TextField label="Emergency" type="number" fullWidth value={policyForm.copay_emergency} onChange={e => updateField('copay_emergency', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
            </Grid>

            <Typography sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>Pharmacy (Rx)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}><TextField label="Rx Deductible" type="number" fullWidth value={policyForm.rx_deductible} onChange={e => updateField('rx_deductible', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Generic Copay" type="number" fullWidth value={policyForm.rx_copay_generic} onChange={e => updateField('rx_copay_generic', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Preferred Copay" type="number" fullWidth value={policyForm.rx_copay_preferred} onChange={e => updateField('rx_copay_preferred', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
              <Grid item xs={6} sm={3}><TextField label="Specialty Copay" type="number" fullWidth value={policyForm.rx_copay_specialty} onChange={e => updateField('rx_copay_specialty', e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} /></Grid>
            </Grid>

            <Typography sx={{ fontWeight: 600, color: 'primary.main', mt: 1 }}>Contact & Notes</Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}><TextField label="Provider Phone" fullWidth value={policyForm.provider_phone} onChange={e => updateField('provider_phone', e.target.value)} /></Grid>
              <Grid item xs={6} sm={4}><TextField label="Provider Website" fullWidth value={policyForm.provider_website} onChange={e => updateField('provider_website', e.target.value)} /></Grid>
              <Grid item xs={12} sm={4}><TextField label="Claims Address" fullWidth value={policyForm.claims_address} onChange={e => updateField('claims_address', e.target.value)} /></Grid>
            </Grid>
            <TextField label="Coverage Details" fullWidth multiline rows={2} value={policyForm.coverage_details} onChange={e => updateField('coverage_details', e.target.value)} />
            <TextField label="Notes" fullWidth multiline rows={2} value={policyForm.notes} onChange={e => updateField('notes', e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowPolicyDialog(false); resetPolicyForm(); }}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePolicy} disabled={!policyForm.provider_name || !policyForm.plan_name}>
            {editingPolicy ? 'Update Policy' : 'Add Policy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Claim Dialog */}
      <Dialog open={showClaimDialog} onClose={() => setShowClaimDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Insurance Claim</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Insurance Policy *" fullWidth value={claimForm.insurance_policy_id} onChange={e => setClaimForm(p => ({ ...p, insurance_policy_id: e.target.value }))}>
              {policies.map(p => <MenuItem key={p.id} value={p.id}>{p.provider_name} — {p.plan_name}</MenuItem>)}
            </TextField>
            <TextField select label="Claim Type" fullWidth value={claimForm.claim_type} onChange={e => setClaimForm(p => ({ ...p, claim_type: e.target.value }))}>
              <MenuItem value="medical">Medical</MenuItem><MenuItem value="dental">Dental</MenuItem><MenuItem value="vision">Vision</MenuItem>
              <MenuItem value="pharmacy">Pharmacy</MenuItem><MenuItem value="mental_health">Mental Health</MenuItem><MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField label="Service Date *" type="date" fullWidth InputLabelProps={{ shrink: true }} value={claimForm.service_date} onChange={e => setClaimForm(p => ({ ...p, service_date: e.target.value }))} />
            <TextField label="Provider Name" fullWidth value={claimForm.provider_name} onChange={e => setClaimForm(p => ({ ...p, provider_name: e.target.value }))} />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Diagnosis Code" fullWidth value={claimForm.diagnosis_code} onChange={e => setClaimForm(p => ({ ...p, diagnosis_code: e.target.value }))} /></Grid>
              <Grid item xs={6}><TextField label="Procedure Code" fullWidth value={claimForm.procedure_code} onChange={e => setClaimForm(p => ({ ...p, procedure_code: e.target.value }))} /></Grid>
            </Grid>
            <TextField label="Billed Amount *" type="number" fullWidth value={claimForm.billed_amount} onChange={e => setClaimForm(p => ({ ...p, billed_amount: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            <TextField label="Description" fullWidth multiline rows={2} value={claimForm.description} onChange={e => setClaimForm(p => ({ ...p, description: e.target.value }))} />
            <TextField label="Notes" fullWidth multiline rows={2} value={claimForm.notes} onChange={e => setClaimForm(p => ({ ...p, notes: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClaimDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitClaim} disabled={!claimForm.insurance_policy_id || !claimForm.service_date || !claimForm.billed_amount}>
            Submit Claim
          </Button>
        </DialogActions>
      </Dialog>

      {/* Policy Detail Dialog */}
      <Dialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} maxWidth="sm" fullWidth>
        {selectedPolicy && (
          <>
            <DialogTitle sx={{ fontWeight: 700 }}>{selectedPolicy.provider_name}</DialogTitle>
            <DialogContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1}>
                  {selectedPolicy.is_primary && <Chip label="Primary" color="primary" size="small" />}
                  <Chip label={selectedPolicy.plan_type?.toUpperCase()} variant="outlined" size="small" />
                  <Chip label={selectedPolicy.status} color={selectedPolicy.status === 'active' ? 'success' : 'default'} size="small" />
                </Stack>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>{selectedPolicy.plan_name}</Typography>
                <Divider />
                <Grid container spacing={2}>
                  <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Policy #</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedPolicy.policy_number || '—'}</Typography></Grid>
                  <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Group #</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedPolicy.group_number || '—'}</Typography></Grid>
                  <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Member ID</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedPolicy.member_id || '—'}</Typography></Grid>
                  <Grid item xs={6}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Subscriber</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedPolicy.subscriber_name || '—'}</Typography></Grid>
                </Grid>
                <Divider />
                <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>Cost Summary</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Deductible</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>${selectedPolicy.deductible?.toFixed(0) || '0'}</Typography></Grid>
                  <Grid item xs={4}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>OOP Max</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>${selectedPolicy.out_of_pocket_max?.toFixed(0) || '0'}</Typography></Grid>
                  <Grid item xs={4}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Premium</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>${selectedPolicy.monthly_premium?.toFixed(0) || '0'}/mo</Typography></Grid>
                </Grid>
                <Typography sx={{ fontWeight: 600, color: 'primary.main' }}>Copays</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>PCP</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>${selectedPolicy.copay_primary || 0}</Typography></Grid>
                  <Grid item xs={4}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Specialist</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>${selectedPolicy.copay_specialist || 0}</Typography></Grid>
                  <Grid item xs={4}><Typography sx={{ fontSize: 12, color: 'text.secondary' }}>ER</Typography><Typography sx={{ fontSize: 14, fontWeight: 700 }}>${selectedPolicy.copay_emergency || 0}</Typography></Grid>
                </Grid>
                {selectedPolicy.provider_phone && (<Typography sx={{ fontSize: 13 }}><Phone sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{selectedPolicy.provider_phone}</Typography>)}
                {selectedPolicy.provider_website && (<Typography sx={{ fontSize: 13 }}><Business sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />{selectedPolicy.provider_website}</Typography>)}
                {selectedPolicy.coverage_details && (<><Divider /><Typography sx={{ fontSize: 13 }}><strong>Coverage:</strong> {selectedPolicy.coverage_details}</Typography></>)}
                {selectedPolicy.notes && (<Typography sx={{ fontSize: 13 }}><strong>Notes:</strong> {selectedPolicy.notes}</Typography>)}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
              <Button variant="outlined" onClick={() => { setShowDetailDialog(false); openEditPolicy(selectedPolicy); }}>Edit Policy</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </AppLayout>
  );
};

export default InsurancePage;

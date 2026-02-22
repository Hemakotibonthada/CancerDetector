import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  Receipt as InvIcon, Payment as PayIcon, HealthAndSafety as InsIcon,
  Calculate as CalcIcon, Gavel as AuthIcon, AttachMoney as MoneyIcon,
  AccountBalance as AccIcon, Description as ClaimIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { billingEnhancedAPI } from '../../services/api';

const BillingPatientPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [priorAuths, setPriorAuths] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, pay, ins, est, auth] = await Promise.all([
        billingEnhancedAPI.getInvoices().catch(() => ({ data: [] })),
        billingEnhancedAPI.getPayments().catch(() => ({ data: [] })),
        billingEnhancedAPI.getInsurancePlans().catch(() => ({ data: [] })),
        billingEnhancedAPI.getCostEstimates().catch(() => ({ data: [] })),
        billingEnhancedAPI.getPriorAuths().catch(() => ({ data: [] })),
      ]);
      setInvoices(inv.data || []);
      setPayments(pay.data || []);
      setInsurance(ins.data || []);
      setEstimates(est.data || []);
      setPriorAuths(auth.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const totalOwed = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.amount_due || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <AppLayout title="Billing & Insurance" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Balance Due', value: `$${totalOwed.toLocaleString()}`, icon: <MoneyIcon />, color: '#f44336' },
            { label: 'Total Paid', value: `$${totalPaid.toLocaleString()}`, icon: <PayIcon />, color: '#4caf50' },
            { label: 'Insurance Plans', value: insurance.length, icon: <InsIcon />, color: '#2196f3' },
            { label: 'Prior Auths', value: priorAuths.length, icon: <AuthIcon />, color: '#ff9800' },
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
          <Tab label="Invoices" icon={<InvIcon />} iconPosition="start" />
          <Tab label="Payments" icon={<PayIcon />} iconPosition="start" />
          <Tab label="Insurance" icon={<InsIcon />} iconPosition="start" />
          <Tab label="Cost Estimates" icon={<CalcIcon />} iconPosition="start" />
          <Tab label="Prior Auth" icon={<AuthIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Invoice #</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Date</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Description</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Total</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Insurance</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Due</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell sx={{ color: '#fff' }}>{inv.invoice_number}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(inv.invoice_date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{inv.description}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>${inv.total_amount?.toLocaleString()}</TableCell>
                    <TableCell sx={{ color: '#4caf50' }}>${inv.insurance_covered?.toLocaleString() || 0}</TableCell>
                    <TableCell sx={{ color: '#f44336', fontWeight: 700 }}>${inv.amount_due?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={inv.status} size="small"
                        sx={{ bgcolor: inv.status === 'paid' ? 'rgba(76,175,80,0.3)' : inv.status === 'overdue' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                              color: inv.status === 'paid' ? '#81c784' : inv.status === 'overdue' ? '#ef5350' : '#ffb74d' }} />
                    </TableCell>
                    <TableCell>
                      {inv.status !== 'paid' && (
                        <Button size="small" variant="outlined" sx={{ color: '#4caf50', borderColor: '#4caf50' }}>Pay</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && <TableRow><TableCell colSpan={8} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No invoices</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {payments.map((p: any) => (
              <Card key={p.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>Payment #{p.transaction_id || p.id}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {p.payment_method} • {new Date(p.payment_date).toLocaleDateString()}
                      </Typography>
                      {p.invoice_number && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Invoice: {p.invoice_number}</Typography>}
                    </Box>
                    <Stack alignItems="flex-end">
                      <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 700 }}>${p.amount?.toLocaleString()}</Typography>
                      <Chip label={p.status || 'completed'} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {payments.length === 0 && <Alert severity="info">No payment history.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {insurance.map((ins: any) => (
              <Grid item xs={12} md={6} key={ins.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0d47a1 20%)', border: '1px solid rgba(33,150,243,0.3)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{ins.plan_name}</Typography>
                      <Chip label={ins.is_active ? 'Active' : 'Inactive'} size="small"
                        sx={{ bgcolor: ins.is_active ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: ins.is_active ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                      Provider: {ins.insurance_provider} • Member ID: {ins.member_id}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Group: {ins.group_number} • Type: {ins.plan_type}
                    </Typography>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {[
                        { label: 'Deductible', value: `$${ins.deductible || 0}`, met: ins.deductible_met },
                        { label: 'Co-pay', value: `$${ins.copay || 0}` },
                        { label: 'Out-of-Pocket Max', value: `$${ins.oop_max || 0}` },
                      ].map((d, i) => (
                        <Grid item xs={4} key={i}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                            <Typography variant="h6" sx={{ color: '#fff' }}>{d.value}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{d.label}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {insurance.length === 0 && <Alert severity="info">No insurance plans on file.</Alert>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {estimates.map((e: any) => (
              <Card key={e.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{e.procedure_name || e.service_description}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Provider: {e.provider_name} • Date: {e.estimated_date ? new Date(e.estimated_date).toLocaleDateString() : 'TBD'}
                      </Typography>
                    </Box>
                    <Stack alignItems="flex-end">
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Total: ${e.total_cost?.toLocaleString()}</Typography>
                      <Typography variant="body2" sx={{ color: '#4caf50' }}>Insurance: -${e.insurance_estimate?.toLocaleString()}</Typography>
                      <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 700 }}>You Pay: ${e.patient_estimate?.toLocaleString()}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {estimates.length === 0 && <Alert severity="info">No cost estimates.</Alert>}
          </Stack>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {priorAuths.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{a.procedure_name || 'Prior Authorization'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Auth #: {a.auth_number} • Submitted: {new Date(a.submitted_date).toLocaleDateString()}
                      </Typography>
                      {a.insurance_plan && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Plan: {a.insurance_plan}</Typography>}
                    </Box>
                    <Chip label={a.status} size="small"
                      sx={{ bgcolor: a.status === 'approved' ? 'rgba(76,175,80,0.3)' : a.status === 'denied' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)',
                            color: a.status === 'approved' ? '#81c784' : a.status === 'denied' ? '#ef5350' : '#ffb74d' }} />
                  </Stack>
                  {a.valid_through && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                      Valid through: {new Date(a.valid_through).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
            {priorAuths.length === 0 && <Alert severity="info">No prior authorizations.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default BillingPatientPage;

import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert,
} from '@mui/material';
import {
  Payment, Receipt, TrendingUp, CheckCircle, CreditCard, AccountBalance,
  Assessment, AttachMoney, Business, Schedule, Warning, Download,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { adminNavItems } from './AdminDashboard';

const SUBSCRIPTIONS = [
  { id: 'SUB-001', hospital: 'City Cancer Center', plan: 'Enterprise', amount: 4999, status: 'active', startDate: '2024-01-01', nextBilling: '2025-01-01', users: 150, features: ['All Modules', 'AI Analytics', 'Priority Support', 'Custom Integrations'] },
  { id: 'SUB-002', hospital: 'Metro Oncology Hospital', plan: 'Professional', amount: 2499, status: 'active', startDate: '2024-03-15', nextBilling: '2025-03-15', users: 75, features: ['Core Modules', 'AI Analytics', 'Standard Support'] },
  { id: 'SUB-003', hospital: 'Regional Medical Center', plan: 'Professional', amount: 2499, status: 'active', startDate: '2024-06-01', nextBilling: '2025-06-01', users: 60, features: ['Core Modules', 'AI Analytics', 'Standard Support'] },
  { id: 'SUB-004', hospital: 'Community Health Clinic', plan: 'Basic', amount: 999, status: 'active', startDate: '2024-09-01', nextBilling: '2025-09-01', users: 25, features: ['Core Modules', 'Basic Support'] },
  { id: 'SUB-005', hospital: 'University Hospital', plan: 'Enterprise', amount: 4999, status: 'trial', startDate: '2024-12-01', nextBilling: '2025-01-01', users: 200, features: ['All Modules', 'AI Analytics', 'Priority Support', 'Custom Integrations'] },
];

const INVOICES = [
  { id: 'INV-2024-012', hospital: 'City Cancer Center', amount: 4999, status: 'paid', date: '2024-12-01', dueDate: '2024-12-15', plan: 'Enterprise' },
  { id: 'INV-2024-011', hospital: 'Metro Oncology Hospital', amount: 2499, status: 'paid', date: '2024-12-01', dueDate: '2024-12-15', plan: 'Professional' },
  { id: 'INV-2024-010', hospital: 'Regional Medical Center', amount: 2499, status: 'pending', date: '2024-12-01', dueDate: '2024-12-31', plan: 'Professional' },
  { id: 'INV-2024-009', hospital: 'Community Health Clinic', amount: 999, status: 'paid', date: '2024-12-01', dueDate: '2024-12-15', plan: 'Basic' },
  { id: 'INV-2024-008', hospital: 'City Cancer Center', amount: 4999, status: 'paid', date: '2024-11-01', dueDate: '2024-11-15', plan: 'Enterprise' },
];

const REVENUE_TREND = [
  { month: 'Jul', revenue: 8500, mrr: 8500 },
  { month: 'Aug', revenue: 8500, mrr: 8500 },
  { month: 'Sep', revenue: 10996, mrr: 10996 },
  { month: 'Oct', revenue: 10996, mrr: 10996 },
  { month: 'Nov', revenue: 10996, mrr: 10996 },
  { month: 'Dec', revenue: 15995, mrr: 15995 },
];

const PLAN_DISTRIBUTION = [
  { name: 'Enterprise', value: 2, fill: '#ae52d4' },
  { name: 'Professional', value: 2, fill: '#5e92f3' },
  { name: 'Basic', value: 1, fill: '#4caf50' },
];

const planColors: Record<string, string> = { Enterprise: '#ae52d4', Professional: '#5e92f3', Basic: '#4caf50' };

const BillingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  const totalMRR = SUBSCRIPTIONS.filter(s => s.status === 'active').reduce((s, sub) => s + sub.amount, 0);
  const paidInvoices = INVOICES.filter(i => i.status === 'paid');
  const pendingInvoices = INVOICES.filter(i => i.status === 'pending');

  return (
    <AppLayout title="Billing" navItems={adminNavItems} portalType="admin" subtitle="Subscriptions, invoices & revenue management">
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<AttachMoney />} label="Monthly Revenue" value={`$${totalMRR.toLocaleString()}`} change="+45%" color="#4caf50" subtitle="MRR" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Business />} label="Active Subscriptions" value={SUBSCRIPTIONS.filter(s => s.status === 'active').length.toString()} color="#5e92f3" subtitle="Hospital accounts" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Receipt />} label="Pending Invoices" value={pendingInvoices.length.toString()} color="#ff9800" subtitle={`$${pendingInvoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}`} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CreditCard />} label="Collection Rate" value="96%" change="+2%" color="#ae52d4" subtitle="Payment success" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<CreditCard />} label="Subscriptions" iconPosition="start" />
            <Tab icon={<Receipt />} label="Invoices" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Revenue" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Hospital Subscriptions" icon={<CreditCard />} />
            <Stack spacing={2}>
              {SUBSCRIPTIONS.map((sub, idx) => (
                <Box key={idx} sx={{ p: 2.5, border: '1px solid #f0f0f0', borderRadius: 3, '&:hover': { borderColor: planColors[sub.plan], bgcolor: '#fafafa' } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700} fontSize={15}>{sub.hospital}</Typography>
                        <Chip label={sub.plan} size="small" sx={{ bgcolor: planColors[sub.plan] + '20', color: planColors[sub.plan], fontWeight: 700, fontSize: 10 }} />
                        {sub.status === 'trial' && <Chip label="Trial" size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100', fontWeight: 700, fontSize: 10 }} />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{sub.id} • Since {sub.startDate}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography fontWeight={700} fontSize={20} color={planColors[sub.plan]}>${sub.amount.toLocaleString()}<Typography component="span" fontSize={11} color="text.secondary">/mo</Typography></Typography>
                      <Typography variant="caption" color="text.secondary">{sub.users} users</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {sub.features.map((f, fi) => (
                      <Chip key={fi} label={f} size="small" variant="outlined" sx={{ fontSize: 10, mb: 0.5 }} icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} />
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Next billing: {sub.nextBilling}</Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        )}

        {activeTab === 1 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Invoices" icon={<Receipt />}
              action={<Button startIcon={<Receipt />} variant="contained" size="small" onClick={() => setShowInvoiceDialog(true)}>Generate Invoice</Button>}
            />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Hospital</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Issue Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {INVOICES.map((inv, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Chip label={inv.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 10 }} /></TableCell>
                      <TableCell><Typography fontWeight={600} fontSize={13}>{inv.hospital}</Typography></TableCell>
                      <TableCell><Chip label={inv.plan} size="small" sx={{ bgcolor: planColors[inv.plan] + '20', color: planColors[inv.plan], fontWeight: 600, fontSize: 10 }} /></TableCell>
                      <TableCell><Typography fontWeight={700} fontSize={14}>${inv.amount.toLocaleString()}</Typography></TableCell>
                      <TableCell><Typography fontSize={12}>{inv.date}</Typography></TableCell>
                      <TableCell><Typography fontSize={12}>{inv.dueDate}</Typography></TableCell>
                      <TableCell>
                        <Chip label={inv.status} size="small" sx={{
                          bgcolor: inv.status === 'paid' ? '#e8f5e9' : '#fff3e0',
                          color: inv.status === 'paid' ? '#2e7d32' : '#e65100',
                          fontWeight: 700, fontSize: 10, textTransform: 'capitalize',
                        }} />
                      </TableCell>
                      <TableCell>
                        <Button size="small" startIcon={<Download />} sx={{ fontSize: 10 }}>PDF</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Revenue Growth" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={REVENUE_TREND}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RTooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Area type="monotone" dataKey="revenue" stroke="#4caf50" fill="#c8e6c9" strokeWidth={2} name="Revenue" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Subscriptions by Plan" icon={<Assessment />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={PLAN_DISTRIBUTION} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                      {PLAN_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Invoice Dialog */}
        <Dialog open={showInvoiceDialog} onClose={() => setShowInvoiceDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Hospital" fullWidth defaultValue="">
                {SUBSCRIPTIONS.map(s => <MenuItem key={s.id} value={s.id}>{s.hospital}</MenuItem>)}
              </TextField>
              <TextField label="Billing Period" fullWidth placeholder="e.g., January 2025" />
              <TextField label="Amount" type="number" fullWidth />
              <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Notes" multiline rows={2} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowInvoiceDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowInvoiceDialog(false)}>Generate & Send</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default BillingManagementPage;

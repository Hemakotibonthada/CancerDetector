import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Badge, InputAdornment, IconButton, CircularProgress,
} from '@mui/material';
import {
  LocalPharmacy, Medication, Warning, CheckCircle, Search,
  Add, TrendingUp, Inventory, ShoppingCart, Timer, Assignment,
  Science, LocalShipping, Delete,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge } from '../../components/common/SharedComponents';
import { hospitalNavItems } from './HospitalDashboard';
import { pharmacyAPI } from '../../services/api';

const statusColors: Record<string, string> = { in_stock: '#4caf50', low_stock: '#ff9800', out_of_stock: '#f44336', expired: '#9e9e9e' };

const PharmacyManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [invRes, rxRes] = await Promise.all([
        pharmacyAPI.getInventory(),
        pharmacyAPI.getPrescriptions(),
      ]);
      const invData = invRes.data ?? invRes ?? [];
      const rxData = rxRes.data ?? rxRes ?? [];
      const invRows = (Array.isArray(invData) ? invData : []).map((item: any, idx: number) => ({
        id: item.id ?? String(idx + 1),
        drug: item.drug ?? item.drug_name ?? item.name ?? 'Unknown',
        generic: item.generic ?? item.generic_name ?? '-',
        category: item.category ?? '-',
        stock: item.stock ?? item.quantity ?? 0,
        min: item.min ?? item.min_level ?? item.reorder_level ?? 10,
        price: item.price ?? item.unit_price ?? 0,
        supplier: item.supplier ?? '-',
        expiry: item.expiry ?? item.expiry_date ?? '-',
        batch: item.batch ?? item.batch_number ?? '-',
        controlled: item.controlled ?? false,
        chemo: item.chemo ?? item.is_chemo ?? false,
        status: item.status ?? 'in_stock',
      }));
      setInventory(invRows);
      const rxRows = (Array.isArray(rxData) ? rxData : []).map((rx: any, idx: number) => ({
        id: rx.id ?? rx.prescription_id ?? `RX-${String(idx + 1).padStart(3, '0')}`,
        patient: rx.patient ?? rx.patient_name ?? 'Unknown',
        doctor: rx.doctor ?? rx.prescribing_doctor ?? '-',
        date: rx.date ?? rx.created_at ?? '-',
        meds: rx.meds ?? rx.medication_count ?? 0,
        status: rx.status ?? 'pending',
        cancer: rx.cancer ?? rx.is_cancer ?? false,
      }));
      setPrescriptions(rxRows);
      // Build category breakdown from inventory
      const catMap: Record<string, number> = {};
      invRows.forEach((item: any) => { catMap[item.category] = (catMap[item.category] ?? 0) + 1; });
      const colors = ['#f44336', '#ae52d4', '#ff9800', '#5e92f3', '#4caf50', '#9e9e9e'];
      const cats = Object.entries(catMap).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] }));
      setCategoryData(cats.length > 0 ? cats : [
        { name: 'Chemotherapy', value: 35, fill: '#f44336' },
        { name: 'Immunotherapy', value: 15, fill: '#ae52d4' },
        { name: 'Hormone Therapy', value: 10, fill: '#ff9800' },
        { name: 'Pain Management', value: 20, fill: '#5e92f3' },
        { name: 'Anti-emetics', value: 12, fill: '#4caf50' },
        { name: 'Other', value: 8, fill: '#9e9e9e' },
      ]);
    } catch (err: any) {
      console.error('Failed to load pharmacy data:', err);
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to load pharmacy data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const lowStockCount = inventory.filter(i => i.status === 'low_stock').length;
  const outOfStockCount = inventory.filter(i => i.status === 'out_of_stock').length;
  const filteredInventory = inventory.filter(i => (i.drug ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || (i.category ?? '').toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) {
    return (
      <AppLayout title="Pharmacy" navItems={hospitalNavItems} portalType="hospital" subtitle="Drug inventory & prescription management">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Pharmacy" navItems={hospitalNavItems} portalType="hospital" subtitle="Drug inventory & prescription management">
      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Inventory />} label="Total Drugs" value={inventory.length.toString()} color="#5e92f3" subtitle="In inventory" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Warning />} label="Low Stock" value={lowStockCount.toString()} color="#ff9800" subtitle="Need reorder" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Delete />} label="Out of Stock" value={outOfStockCount.toString()} color="#f44336" subtitle="Critical shortage" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<ShoppingCart />} label="Prescriptions Today" value={prescriptions.filter(p => p.date === new Date().toISOString().split('T')[0]).length.toString()} change="+3" color="#4caf50" subtitle="Pending: 2" />
          </Grid>
        </Grid>

        {(lowStockCount > 0 || outOfStockCount > 0) && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }} action={<Button size="small" variant="outlined" onClick={() => setShowOrderDialog(true)}>Reorder</Button>}>
            <strong>{lowStockCount + outOfStockCount} items need attention:</strong> {outOfStockCount} out of stock, {lowStockCount} low stock.
            Cisplatin and Paclitaxel need immediate reorder for ongoing chemotherapy treatments.
          </Alert>
        )}

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<Inventory />} label="Inventory" iconPosition="start" />
            <Tab icon={<Assignment />} label="Prescriptions" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Drug Inventory" icon={<Inventory />}
              action={<Stack direction="row" spacing={1}>
                <TextField size="small" placeholder="Search drugs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment> }} sx={{ width: 250 }} />
                <Button startIcon={<Add />} variant="contained" size="small" onClick={() => setShowOrderDialog(true)}>Add Stock</Button>
              </Stack>}
            />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Drug Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Min Level</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Expiry</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Flags</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInventory.map((item, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: item.status === 'out_of_stock' ? '#fff5f5' : item.status === 'low_stock' ? '#fffbf0' : 'transparent' }}>
                      <TableCell>
                        <Typography fontWeight={600} fontSize={13}>{item.drug}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.generic}</Typography>
                      </TableCell>
                      <TableCell><Typography fontSize={12}>{item.category}</Typography></TableCell>
                      <TableCell>
                        <Typography fontWeight={700} fontSize={13} color={item.stock <= item.min ? 'error' : 'text.primary'}>{item.stock}</Typography>
                      </TableCell>
                      <TableCell><Typography fontSize={12}>{item.min}</Typography></TableCell>
                      <TableCell><Typography fontSize={12}>${item.price}</Typography></TableCell>
                      <TableCell><Typography fontSize={12}>{item.expiry}</Typography></TableCell>
                      <TableCell>
                        <Chip label={item.status.replace('_', ' ').toUpperCase()} size="small" sx={{ bgcolor: `${statusColors[item.status]}15`, color: statusColors[item.status], fontWeight: 700, fontSize: 10 }} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {item.chemo && <Chip label="Chemo" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontSize: 9, height: 18 }} />}
                          {item.controlled && <Chip label="Controlled" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontSize: 9, height: 18 }} />}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {activeTab === 1 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Prescriptions" icon={<Assignment />} />
            {prescriptions.map((rx, idx) => (
              <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f0f0f0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: rx.cancer ? '#ffebee' : '#e3f2fd', color: rx.cancer ? '#c62828' : '#1565c0' }}>
                      <Medication />
                    </Avatar>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>{rx.id}</Typography>
                        {rx.cancer && <Chip label="Cancer Rx" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontSize: 9, height: 18 }} />}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{rx.patient} • {rx.doctor} • {rx.meds} medications</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <StatusBadge status={rx.status} />
                    {rx.status === 'pending' && <Button size="small" variant="contained">Dispense</Button>}
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Card>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Drug Categories" icon={<Science />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                      {categoryData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Inventory Value" icon={<TrendingUp />} />
                <Stack spacing={2}>
                  {inventory.map((item, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ borderBottom: '1px solid #f5f5f5', pb: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{item.drug}</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary">${(item.stock * item.price).toLocaleString()}</Typography>
                    </Stack>
                  ))}
                  <Stack direction="row" justifyContent="space-between" sx={{ pt: 1 }}>
                    <Typography fontWeight={800}>Total Value</Typography>
                    <Typography fontWeight={800} color="primary">${inventory.reduce((sum, i) => sum + i.stock * i.price, 0).toLocaleString()}</Typography>
                  </Stack>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        <Dialog open={showOrderDialog} onClose={() => setShowOrderDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Stock / Reorder</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Drug" fullWidth defaultValue="">
                {inventory.map(i => <MenuItem key={i.id} value={i.id}>{i.drug} ({i.generic})</MenuItem>)}
              </TextField>
              <TextField label="Quantity" type="number" fullWidth />
              <TextField label="Batch Number" fullWidth />
              <TextField label="Expiry Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField select label="Supplier" fullWidth defaultValue="">
                <MenuItem value="pharmaCorp">PharmaCorp</MenuItem>
                <MenuItem value="medSupply">MedSupply</MenuItem>
                <MenuItem value="bioPharm">BioPharm</MenuItem>
                <MenuItem value="merck">Merck</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowOrderDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowOrderDialog(false)}>Submit Order</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default PharmacyManagementPage;

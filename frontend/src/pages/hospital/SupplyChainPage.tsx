import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  Inventory as InvIcon, LocalShipping as ShipIcon,
  Build as EquipIcon, RequestPage as POIcon,
  Warning as WarningIcon, Store as VendorIcon,
  Delete as WasteIcon, TrackChanges as TrackIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { supplyChainAPI } from '../../services/api';

const SupplyChainPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [inventory, setInventory] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, ven, po, eq, main, st] = await Promise.all([
        supplyChainAPI.getInventory().catch(() => ({ data: [] })),
        supplyChainAPI.getVendors().catch(() => ({ data: [] })),
        supplyChainAPI.getPurchaseOrders().catch(() => ({ data: [] })),
        supplyChainAPI.getEquipment().catch(() => ({ data: [] })),
        supplyChainAPI.getMaintenanceRequests().catch(() => ({ data: [] })),
        supplyChainAPI.getDashboardStats().catch(() => ({ data: {} })),
      ]);
      setInventory(inv.data || []);
      setVendors(ven.data || []);
      setPurchaseOrders(po.data || []);
      setEquipment(eq.data || []);
      setMaintenance(main.data || []);
      setStats(st.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const lowStockItems = inventory.filter(i => i.current_quantity <= i.min_quantity);

  return (
    <AppLayout title="Supply Chain Management" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Items', value: inventory.length, icon: <InvIcon />, color: '#2196f3' },
            { label: 'Low Stock', value: lowStockItems.length, icon: <WarningIcon />, color: '#f44336' },
            { label: 'Active POs', value: purchaseOrders.filter(p => !['received', 'cancelled'].includes(p.status)).length, icon: <POIcon />, color: '#ff9800' },
            { label: 'Equipment', value: equipment.length, icon: <EquipIcon />, color: '#4caf50' },
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

        {lowStockItems.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {lowStockItems.length} item(s) are below minimum stock levels and need reordering!
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' }, '& .Mui-selected': { color: '#90caf9' } }}>
          <Tab label="Inventory" icon={<InvIcon />} iconPosition="start" />
          <Tab label="Purchase Orders" icon={<POIcon />} iconPosition="start" />
          <Tab label="Vendors" icon={<VendorIcon />} iconPosition="start" />
          <Tab label="Equipment" icon={<EquipIcon />} iconPosition="start" />
          <Tab label="Maintenance" icon={<EquipIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Item</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>SKU</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Category</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Qty</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Min</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Location</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inventory.map((item: any) => (
                  <TableRow key={item.id} sx={{ bgcolor: item.current_quantity <= item.min_quantity ? 'rgba(244,67,54,0.1)' : 'transparent' }}>
                    <TableCell sx={{ color: '#fff' }}>{item.item_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.sku}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.category}</TableCell>
                    <TableCell sx={{ color: item.current_quantity <= item.min_quantity ? '#f44336' : '#fff', fontWeight: 700 }}>{item.current_quantity}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.min_quantity}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{item.location}</TableCell>
                    <TableCell><Chip label={item.status} size="small" sx={{ bgcolor: item.status === 'in_stock' ? 'rgba(76,175,80,0.3)' : item.status === 'low_stock' ? 'rgba(255,152,0,0.3)' : 'rgba(244,67,54,0.3)', color: item.status === 'in_stock' ? '#81c784' : item.status === 'low_stock' ? '#ffb74d' : '#ef5350' }} /></TableCell>
                  </TableRow>
                ))}
                {inventory.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No inventory items</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {purchaseOrders.map((po: any) => (
              <Card key={po.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>PO #{po.order_number}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Vendor: {po.vendor_name || po.vendor_id}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6" sx={{ color: '#4caf50' }}>${po.total_amount?.toLocaleString()}</Typography>
                      <Chip label={po.status} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      {po.status === 'submitted' && (
                        <Button size="small" variant="outlined" sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                          onClick={async () => { await supplyChainAPI.approvePurchaseOrder(po.id); loadData(); }}>
                          Approve
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
                    Ordered: {new Date(po.order_date).toLocaleDateString()} • Items: {po.items_count}
                    {po.expected_delivery && ` • Expected: ${new Date(po.expected_delivery).toLocaleDateString()}`}
                  </Typography>
                </CardContent>
              </Card>
            ))}
            {purchaseOrders.length === 0 && <Alert severity="info">No purchase orders.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {vendors.map((v: any) => (
              <Grid item xs={12} md={6} lg={4} key={v.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{v.name}</Typography>
                    <Chip label={v.status} size="small" sx={{ mt: 1, bgcolor: v.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: v.status === 'active' ? '#81c784' : '#9e9e9e' }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>Category: {v.category}</Typography>
                    {v.contact_person && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Contact: {v.contact_person}</Typography>}
                    {v.rating && <Typography variant="body2" sx={{ color: '#ffd700' }}>Rating: {'★'.repeat(Math.round(v.rating))}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {vendors.length === 0 && <Grid item xs={12}><Alert severity="info">No vendors registered.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Equipment</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Serial #</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Location</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Next Maintenance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {equipment.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell sx={{ color: '#fff' }}>{e.name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{e.equipment_type}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{e.serial_number}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{e.location}</TableCell>
                    <TableCell><Chip label={e.status} size="small" sx={{ bgcolor: e.status === 'operational' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)', color: e.status === 'operational' ? '#81c784' : '#ffb74d' }} /></TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{e.next_maintenance ? new Date(e.next_maintenance).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
                {equipment.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No equipment registered</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {maintenance.map((m: any) => (
              <Card key={m.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{m.equipment_name || 'Equipment'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{m.description}</Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Chip label={m.request_type} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={m.priority} size="small" sx={{ bgcolor: m.priority === 'critical' ? 'rgba(244,67,54,0.3)' : 'rgba(255,152,0,0.3)', color: m.priority === 'critical' ? '#ef5350' : '#ffb74d' }} />
                      <Chip label={m.status} size="small" sx={{ bgcolor: m.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: m.status === 'completed' ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {maintenance.length === 0 && <Alert severity="info">No maintenance requests.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default SupplyChainPage;

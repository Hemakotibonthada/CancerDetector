import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Avatar, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Alert, Switch, FormControlLabel, Divider, IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Security, Shield, Lock, VpnKey, Fingerprint, VerifiedUser,
  Warning, Error, Info, CheckCircle, Gavel, Policy, BugReport,
  NetworkCheck, Visibility, VisibilityOff, Delete,
  AdminPanelSettings, HealthAndSafety, Storage, Flag,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, Tooltip,
} from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { StatCard, StatusBadge, SectionHeader } from '../../components/common/SharedComponents';
import { adminAPI } from '../../services/api';

const SecurityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [complianceChecks, setComplianceChecks] = useState<any[]>([]);
  const [attacksByDay, setAttacksByDay] = useState<any[]>([]);
  const [threatTypes, setThreatTypes] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [vulnScan, setVulnScan] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminAPI.getDashboard();
      const d = res.data ?? res;
      setSecurityEvents(d.security_events ?? d.securityEvents ?? []);
      setComplianceChecks(d.compliance_checks ?? d.complianceChecks ?? []);
      setAttacksByDay(d.attacks_by_day ?? d.attacksByDay ?? []);
      setThreatTypes(d.threat_types ?? d.threatTypes ?? []);
      setPolicies(d.policies ?? []);
      setVulnScan(d.vuln_scan ?? d.vulnScan ?? d.vulnerabilities ?? []);
    } catch {
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const sevColors: any = { critical: '#d32f2f', high: '#f57c00', medium: '#ff9800', low: '#4caf50' };

  if (loading) {
    return (
      <AppLayout title="Security & Compliance" subtitle="Monitor security events and compliance" navItems={adminNavItems} portalType="admin">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Security & Compliance" subtitle="Monitor security events and compliance" navItems={adminNavItems} portalType="admin">
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Warning />} label="Active Threats" value={securityEvents.filter(e => !e.resolved && (e.severity === 'critical' || e.severity === 'high')).length} color="#d32f2f" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Shield />} label="Attacks Blocked" value="249" color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<VerifiedUser />} label="Compliance Score" value="94%" color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<BugReport />} label="Open Vulns" value={vulnScan.filter(v => v.status !== 'fixed').length} color="#f57c00" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Security Events" />
        <Tab label="Compliance" />
        <Tab label="Threat Analytics" />
        <Tab label="Policies" />
        <Tab label="Vulnerabilities" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Security Events</Typography>
              <Stack direction="row" spacing={1}>
                {['critical', 'high', 'medium', 'low'].map(s => (
                  <Chip key={s} label={`${s}: ${securityEvents.filter(e => e.severity === s).length}`} size="small"
                    sx={{ fontSize: 10, bgcolor: `${sevColors[s]}15`, color: sevColors[s], fontWeight: 700, textTransform: 'capitalize' }} />
                ))}
              </Stack>
            </Stack>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['ID', 'Type', 'Severity', 'Source IP', 'User', 'Time', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {securityEvents.map(e => (
                  <TableRow key={e.id} hover sx={{ cursor: 'pointer', bgcolor: !e.resolved && e.severity === 'critical' ? '#fff3f3' : 'inherit' }}
                    onClick={() => setSelectedEvent(e)}>
                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{e.id}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{e.type}</TableCell>
                    <TableCell>
                      <Chip label={e.severity} size="small" sx={{ fontSize: 10, fontWeight: 700, bgcolor: `${sevColors[e.severity]}15`, color: sevColors[e.severity], textTransform: 'uppercase' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{e.source}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{e.user}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{e.timestamp}</TableCell>
                    <TableCell>{e.resolved ? <Chip label="Resolved" size="small" color="success" sx={{ fontSize: 10 }} /> : <Chip label="Active" size="small" color="error" sx={{ fontSize: 10 }} />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 1 }}>Overall Compliance Score: 94% | Last Full Audit: Dec 20, 2024</Alert>
          </Grid>
          {complianceChecks.map((c, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ p: 2, borderLeft: `3px solid ${c.status === 'passed' ? '#4caf50' : '#ff9800'}` }}>
                <Stack direction="row" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{c.name}</Typography>
                    <Chip label={c.category} size="small" sx={{ fontSize: 9, mt: 0.5 }} />
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: c.score >= 90 ? '#4caf50' : c.score >= 80 ? '#ff9800' : '#d32f2f' }}>{c.score}%</Typography>
                  </Box>
                </Stack>
                <LinearProgress variant="determinate" value={c.score} sx={{ mt: 1, height: 6, borderRadius: 3 }} color={c.score >= 90 ? 'success' : 'warning'} />
                <Typography sx={{ fontSize: 10, color: 'text.secondary', mt: 0.5 }}>Last checked: {c.lastChecked}</Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Attacks This Week</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={attacksByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Bar dataKey="blocked" stackId="a" fill="#4caf50" name="Blocked" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="flagged" stackId="a" fill="#ff9800" name="Flagged" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Threat Types</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={threatTypes} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {threatTypes.map((t, i) => <Cell key={i} fill={t.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Card sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Security Policies</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['Policy', 'Status', 'Description', 'Last Updated'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {policies.map((p, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell>
                      <Switch checked={p.enabled} size="small" color="success" />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>{p.description}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{p.lastUpdated}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <Box sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Vulnerability Scan Results</Typography>
              <Button variant="outlined" size="small" startIcon={<NetworkCheck />}>Run Scan</Button>
            </Stack>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9ff' }}>
                  {['ID', 'Vulnerability', 'Severity', 'Component', 'CVE', 'Discovered', 'Status'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {vulnScan.map(v => (
                  <TableRow key={v.id} hover>
                    <TableCell sx={{ fontSize: 12, fontWeight: 700 }}>{v.id}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{v.name}</TableCell>
                    <TableCell>
                      <Chip label={v.severity} size="small" sx={{ fontSize: 10, fontWeight: 700, bgcolor: `${sevColors[v.severity]}15`, color: sevColors[v.severity], textTransform: 'uppercase' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{v.component}</TableCell>
                    <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{v.cve}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{v.discovered}</TableCell>
                    <TableCell><StatusBadge status={v.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography sx={{ fontWeight: 700 }}>{selectedEvent.id}: {selectedEvent.type}</Typography>
                <Chip label={selectedEvent.severity} sx={{ bgcolor: `${sevColors[selectedEvent.severity]}15`, color: sevColors[selectedEvent.severity], fontWeight: 700, textTransform: 'uppercase' }} />
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1.5} sx={{ mt: 1 }}>
                {[
                  { l: 'Description', v: selectedEvent.description },
                  { l: 'Source IP', v: selectedEvent.source },
                  { l: 'User', v: selectedEvent.user },
                  { l: 'Timestamp', v: selectedEvent.timestamp },
                  { l: 'Status', v: selectedEvent.resolved ? 'Resolved' : 'Active' },
                ].map(item => (
                  <Stack key={item.l} direction="row" justifyContent="space-between" sx={{ py: 0.5, borderBottom: '1px solid #f5f5f5' }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>{item.l}</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, maxWidth: '60%', textAlign: 'right' }}>{item.v}</Typography>
                  </Stack>
                ))}
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
              {!selectedEvent.resolved && <Button variant="contained" color="success">Mark Resolved</Button>}
              <Button variant="outlined" color="error">Block IP</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </AppLayout>
  );
};

export default SecurityPage;

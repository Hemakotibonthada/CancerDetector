import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, CircularProgress, Switch, FormControlLabel, Accordion, AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Shield, VerifiedUser, Warning, CheckCircle, Schedule, Assignment,
  Policy, Gavel, TrendingUp, Error, ExpandMore, Description,
  CalendarMonth, Security,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { adminNavItems } from './AdminDashboard';
import { complianceAPI } from '../../services/api';

const CompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showAuditDialog, setShowAuditDialog] = useState(false);
  const [complianceItems, setComplianceItems] = useState<any[]>([]);
  const [complianceScoreTrend, setComplianceScoreTrend] = useState<any[]>([]);
  const [regulationDistribution, setRegulationDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [recordsRes, hipaaRes] = await Promise.all([
        complianceAPI.getRecords(),
        complianceAPI.getHIPAAStatus(),
      ]);
      setComplianceItems(recordsRes.data?.compliance_items ?? recordsRes.data?.complianceItems ?? recordsRes.data ?? []);
      setComplianceScoreTrend(hipaaRes.data?.compliance_score_trend ?? hipaaRes.data?.complianceScoreTrend ?? []);
      setRegulationDistribution(hipaaRes.data?.regulation_distribution ?? hipaaRes.data?.regulationDistribution ?? []);
    } catch {
      setError('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const compliant = complianceItems.filter(c => c.status === 'compliant').length;
  const nonCompliant = complianceItems.filter(c => c.status === 'non_compliant').length;
  const overallScore = complianceItems.length > 0 ? Math.round((compliant / complianceItems.length) * 100) : 0;

  if (loading) {
    return (
      <AppLayout title="Compliance" navItems={adminNavItems} portalType="admin" subtitle="Regulatory compliance & audit management">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Compliance" navItems={adminNavItems} portalType="admin" subtitle="Regulatory compliance & audit management">
      <Box sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {nonCompliant > 0 && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
            {nonCompliant} compliance item(s) require immediate remediation!
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Shield />} label="Compliance Score" value={`${overallScore}%`} change="+3%" color="#4caf50" subtitle="Overall rating" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CheckCircle />} label="Compliant" value={compliant.toString()} color="#4caf50" subtitle={`of ${complianceItems.length} requirements`} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Error />} label="Non-Compliant" value={nonCompliant.toString()} color="#f44336" subtitle="Action required" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<CalendarMonth />} label="Next Audit" value="Jan 15" color="#ff9800" subtitle="SOC 2 - Confidentiality" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<Assignment />} label="Requirements" iconPosition="start" />
            <Tab icon={<CalendarMonth />} label="Audit Schedule" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Trends" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Compliance Requirements" icon={<Shield />}
              action={<Button startIcon={<Schedule />} variant="contained" size="small" onClick={() => setShowAuditDialog(true)}>Schedule Audit</Button>}
            />
            {['HIPAA', 'FDA 21 CFR Part 11', 'GDPR', 'SOC 2'].map((reg, ri) => (
              <Accordion key={ri} defaultExpanded={ri === 0} sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' }, border: '1px solid #f0f0f0' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip label={reg} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }} />
                    <Typography fontWeight={600} fontSize={14}>{complianceItems.filter(c => c.regulation === reg).length} Requirements</Typography>
                    {complianceItems.filter(c => c.regulation === reg && c.status !== 'compliant').length > 0 && (
                      <Warning sx={{ color: '#ff9800', fontSize: 18 }} />
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Requirement</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Risk</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Last Audit</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Next Audit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {complianceItems.filter(c => c.regulation === reg).map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell><Chip label={item.id} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 9 }} /></TableCell>
                            <TableCell>
                              <Typography fontSize={12} fontWeight={600}>{item.requirement}</Typography>
                              <Typography variant="caption" color="text.secondary" fontSize={10}>{item.details}</Typography>
                            </TableCell>
                            <TableCell><Typography fontSize={11}>{item.category}</Typography></TableCell>
                            <TableCell>
                              <Chip label={item.status.replace('_', ' ')} size="small" sx={{
                                bgcolor: item.status === 'compliant' ? '#e8f5e9' : item.status === 'partial' ? '#fff3e0' : '#ffebee',
                                color: item.status === 'compliant' ? '#2e7d32' : item.status === 'partial' ? '#e65100' : '#c62828',
                                fontWeight: 700, fontSize: 10, textTransform: 'capitalize',
                              }} />
                            </TableCell>
                            <TableCell>
                              <Chip label={item.risk} size="small" sx={{
                                bgcolor: item.risk === 'Low' ? '#e8f5e9' : item.risk === 'Medium' ? '#fff3e0' : '#ffebee',
                                color: item.risk === 'Low' ? '#2e7d32' : item.risk === 'Medium' ? '#e65100' : '#c62828',
                                fontWeight: 600, fontSize: 10,
                              }} />
                            </TableCell>
                            <TableCell><Typography fontSize={11}>{item.lastAudit}</Typography></TableCell>
                            <TableCell><Typography fontSize={11}>{item.nextAudit}</Typography></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </Card>
        )}

        {activeTab === 1 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Upcoming Audits" icon={<CalendarMonth />} />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Regulation</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Requirement</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Risk Level</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...complianceItems].sort((a, b) => a.nextAudit.localeCompare(b.nextAudit)).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell><Typography fontSize={12} fontWeight={600}>{item.nextAudit}</Typography></TableCell>
                      <TableCell><Chip label={item.regulation} size="small" variant="outlined" sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell><Typography fontSize={12}>{item.requirement}</Typography></TableCell>
                      <TableCell>
                        <Chip label={item.risk} size="small" sx={{
                          bgcolor: item.risk === 'Low' ? '#e8f5e9' : item.risk === 'Medium' ? '#fff3e0' : '#ffebee',
                          color: item.risk === 'Low' ? '#2e7d32' : item.risk === 'Medium' ? '#e65100' : '#c62828',
                          fontWeight: 600, fontSize: 10,
                        }} />
                      </TableCell>
                      <TableCell><StatusBadge status={item.status === 'compliant' ? 'ready' : 'pending'} /></TableCell>
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
                <SectionHeader title="Compliance Score Trend" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={complianceScoreTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <RTooltip />
                    <Line type="monotone" dataKey="score" stroke="#4caf50" strokeWidth={3} name="Compliance %" dot={{ fill: '#4caf50', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="By Regulation" icon={<Policy />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={regulationDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                      {regulationDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Audit Dialog */}
        <Dialog open={showAuditDialog} onClose={() => setShowAuditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Compliance Audit</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Regulation" fullWidth defaultValue="">
                <MenuItem value="hipaa">HIPAA</MenuItem>
                <MenuItem value="fda">FDA 21 CFR Part 11</MenuItem>
                <MenuItem value="gdpr">GDPR</MenuItem>
                <MenuItem value="soc2">SOC 2</MenuItem>
              </TextField>
              <TextField label="Audit Scope" fullWidth />
              <TextField label="Auditor" fullWidth />
              <TextField label="Scheduled Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Notes" multiline rows={3} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAuditDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowAuditDialog(false)}>Schedule</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default CompliancePage;

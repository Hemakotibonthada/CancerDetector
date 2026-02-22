import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Switch, FormControlLabel, Accordion, AccordionSummary,
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

const COMPLIANCE_ITEMS = [
  { id: 'HIPAA-001', regulation: 'HIPAA', category: 'Privacy', requirement: 'Patient Data Encryption', status: 'compliant', lastAudit: '2024-12-01', nextAudit: '2025-03-01', risk: 'Low', details: 'AES-256 encryption at rest and in transit. All endpoints verified.' },
  { id: 'HIPAA-002', regulation: 'HIPAA', category: 'Security', requirement: 'Access Control & Authentication', status: 'compliant', lastAudit: '2024-11-15', nextAudit: '2025-02-15', risk: 'Low', details: 'MFA enabled for all users. Role-based access controls implemented.' },
  { id: 'HIPAA-003', regulation: 'HIPAA', category: 'Breach', requirement: 'Breach Notification Procedures', status: 'compliant', lastAudit: '2024-10-20', nextAudit: '2025-01-20', risk: 'Medium', details: 'Procedures documented. Last drill: Oct 2024. Response time: 2 hours.' },
  { id: 'FDA-001', regulation: 'FDA 21 CFR Part 11', category: 'Electronic Records', requirement: 'Electronic Signatures', status: 'partial', lastAudit: '2024-11-01', nextAudit: '2025-02-01', risk: 'Medium', details: 'Digital signatures implemented. Audit trail needs enhancement.' },
  { id: 'GDPR-001', regulation: 'GDPR', category: 'Data Rights', requirement: 'Right to Erasure', status: 'compliant', lastAudit: '2024-12-05', nextAudit: '2025-03-05', risk: 'Low', details: 'Data deletion workflows automated. Average processing: 24 hours.' },
  { id: 'GDPR-002', regulation: 'GDPR', category: 'Consent', requirement: 'Consent Management', status: 'compliant', lastAudit: '2024-11-20', nextAudit: '2025-02-20', risk: 'Low', details: 'Granular consent collection. Opt-out mechanism functional.' },
  { id: 'SOC2-001', regulation: 'SOC 2', category: 'Availability', requirement: 'System Uptime SLA', status: 'compliant', lastAudit: '2024-12-10', nextAudit: '2025-03-10', risk: 'Low', details: '99.97% uptime achieved. Target: 99.9%.' },
  { id: 'SOC2-002', regulation: 'SOC 2', category: 'Confidentiality', requirement: 'Data Classification', status: 'non_compliant', lastAudit: '2024-09-15', nextAudit: '2025-01-15', risk: 'High', details: 'Classification policy incomplete. 30% of data assets unclassified.' },
];

const COMPLIANCE_SCORE_TREND = [
  { month: 'Jul', score: 82 }, { month: 'Aug', score: 85 }, { month: 'Sep', score: 87 },
  { month: 'Oct', score: 89 }, { month: 'Nov', score: 91 }, { month: 'Dec', score: 92 },
];

const REGULATION_DISTRIBUTION = [
  { name: 'HIPAA', value: 3, fill: '#5e92f3' },
  { name: 'FDA', value: 1, fill: '#ff9800' },
  { name: 'GDPR', value: 2, fill: '#ae52d4' },
  { name: 'SOC 2', value: 2, fill: '#4caf50' },
];

const CompliancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showAuditDialog, setShowAuditDialog] = useState(false);

  const compliant = COMPLIANCE_ITEMS.filter(c => c.status === 'compliant').length;
  const nonCompliant = COMPLIANCE_ITEMS.filter(c => c.status === 'non_compliant').length;
  const overallScore = Math.round((compliant / COMPLIANCE_ITEMS.length) * 100);

  return (
    <AppLayout title="Compliance" navItems={adminNavItems} portalType="admin" subtitle="Regulatory compliance & audit management">
      <Box sx={{ p: 3 }}>
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
            <StatCard icon={<CheckCircle />} label="Compliant" value={compliant.toString()} color="#4caf50" subtitle={`of ${COMPLIANCE_ITEMS.length} requirements`} />
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
                    <Typography fontWeight={600} fontSize={14}>{COMPLIANCE_ITEMS.filter(c => c.regulation === reg).length} Requirements</Typography>
                    {COMPLIANCE_ITEMS.filter(c => c.regulation === reg && c.status !== 'compliant').length > 0 && (
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
                        {COMPLIANCE_ITEMS.filter(c => c.regulation === reg).map((item, idx) => (
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
                  {COMPLIANCE_ITEMS.sort((a, b) => a.nextAudit.localeCompare(b.nextAudit)).map((item, idx) => (
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
                  <LineChart data={COMPLIANCE_SCORE_TREND}>
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
                    <Pie data={REGULATION_DISTRIBUTION} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                      {REGULATION_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill} />)}
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

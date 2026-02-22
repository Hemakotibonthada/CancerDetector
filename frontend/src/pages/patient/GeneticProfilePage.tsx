import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Tooltip, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Divider,
} from '@mui/material';
import {
  Biotech, Science, TrendingUp, Warning, CheckCircle, Info,
  Download, Share, Refresh, Timeline, Psychology,
  LocalPharmacy, FamilyRestroom, Assessment, Help,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, GlassCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { patientNavItems } from './PatientDashboard';

const GENETIC_MARKERS = [
  { gene: 'BRCA1', variant: 'c.5266dupC', risk_level: 'high', cancer_type: 'Breast/Ovarian', description: 'Increased risk for breast and ovarian cancer', prevalence: 0.12 },
  { gene: 'BRCA2', variant: 'Normal', risk_level: 'low', cancer_type: 'Breast/Ovarian', description: 'No pathogenic variants detected', prevalence: 0.11 },
  { gene: 'TP53', variant: 'Normal', risk_level: 'low', cancer_type: 'Li-Fraumeni', description: 'Normal tumor suppressor function', prevalence: 0.001 },
  { gene: 'APC', variant: 'c.3920T>A', risk_level: 'moderate', cancer_type: 'Colorectal', description: 'Variant of uncertain significance', prevalence: 0.05 },
  { gene: 'MLH1', variant: 'Normal', risk_level: 'low', cancer_type: 'Lynch Syndrome', description: 'No mismatch repair deficiency', prevalence: 0.03 },
  { gene: 'KRAS', variant: 'Normal', risk_level: 'low', cancer_type: 'Pancreatic/Lung', description: 'No activating mutations', prevalence: 0.25 },
  { gene: 'EGFR', variant: 'Normal', risk_level: 'low', cancer_type: 'Lung', description: 'Normal epidermal growth factor receptor', prevalence: 0.15 },
  { gene: 'PALB2', variant: 'c.172_175del', risk_level: 'moderate', cancer_type: 'Breast', description: 'Moderate increased risk', prevalence: 0.01 },
];

const PHARMACOGENOMICS = [
  { drug: 'Tamoxifen', gene: 'CYP2D6', metabolism: 'Normal', recommendation: 'Standard dosing recommended' },
  { drug: '5-Fluorouracil', gene: 'DPYD', metabolism: 'Intermediate', recommendation: 'Consider 25-50% dose reduction' },
  { drug: 'Irinotecan', gene: 'UGT1A1', metabolism: 'Poor', recommendation: 'Significant dose reduction required' },
  { drug: 'Capecitabine', gene: 'DPYD', metabolism: 'Intermediate', recommendation: 'Monitor closely, possible dose adjustment' },
  { drug: 'Cisplatin', gene: 'TPMT', metabolism: 'Normal', recommendation: 'Standard dosing recommended' },
  { drug: 'Mercaptopurine', gene: 'TPMT', metabolism: 'Rapid', recommendation: 'Standard or increased dosing may be needed' },
];

const ANCESTRY = [
  { name: 'European', value: 45, fill: '#5e92f3' },
  { name: 'South Asian', value: 30, fill: '#4ebaaa' },
  { name: 'East Asian', value: 12, fill: '#ae52d4' },
  { name: 'African', value: 8, fill: '#ff9800' },
  { name: 'Other', value: 5, fill: '#9e9e9e' },
];

const CANCER_RISK_RADAR = [
  { cancer: 'Breast', risk: 35, average: 12 },
  { cancer: 'Colorectal', risk: 18, average: 5 },
  { cancer: 'Lung', risk: 8, average: 6 },
  { cancer: 'Ovarian', risk: 22, average: 2 },
  { cancer: 'Pancreatic', risk: 5, average: 2 },
  { cancer: 'Prostate', risk: 10, average: 12 },
  { cancer: 'Skin', risk: 12, average: 8 },
];

const riskColors: Record<string, string> = { low: '#4caf50', moderate: '#ff9800', high: '#f44336' };

const GeneticProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  return (
    <AppLayout title="Genetic Profile" navItems={patientNavItems} portalType="patient" subtitle="DNA analysis & hereditary cancer risk">
      <Box sx={{ p: 3 }}>
        {/* Top Stats */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Biotech />} label="Genes Analyzed" value="247" change="+12" color="#5e92f3" subtitle="Last updated: Nov 2024" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Warning />} label="Risk Variants" value="2" color="#f44336" subtitle="1 high, 1 moderate" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Science />} label="Genetic Risk Score" value="32%" color="#ff9800" subtitle="Above average" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<LocalPharmacy />} label="Drug Sensitivity" value="1" change="Alert" color="#ae52d4" subtitle="Dose adjustment needed" />
          </Grid>
        </Grid>

        {/* Alert Banner */}
        <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }} action={
          <Button size="small" variant="outlined" onClick={() => setShowRequestDialog(true)}>Request New Test</Button>
        }>
          <strong>Genetic Counseling Recommended</strong> — Based on your BRCA1 variant, we recommend scheduling a genetic counseling session for personalized risk management strategies.
        </Alert>

        {/* Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<Biotech />} label="Gene Variants" iconPosition="start" />
            <Tab icon={<Assessment />} label="Cancer Risk Radar" iconPosition="start" />
            <Tab icon={<LocalPharmacy />} label="Pharmacogenomics" iconPosition="start" />
            <Tab icon={<FamilyRestroom />} label="Ancestry" iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab 0: Gene Variants */}
        {activeTab === 0 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Genetic Markers Analysis" subtitle="Pathogenic & VUS variants identified" icon={<Biotech />}
                  action={<Stack direction="row" spacing={1}>
                    <Button startIcon={<Download />} size="small" variant="outlined">Export Report</Button>
                    <Button startIcon={<Share />} size="small" variant="outlined">Share with Doctor</Button>
                  </Stack>}
                />
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Gene</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Variant</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Risk Level</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Cancer Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Population Prevalence</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {GENETIC_MARKERS.map((marker, idx) => (
                        <TableRow key={idx} sx={{ bgcolor: marker.risk_level === 'high' ? '#fff5f5' : marker.risk_level === 'moderate' ? '#fffbf0' : 'transparent' }}>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 32, height: 32, bgcolor: `${riskColors[marker.risk_level]}20`, color: riskColors[marker.risk_level], fontSize: 12, fontWeight: 700 }}>
                                {marker.gene.substring(0, 2)}
                              </Avatar>
                              <Typography fontWeight={600}>{marker.gene}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell><Chip label={marker.variant} size="small" variant="outlined" sx={{ fontFamily: 'monospace', fontSize: 11 }} /></TableCell>
                          <TableCell><Chip label={marker.risk_level.toUpperCase()} size="small" sx={{ bgcolor: `${riskColors[marker.risk_level]}15`, color: riskColors[marker.risk_level], fontWeight: 700 }} /></TableCell>
                          <TableCell>{marker.cancer_type}</TableCell>
                          <TableCell><Typography variant="body2" sx={{ fontSize: 12, maxWidth: 250 }}>{marker.description}</Typography></TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <LinearProgress variant="determinate" value={marker.prevalence * 100} sx={{ width: 60, height: 6, borderRadius: 3, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: riskColors[marker.risk_level] } }} />
                              <Typography variant="caption" fontWeight={600}>{(marker.prevalence * 100).toFixed(1)}%</Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Cancer Risk Radar */}
        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Cancer Risk Radar" subtitle="Your genetic risk vs population average" icon={<Assessment />} />
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={CANCER_RISK_RADAR}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="cancer" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 40]} />
                    <Radar name="Your Risk" dataKey="risk" stroke="#f44336" fill="#f44336" fillOpacity={0.2} strokeWidth={2} />
                    <Radar name="Population Avg" dataKey="average" stroke="#1565c0" fill="#1565c0" fillOpacity={0.1} strokeWidth={2} />
                    <Legend />
                    <RTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3, mb: 2.5 }}>
                <SectionHeader title="Highest Risk Factors" icon={<Warning />} />
                {CANCER_RISK_RADAR.sort((a, b) => b.risk - a.risk).slice(0, 4).map((item, idx) => (
                  <Box key={idx} sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{item.cancer} Cancer</Typography>
                      <Typography variant="body2" fontWeight={700} color={item.risk > 20 ? 'error' : item.risk > 10 ? 'warning.main' : 'success.main'}>{item.risk}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={item.risk} sx={{ height: 8, borderRadius: 4, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: item.risk > 20 ? '#f44336' : item.risk > 10 ? '#ff9800' : '#4caf50', borderRadius: 4 } }} />
                    <Typography variant="caption" color="text.secondary">Population average: {item.average}%</Typography>
                  </Box>
                ))}
              </Card>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Overall Genetic Risk" icon={<Science />} />
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <MetricGauge value={32} color="#ff9800" label="Risk Score" size={160} />
                </Box>
                <Typography variant="body2" color="text.secondary" textAlign="center">Your overall genetic cancer risk is <strong>moderately elevated</strong> compared to the general population.</Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Pharmacogenomics */}
        {activeTab === 2 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Pharmacogenomics Report" subtitle="How your genetics affect drug metabolism" icon={<LocalPharmacy />}
              action={<Button startIcon={<Download />} size="small" variant="outlined">Download Full Report</Button>}
            />
            <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
              <strong>Important:</strong> 1 drug requires dose adjustment based on your genetic profile. Share this report with your oncologist.
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Drug</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Gene</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Metabolism</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Recommendation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {PHARMACOGENOMICS.map((item, idx) => (
                    <TableRow key={idx} sx={{ bgcolor: item.metabolism === 'Poor' ? '#fff5f5' : item.metabolism === 'Intermediate' ? '#fffbf0' : 'transparent' }}>
                      <TableCell><Typography fontWeight={600}>{item.drug}</Typography></TableCell>
                      <TableCell><Chip label={item.gene} size="small" variant="outlined" sx={{ fontFamily: 'monospace' }} /></TableCell>
                      <TableCell>
                        <Chip label={item.metabolism} size="small" sx={{
                          fontWeight: 700,
                          bgcolor: item.metabolism === 'Poor' ? '#ffebee' : item.metabolism === 'Intermediate' ? '#fff3e0' : '#e8f5e9',
                          color: item.metabolism === 'Poor' ? '#c62828' : item.metabolism === 'Intermediate' ? '#e65100' : '#2e7d32',
                        }} />
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontSize: 13 }}>{item.recommendation}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Tab 3: Ancestry */}
        {activeTab === 3 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Ancestry Composition" subtitle="Based on genetic analysis" icon={<FamilyRestroom />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={ANCESTRY} cx="50%" cy="50%" innerRadius={60} outerRadius={110} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                      {ANCESTRY.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Ancestry-Based Risk Factors" icon={<Info />} />
                <Stack spacing={2}>
                  {[
                    { ancestry: 'European', risk: 'Higher prevalence of BRCA1/2 mutations in Ashkenazi Jewish heritage', icon: '🧬' },
                    { ancestry: 'South Asian', risk: 'Elevated risk for gallbladder and oral cancers', icon: '⚠️' },
                    { ancestry: 'General', risk: 'Vitamin D metabolism variants may affect cancer prevention', icon: '☀️' },
                    { ancestry: 'Pharmacogenomics', risk: 'CYP2D6 metabolism rates vary by ancestry, affecting drug efficacy', icon: '💊' },
                  ].map((item, idx) => (
                    <GlassCard key={idx} sx={{ p: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography fontSize={28}>{item.icon}</Typography>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>{item.ancestry}</Typography>
                          <Typography variant="body2" color="text.secondary" fontSize={12}>{item.risk}</Typography>
                        </Box>
                      </Stack>
                    </GlassCard>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Request Test Dialog */}
        <Dialog open={showRequestDialog} onClose={() => setShowRequestDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request Genetic Test</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Test Type" fullWidth defaultValue="comprehensive">
                <MenuItem value="comprehensive">Comprehensive Cancer Panel (100+ genes)</MenuItem>
                <MenuItem value="brca">BRCA1/BRCA2 Analysis</MenuItem>
                <MenuItem value="lynch">Lynch Syndrome Panel</MenuItem>
                <MenuItem value="pharmacogenomics">Pharmacogenomics Panel</MenuItem>
                <MenuItem value="whole_genome">Whole Genome Sequencing</MenuItem>
              </TextField>
              <TextField label="Reason for Testing" multiline rows={3} fullWidth placeholder="Describe your reason..." />
              <TextField select label="Preferred Lab" fullWidth defaultValue="genomics_center">
                <MenuItem value="genomics_center">National Genomics Center</MenuItem>
                <MenuItem value="genetic_lab">Genetic Testing Lab</MenuItem>
                <MenuItem value="university">University Hospital Lab</MenuItem>
              </TextField>
              <Alert severity="info" sx={{ borderRadius: 2 }}>Insurance coverage will be verified before testing. Estimated turnaround: 2-4 weeks.</Alert>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowRequestDialog(false)}>Submit Request</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default GeneticProfilePage;

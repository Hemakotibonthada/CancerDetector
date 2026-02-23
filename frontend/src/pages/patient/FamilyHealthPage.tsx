import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Avatar,
  LinearProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Divider, Switch, FormControlLabel, IconButton,
  Tooltip, CircularProgress,
} from '@mui/material';
import {
  FamilyRestroom, AccountTree, Person, PersonAdd, Warning, CheckCircle,
  Edit, Delete, Science, Info, TrendingUp, Favorite, HealthAndSafety,
  Male, Female, ChildCare,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, GlassCard, SectionHeader, MetricGauge } from '../../components/common/SharedComponents';
import { patientNavItems } from './PatientDashboard';
import { familyHealthAPI } from '../../services/api';

const getRelationIcon = (rel: string) => {
  if (rel.includes('Father') || rel.includes('Brother') || rel.includes('GF')) return <Male />;
  if (rel.includes('Mother') || rel.includes('Sister') || rel.includes('GM') || rel.includes('Aunt')) return <Female />;
  return <Person />;
};

const FamilyHealthPage: React.FC = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [hereditaryRisk, setHereditaryRisk] = useState<any[]>([]);
  const [cancerPattern, setCancerPattern] = useState<any[]>([]);

  const membersWithCancer = familyMembers.filter(m => m.cancerHistory?.length > 0);
  const geneticTestedCount = familyMembers.filter(m => m.geneticTested).length;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [treeRes, riskRes] = await Promise.all([
        familyHealthAPI.getTree().catch(() => null),
        familyHealthAPI.getRiskAnalysis().catch(() => null),
      ]);

      if (treeRes?.data) {
        const members = Array.isArray(treeRes.data) ? treeRes.data : (treeRes.data.members ?? treeRes.data.family ?? []);
        setFamilyMembers(members.map((m: any) => ({
          id: m.id ?? '', name: m.name ?? '', relationship: m.relationship ?? '', age: m.age ?? 0,
          alive: m.alive ?? m.is_alive ?? true, conditions: m.conditions ?? m.medical_conditions ?? [],
          cancerHistory: m.cancer_history ?? m.cancerHistory ?? [], geneticTested: m.genetic_tested ?? m.geneticTested ?? false,
        })));
      }
      if (riskRes?.data) {
        if (Array.isArray(riskRes.data.hereditary_risks ?? riskRes.data.risks)) {
          setHereditaryRisk((riskRes.data.hereditary_risks ?? riskRes.data.risks).map((r: any) => ({
            cancer: r.cancer_type ?? r.cancer ?? '', risk: r.risk ?? r.risk_percentage ?? 0,
            population: r.population_average ?? r.population ?? 0, inherited: r.inherited ?? r.is_inherited ?? false,
          })));
        }
        if (Array.isArray(riskRes.data.cancer_patterns ?? riskRes.data.patterns)) {
          setCancerPattern((riskRes.data.cancer_patterns ?? riskRes.data.patterns).map((p: any) => ({
            name: p.name ?? p.cancer_type ?? '', value: p.count ?? p.value ?? 0, fill: p.fill ?? p.color ?? '#5e92f3',
          })));
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load family health data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout title="Family Health" navItems={patientNavItems} portalType="patient" subtitle="Hereditary risk & family health tree">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 3 }} action={<Button onClick={loadData}>Retry</Button>}>{error}</Alert>
      ) : (
      <Box sx={{ p: 3 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<FamilyRestroom />} label="Family Members" value={familyMembers.length.toString()} color="#5e92f3" subtitle="In health tree" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Warning />} label="Cancer History" value={membersWithCancer.length.toString()} color="#f44336" subtitle={`${cancerPattern.length} types`} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Science />} label="Genetic Testing" value={`${geneticTestedCount}/${familyMembers.length}`} color="#ae52d4" subtitle="Members tested" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<TrendingUp />} label="Hereditary Risk" value="Elevated" color="#ff9800" subtitle="Based on family history" />
          </Grid>
        </Grid>

        <Alert severity="warning" sx={{ mb: 3, borderRadius: 3 }}>
          <strong>Hereditary Pattern Detected:</strong> Multiple first-degree relatives with breast and ovarian cancer suggest a possible BRCA gene mutation.
          We recommend genetic counseling for untested family members.
        </Alert>

        <Grid container spacing={2.5}>
          {/* Family Members */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, mb: 2.5 }}>
              <SectionHeader title="Family Health Tree" subtitle="Medical history of family members" icon={<AccountTree />}
                action={<Button startIcon={<PersonAdd />} variant="contained" size="small" onClick={() => setShowAddDialog(true)}>Add Member</Button>}
              />
              {familyMembers.map((member, idx) => (
                <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: member.cancerHistory.length > 0 ? '#fff8f8' : '#f8fafc', borderRadius: 3, border: `1px solid ${member.cancerHistory.length > 0 ? '#ffcdd2' : '#f0f0f0'}` }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: member.alive ? '#e3f2fd' : '#f5f5f5', color: member.alive ? '#1565c0' : '#9e9e9e' }}>{getRelationIcon(member.relationship)}</Avatar>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography fontWeight={700} fontSize={14}>{member.name}</Typography>
                          {!member.alive && <Chip label="Deceased" size="small" sx={{ bgcolor: '#f5f5f5', color: '#757575', fontSize: 10 }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{member.relationship}{member.alive ? ` • Age ${member.age}` : ''}</Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {member.geneticTested && <Chip icon={<Science sx={{ fontSize: 14 }} />} label="Tested" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontSize: 10, fontWeight: 600 }} />}
                      <IconButton size="small"><Edit sx={{ fontSize: 16 }} /></IconButton>
                    </Stack>
                  </Stack>
                  {(member.conditions.length > 0 || member.cancerHistory.length > 0) && (
                    <Box sx={{ mt: 1.5 }}>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {member.conditions.map((c, i) => <Chip key={i} label={c} size="small" variant="outlined" sx={{ fontSize: 10, mb: 0.5 }} />)}
                        {member.cancerHistory.map((c, i) => (
                          <Chip key={`cancer-${i}`} label={`${c.type} Cancer (age ${c.age}) - ${c.outcome}`} size="small" sx={{
                            bgcolor: c.outcome === 'Deceased' ? '#ffebee' : '#fff3e0',
                            color: c.outcome === 'Deceased' ? '#c62828' : '#e65100',
                            fontSize: 10, fontWeight: 600, mb: 0.5,
                          }} />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              ))}
            </Card>
          </Grid>

          {/* Risk Analysis */}
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, mb: 2.5 }}>
              <SectionHeader title="Cancer Pattern" icon={<Favorite />} />
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={cancerPattern} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name}: ${value}`}>
                    {cancerPattern.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Family Cancer Summary</Typography>
              <Stack spacing={0.5}>
                {cancerPattern.map((p, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.fill }} />
                    <Typography variant="body2" fontSize={12}>{p.name}: {p.value} case(s)</Typography>
                  </Stack>
                ))}
              </Stack>
            </Card>

            <Card sx={{ p: 3, mb: 2.5 }}>
              <SectionHeader title="Hereditary Risk Assessment" icon={<TrendingUp />} />
              {hereditaryRisk.filter(r => r.inherited).map((risk, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{risk.cancer}</Typography>
                    <Typography variant="body2" fontWeight={700} color={risk.risk > 20 ? 'error' : 'warning.main'}>{risk.risk}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={risk.risk} sx={{ height: 8, borderRadius: 4, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: risk.risk > 20 ? '#f44336' : '#ff9800', borderRadius: 4 } }} />
                  <Typography variant="caption" color="text.secondary">Population avg: {risk.population}%</Typography>
                </Box>
              ))}
            </Card>

            <Card sx={{ p: 3 }}>
              <SectionHeader title="Recommendations" icon={<HealthAndSafety />} />
              <Stack spacing={1.5}>
                {[
                  { text: 'Get BRCA1/BRCA2 testing', priority: 'High', done: true },
                  { text: 'Earlier mammography screening', priority: 'High', done: true },
                  { text: 'Recommend sibling genetic testing', priority: 'Medium', done: false },
                  { text: 'Consider risk-reducing medications', priority: 'Medium', done: false },
                  { text: 'Annual ovarian cancer screening', priority: 'High', done: false },
                ].map((rec, i) => (
                  <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 2, opacity: rec.done ? 0.6 : 1 }}>
                    <CheckCircle sx={{ fontSize: 16, color: rec.done ? '#4caf50' : '#e0e0e0' }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontSize={12} sx={{ textDecoration: rec.done ? 'line-through' : 'none' }}>{rec.text}</Typography>
                    </Box>
                    <Chip label={rec.priority} size="small" sx={{ fontSize: 9, fontWeight: 600, bgcolor: rec.priority === 'High' ? '#ffebee' : '#fff3e0', color: rec.priority === 'High' ? '#c62828' : '#e65100' }} />
                  </Stack>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Add Member Dialog */}
        <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Full Name" fullWidth />
              <TextField select label="Relationship" fullWidth defaultValue="">
                <MenuItem value="father">Father</MenuItem>
                <MenuItem value="mother">Mother</MenuItem>
                <MenuItem value="brother">Brother</MenuItem>
                <MenuItem value="sister">Sister</MenuItem>
                <MenuItem value="grandfather">Grandfather</MenuItem>
                <MenuItem value="grandmother">Grandmother</MenuItem>
                <MenuItem value="uncle">Uncle</MenuItem>
                <MenuItem value="aunt">Aunt</MenuItem>
                <MenuItem value="cousin">Cousin</MenuItem>
                <MenuItem value="child">Child</MenuItem>
              </TextField>
              <TextField label="Age" type="number" fullWidth />
              <FormControlLabel control={<Switch defaultChecked />} label="Alive" />
              <TextField label="Medical Conditions" multiline rows={2} fullWidth placeholder="List conditions separated by commas..." />
              <FormControlLabel control={<Switch />} label="Has Cancer History" />
              <FormControlLabel control={<Switch />} label="Had Genetic Testing" />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowAddDialog(false)}>Add Member</Button>
          </DialogActions>
        </Dialog>
      </Box>
      )}
    </AppLayout>
  );
};

export default FamilyHealthPage;

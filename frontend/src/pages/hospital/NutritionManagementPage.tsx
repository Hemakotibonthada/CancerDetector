import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  Restaurant as NutIcon, FoodBank as MealIcon,
  LocalDrink as HydrationIcon, MonitorWeight as WeightIcon,
  Assessment as AssessIcon, MedicalServices as EnteralIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { hospitalNavItems } from './HospitalDashboard';
import { nutritionEnhancedAPI } from '../../services/api';

const NutritionManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [enteral, setEnteral] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [as_, mp, dt, sp, en] = await Promise.all([
        nutritionEnhancedAPI.getAssessments().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getMealPlans().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getDietaryRestrictions().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getSupplements().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getEnteralNutrition().catch(() => ({ data: [] })),
      ]);
      setAssessments(as_.data || []);
      setMealPlans(mp.data || []);
      setDiets(dt.data || []);
      setSupplements(sp.data || []);
      setEnteral(en.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const malnutritionColors: Record<string, string> = { severe: '#d32f2f', moderate: '#ff9800', mild: '#ffd54f', none: '#4caf50' };

  return (
    <AppLayout title="Nutrition Management" navItems={hospitalNavItems} portalType="hospital">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Assessments Due', value: assessments.filter(a => a.status === 'pending').length, icon: <AssessIcon />, color: '#ff9800' },
            { label: 'Active Meal Plans', value: mealPlans.filter(m => m.status === 'active').length, icon: <MealIcon />, color: '#4caf50' },
            { label: 'Dietary Restrictions', value: diets.length, icon: <NutIcon />, color: '#2196f3' },
            { label: 'Enteral Feeds', value: enteral.filter(e => e.status === 'active').length, icon: <EnteralIcon />, color: '#9c27b0' },
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
          <Tab label="Nutritional Assessments" icon={<AssessIcon />} iconPosition="start" />
          <Tab label="Meal Plans" icon={<MealIcon />} iconPosition="start" />
          <Tab label="Supplements" icon={<NutIcon />} iconPosition="start" />
          <Tab label="Enteral/Parenteral" icon={<EnteralIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={2}>
            {assessments.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{a.patient_name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Assessed: {a.assessment_date ? new Date(a.assessment_date).toLocaleDateString() : 'Pending'} • Tool: {a.screening_tool || 'MUST'}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        {a.bmi && <Typography variant="body2" sx={{ color: a.bmi < 18.5 ? '#f44336' : a.bmi > 30 ? '#ff9800' : '#81c784' }}>BMI: {a.bmi}</Typography>}
                        {a.weight && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Weight: {a.weight}kg</Typography>}
                        {a.albumin && <Typography variant="body2" sx={{ color: a.albumin < 3.5 ? '#f44336' : '#81c784' }}>Albumin: {a.albumin} g/dL</Typography>}
                        {a.prealbumin && <Typography variant="body2" sx={{ color: a.prealbumin < 16 ? '#f44336' : '#81c784' }}>Prealbumin: {a.prealbumin} mg/dL</Typography>}
                      </Stack>
                      {a.malnutrition_risk && (
                        <Chip label={`Malnutrition Risk: ${a.malnutrition_risk}`} size="small" sx={{ mt: 1,
                          bgcolor: `${malnutritionColors[a.malnutrition_risk] || '#ff9800'}33`,
                          color: malnutritionColors[a.malnutrition_risk] || '#ffb74d' }} />
                      )}
                      {a.calorie_needs && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                        Calorie Needs: {a.calorie_needs} kcal/day • Protein: {a.protein_needs}g/day
                      </Typography>}
                    </Box>
                    <Chip label={a.status} size="small"
                      sx={{ bgcolor: a.status === 'completed' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                            color: a.status === 'completed' ? '#81c784' : '#ffb74d' }} />
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {assessments.length === 0 && <Alert severity="info">No nutritional assessments.</Alert>}
          </Stack>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Patient</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Diet Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Calories</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Restrictions</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Texture</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mealPlans.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell sx={{ color: '#fff' }}>{m.patient_name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{m.diet_type || 'Regular'}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{m.calorie_target || '-'} kcal</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(m.restrictions || []).map((r: string, i: number) => (
                          <Chip key={i} label={r} size="small" sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350', fontSize: 10 }} />
                        ))}
                        {(!m.restrictions || m.restrictions.length === 0) && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>None</Typography>}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{m.texture_modification || 'Regular'}</TableCell>
                    <TableCell>
                      <Chip label={m.status || 'active'} size="small"
                        sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                    </TableCell>
                  </TableRow>
                ))}
                {mealPlans.length === 0 && <TableRow><TableCell colSpan={6} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No meal plans</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {supplements.map((s: any) => (
              <Grid item xs={12} sm={6} md={4} key={s.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{s.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Patient: {s.patient_name}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={`${s.dosage || ''} ${s.unit || ''}`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={s.frequency || 'Daily'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mt: 1, display: 'block' }}>
                      Reason: {s.reason || 'Nutritional support'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {supplements.length === 0 && <Grid item xs={12}><Alert severity="info">No supplements prescribed.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {enteral.map((e: any) => (
              <Card key={e.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>
                        <EnteralIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#9c27b0' }} />
                        {e.feeding_type || 'Enteral'} - {e.patient_name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Formula: {e.formula_name} • Route: {e.route || 'NG Tube'}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: '#90caf9' }}>Rate: {e.rate}ml/hr</Typography>
                        <Typography variant="body2" sx={{ color: '#81c784' }}>Goal: {e.goal_rate}ml/hr</Typography>
                        <Typography variant="body2" sx={{ color: '#ffb74d' }}>Calories: {e.calories_per_day}kcal/day</Typography>
                      </Stack>
                      {e.residual_checks && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Last Residual: {e.last_residual}ml</Typography>}
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={e.status || 'active'} size="small"
                        sx={{ bgcolor: e.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: e.status === 'active' ? '#81c784' : '#ffb74d' }} />
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>
                        Update Rate
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {enteral.length === 0 && <Alert severity="info">No enteral/parenteral feedings.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default NutritionManagementPage;

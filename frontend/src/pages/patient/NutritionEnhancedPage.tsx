import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  Restaurant as FoodIcon, LocalDrink as DrinkIcon,
  FitnessCenter as WeightIcon, Medication as SupIcon,
  MenuBook as PlanIcon, TrackChanges as TrackIcon,
  WaterDrop as HydIcon, CheckCircle as CheckIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { nutritionEnhancedAPI } from '../../services/api';

const NutritionEnhancedPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [foodLogs, setFoodLogs] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [hydration, setHydration] = useState<any[]>([]);
  const [weightPrograms, setWeightPrograms] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asmt, meals, logs, sups, hyd, wgt] = await Promise.all([
        nutritionEnhancedAPI.getAssessments().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getMealPlans().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getFoodLogs().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getSupplements().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getHydrationLogs().catch(() => ({ data: [] })),
        nutritionEnhancedAPI.getWeightPrograms().catch(() => ({ data: [] })),
      ]);
      setAssessments(asmt.data || []);
      setMealPlans(meals.data || []);
      setFoodLogs(logs.data || []);
      setSupplements(sups.data || []);
      setHydration(hyd.data || []);
      setWeightPrograms(wgt.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const todayCalories = foodLogs.filter(l => new Date(l.logged_at).toDateString() === new Date().toDateString())
    .reduce((sum, l) => sum + (l.calories || 0), 0);
  const todayWater = hydration.filter(h => new Date(h.logged_at).toDateString() === new Date().toDateString())
    .reduce((sum, h) => sum + (h.amount_ml || 0), 0);

  return (
    <AppLayout title="Nutrition & Diet" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Today Calories', value: `${todayCalories} kcal`, icon: <FoodIcon />, color: '#ff9800' },
            { label: 'Water Intake', value: `${todayWater} ml`, icon: <HydIcon />, color: '#2196f3' },
            { label: 'Active Plans', value: mealPlans.filter(p => p.status === 'active').length, icon: <PlanIcon />, color: '#4caf50' },
            { label: 'Supplements', value: supplements.length, icon: <SupIcon />, color: '#9c27b0' },
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
          <Tab label="Meal Plans" icon={<PlanIcon />} iconPosition="start" />
          <Tab label="Food Log" icon={<FoodIcon />} iconPosition="start" />
          <Tab label="Hydration" icon={<HydIcon />} iconPosition="start" />
          <Tab label="Supplements" icon={<SupIcon />} iconPosition="start" />
          <Tab label="Weight Mgmt" icon={<WeightIcon />} iconPosition="start" />
          <Tab label="Assessments" icon={<TrackIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {mealPlans.map((plan: any) => (
              <Grid item xs={12} md={6} key={plan.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{plan.plan_name || 'Meal Plan'}</Typography>
                      <Chip label={plan.status} size="small" sx={{ bgcolor: plan.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: plan.status === 'active' ? '#81c784' : '#9e9e9e' }} />
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                      Target: {plan.daily_calories || 2000} kcal/day • {plan.diet_type || 'Balanced'}
                    </Typography>
                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      {['Protein', 'Carbs', 'Fat'].map((m, i) => (
                        <Grid item xs={4} key={m}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                            <Typography variant="h6" sx={{ color: ['#4caf50', '#ff9800', '#f44336'][i] }}>
                              {plan[`${m.toLowerCase()}_grams`] || [120, 250, 65][i]}g
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{m}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    {plan.meals && (
                      <Stack spacing={0.5} sx={{ mt: 2 }}>
                        {plan.meals.map((meal: any, i: number) => (
                          <Typography key={i} variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            • {meal.time}: {meal.description} ({meal.calories} kcal)
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {mealPlans.length === 0 && <Grid item xs={12}><Alert severity="info">No meal plans yet.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Time</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Meal</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Food</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Calories</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Protein</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Carbs</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Fat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {foodLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{new Date(log.logged_at).toLocaleTimeString()}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{log.meal_type}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{log.food_name}</TableCell>
                    <TableCell sx={{ color: '#ff9800', fontWeight: 700 }}>{log.calories}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{log.protein_g}g</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{log.carbs_g}g</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{log.fat_g}g</TableCell>
                  </TableRow>
                ))}
                {foodLogs.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No food logs today</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 2 && (
          <Box>
            <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #1a1a2e 0%, #0d47a1 100%)', border: '1px solid rgba(33,150,243,0.3)', p: 2, textAlign: 'center' }}>
              <CardContent>
                <HydIcon sx={{ fontSize: 48, color: '#2196f3', mb: 1 }} />
                <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700 }}>{todayWater} ml</Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>of 2500 ml daily goal</Typography>
                <LinearProgress variant="determinate" value={Math.min((todayWater / 2500) * 100, 100)}
                  sx={{ mt: 2, height: 12, borderRadius: 6, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#2196f3' } }} />
                <Button variant="contained" sx={{ mt: 2, bgcolor: '#2196f3' }}
                  onClick={async () => { await nutritionEnhancedAPI.logHydration({ amount_ml: 250 }); loadData(); }}>
                  + 250ml Water
                </Button>
              </CardContent>
            </Card>
            <Stack spacing={1}>
              {hydration.map((h: any) => (
                <Card key={h.id} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
                  <CardContent sx={{ py: 1 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: '#fff' }}>{h.beverage_type || 'Water'} - {h.amount_ml} ml</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{new Date(h.logged_at).toLocaleTimeString()}</Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>
        )}

        {activeTab === 3 && (
          <Grid container spacing={2}>
            {supplements.map((sup: any) => (
              <Grid item xs={12} sm={6} md={4} key={sup.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{sup.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{sup.dosage} • {sup.frequency}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>Purpose: {sup.purpose}</Typography>
                    <Chip label={sup.is_active ? 'Active' : 'Stopped'} size="small" sx={{ mt: 1, bgcolor: sup.is_active ? 'rgba(76,175,80,0.3)' : 'rgba(158,158,158,0.3)', color: sup.is_active ? '#81c784' : '#9e9e9e' }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {supplements.length === 0 && <Grid item xs={12}><Alert severity="info">No supplements tracked.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 4 && (
          <Stack spacing={2}>
            {weightPrograms.map((prog: any) => (
              <Card key={prog.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{prog.program_name || 'Weight Management'}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Goal: {prog.target_weight} kg • Current: {prog.current_weight} kg
                      </Typography>
                    </Box>
                    <Chip label={prog.status} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                  </Stack>
                  {prog.target_weight && prog.current_weight && prog.start_weight && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress variant="determinate"
                        value={Math.min(Math.abs((prog.start_weight - prog.current_weight) / (prog.start_weight - prog.target_weight)) * 100, 100)}
                        sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5, display: 'block' }}>
                        {Math.abs(prog.current_weight - prog.target_weight).toFixed(1)} kg to goal
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
            {weightPrograms.length === 0 && <Alert severity="info">No weight management programs.</Alert>}
          </Stack>
        )}

        {activeTab === 5 && (
          <Stack spacing={2}>
            {assessments.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>Nutrition Assessment</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        BMI: {a.bmi} • Risk: {a.malnutrition_risk || 'Low'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {new Date(a.assessment_date).toLocaleDateString()} • By: {a.dietitian_name}
                      </Typography>
                    </Box>
                    <Chip label={a.malnutrition_risk || 'Low'} size="small"
                      sx={{ bgcolor: a.malnutrition_risk === 'high' ? 'rgba(244,67,54,0.3)' : 'rgba(76,175,80,0.3)',
                            color: a.malnutrition_risk === 'high' ? '#ef5350' : '#81c784' }} />
                  </Stack>
                  {a.recommendations && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 1 }}>
                      Recommendations: {a.recommendations}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
            {assessments.length === 0 && <Alert severity="info">No nutrition assessments.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default NutritionEnhancedPage;

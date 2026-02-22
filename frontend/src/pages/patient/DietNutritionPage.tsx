import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText,
  Rating, Divider, IconButton,
} from '@mui/material';
import {
  Restaurant, FoodBank, LocalDining, WaterDrop, Spa, EggAlt,
  Add, TrendingUp, Favorite, Science, FitnessCenter, CheckCircle,
  Star, Schedule, Nature as EcoIcon, MonitorWeight,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, GlassCard, SectionHeader, ProgressCard } from '../../components/common/SharedComponents';
import { patientNavItems } from './PatientDashboard';

const WEEKLY_NUTRITION = [
  { day: 'Mon', calories: 1850, protein: 75, carbs: 220, fat: 58, antioxidants: 82 },
  { day: 'Tue', calories: 2100, protein: 88, carbs: 240, fat: 65, antioxidants: 78 },
  { day: 'Wed', calories: 1920, protein: 80, carbs: 210, fat: 62, antioxidants: 90 },
  { day: 'Thu', calories: 1780, protein: 72, carbs: 195, fat: 55, antioxidants: 85 },
  { day: 'Fri', calories: 2050, protein: 85, carbs: 235, fat: 61, antioxidants: 88 },
  { day: 'Sat', calories: 2200, protein: 90, carbs: 260, fat: 70, antioxidants: 75 },
  { day: 'Sun', calories: 1950, protein: 78, carbs: 225, fat: 60, antioxidants: 92 },
];

const MACRO_BREAKDOWN = [
  { name: 'Protein', value: 25, fill: '#5e92f3', target: 30 },
  { name: 'Carbs', value: 50, fill: '#4ebaaa', target: 45 },
  { name: 'Fats', value: 20, fill: '#ff9800', target: 25 },
  { name: 'Fiber', value: 5, fill: '#ae52d4', target: 8 },
];

const ANTI_CANCER_FOODS = [
  { name: 'Broccoli', category: 'Cruciferous', score: 95, benefit: 'Sulforaphane - powerful anti-cancer compound', icon: '🥦', servings: 3 },
  { name: 'Blueberries', category: 'Berries', score: 92, benefit: 'High in antioxidants, reduces oxidative stress', icon: '🫐', servings: 5 },
  { name: 'Turmeric', category: 'Spices', score: 90, benefit: 'Curcumin inhibits cancer cell growth', icon: '🟡', servings: 2 },
  { name: 'Green Tea', category: 'Beverages', score: 88, benefit: 'EGCG catechins fight multiple cancer types', icon: '🍵', servings: 4 },
  { name: 'Salmon', category: 'Fish', score: 87, benefit: 'Omega-3 fatty acids reduce inflammation', icon: '🐟', servings: 2 },
  { name: 'Garlic', category: 'Allium', score: 85, benefit: 'Allicin compounds prevent DNA damage', icon: '🧄', servings: 6 },
  { name: 'Tomatoes', category: 'Fruits', score: 84, benefit: 'Lycopene linked to reduced prostate cancer risk', icon: '🍅', servings: 4 },
  { name: 'Spinach', category: 'Leafy Greens', score: 83, benefit: 'Folate and carotenoids for cancer prevention', icon: '🥬', servings: 3 },
  { name: 'Walnuts', category: 'Nuts', score: 80, benefit: 'Ellagic acid & omega-3 anti-cancer properties', icon: '🥜', servings: 1 },
  { name: 'Mushrooms', category: 'Fungi', score: 78, benefit: 'Beta-glucans boost immune anti-cancer response', icon: '🍄', servings: 2 },
];

const MEAL_PLAN = [
  { meal: 'Breakfast', time: '7:30 AM', items: ['Oatmeal with blueberries & walnuts', 'Green tea', 'Greek yogurt'], calories: 420, antiCancer: 3 },
  { meal: 'Snack', time: '10:00 AM', items: ['Mixed berries & almonds', 'Turmeric latte'], calories: 180, antiCancer: 2 },
  { meal: 'Lunch', time: '12:30 PM', items: ['Grilled salmon salad', 'Broccoli & spinach', 'Quinoa'], calories: 580, antiCancer: 4 },
  { meal: 'Snack', time: '3:30 PM', items: ['Apple with almond butter', 'Green tea'], calories: 220, antiCancer: 2 },
  { meal: 'Dinner', time: '7:00 PM', items: ['Turmeric chicken', 'Roasted vegetables', 'Brown rice', 'Garlic mushrooms'], calories: 620, antiCancer: 5 },
];

const HYDRATION_DATA = [
  { time: '8 AM', ml: 300 }, { time: '10 AM', ml: 250 }, { time: '12 PM', ml: 400 },
  { time: '2 PM', ml: 300 }, { time: '4 PM', ml: 350 }, { time: '6 PM', ml: 200 },
  { time: '8 PM', ml: 300 }, { time: '10 PM', ml: 150 },
];

const DietNutritionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showLogDialog, setShowLogDialog] = useState(false);

  return (
    <AppLayout title="Diet & Nutrition" navItems={patientNavItems} portalType="patient" subtitle="AI-powered cancer-fighting nutrition">
      <Box sx={{ p: 3 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Restaurant />} label="Today's Calories" value="1,580" change="-8%" color="#5e92f3" subtitle="Target: 2,000" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EcoIcon />} label="Anti-Cancer Score" value="88/100" change="+5" color="#4caf50" subtitle="Excellent" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<WaterDrop />} label="Hydration" value="2.25L" change="+12%" color="#0288d1" subtitle="Target: 3L" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<FitnessCenter />} label="Diet Compliance" value="92%" change="+3%" color="#ae52d4" subtitle="7-day average" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<LocalDining />} label="Meal Plan" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Nutrition Trends" iconPosition="start" />
            <Tab icon={<EcoIcon />} label="Anti-Cancer Foods" iconPosition="start" />
            <Tab icon={<WaterDrop />} label="Hydration" iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab 0: Meal Plan */}
        {activeTab === 0 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Today's AI Meal Plan" subtitle="Personalized for cancer prevention" icon={<Restaurant />}
                  action={<Button startIcon={<Add />} variant="contained" size="small" onClick={() => setShowLogDialog(true)}>Log Meal</Button>}
                />
                {MEAL_PLAN.map((meal, idx) => (
                  <Box key={idx} sx={{ mb: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f0f0f0' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: '#5e92f320', color: '#5e92f3', width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
                          {meal.meal.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700} fontSize={14}>{meal.meal}</Typography>
                          <Typography variant="caption" color="text.secondary">{meal.time}</Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        <Chip label={`${meal.calories} cal`} size="small" sx={{ fontWeight: 600 }} />
                        <Chip label={`${meal.antiCancer} cancer-fighting`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }} icon={<EcoIcon sx={{ fontSize: 14 }} />} />
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {meal.items.map((item, i) => (
                        <Chip key={i} label={item} size="small" variant="outlined" sx={{ fontSize: 11, mb: 0.5 }} />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 2.5 }}>
                <SectionHeader title="Macro Breakdown" icon={<EggAlt />} />
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={MACRO_BREAKDOWN} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name} ${value}%`}>
                      {MACRO_BREAKDOWN.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
                {MACRO_BREAKDOWN.map((macro, idx) => (
                  <Stack key={idx} direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: macro.fill }} />
                      <Typography variant="body2" fontSize={12}>{macro.name}</Typography>
                    </Stack>
                    <Typography variant="body2" fontSize={12} fontWeight={600}>{macro.value}% / {macro.target}% target</Typography>
                  </Stack>
                ))}
              </Card>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Daily Progress" icon={<CheckCircle />} />
                <Stack spacing={2}>
                  <ProgressCard title="Calories" value={1580} max={2000} color="#5e92f3" unit=" cal" />
                  <ProgressCard title="Protein" value={68} max={90} color="#f44336" unit="g" />
                  <ProgressCard title="Fiber" value={22} max={35} color="#4caf50" unit="g" />
                  <ProgressCard title="Antioxidants" value={88} max={100} color="#ae52d4" />
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Nutrition Trends */}
        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Weekly Nutrition Overview" subtitle="Calorie & macronutrient tracking" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={WEEKLY_NUTRITION}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="calories" stroke="#5e92f3" fill="#5e92f320" strokeWidth={2} name="Calories" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Protein Intake" icon={<FitnessCenter />} />
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={WEEKLY_NUTRITION}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Bar dataKey="protein" fill="#5e92f3" radius={[4, 4, 0, 0]} name="Protein (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Antioxidant Score" icon={<EcoIcon />} />
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={WEEKLY_NUTRITION}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[60, 100]} />
                    <RTooltip />
                    <Line type="monotone" dataKey="antioxidants" stroke="#4caf50" strokeWidth={3} dot={{ fill: '#4caf50', r: 5 }} name="Score" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Anti-Cancer Foods */}
        {activeTab === 2 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Cancer-Fighting Foods Guide" subtitle="AI-recommended foods for cancer prevention" icon={<EcoIcon />} />
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              You've consumed <strong>8 out of 10</strong> recommended cancer-fighting foods this week. Keep it up!
            </Alert>
            <Grid container spacing={2}>
              {ANTI_CANCER_FOODS.map((food, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Typography fontSize={36}>{food.icon}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography fontWeight={700} fontSize={14}>{food.name}</Typography>
                          <Chip label={`${food.score}/100`} size="small" sx={{ bgcolor: food.score >= 90 ? '#e8f5e9' : '#fff3e0', color: food.score >= 90 ? '#2e7d32' : '#e65100', fontWeight: 700, fontSize: 11 }} />
                        </Stack>
                        <Chip label={food.category} size="small" variant="outlined" sx={{ fontSize: 10, mt: 0.5, mb: 1 }} />
                        <Typography variant="body2" fontSize={11} color="text.secondary">{food.benefit}</Typography>
                        <Typography variant="caption" color="primary" fontWeight={600} sx={{ mt: 0.5, display: 'block' }}>This week: {food.servings} servings</Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}

        {/* Tab 3: Hydration */}
        {activeTab === 3 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Today's Hydration" subtitle="Water intake throughout the day" icon={<WaterDrop />} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={HYDRATION_DATA}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RTooltip />
                    <Bar dataKey="ml" fill="#0288d1" radius={[4, 4, 0, 0]} name="Water (ml)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, textAlign: 'center' }}>
                <SectionHeader title="Hydration Goal" icon={<WaterDrop />} />
                <Box sx={{ py: 2 }}>
                  <Typography variant="h2" fontWeight={800} color="#0288d1">75%</Typography>
                  <Typography variant="h6" color="text.secondary">2,250 / 3,000 ml</Typography>
                </Box>
                <LinearProgress variant="determinate" value={75} sx={{ height: 12, borderRadius: 6, bgcolor: '#e3f2fd', mb: 2, '& .MuiLinearProgress-bar': { bgcolor: '#0288d1', borderRadius: 6 } }} />
                <Stack spacing={1}>
                  {['Improves drug metabolism', 'Flushes toxins', 'Reduces treatment side effects', 'Supports immune function'].map((tip, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <CheckCircle sx={{ fontSize: 16, color: '#4caf50' }} />
                      <Typography variant="body2" fontSize={12}>{tip}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Log Meal Dialog */}
        <Dialog open={showLogDialog} onClose={() => setShowLogDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Log a Meal</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Meal Type" fullWidth defaultValue="lunch">
                <MenuItem value="breakfast">Breakfast</MenuItem>
                <MenuItem value="snack_am">Morning Snack</MenuItem>
                <MenuItem value="lunch">Lunch</MenuItem>
                <MenuItem value="snack_pm">Afternoon Snack</MenuItem>
                <MenuItem value="dinner">Dinner</MenuItem>
              </TextField>
              <TextField label="Foods Eaten" multiline rows={3} fullWidth placeholder="Enter foods and portions..." />
              <TextField label="Estimated Calories" type="number" fullWidth />
              <TextField label="Water Intake (ml)" type="number" fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowLogDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowLogDialog(false)}>Log Meal</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default DietNutritionPage;

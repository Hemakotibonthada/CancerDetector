import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Divider,
} from '@mui/material';
import {
  FitnessCenter, DirectionsRun, SelfImprovement, Pool, DirectionsBike,
  Add, TrendingUp, Favorite, Timer, LocalFireDepartment, Speed,
  Star, CalendarMonth, CheckCircle, EmojiEvents, AccessibilityNew,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area, PieChart,
  Pie, Cell, RadialBarChart, RadialBar } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, GlassCard, SectionHeader, ProgressCard, MetricGauge } from '../../components/common/SharedComponents';
import { patientNavItems } from './PatientDashboard';

const WEEKLY_EXERCISE = [
  { day: 'Mon', minutes: 45, calories: 280, type: 'Walking', heartRate: 110 },
  { day: 'Tue', minutes: 30, calories: 200, type: 'Yoga', heartRate: 85 },
  { day: 'Wed', minutes: 60, calories: 380, type: 'Swimming', heartRate: 125 },
  { day: 'Thu', minutes: 0, calories: 0, type: 'Rest', heartRate: 0 },
  { day: 'Fri', minutes: 35, calories: 250, type: 'Cycling', heartRate: 115 },
  { day: 'Sat', minutes: 50, calories: 320, type: 'Walking', heartRate: 108 },
  { day: 'Sun', minutes: 40, calories: 180, type: 'Stretching', heartRate: 78 },
];

const HEART_RATE_ZONES = [
  { name: 'Rest (50-60%)', value: 15, fill: '#e3f2fd', color: '#1565c0' },
  { name: 'Fat Burn (60-70%)', value: 40, fill: '#e8f5e9', color: '#2e7d32' },
  { name: 'Cardio (70-80%)', value: 30, fill: '#fff3e0', color: '#e65100' },
  { name: 'Peak (80-90%)', value: 15, fill: '#ffebee', color: '#c62828' },
];

const FITNESS_GOALS = [
  { type: 'Weekly Steps', target: 50000, current: 38500, unit: 'steps', icon: <DirectionsRun />, color: '#5e92f3' },
  { type: 'Exercise Minutes', target: 150, current: 120, unit: 'min', icon: <Timer />, color: '#4caf50' },
  { type: 'Calories Burned', target: 2000, current: 1610, unit: 'cal', icon: <LocalFireDepartment />, color: '#f44336' },
  { type: 'Active Days', target: 5, current: 4, unit: 'days', icon: <CalendarMonth />, color: '#ff9800' },
];

const AI_RECOMMENDATIONS = [
  { exercise: 'Moderate Walking', duration: '30 min', frequency: 'Daily', benefit: 'Reduces cancer recurrence risk by 25%', safetyLevel: 'Very Safe', icon: <DirectionsRun />, color: '#4caf50' },
  { exercise: 'Gentle Yoga', duration: '20 min', frequency: '3x/week', benefit: 'Improves flexibility & mental wellness', safetyLevel: 'Very Safe', icon: <SelfImprovement />, color: '#ae52d4' },
  { exercise: 'Swimming', duration: '30 min', frequency: '2x/week', benefit: 'Low-impact full body workout', safetyLevel: 'Safe', icon: <Pool />, color: '#0288d1' },
  { exercise: 'Light Cycling', duration: '20 min', frequency: '3x/week', benefit: 'Cardiovascular health improvement', safetyLevel: 'Safe', icon: <DirectionsBike />, color: '#ff9800' },
  { exercise: 'Resistance Bands', duration: '15 min', frequency: '3x/week', benefit: 'Maintains muscle mass during treatment', safetyLevel: 'Moderate', icon: <FitnessCenter />, color: '#f44336' },
  { exercise: 'Tai Chi', duration: '20 min', frequency: '2x/week', benefit: 'Balance & fall prevention', safetyLevel: 'Very Safe', icon: <AccessibilityNew />, color: '#1565c0' },
];

const MONTHLY_PROGRESS = [
  { month: 'Sep', minutes: 320, calories: 4200, sessions: 16 },
  { month: 'Oct', minutes: 380, calories: 5100, sessions: 18 },
  { month: 'Nov', minutes: 420, calories: 5800, sessions: 20 },
  { month: 'Dec', minutes: 260, calories: 3400, sessions: 12 },
];

const ExerciseFitnessPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showLogDialog, setShowLogDialog] = useState(false);

  return (
    <AppLayout title="Exercise & Fitness" navItems={patientNavItems} portalType="patient" subtitle="Cancer-safe fitness tracking & recommendations">
      <Box sx={{ p: 3 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<DirectionsRun />} label="Steps Today" value="8,420" change="+12%" color="#5e92f3" subtitle="Goal: 10,000" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Timer />} label="Active Minutes" value="120" change="+8%" color="#4caf50" subtitle="Weekly: 150 target" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<LocalFireDepartment />} label="Calories Burned" value="1,610" change="+15%" color="#f44336" subtitle="Weekly total" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Favorite />} label="Avg Heart Rate" value="72 bpm" change="-3" color="#ae52d4" subtitle="Resting" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<CalendarMonth />} label="Weekly Activity" iconPosition="start" />
            <Tab icon={<EmojiEvents />} label="Goals" iconPosition="start" />
            <Tab icon={<Star />} label="AI Recommendations" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Progress" iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab 0: Weekly Activity */}
        {activeTab === 0 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="This Week's Exercise" icon={<CalendarMonth />}
                  action={<Button startIcon={<Add />} variant="contained" size="small" onClick={() => setShowLogDialog(true)}>Log Exercise</Button>}
                />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={WEEKLY_EXERCISE}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Bar dataKey="minutes" fill="#5e92f3" radius={[4, 4, 0, 0]} name="Minutes" />
                    <Bar dataKey="calories" fill="#ff9800" radius={[4, 4, 0, 0]} name="Calories" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 2.5 }}>
                <SectionHeader title="Heart Rate Zones" icon={<Favorite />} />
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={HEART_RATE_ZONES} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {HEART_RATE_ZONES.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Stack spacing={0.5}>
                  {HEART_RATE_ZONES.map((zone, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: zone.color }} />
                      <Typography variant="caption">{zone.name}: {zone.value}%</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Card>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Session Log" icon={<Timer />} />
                {WEEKLY_EXERCISE.filter(e => e.minutes > 0).map((session, i) => (
                  <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: '1px solid #f5f5f5' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{session.day} - {session.type}</Typography>
                      <Typography variant="caption" color="text.secondary">{session.minutes} min • {session.calories} cal</Typography>
                    </Box>
                    <Chip label={`${session.heartRate} bpm`} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                  </Stack>
                ))}
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Goals */}
        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            {FITNESS_GOALS.map((goal, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Card sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${goal.color}15`, color: goal.color }}>{goal.icon}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700}>{goal.type}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                      </Typography>
                    </Box>
                    <MetricGauge value={Math.round((goal.current / goal.target) * 100)} color={goal.color} size={80} />
                  </Stack>
                  <LinearProgress variant="determinate" value={(goal.current / goal.target) * 100} sx={{ height: 10, borderRadius: 5, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: goal.color, borderRadius: 5 } }} />
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">{Math.round((goal.current / goal.target) * 100)}% complete</Typography>
                    <Typography variant="caption" fontWeight={600} color={goal.color}>{(goal.target - goal.current).toLocaleString()} {goal.unit} remaining</Typography>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 2: AI Recommendations */}
        {activeTab === 2 && (
          <Box>
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
              <strong>AI Exercise Advisor:</strong> Based on your cancer type, treatment phase, and fitness level, these exercises are recommended. Always consult your oncologist before starting new activities.
            </Alert>
            <Grid container spacing={2.5}>
              {AI_RECOMMENDATIONS.map((rec, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card sx={{ p: 2.5, height: '100%', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 } }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ bgcolor: `${rec.color}15`, color: rec.color, width: 48, height: 48 }}>{rec.icon}</Avatar>
                      <Box>
                        <Typography fontWeight={700}>{rec.exercise}</Typography>
                        <Stack direction="row" spacing={1}>
                          <Chip label={rec.duration} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                          <Chip label={rec.frequency} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                        </Stack>
                      </Box>
                    </Stack>
                    <Typography variant="body2" fontSize={12} color="text.secondary" sx={{ mb: 1.5 }}>{rec.benefit}</Typography>
                    <Chip label={rec.safetyLevel} size="small" sx={{
                      bgcolor: rec.safetyLevel === 'Very Safe' ? '#e8f5e9' : rec.safetyLevel === 'Safe' ? '#e3f2fd' : '#fff3e0',
                      color: rec.safetyLevel === 'Very Safe' ? '#2e7d32' : rec.safetyLevel === 'Safe' ? '#1565c0' : '#e65100',
                      fontWeight: 600, fontSize: 11,
                    }} />
                    <Box sx={{ mt: 2 }}>
                      <Button variant="outlined" size="small" fullWidth>Add to Plan</Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Tab 3: Progress */}
        {activeTab === 3 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Monthly Exercise Trends" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={MONTHLY_PROGRESS}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="minutes" stroke="#5e92f3" fill="#5e92f320" strokeWidth={2} name="Total Minutes" />
                    <Area type="monotone" dataKey="calories" stroke="#f44336" fill="#f4433620" strokeWidth={2} name="Calories Burned" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 2.5 }}>
                <SectionHeader title="Fitness Score" icon={<EmojiEvents />} />
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <MetricGauge value={72} color="#5e92f3" size={140} />
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>Good Fitness Level</Typography>
                  <Typography variant="caption" color="text.secondary">Improved 8% from last month</Typography>
                </Box>
              </Card>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Achievements" icon={<EmojiEvents />} />
                <Stack spacing={1.5}>
                  {[
                    { badge: '🏃', name: '10K Steps', desc: 'Reached 10,000 steps in a day', earned: true },
                    { badge: '🏋️', name: 'Consistency King', desc: '5 active days this week', earned: true },
                    { badge: '🏊', name: 'Aqua Champion', desc: 'Complete 10 swim sessions', earned: false },
                    { badge: '🧘', name: 'Zen Master', desc: '30 yoga sessions completed', earned: false },
                  ].map((ach, i) => (
                    <Stack key={i} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1, bgcolor: ach.earned ? '#f8fafc' : '#fafafa', borderRadius: 2, opacity: ach.earned ? 1 : 0.5 }}>
                      <Typography fontSize={24}>{ach.badge}</Typography>
                      <Box>
                        <Typography variant="body2" fontWeight={600} fontSize={12}>{ach.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{ach.desc}</Typography>
                      </Box>
                      {ach.earned && <CheckCircle sx={{ fontSize: 16, color: '#4caf50', ml: 'auto' }} />}
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Log Exercise Dialog */}
        <Dialog open={showLogDialog} onClose={() => setShowLogDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Log Exercise</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Exercise Type" fullWidth defaultValue="walking">
                <MenuItem value="walking">Walking</MenuItem>
                <MenuItem value="yoga">Yoga</MenuItem>
                <MenuItem value="swimming">Swimming</MenuItem>
                <MenuItem value="cycling">Cycling</MenuItem>
                <MenuItem value="stretching">Stretching</MenuItem>
                <MenuItem value="resistance">Resistance Training</MenuItem>
                <MenuItem value="tai_chi">Tai Chi</MenuItem>
              </TextField>
              <TextField label="Duration (minutes)" type="number" fullWidth />
              <TextField select label="Intensity" fullWidth defaultValue="moderate">
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="vigorous">Vigorous</MenuItem>
              </TextField>
              <TextField label="Average Heart Rate" type="number" fullWidth />
              <TextField label="Notes" multiline rows={2} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowLogDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowLogDialog(false)}>Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default ExerciseFitnessPage;

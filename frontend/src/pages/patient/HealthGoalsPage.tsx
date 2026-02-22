import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Avatar, Divider, LinearProgress, Alert,
} from '@mui/material';
import {
  Flag, Add, EmojiEvents, TrendingUp, FitnessCenter, Fastfood,
  Bedtime, SelfImprovement, DirectionsWalk, LocalDrink, Favorite,
  CheckCircle, Star, Timer, Edit,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { StatCard, SectionHeader } from '../../components/common/SharedComponents';

const HealthGoalsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showGoalDialog, setShowGoalDialog] = useState(false);

  const activeGoals = [
    { id: '1', title: 'Walk 10,000 steps daily', icon: <DirectionsWalk />, category: 'Exercise', target: 10000, current: 8432, unit: 'steps', streak: 5, startDate: 'Jan 15, 2026', endDate: 'Mar 15, 2026', progress: 84, color: '#2e7d32' },
    { id: '2', title: 'Drink 8 glasses of water', icon: <LocalDrink />, category: 'Nutrition', target: 8, current: 6, unit: 'glasses', streak: 12, startDate: 'Feb 01, 2026', endDate: 'Apr 01, 2026', progress: 75, color: '#1565c0' },
    { id: '3', title: 'Sleep 8 hours nightly', icon: <Bedtime />, category: 'Sleep', target: 8, current: 7.5, unit: 'hours', streak: 3, startDate: 'Feb 01, 2026', endDate: 'Apr 01, 2026', progress: 94, color: '#7b1fa2' },
    { id: '4', title: 'Meditate 15 minutes daily', icon: <SelfImprovement />, category: 'Mental Health', target: 15, current: 10, unit: 'minutes', streak: 8, startDate: 'Jan 20, 2026', endDate: 'Mar 20, 2026', progress: 67, color: '#00897b' },
    { id: '5', title: 'Exercise 5 days per week', icon: <FitnessCenter />, category: 'Exercise', target: 5, current: 3, unit: 'days', streak: 2, startDate: 'Feb 10, 2026', endDate: 'May 10, 2026', progress: 60, color: '#c62828' },
    { id: '6', title: 'Eat 5 servings of fruits/veggies', icon: <Fastfood />, category: 'Nutrition', target: 5, current: 4, unit: 'servings', streak: 7, startDate: 'Feb 01, 2026', endDate: 'Apr 01, 2026', progress: 80, color: '#f57c00' },
  ];

  const completedGoals = [
    { id: '7', title: 'Complete annual health checkup', completedDate: 'Feb 15, 2026', reward: '🏆 Health Champion' },
    { id: '8', title: 'Reduce sugar for 30 days', completedDate: 'Jan 31, 2026', reward: '⭐ Sugar-Free Champion' },
    { id: '9', title: 'Walk 100,000 steps in January', completedDate: 'Jan 28, 2026', reward: '🎯 Step Master' },
  ];

  const challenges = [
    { id: '1', title: '7-Day Hydration Challenge', desc: 'Drink 8 glasses of water daily for 7 consecutive days', participants: 1243, difficulty: 'Easy', reward: '50 Health Points', daysLeft: 5, joined: true },
    { id: '2', title: '30-Day Cancer Prevention', desc: 'Follow daily cancer prevention habits for 30 days', participants: 867, difficulty: 'Medium', reward: '200 Health Points', daysLeft: 22, joined: true },
    { id: '3', title: 'Sleep Quality Sprint', desc: 'Achieve 85+ sleep score for 14 consecutive days', participants: 456, difficulty: 'Hard', reward: '150 Health Points', daysLeft: 14, joined: false },
    { id: '4', title: 'Move More March', desc: 'Walk 15,000 steps daily throughout March', participants: 2341, difficulty: 'Hard', reward: '300 Health Points', daysLeft: 30, joined: false },
  ];

  const milestones = [
    { title: 'First Week Streak', desc: '7-day consecutive goal streak', achieved: true, date: 'Feb 08, 2026', icon: '🔥' },
    { title: '100K Steps', desc: 'Walk 100,000 total steps', achieved: true, date: 'Feb 12, 2026', icon: '👟' },
    { title: 'Health Score 80+', desc: 'Achieve health score above 80', achieved: true, date: 'Feb 15, 2026', icon: '💪' },
    { title: '30-Day Streak', desc: '30-day consecutive goal streak', achieved: false, date: '', icon: '🏆' },
    { title: 'Cancer Screening Complete', desc: 'Complete all recommended screenings', achieved: false, date: '', icon: '🎯' },
    { title: 'Perfect Month', desc: 'Achieve all daily goals for an entire month', achieved: false, date: '', icon: '⭐' },
  ];

  return (
    <AppLayout title="Health Goals" subtitle="Set, track, and achieve your wellness goals" navItems={patientNavItems} portalType="patient">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Flag />} label="Active Goals" value={activeGoals.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Completed" value={completedGoals.length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<EmojiEvents />} label="Milestones" value={`${milestones.filter(m => m.achieved).length}/${milestones.length}`} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Star />} label="Health Points" value="450" color="#7b1fa2" /></Grid>
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="My Goals" />
        <Tab label="Challenges" />
        <Tab label="Milestones" />
        <Tab label="Completed" />
      </Tabs>

      {activeTab === 0 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" startIcon={<Add />} onClick={() => setShowGoalDialog(true)}>Add Goal</Button>
          </Box>
          <Grid container spacing={2}>
            {activeGoals.map((goal) => (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <Card sx={{ p: 2.5, transition: 'all 0.2s', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: `${goal.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: goal.color }}>
                        {goal.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{goal.title}</Typography>
                        <Chip label={goal.category} size="small" sx={{ fontSize: 10, mt: 0.5 }} variant="outlined" />
                      </Box>
                    </Stack>
                    <IconButton size="small"><Edit sx={{ fontSize: 16 }} /></IconButton>
                  </Stack>

                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Progress</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: goal.color }}>{goal.current}/{goal.target} {goal.unit}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate" value={goal.progress}
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0', '& .MuiLinearProgress-bar': { bgcolor: goal.color, borderRadius: 4 } }}
                    />
                    <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.5, textAlign: 'right' }}>{goal.progress}%</Typography>
                  </Box>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography sx={{ fontSize: 16 }}>🔥</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{goal.streak} day streak</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Timer sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Ends {goal.endDate}</Typography>
                    </Stack>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {challenges.map((ch) => (
            <Grid item xs={12} sm={6} key={ch.id}>
              <Card sx={{ p: 3, border: ch.joined ? '2px solid #1565c0' : '1px solid #e0e0e0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{ch.title}</Typography>
                  <Chip
                    label={ch.difficulty}
                    size="small"
                    color={ch.difficulty === 'Easy' ? 'success' : ch.difficulty === 'Medium' ? 'warning' : 'error'}
                    sx={{ fontSize: 10 }}
                  />
                </Stack>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>{ch.desc}</Typography>
                <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                  <Box><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Participants</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{ch.participants.toLocaleString()}</Typography></Box>
                  <Box><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Days Left</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{ch.daysLeft}</Typography></Box>
                  <Box><Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Reward</Typography><Typography sx={{ fontSize: 13, fontWeight: 600 }}>{ch.reward}</Typography></Box>
                </Stack>
                <Button variant={ch.joined ? 'outlined' : 'contained'} fullWidth>{ch.joined ? 'View Progress' : 'Join Challenge'}</Button>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={2}>
          {milestones.map((m, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ p: 2.5, opacity: m.achieved ? 1 : 0.6, bgcolor: m.achieved ? '#f8f9ff' : 'background.paper', '&:hover': { boxShadow: 3 }, transition: 'all 0.2s' }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                  <Typography sx={{ fontSize: 32 }}>{m.icon}</Typography>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{m.title}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{m.desc}</Typography>
                  </Box>
                </Stack>
                {m.achieved ? (
                  <Chip label={`Achieved ${m.date}`} size="small" color="success" icon={<CheckCircle sx={{ fontSize: 14 }} />} sx={{ fontSize: 10 }} />
                ) : (
                  <Chip label="In Progress" size="small" variant="outlined" sx={{ fontSize: 10 }} />
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={2}>
          {completedGoals.map((g) => (
            <Grid item xs={12} sm={6} md={4} key={g.id}>
              <Card sx={{ p: 2.5, bgcolor: '#e8f5e9', border: '1px solid #c8e6c9' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <CheckCircle sx={{ color: '#2e7d32' }} />
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{g.title}</Typography>
                </Stack>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Completed: {g.completedDate}</Typography>
                <Chip label={g.reward} size="small" sx={{ mt: 1, fontSize: 11 }} />
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={showGoalDialog} onClose={() => setShowGoalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Goal</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Goal Title" fullWidth size="small" placeholder="e.g., Walk 10,000 steps daily" />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Target Value" fullWidth size="small" type="number" /></Grid>
              <Grid item xs={6}><TextField label="Unit" fullWidth size="small" placeholder="e.g., steps, glasses" /></Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Start Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
              <Grid item xs={6}><TextField label="End Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} /></Grid>
            </Grid>
            <TextField label="Category" fullWidth size="small" placeholder="e.g., Exercise, Nutrition, Sleep" />
            <TextField label="Notes" multiline rows={2} fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGoalDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowGoalDialog(false)}>Create Goal</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default HealthGoalsPage;

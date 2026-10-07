import React, { useEffect, useState } from 'react';
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
import { goalsAPI } from '../../services/api';

const HealthGoalsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [goals, setGoals] = useState<any[]>([]);
  const [draft, setDraft] = useState({ title: '', target: '', unit: '', category: 'general' });

  const loadGoals = () => {
    goalsAPI.list().then((res) => {
      const rows = Array.isArray(res.data) ? res.data : [];
      setGoals(rows);
    }).catch(() => setGoals([]));
  };
  useEffect(() => { loadGoals(); }, []);

  const activeGoals = goals.filter((g) => (g.status || 'active') !== 'completed').map((g) => ({
    id: g.id,
    title: g.goal_description || g.title,
    icon: <Flag />,
    category: g.goal_category || 'general',
    target: g.target_frequency || '—',
    current: g.progress ?? 0,
    unit: g.measurement_method || '',
    streak: null,
    endDate: g.target_date ? new Date(g.target_date).toLocaleDateString() : '—',
    progress: Math.min(100, Number(g.progress) || 0),
    color: '#1565c0',
  }));
  const completedGoals = goals.filter((g) => g.status === 'completed').map((g) => ({
    id: g.id,
    title: g.goal_description,
    completedDate: g.last_updated ? new Date(g.last_updated).toLocaleDateString() : '—',
    reward: g.status,
  }));
  const challenges: any[] = [];
  const milestones: any[] = [];

  const createGoal = async () => {
    if (!draft.title.trim()) return;
    await goalsAPI.create({ title: draft.title, category: draft.category || 'general', target: draft.target || null, unit: draft.unit || null });
    setShowGoalDialog(false);
    setDraft({ title: '', target: '', unit: '', category: 'general' });
    loadGoals();
  };

  return (
    <AppLayout title="Health Goals" subtitle="Set, track, and achieve your wellness goals" navItems={patientNavItems} portalType="patient">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}><StatCard icon={<Flag />} label="Active Goals" value={activeGoals.length} color="#1565c0" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<CheckCircle />} label="Completed" value={completedGoals.length} color="#4caf50" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<EmojiEvents />} label="Milestones" value={`${milestones.filter(m => m.achieved).length}/${milestones.length}`} color="#f57c00" /></Grid>
        <Grid item xs={6} sm={3}><StatCard icon={<Star />} label="Health Points" value="Not available" color="#7b1fa2" /></Grid>
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
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>Streak not tracked</Typography>
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
            <TextField label="Goal Title" fullWidth size="small" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Target" fullWidth size="small" value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} /></Grid>
              <Grid item xs={6}><TextField label="Unit" fullWidth size="small" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} /></Grid>
            </Grid>
            <TextField label="Category" fullWidth size="small" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGoalDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={createGoal}>Create Goal</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
};

export default HealthGoalsPage;

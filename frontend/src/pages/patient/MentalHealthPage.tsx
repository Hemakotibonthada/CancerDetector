import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs, Avatar,
  LinearProgress, TextField, MenuItem, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Slider, Rating, Divider, List, ListItem,
  ListItemAvatar, ListItemText, ListItemSecondaryAction, IconButton,
} from '@mui/material';
import {
  Psychology, SelfImprovement, Mood, MoodBad, NightsStay, Favorite,
  Group, Phone, VideoCall, Chat, Add, CalendarMonth, TrendingUp,
  EmojiNature, SentimentSatisfied, SentimentDissatisfied, SentimentNeutral,
  Book, MusicNote, FitnessCenter, Spa, CheckCircle,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, BarChart, Bar } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, GlassCard, SectionHeader, MetricGauge } from '../../components/common/SharedComponents';
import { patientNavItems } from './PatientDashboard';

const MOOD_HISTORY = [
  { date: 'Mon', mood: 7, anxiety: 3, energy: 6, sleep: 7 },
  { date: 'Tue', mood: 6, anxiety: 5, energy: 5, sleep: 6 },
  { date: 'Wed', mood: 8, anxiety: 2, energy: 7, sleep: 8 },
  { date: 'Thu', mood: 5, anxiety: 6, energy: 4, sleep: 5 },
  { date: 'Fri', mood: 7, anxiety: 3, energy: 7, sleep: 7 },
  { date: 'Sat', mood: 8, anxiety: 2, energy: 8, sleep: 8 },
  { date: 'Sun', mood: 9, anxiety: 1, energy: 8, sleep: 9 },
];

const WELLNESS_RADAR = [
  { dimension: 'Anxiety Mgmt', score: 72, benchmark: 65 },
  { dimension: 'Depression', score: 80, benchmark: 70 },
  { dimension: 'Sleep Quality', score: 68, benchmark: 72 },
  { dimension: 'Coping Skills', score: 85, benchmark: 68 },
  { dimension: 'Social Support', score: 78, benchmark: 75 },
  { dimension: 'Mindfulness', score: 70, benchmark: 60 },
  { dimension: 'Self-Care', score: 75, benchmark: 65 },
];

const THERAPY_SESSIONS = [
  { id: '1', therapist: 'Dr. Sarah Chen', date: '2024-12-18', type: 'Individual', duration: 50, status: 'scheduled', mood_before: 5, mood_after: 7, notes: 'CBT session for treatment anxiety' },
  { id: '2', therapist: 'Dr. Sarah Chen', date: '2024-12-11', type: 'Individual', duration: 50, status: 'completed', mood_before: 4, mood_after: 7, notes: 'Processing diagnosis emotions' },
  { id: '3', therapist: 'Support Group', date: '2024-12-10', type: 'Group', duration: 90, status: 'completed', mood_before: 5, mood_after: 8, notes: 'Cancer survivor support group' },
  { id: '4', therapist: 'Dr. Sarah Chen', date: '2024-12-04', type: 'Online', duration: 50, status: 'completed', mood_before: 3, mood_after: 6, notes: 'Anxiety management techniques' },
];

const COPING_ACTIVITIES = [
  { name: 'Meditation', icon: <SelfImprovement />, duration: '15 min', frequency: 'Daily', benefit: 'Reduces anxiety by 32%', color: '#ae52d4', completed: 5, target: 7 },
  { name: 'Journaling', icon: <Book />, duration: '10 min', frequency: 'Daily', benefit: 'Improves emotional processing', color: '#5e92f3', completed: 4, target: 7 },
  { name: 'Deep Breathing', icon: <Spa />, duration: '5 min', frequency: '3x daily', benefit: 'Lowers cortisol levels', color: '#4ebaaa', completed: 12, target: 21 },
  { name: 'Gentle Yoga', icon: <FitnessCenter />, duration: '30 min', frequency: '3x week', benefit: 'Reduces fatigue & pain', color: '#ff9800', completed: 2, target: 3 },
  { name: 'Music Therapy', icon: <MusicNote />, duration: '20 min', frequency: 'Daily', benefit: 'Elevates mood by 25%', color: '#f44336', completed: 6, target: 7 },
  { name: 'Nature Walks', icon: <EmojiNature />, duration: '30 min', frequency: '4x week', benefit: 'Boosts immune function', color: '#4caf50', completed: 3, target: 4 },
];

const SUPPORT_RESOURCES = [
  { name: 'Cancer Support Hotline', type: 'Phone', availability: '24/7', contact: '1-800-XXX-XXXX', icon: <Phone /> },
  { name: 'Online Therapy Sessions', type: 'Video', availability: 'Mon-Sat 9AM-9PM', contact: 'Book via app', icon: <VideoCall /> },
  { name: 'Peer Support Chat', type: 'Chat', availability: '24/7', contact: 'In-app chat', icon: <Chat /> },
  { name: 'Cancer Survivors Group', type: 'Group', availability: 'Tuesdays 6PM', contact: 'Hospital Center', icon: <Group /> },
];

const MentalHealthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showMoodDialog, setShowMoodDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [moodValue, setMoodValue] = useState(7);
  const [anxietyValue, setAnxietyValue] = useState(3);

  const getMoodEmoji = (val: number) => val >= 8 ? '😊' : val >= 6 ? '🙂' : val >= 4 ? '😐' : '😟';

  return (
    <AppLayout title="Mental Wellness" navItems={patientNavItems} portalType="patient" subtitle="Emotional support & coping resources">
      <Box sx={{ p: 3 }}>
        {/* Stats */}
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Mood />} label="Today's Mood" value={`${getMoodEmoji(7)} 7/10`} change="+2" color="#4caf50" subtitle="Improving trend" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Psychology />} label="Anxiety Level" value="Low" change="-15%" color="#5e92f3" subtitle="Well managed" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<NightsStay />} label="Sleep Quality" value="7.2/10" change="+8%" color="#ae52d4" subtitle="7.5 hours avg" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<SelfImprovement />} label="Coping Score" value="85%" change="+5%" color="#ff9800" subtitle="Above average" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab icon={<TrendingUp />} label="Mood Tracker" iconPosition="start" />
            <Tab icon={<Psychology />} label="Wellness Assessment" iconPosition="start" />
            <Tab icon={<CalendarMonth />} label="Therapy Sessions" iconPosition="start" />
            <Tab icon={<SelfImprovement />} label="Coping Activities" iconPosition="start" />
            <Tab icon={<Favorite />} label="Support Resources" iconPosition="start" />
          </Tabs>
        </Card>

        {/* Tab 0: Mood Tracker */}
        {activeTab === 0 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Mood & Anxiety Trends" subtitle="7-day tracking" icon={<TrendingUp />}
                  action={<Button startIcon={<Add />} variant="contained" size="small" onClick={() => setShowMoodDialog(true)}>Log Mood</Button>}
                />
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={MOOD_HISTORY}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <RTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="mood" stroke="#4caf50" fill="#4caf5020" strokeWidth={2} name="Mood" />
                    <Area type="monotone" dataKey="anxiety" stroke="#f44336" fill="#f4433620" strokeWidth={2} name="Anxiety" />
                    <Area type="monotone" dataKey="energy" stroke="#5e92f3" fill="#5e92f320" strokeWidth={2} name="Energy" />
                    <Area type="monotone" dataKey="sleep" stroke="#ae52d4" fill="#ae52d420" strokeWidth={2} name="Sleep" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3, mb: 2.5 }}>
                <SectionHeader title="Today's Check-in" icon={<Mood />} />
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography fontSize={64}>{getMoodEmoji(7)}</Typography>
                  <Typography variant="h5" fontWeight={700} color="#4caf50">Feeling Good</Typography>
                  <Typography variant="body2" color="text.secondary">Mood: 7/10 | Anxiety: 3/10</Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  {[
                    { label: 'Mood', value: 7, color: '#4caf50' },
                    { label: 'Energy', value: 6, color: '#5e92f3' },
                    { label: 'Sleep', value: 7, color: '#ae52d4' },
                    { label: 'Anxiety', value: 3, color: '#f44336' },
                  ].map((item, i) => (
                    <Box key={i}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                        <Typography variant="body2" fontWeight={700} color={item.color}>{item.value}/10</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={item.value * 10} sx={{ height: 6, borderRadius: 3, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: item.color, borderRadius: 3 } }} />
                    </Box>
                  ))}
                </Stack>
              </Card>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Positive Affirmation" icon={<Favorite />} />
                <GlassCard sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(135deg, #e8f5e920, #c8e6c920)' }}>
                  <Typography variant="body1" fontStyle="italic" color="text.secondary" fontSize={14}>
                    "Every day is a new opportunity for healing. Your strength is greater than any challenge you face."
                  </Typography>
                </GlassCard>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 1: Wellness Assessment */}
        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Wellness Dimensions" subtitle="Your scores vs cancer patient benchmark" icon={<Psychology />} />
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={WELLNESS_RADAR}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Your Score" dataKey="score" stroke="#5e92f3" fill="#5e92f3" fillOpacity={0.2} strokeWidth={2} />
                    <Radar name="Benchmark" dataKey="benchmark" stroke="#ff9800" fill="#ff9800" fillOpacity={0.1} strokeWidth={2} />
                    <Legend />
                    <RTooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3, mb: 2.5 }}>
                <SectionHeader title="Overall Wellness" icon={<Favorite />} />
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <MetricGauge value={76} color="#4caf50" size={160} />
                </Box>
                <Typography variant="body2" textAlign="center" color="text.secondary">Your overall mental wellness score is <strong>above average</strong> for cancer patients. Your coping skills are particularly strong.</Typography>
              </Card>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="AI Recommendations" icon={<Psychology />} />
                <Stack spacing={1.5}>
                  {[
                    { text: 'Increase sleep duration to 8+ hours', priority: 'high' },
                    { text: 'Try guided meditation before bed', priority: 'medium' },
                    { text: 'Join a second support group session', priority: 'medium' },
                    { text: 'Practice gratitude journaling daily', priority: 'low' },
                  ].map((rec, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center" sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f0f0f0' }}>
                      <CheckCircle sx={{ fontSize: 18, color: rec.priority === 'high' ? '#f44336' : rec.priority === 'medium' ? '#ff9800' : '#4caf50' }} />
                      <Typography variant="body2" fontSize={12}>{rec.text}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab 2: Therapy Sessions */}
        {activeTab === 2 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Therapy Sessions" subtitle="Individual & group therapy tracking" icon={<CalendarMonth />}
              action={<Button startIcon={<Add />} variant="contained" size="small" onClick={() => setShowSessionDialog(true)}>Book Session</Button>}
            />
            {THERAPY_SESSIONS.map((session, idx) => (
              <Box key={idx} sx={{ mb: 2, p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f0f0f0' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: session.status === 'scheduled' ? '#e3f2fd' : '#e8f5e9', color: session.status === 'scheduled' ? '#1565c0' : '#2e7d32' }}>
                      {session.type === 'Group' ? <Group /> : session.type === 'Online' ? <VideoCall /> : <Psychology />}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={700}>{session.therapist}</Typography>
                      <Typography variant="caption" color="text.secondary">{session.date} • {session.duration} min • {session.type}</Typography>
                    </Box>
                  </Stack>
                  <Chip label={session.status.toUpperCase()} size="small" sx={{
                    bgcolor: session.status === 'scheduled' ? '#e3f2fd' : '#e8f5e9',
                    color: session.status === 'scheduled' ? '#1565c0' : '#2e7d32',
                    fontWeight: 700,
                  }} />
                </Stack>
                <Typography variant="body2" color="text.secondary" fontSize={12} sx={{ mb: 1 }}>{session.notes}</Typography>
                {session.status === 'completed' && (
                  <Stack direction="row" spacing={2}>
                    <Chip label={`Mood Before: ${session.mood_before}/10`} size="small" sx={{ bgcolor: '#fff3e0', color: '#e65100' }} />
                    <Chip label={`Mood After: ${session.mood_after}/10`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                    <Chip label={`Improvement: +${session.mood_after - session.mood_before}`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }} />
                  </Stack>
                )}
              </Box>
            ))}
          </Card>
        )}

        {/* Tab 3: Coping Activities */}
        {activeTab === 3 && (
          <Grid container spacing={2.5}>
            {COPING_ACTIVITIES.map((activity, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Card sx={{ p: 2.5, height: '100%' }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${activity.color}15`, color: activity.color }}>{activity.icon}</Avatar>
                    <Box>
                      <Typography fontWeight={700} fontSize={14}>{activity.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{activity.duration} • {activity.frequency}</Typography>
                    </Box>
                  </Stack>
                  <Typography variant="body2" fontSize={12} color="text.secondary" sx={{ mb: 2 }}>{activity.benefit}</Typography>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600}>Progress</Typography>
                    <Typography variant="caption" fontWeight={700}>{activity.completed}/{activity.target}</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={(activity.completed / activity.target) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: '#f5f5f5', '& .MuiLinearProgress-bar': { bgcolor: activity.color, borderRadius: 4 } }} />
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 4: Support Resources */}
        {activeTab === 4 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Support Resources" subtitle="Help is always available" icon={<Favorite />} />
                {SUPPORT_RESOURCES.map((resource, idx) => (
                  <Box key={idx} sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f0f0f0' }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1565c0' }}>{resource.icon}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700} fontSize={14}>{resource.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{resource.type} • {resource.availability}</Typography>
                        <Typography variant="body2" fontSize={12} color="primary" fontWeight={600}>{resource.contact}</Typography>
                      </Box>
                      <Button variant="outlined" size="small">Connect</Button>
                    </Stack>
                  </Box>
                ))}
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Crisis Resources" icon={<Phone />} />
                <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                  <strong>If you're in crisis, call 988</strong><br />
                  Suicide & Crisis Lifeline available 24/7
                </Alert>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <strong>Cancer Distress Helpline</strong><br />
                  1-800-XXX-XXXX • Specialized support for cancer patients
                </Alert>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Mood Log Dialog */}
        <Dialog open={showMoodDialog} onClose={() => setShowMoodDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Log Your Mood</DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography gutterBottom fontWeight={600}>How are you feeling? ({moodValue}/10)</Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <MoodBad color="error" />
                  <Slider value={moodValue} onChange={(_, v) => setMoodValue(v as number)} min={1} max={10} valueLabelDisplay="auto" />
                  <Mood color="success" />
                </Stack>
              </Box>
              <Box>
                <Typography gutterBottom fontWeight={600}>Anxiety Level ({anxietyValue}/10)</Typography>
                <Slider value={anxietyValue} onChange={(_, v) => setAnxietyValue(v as number)} min={0} max={10} valueLabelDisplay="auto" color="error" />
              </Box>
              <TextField label="How did you sleep?" select fullWidth defaultValue="good">
                <MenuItem value="excellent">Excellent (8+ hrs)</MenuItem>
                <MenuItem value="good">Good (6-8 hrs)</MenuItem>
                <MenuItem value="fair">Fair (4-6 hrs)</MenuItem>
                <MenuItem value="poor">Poor (&lt;4 hrs)</MenuItem>
              </TextField>
              <TextField label="What's on your mind?" multiline rows={3} fullWidth placeholder="Share your thoughts..." />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMoodDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowMoodDialog(false)}>Save Entry</Button>
          </DialogActions>
        </Dialog>

        {/* Book Session Dialog */}
        <Dialog open={showSessionDialog} onClose={() => setShowSessionDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Book Therapy Session</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField select label="Session Type" fullWidth defaultValue="individual">
                <MenuItem value="individual">Individual Therapy</MenuItem>
                <MenuItem value="group">Group Support Session</MenuItem>
                <MenuItem value="couples">Couples/Family Session</MenuItem>
                <MenuItem value="online">Online Session</MenuItem>
              </TextField>
              <TextField select label="Therapist" fullWidth defaultValue="chen">
                <MenuItem value="chen">Dr. Sarah Chen - CBT Specialist</MenuItem>
                <MenuItem value="kumar">Dr. Raj Kumar - Cancer Psychology</MenuItem>
                <MenuItem value="group">Support Group Facilitator</MenuItem>
              </TextField>
              <TextField label="Preferred Date" type="date" fullWidth InputLabelProps={{ shrink: true }} />
              <TextField label="Concerns to Discuss" multiline rows={2} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSessionDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowSessionDialog(false)}>Book Session</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default MentalHealthPage;

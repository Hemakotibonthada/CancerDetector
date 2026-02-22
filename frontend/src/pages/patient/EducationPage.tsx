import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, List, ListItem, ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  School as EduIcon, Quiz as QuizIcon, MenuBook as BookIcon,
  TrendingUp as LitIcon, EmojiEvents as CertIcon,
  VideoLibrary as VideoIcon, PlayCircle as PlayIcon,
  CheckCircle as CheckIcon, Assignment as AssignIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { educationAPI } from '../../services/api';

const EducationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [resources, setResources] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [literacy, setLiteracy] = useState<any>(null);
  const [paths, setPaths] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, asg, qz, lit, pth] = await Promise.all([
        educationAPI.getResources().catch(() => ({ data: [] })),
        educationAPI.getAssignments().catch(() => ({ data: [] })),
        educationAPI.getQuizzes().catch(() => ({ data: [] })),
        educationAPI.getHealthLiteracy().catch(() => ({ data: [] })),
        educationAPI.getLearningPaths().catch(() => ({ data: [] })),
      ]);
      setResources(res.data || []);
      setAssignments(asg.data || []);
      setQuizzes(qz.data || []);
      const scores = lit.data || [];
      setLiteracy(scores.length > 0 ? scores[scores.length - 1] : null);
      setPaths(pth.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const typeIcons: Record<string, React.ReactNode> = { video: <VideoIcon />, article: <BookIcon />, quiz: <QuizIcon />, course: <EduIcon /> };

  return (
    <AppLayout title="Health Education" navItems={patientNavItems} portalType="patient">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Resources', value: resources.length, icon: <BookIcon />, color: '#2196f3' },
            { label: 'Completed', value: completedCount, icon: <CheckIcon />, color: '#4caf50' },
            { label: 'Quizzes', value: quizzes.length, icon: <QuizIcon />, color: '#ff9800' },
            { label: 'Literacy Score', value: literacy?.score || '-', icon: <LitIcon />, color: '#9c27b0' },
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
          <Tab label="Resources" icon={<BookIcon />} iconPosition="start" />
          <Tab label="My Assignments" icon={<AssignIcon />} iconPosition="start" />
          <Tab label="Quizzes" icon={<QuizIcon />} iconPosition="start" />
          <Tab label="Learning Paths" icon={<EduIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {resources.map((r: any) => (
              <Grid item xs={12} sm={6} md={4} key={r.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)', height: '100%' }}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Box sx={{ color: '#2196f3' }}>{typeIcons[r.resource_type] || <BookIcon />}</Box>
                      <Chip label={r.resource_type} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.2)', color: '#90caf9' }} />
                      {r.difficulty && <Chip label={r.difficulty} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)' }} />}
                    </Stack>
                    <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>{r.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>{r.description?.substring(0, 120)}...</Typography>
                    {r.category && <Chip label={r.category} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.2)', color: '#81c784' }} />}
                    {r.estimated_time && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', mt: 1 }}>{r.estimated_time} min read</Typography>}
                    <Button size="small" sx={{ color: '#90caf9', mt: 1 }} startIcon={<PlayIcon />}>Start</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {resources.length === 0 && <Grid item xs={12}><Alert severity="info">No education resources available.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {assignments.map((a: any) => (
              <Card key={a.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{a.resource_title || a.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        Assigned: {new Date(a.assigned_date).toLocaleDateString()}
                        {a.due_date && ` • Due: ${new Date(a.due_date).toLocaleDateString()}`}
                      </Typography>
                      {a.assigned_by && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>By: Dr. {a.assigned_by}</Typography>}
                    </Box>
                    <Stack spacing={1} alignItems="flex-end">
                      <Chip label={a.status} size="small"
                        sx={{ bgcolor: a.status === 'completed' ? 'rgba(76,175,80,0.3)' : a.status === 'in_progress' ? 'rgba(33,150,243,0.3)' : 'rgba(255,152,0,0.3)',
                              color: a.status === 'completed' ? '#81c784' : a.status === 'in_progress' ? '#90caf9' : '#ffb74d' }} />
                      {a.status !== 'completed' && (
                        <Button size="small" variant="outlined" sx={{ color: '#4caf50', borderColor: '#4caf50' }}
                          onClick={async () => { await educationAPI.completeAssignment(a.id, {}); loadData(); }}>
                          Complete
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  {a.progress !== undefined && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress variant="determinate" value={a.progress}
                        sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.1)' }} />
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
            {assignments.length === 0 && <Alert severity="info">No assignments yet.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2}>
            {quizzes.map((q: any) => (
              <Grid item xs={12} md={6} key={q.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="h6" sx={{ color: '#fff' }}>{q.title}</Typography>
                      {q.best_score !== undefined && (
                        <Typography variant="h5" sx={{ color: q.best_score >= 80 ? '#4caf50' : '#ff9800', fontWeight: 700 }}>
                          {q.best_score}%
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>{q.description}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip label={`${q.question_count || 0} questions`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.2)', color: '#90caf9' }} />
                      {q.attempts > 0 && <Chip label={`${q.attempts} attempts`} size="small" sx={{ bgcolor: 'rgba(255,152,0,0.2)', color: '#ffb74d' }} />}
                      {q.best_score >= 80 && <Chip icon={<CheckIcon />} label="Passed" size="small" sx={{ bgcolor: 'rgba(76,175,80,0.2)', color: '#81c784' }} />}
                    </Stack>
                    <Button size="small" variant="contained" sx={{ mt: 2, bgcolor: '#2196f3' }}>Take Quiz</Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {quizzes.length === 0 && <Alert severity="info">No quizzes available.</Alert>}
          </Grid>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {paths.map((p: any) => (
              <Card key={p.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{p.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{p.description}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
                        {p.total_modules || 0} modules • {p.estimated_hours || 0} hours
                      </Typography>
                    </Box>
                    <Chip label={`${p.completed_modules || 0}/${p.total_modules || 0}`} size="small"
                      sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                  </Stack>
                  <LinearProgress variant="determinate"
                    value={p.total_modules ? ((p.completed_modules || 0) / p.total_modules) * 100 : 0}
                    sx={{ mt: 2, height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#2196f3' } }} />
                  {p.next_module && (
                    <Button size="small" sx={{ color: '#90caf9', mt: 1 }} startIcon={<PlayIcon />}>
                      Continue: {p.next_module}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            {paths.length === 0 && <Alert severity="info">No learning paths available.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default EducationPage;

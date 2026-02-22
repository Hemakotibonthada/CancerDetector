import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tab, Tabs,
  LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Alert, Avatar, Rating,
} from '@mui/material';
import {
  School, EmojiEvents, CheckCircle, Schedule, Person, TrendingUp,
  Assignment, PlayCircle, Quiz, Star, Group, Timer,
  Description, Verified, BookmarkBorder,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { StatCard, SectionHeader, StatusBadge, MetricGauge } from '../../components/common/SharedComponents';
import { adminNavItems } from './AdminDashboard';

const COURSES = [
  { id: 'TR-001', title: 'CancerGuard Platform Fundamentals', category: 'Onboarding', duration: '4 hours', modules: 8, enrolled: 125, completed: 98, rating: 4.7, status: 'active', mandatory: true, certification: true, level: 'Beginner', instructor: 'Dr. Sarah Johnson' },
  { id: 'TR-002', title: 'AI-Powered Cancer Detection', category: 'Clinical AI', duration: '6 hours', modules: 12, enrolled: 85, completed: 62, rating: 4.9, status: 'active', mandatory: false, certification: true, level: 'Advanced', instructor: 'Dr. Michael Chen' },
  { id: 'TR-003', title: 'HIPAA Compliance & Data Privacy', category: 'Compliance', duration: '3 hours', modules: 6, enrolled: 200, completed: 180, rating: 4.3, status: 'active', mandatory: true, certification: true, level: 'All Levels', instructor: 'Legal Team' },
  { id: 'TR-004', title: 'Telemedicine Best Practices', category: 'Clinical', duration: '2 hours', modules: 5, enrolled: 65, completed: 45, rating: 4.5, status: 'active', mandatory: false, certification: false, level: 'Intermediate', instructor: 'Dr. Emily Park' },
  { id: 'TR-005', title: 'Advanced Radiology & AI Analysis', category: 'Clinical AI', duration: '8 hours', modules: 15, enrolled: 40, completed: 18, rating: 4.8, status: 'active', mandatory: false, certification: true, level: 'Expert', instructor: 'Dr. Raj Patel' },
  { id: 'TR-006', title: 'Cybersecurity Awareness', category: 'Security', duration: '2 hours', modules: 4, enrolled: 210, completed: 195, rating: 4.1, status: 'active', mandatory: true, certification: false, level: 'All Levels', instructor: 'Security Team' },
];

const CERTIFICATIONS = [
  { name: 'CancerGuard Certified User', holders: 98, total: 125, color: '#5e92f3' },
  { name: 'AI Cancer Detection Specialist', holders: 62, total: 85, color: '#ae52d4' },
  { name: 'HIPAA Compliance Certified', holders: 180, total: 200, color: '#4caf50' },
  { name: 'Advanced Radiology AI', holders: 18, total: 40, color: '#ff9800' },
];

const CATEGORY_DISTRIBUTION = [
  { name: 'Onboarding', value: 1, fill: '#5e92f3' },
  { name: 'Clinical AI', value: 2, fill: '#ae52d4' },
  { name: 'Compliance', value: 1, fill: '#4caf50' },
  { name: 'Clinical', value: 1, fill: '#ff9800' },
  { name: 'Security', value: 1, fill: '#f44336' },
];

const COMPLETION_TREND = [
  { month: 'Jul', completions: 35 }, { month: 'Aug', completions: 42 }, { month: 'Sep', completions: 55 },
  { month: 'Oct', completions: 48 }, { month: 'Nov', completions: 65 }, { month: 'Dec', completions: 52 },
];

const levelColors: Record<string, string> = {
  Beginner: '#4caf50', Intermediate: '#ff9800', Advanced: '#5e92f3', Expert: '#ae52d4', 'All Levels': '#607d8b',
};

const TrainingCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showCourseDialog, setShowCourseDialog] = useState(false);

  const totalEnrolled = COURSES.reduce((s, c) => s + c.enrolled, 0);
  const totalCompleted = COURSES.reduce((s, c) => s + c.completed, 0);
  const avgRating = COURSES.reduce((s, c) => s + c.rating, 0) / COURSES.length;

  return (
    <AppLayout title="Training Center" navItems={adminNavItems} portalType="admin" subtitle="Staff training, courses & certification management">
      <Box sx={{ p: 3 }}>
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<School />} label="Active Courses" value={COURSES.length.toString()} color="#5e92f3" subtitle="Available training" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Group />} label="Total Enrolled" value={totalEnrolled.toString()} color="#4caf50" subtitle="Across all courses" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<EmojiEvents />} label="Completions" value={totalCompleted.toString()} change="+52" color="#ff9800" subtitle="This period" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard icon={<Star />} label="Avg Rating" value={avgRating.toFixed(1)} color="#ae52d4" subtitle="Course satisfaction" />
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab icon={<PlayCircle />} label="Courses" iconPosition="start" />
            <Tab icon={<Verified />} label="Certifications" iconPosition="start" />
            <Tab icon={<TrendingUp />} label="Analytics" iconPosition="start" />
          </Tabs>
        </Card>

        {activeTab === 0 && (
          <Card sx={{ p: 3 }}>
            <SectionHeader title="Training Courses" icon={<School />}
              action={<Button startIcon={<School />} variant="contained" size="small" onClick={() => setShowCourseDialog(true)}>Create Course</Button>}
            />
            <Grid container spacing={2}>
              {COURSES.map((course, idx) => (
                <Grid item xs={12} md={6} key={idx}>
                  <Box sx={{ p: 2.5, border: '1px solid #f0f0f0', borderRadius: 3, '&:hover': { borderColor: '#5e92f3', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
                      <Box>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                          {course.mandatory && <Chip label="Required" size="small" sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 700, fontSize: 9, height: 18 }} />}
                          {course.certification && <Chip icon={<Verified sx={{ fontSize: '12px !important' }} />} label="Certification" size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontSize: 9, height: 18 }} />}
                          <Chip label={course.level} size="small" sx={{ bgcolor: levelColors[course.level] + '20', color: levelColors[course.level], fontWeight: 600, fontSize: 9, height: 18 }} />
                        </Stack>
                        <Typography fontWeight={700} fontSize={14}>{course.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{course.instructor} • {course.category}</Typography>
                      </Box>
                      <MetricGauge value={Math.round((course.completed / course.enrolled) * 100)} size={55} color="#4caf50" />
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Timer sx={{ fontSize: 14, color: '#9e9e9e' }} />
                        <Typography variant="caption">{course.duration}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Description sx={{ fontSize: 14, color: '#9e9e9e' }} />
                        <Typography variant="caption">{course.modules} modules</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Rating value={course.rating} precision={0.1} size="small" readOnly sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={600}>{course.rating}</Typography>
                      </Stack>
                    </Stack>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Completed: {course.completed}/{course.enrolled}</Typography>
                        <Typography variant="caption" fontWeight={600}>{Math.round((course.completed / course.enrolled) * 100)}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={(course.completed / course.enrolled) * 100} sx={{
                        height: 6, borderRadius: 3, bgcolor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: '#4caf50' },
                      }} />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Card>
        )}

        {activeTab === 1 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Certification Programs" icon={<Verified />} />
                <Grid container spacing={2}>
                  {CERTIFICATIONS.map((cert, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: `1px solid ${cert.color}30` }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <EmojiEvents sx={{ color: cert.color, fontSize: 28 }} />
                            <Typography fontWeight={700} fontSize={14}>{cert.name}</Typography>
                          </Stack>
                          <MetricGauge value={Math.round((cert.holders / cert.total) * 100)} size={60} color={cert.color} />
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Certified: {cert.holders}/{cert.total} staff</Typography>
                          <Typography variant="body2" fontWeight={700} color={cert.color}>{Math.round((cert.holders / cert.total) * 100)}%</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={(cert.holders / cert.total) * 100} sx={{
                          height: 10, borderRadius: 5, bgcolor: '#f0f0f0',
                          '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: cert.color },
                        }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>
          </Grid>
        )}

        {activeTab === 2 && (
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Monthly Completions" icon={<TrendingUp />} />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={COMPLETION_TREND}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RTooltip />
                    <Bar dataKey="completions" fill="#5e92f3" name="Completions" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <SectionHeader title="Courses by Category" icon={<Assignment />} />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={CATEGORY_DISTRIBUTION} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" label={({ name }: any) => name}>
                      {CATEGORY_DISTRIBUTION.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Create Course Dialog */}
        <Dialog open={showCourseDialog} onClose={() => setShowCourseDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create Training Course</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Course Title" fullWidth />
              <TextField select label="Category" fullWidth defaultValue="">
                <MenuItem value="onboarding">Onboarding</MenuItem>
                <MenuItem value="clinical">Clinical</MenuItem>
                <MenuItem value="clinical_ai">Clinical AI</MenuItem>
                <MenuItem value="compliance">Compliance</MenuItem>
                <MenuItem value="security">Security</MenuItem>
              </TextField>
              <TextField select label="Level" fullWidth defaultValue="">
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
                <MenuItem value="all">All Levels</MenuItem>
              </TextField>
              <TextField label="Instructor" fullWidth />
              <Grid container spacing={2}>
                <Grid item xs={6}><TextField label="Duration (hours)" type="number" fullWidth /></Grid>
                <Grid item xs={6}><TextField label="Number of Modules" type="number" fullWidth /></Grid>
              </Grid>
              <TextField label="Description" multiline rows={3} fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCourseDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setShowCourseDialog(false)}>Create Course</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
};

export default TrainingCenterPage;

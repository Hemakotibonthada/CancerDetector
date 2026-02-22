import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, Button,
  Tabs, Tab, Alert, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import {
  School as EduIcon, Assignment as TrainIcon,
  Verified as CertIcon, Timeline as PathIcon,
  Quiz as QuizIcon, Assessment as AssessIcon,
} from '@mui/icons-material';
import AppLayout from '../../components/common/AppLayout';
import { adminNavItems } from './AdminDashboard';
import { educationAPI } from '../../services/api';

const EducationManagementPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [resources, setResources] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [learningPaths, setLearningPaths] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rs, tr, ct, lp] = await Promise.all([
        educationAPI.getResources().catch(() => ({ data: [] })),
        educationAPI.getTrainingModules().catch(() => ({ data: [] })),
        educationAPI.getCertifications ? educationAPI.getCertifications().catch(() => ({ data: [] })) : { data: [] },
        educationAPI.getLearningPaths().catch(() => ({ data: [] })),
      ]);
      setResources(rs.data || []);
      setTrainings(tr.data || []);
      setCertifications(ct.data || []);
      setLearningPaths(lp.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <AppLayout title="Education & Training Management" navItems={adminNavItems} portalType="admin">
      <Box sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Resources', value: resources.length, icon: <EduIcon />, color: '#2196f3' },
            { label: 'Training Modules', value: trainings.length, icon: <TrainIcon />, color: '#4caf50' },
            { label: 'Active Certifications', value: certifications.filter(c => c.status === 'active').length, icon: <CertIcon />, color: '#ff9800' },
            { label: 'Learning Paths', value: learningPaths.length, icon: <PathIcon />, color: '#9c27b0' },
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
          <Tab label="Resources Library" icon={<EduIcon />} iconPosition="start" />
          <Tab label="Training Modules" icon={<TrainIcon />} iconPosition="start" />
          <Tab label="Certifications" icon={<CertIcon />} iconPosition="start" />
          <Tab label="Learning Paths" icon={<PathIcon />} iconPosition="start" />
        </Tabs>

        {activeTab === 0 && (
          <Grid container spacing={2}>
            {resources.map((r: any) => (
              <Grid item xs={12} sm={6} md={4} key={r.id}>
                <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: '#fff' }}>{r.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>{r.description}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip label={r.resource_type || 'Article'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                      <Chip label={r.category || 'General'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                      <Chip label={r.difficulty || 'Intermediate'} size="small"
                        sx={{ bgcolor: r.difficulty === 'Advanced' ? 'rgba(244,67,54,0.3)' : r.difficulty === 'Beginner' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: r.difficulty === 'Advanced' ? '#ef5350' : r.difficulty === 'Beginner' ? '#81c784' : '#ffb74d' }} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Views: {r.view_count || 0} • Rating: {r.avg_rating || '-'}/5 • Duration: {r.duration_minutes || '-'} min
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>Edit</Button>
                      <Button variant="contained" size="small" sx={{ bgcolor: '#1976d2' }}>Preview</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {resources.length === 0 && <Grid item xs={12}><Alert severity="info">No resources.</Alert></Grid>}
          </Grid>
        )}

        {activeTab === 1 && (
          <Stack spacing={2}>
            {trainings.map((t: any) => (
              <Card key={t.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{t.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{t.description}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        Instructor: {t.instructor || 'Self-paced'} • Duration: {t.duration_hours || '-'}h
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          Completion: {t.completed_count || 0}/{t.enrolled_count || 0} staff ({t.enrolled_count ? Math.round((t.completed_count / t.enrolled_count) * 100) : 0}%)
                        </Typography>
                        <LinearProgress variant="determinate"
                          value={t.enrolled_count ? (t.completed_count / t.enrolled_count) * 100 : 0}
                          sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#4caf50' } }} />
                      </Box>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={t.category || 'Clinical'} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                        {t.mandatory && <Chip label="Mandatory" size="small" sx={{ bgcolor: 'rgba(244,67,54,0.3)', color: '#ef5350' }} />}
                        {t.cme_credits && <Chip label={`${t.cme_credits} CME`} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />}
                      </Stack>
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={t.status || 'active'} size="small"
                        sx={{ bgcolor: t.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: t.status === 'active' ? '#81c784' : '#ffb74d' }} />
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>Manage</Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {trainings.length === 0 && <Alert severity="info">No training modules.</Alert>}
          </Stack>
        )}

        {activeTab === 2 && (
          <TableContainer component={Paper} sx={{ bgcolor: 'rgba(26,26,46,0.9)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#90caf9' }}>Certification</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Type</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Provider</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Staff Certified</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Expiring Soon</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Status</TableCell>
                  <TableCell sx={{ color: '#90caf9' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {certifications.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell sx={{ color: '#fff' }}>{c.name}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{c.cert_type || 'Professional'}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{c.provider || '-'}</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{c.certified_count || 0}</TableCell>
                    <TableCell>
                      <Chip label={c.expiring_soon || 0} size="small"
                        sx={{ bgcolor: (c.expiring_soon || 0) > 0 ? 'rgba(255,152,0,0.3)' : 'rgba(76,175,80,0.3)',
                              color: (c.expiring_soon || 0) > 0 ? '#ffb74d' : '#81c784' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={c.status || 'active'} size="small"
                        sx={{ bgcolor: c.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: c.status === 'active' ? '#81c784' : '#ffb74d' }} />
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {certifications.length === 0 && <TableRow><TableCell colSpan={7} sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No certifications</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            {learningPaths.map((lp: any) => (
              <Card key={lp.id} sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between">
                    <Box flex={1}>
                      <Typography variant="h6" sx={{ color: '#fff' }}>{lp.name}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>{lp.description}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={`${lp.module_count || 0} modules`} size="small" sx={{ bgcolor: 'rgba(33,150,243,0.3)', color: '#90caf9' }} />
                        <Chip label={`${lp.enrolled || 0} enrolled`} size="small" sx={{ bgcolor: 'rgba(76,175,80,0.3)', color: '#81c784' }} />
                        <Chip label={`${lp.total_hours || 0}h total`} size="small" sx={{ bgcolor: 'rgba(255,152,0,0.3)', color: '#ffb74d' }} />
                        <Chip label={lp.target_role || 'All Staff'} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.3)', color: '#ce93d8' }} />
                      </Stack>
                      {lp.modules && (
                        <Box sx={{ mt: 1 }}>
                          {(lp.modules || []).map((mod: any, i: number) => (
                            <Typography key={i} variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                              {i + 1}. {mod.name || mod}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                    <Stack spacing={1}>
                      <Chip label={lp.status || 'active'} size="small"
                        sx={{ bgcolor: lp.status === 'active' ? 'rgba(76,175,80,0.3)' : 'rgba(255,152,0,0.3)',
                              color: lp.status === 'active' ? '#81c784' : '#ffb74d' }} />
                      <Button variant="outlined" size="small" sx={{ color: '#90caf9', borderColor: 'rgba(144,202,249,0.3)' }}>Edit Path</Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
            {learningPaths.length === 0 && <Alert severity="info">No learning paths.</Alert>}
          </Stack>
        )}
      </Box>
    </AppLayout>
  );
};

export default EducationManagementPage;

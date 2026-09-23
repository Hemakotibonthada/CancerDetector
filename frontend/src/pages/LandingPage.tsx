import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Card, CardContent,
  AppBar, Toolbar, Stack, Chip, Avatar, IconButton, useTheme
} from '@mui/material';
import {
  Science as ScienceIcon,
  MonitorHeart as HeartIcon,
  LocalHospital as HospitalIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Psychology as AIIcon,
  Biotech as BiotechIcon,
  Watch as WatchIcon,
  HealthAndSafety as HealthIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const features = [
    {
      icon: <AIIcon sx={{ fontSize: 48, color: '#1565c0' }} />,
      title: 'Explore Personal Risk Factors',
      description: 'Review recorded health factors with an exploratory, rule-based score. This prototype is not validated for diagnosis.',
    },
    {
      icon: <WatchIcon sx={{ fontSize: 48, color: '#00897b' }} />,
      title: 'Smartwatch Integration',
      description: 'Record supported wearable measurements in your health profile and review them alongside other information.',
    },
    {
      icon: <BiotechIcon sx={{ fontSize: 48, color: '#7b1fa2' }} />,
      title: 'Blood Biomarker Analysis',
      description: 'Keep blood test results and related health records in one place for discussion with your care team.',
    },
    {
      icon: <HospitalIcon sx={{ fontSize: 48, color: '#d32f2f' }} />,
      title: 'Hospital Integration',
      description: 'Organize hospital and clinician information in your personal health profile.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48, color: '#f57c00' }} />,
      title: 'Unique Health ID',
      description: 'Every user gets a unique Health ID for organizing records and exploratory assessments.',
    },
    {
      icon: <HeartIcon sx={{ fontSize: 48, color: '#c62828' }} />,
      title: 'Real-time Monitoring',
      description: 'Keep health information in one place and review trends with your care team.',
    },
  ];

  const stats = [
    { value: '7', label: 'Exploratory Indicators' },
    { value: '1', label: 'Personal Health Profile' },
    { value: '0', label: 'Validated Cancer Models' },
    { value: 'Your', label: 'Data, Your Control' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* Navbar */}
      <AppBar position="fixed" sx={{ bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1200, width: '100%', mx: 'auto' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HealthIcon sx={{ color: '#1565c0', fontSize: 32 }} />
            <Typography variant="h6" sx={{ color: '#1565c0', fontWeight: 800, letterSpacing: -0.5 }}>
              CancerGuard AI
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button color="primary" onClick={() => navigate('/login')}>Sign In</Button>
            <Button variant="contained" onClick={() => navigate('/register')} sx={{
              background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
              '&:hover': { background: 'linear-gradient(135deg, #1976d2, #1565c0)' },
            }}>
              Get Started
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{
        pt: 16, pb: 12,
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 30%, #00897b 70%, #004d40 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="Research Prototype" sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
              <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 3, lineHeight: 1.1, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                Explore Health Factors.{' '}
                <Box component="span" sx={{ background: 'linear-gradient(90deg, #80cbc4, #b2dfdb)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                  Plan Better Conversations.
                </Box>
              </Typography>
              <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, fontWeight: 400, lineHeight: 1.5 }}>
                Organize your health information and explore an unvalidated rule-based score.
                This tool cannot detect or diagnose cancer. Consult a licensed clinician about screening.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" size="large" onClick={() => navigate('/register')}
                  sx={{ bgcolor: 'white', color: '#1565c0', fontWeight: 700, px: 4, '&:hover': { bgcolor: '#e3f2fd' } }}
                  endIcon={<ArrowIcon />}>
                  Start Free Assessment
                </Button>
                <Button variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  Learn More
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{
                width: 350, height: 350, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid rgba(255,255,255,0.2)',
              }}>
                <ScienceIcon sx={{ fontSize: 150, color: 'rgba(255,255,255,0.8)' }} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ mt: -6, mb: 8, position: 'relative', zIndex: 2 }}>
        <Card sx={{ p: 4, bgcolor: 'white' }}>
          <Grid container spacing={4}>
            {stats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ color: '#1565c0', fontWeight: 800 }}>{stat.value}</Typography>
                  <Typography variant="body1" sx={{ color: '#666', fontWeight: 500 }}>{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Card>
      </Container>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: '#1a237e' }}>
            Explore Your Health Information
          </Typography>
          <Typography variant="h6" sx={{ color: '#666', maxWidth: 700, mx: 'auto', fontWeight: 400 }}>
            Organize your health details and explore rule-based indicators. This prototype has not been validated for clinical use.
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{
                height: '100%', p: 3, transition: 'all 0.3s',
                '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' },
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{feature.title}</Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.7 }}>{feature.description}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works */}
      <Box sx={{ bgcolor: '#f0f4f8', py: 10 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 6, textAlign: 'center', color: '#1a237e' }}>
            How It Works
          </Typography>
          <Grid container spacing={4}>
            {[
              { step: '1', title: 'Create Your Health Profile', desc: 'Sign up and receive your unique Health ID. Enter your medical history, lifestyle data, and connect your smartwatch.' },
              { step: '2', title: 'Review Your Information', desc: 'A transparent prototype uses recorded health factors to generate an exploratory score.' },
              { step: '3', title: 'Get Risk Assessment', desc: 'See which recorded factors influence the prototype score and discuss screening with your clinician.' },
              { step: '4', title: 'Continuous Monitoring', desc: 'Keep your health profile up to date as you gather new information.' },
            ].map((item, index) => (
              <Grid item xs={12} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: '#1565c0', fontSize: 28, fontWeight: 800 }}>
                    {item.step}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{item.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>{item.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{
        py: 10,
        background: 'linear-gradient(135deg, #1565c0, #0d47a1)',
        textAlign: 'center',
      }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
            Take Your Questions to Your Clinician
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
            Use this research prototype to organize health factors. It is not a diagnostic or screening tool.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/register')}
            sx={{ bgcolor: 'white', color: '#1565c0', fontWeight: 700, px: 6, py: 1.5, fontSize: '1.1rem' }}
            endIcon={<ArrowIcon />}>
            Get Started for Free
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#0d1b2a', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <HealthIcon sx={{ color: '#5e92f3' }} />
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 18 }}>CancerGuard AI</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                A research prototype for organizing health information and exploring risk factors. Not for diagnosis or treatment decisions.
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>Platform</Typography>
              {['For Users', 'For Hospitals', 'For Doctors', 'Risk Factors'].map(item => (
                <Typography key={item} variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>Company</Typography>
              {['About Us', 'Research', 'Careers', 'Contact'].map(item => (
                <Typography key={item} variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, cursor: 'pointer', '&:hover': { color: 'white' } }}>
                  {item}
                </Typography>
              ))}
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>Status</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {['Research prototype', 'No clinical validation'].map(badge => (
                  <Chip key={badge} label={badge} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', mb: 1 }} />
                ))}
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              © 2026 CancerGuard AI. All rights reserved. For research exploration only.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;

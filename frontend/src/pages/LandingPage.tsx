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
      title: 'AI-Powered Cancer Detection',
      description: 'Our advanced ensemble ML models analyze blood biomarkers, genetic data, and health patterns to detect cancer risk with 95%+ accuracy.',
    },
    {
      icon: <WatchIcon sx={{ fontSize: 48, color: '#00897b' }} />,
      title: 'Smartwatch Integration',
      description: 'Connect your smartwatch for continuous health monitoring. Real-time heart rate, SpO2, sleep, and stress data feed into our AI models.',
    },
    {
      icon: <BiotechIcon sx={{ fontSize: 48, color: '#7b1fa2' }} />,
      title: 'Blood Biomarker Analysis',
      description: 'Comprehensive analysis of 60+ blood biomarkers including tumor markers, inflammatory markers, and metabolic indicators.',
    },
    {
      icon: <HospitalIcon sx={{ fontSize: 48, color: '#d32f2f' }} />,
      title: 'Hospital Integration',
      description: 'Seamless integration with hospitals. Share your health ID for doctors to access your complete medical history securely.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48, color: '#f57c00' }} />,
      title: 'Unique Health ID',
      description: 'Every user gets a unique Health ID that stores their entire health history, medications, and AI-generated risk assessments.',
    },
    {
      icon: <HeartIcon sx={{ fontSize: 48, color: '#c62828' }} />,
      title: 'Real-time Monitoring',
      description: '24/7 health monitoring with instant alerts for anomalies. Early detection that can save lives through proactive healthcare.',
    },
  ];

  const stats = [
    { value: '95%+', label: 'Detection Accuracy' },
    { value: '60+', label: 'Biomarkers Analyzed' },
    { value: '17', label: 'Cancer Types' },
    { value: '24/7', label: 'Monitoring' },
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
              <Chip label="AI-Powered Healthcare" sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
              <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 3, lineHeight: 1.1, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                Detect Cancer Early.{' '}
                <Box component="span" sx={{ background: 'linear-gradient(90deg, #80cbc4, #b2dfdb)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                  Save Lives.
                </Box>
              </Typography>
              <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, fontWeight: 400, lineHeight: 1.5 }}>
                Advanced AI models analyze your blood biomarkers, smartwatch data, and health history
                to detect cancer risk before symptoms appear.
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
            Comprehensive Cancer Detection Platform
          </Typography>
          <Typography variant="h6" sx={{ color: '#666', maxWidth: 700, mx: 'auto', fontWeight: 400 }}>
            Combining cutting-edge AI with multi-source health data for the most accurate
            cancer risk assessment available today.
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
              { step: '2', title: 'AI Analyzes Your Data', desc: 'Our ensemble ML models analyze your blood biomarkers, smartwatch data, genetic info, and health history.' },
              { step: '3', title: 'Get Risk Assessment', desc: 'Receive a comprehensive cancer risk assessment with specific cancer type risks and personalized recommendations.' },
              { step: '4', title: 'Continuous Monitoring', desc: 'Ongoing monitoring through your smartwatch with real-time alerts and regular AI-powered health updates.' },
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
            Early Detection Saves Lives
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.8)', mb: 4 }}>
            Join thousands of users who are taking control of their health with AI-powered cancer screening.
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
                Advanced AI-powered cancer detection and health monitoring platform.
                Empowering users and healthcare providers with predictive analytics.
              </Typography>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>Platform</Typography>
              {['For Users', 'For Hospitals', 'For Doctors', 'AI Models'].map(item => (
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
              <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>Compliance</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {['HIPAA', 'GDPR', 'SOC 2', 'ISO 27001'].map(badge => (
                  <Chip key={badge} label={badge} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', mb: 1 }} />
                ))}
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              © 2026 CancerGuard AI. All rights reserved. For research and medical purposes.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;

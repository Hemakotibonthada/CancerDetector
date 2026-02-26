// ============================================================================
// Landing Page Components - Hero, Features, Testimonials, Pricing, Footer
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Avatar, Chip,
  Container, Paper, Stack, IconButton, Rating, Divider, Link,
  TextField, useTheme, alpha, useMediaQuery,
} from '@mui/material';
import {
  ArrowForward, CheckCircle, Star, PlayArrow, Speed,
  Security, HealthAndSafety, Biotech, Psychology, Analytics,
  LocalHospital, People, Verified, Timeline, Support, Cloud,
  FormatQuote, KeyboardArrowLeft, KeyboardArrowRight,
  GitHub, LinkedIn, Twitter, Email, Phone, LocationOn,
  Schedule, TrendingUp, Shield, AutoAwesome, Devices,
  Notifications, DataObject, Api, SmartToy, Favorite,
  MedicalServices, Science, Vaccines, MonitorHeart,
} from '@mui/icons-material';
import { motion, useInView, useAnimation } from 'framer-motion';

// ============================================================================
// HERO SECTION
// ============================================================================
interface HeroSectionProps {
  onGetStarted?: () => void;
  onLearnMore?: () => void;
  onWatchDemo?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onGetStarted, onLearnMore, onWatchDemo,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentStat, setCurrentStat] = useState(0);

  const stats = [
    { value: '99.2%', label: 'Detection Accuracy' },
    { value: '500K+', label: 'Patients Served' },
    { value: '1,200+', label: 'Partner Hospitals' },
    { value: '50+', label: 'Cancer Types Detected' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % stats.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${alpha(theme.palette.primary.main, 0.9)} 50%, ${theme.palette.secondary.dark} 100%)`,
      }}
    >
      {/* Animated Background Elements */}
      <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.15 }}>
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 300 + 50,
              height: Math.random() * 300 + 50,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha('#fff', 0.3)}, transparent)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          />
        ))}
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={7}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Chip
                label="🏆 #1 AI-Powered Cancer Detection Platform"
                sx={{
                  mb: 3,
                  bgcolor: alpha('#fff', 0.15),
                  color: 'white',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  fontSize: '0.85rem',
                  height: 36,
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  color: 'white',
                  fontWeight: 800,
                  fontSize: isMobile ? '2.5rem' : '3.8rem',
                  lineHeight: 1.15,
                  mb: 3,
                  letterSpacing: '-1px',
                }}
              >
                AI-Powered{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(90deg, #81d4fa, #80cbc4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Cancer Detection
                </Box>
                <br />
                Saving Lives Daily
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: alpha('#fff', 0.85),
                  mb: 4,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  maxWidth: 550,
                }}
              >
                CancerGuard AI combines advanced machine learning with medical expertise to provide
                early, accurate cancer detection. Join thousands of healthcare providers revolutionizing
                patient outcomes.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 5 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={onGetStarted}
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: 'white',
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    py: 1.5,
                    px: 4,
                    borderRadius: 3,
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.9),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={onWatchDemo}
                  startIcon={<PlayArrow />}
                  sx={{
                    color: 'white',
                    borderColor: alpha('#fff', 0.5),
                    py: 1.5,
                    px: 4,
                    borderRadius: 3,
                    fontSize: '1rem',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: alpha('#fff', 0.1),
                    },
                  }}
                >
                  Watch Demo
                </Button>
              </Stack>

              {/* Trust Indicators */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Verified sx={{ color: '#4caf50', fontSize: 20 }} />
                  <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                    HIPAA Compliant
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Shield sx={{ color: '#4caf50', fontSize: 20 }} />
                  <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                    FDA Approved
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star sx={{ color: '#ffd700', fontSize: 20 }} />
                  <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                    4.9/5 Rating
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={5}>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Animated Stats Card */}
              <Paper
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: alpha('#fff', 0.1),
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${alpha('#fff', 0.2)}`,
                }}
              >
                <Box sx={{ mb: 3 }}>
                  <motion.div
                    key={currentStat}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Typography
                      variant="h2"
                      sx={{
                        color: 'white',
                        fontWeight: 800,
                        textAlign: 'center',
                        fontSize: '3.5rem',
                      }}
                    >
                      {stats[currentStat].value}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: alpha('#fff', 0.7),
                        textAlign: 'center',
                        fontWeight: 400,
                      }}
                    >
                      {stats[currentStat].label}
                    </Typography>
                  </motion.div>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  {stats.map((_, i) => (
                    <Box
                      key={i}
                      onClick={() => setCurrentStat(i)}
                      sx={{
                        width: i === currentStat ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        bgcolor: i === currentStat ? 'white' : alpha('#fff', 0.3),
                        transition: 'all 0.3s',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Box>
                <Grid container spacing={2} sx={{ mt: 3 }}>
                  {stats.map((stat, i) => (
                    <Grid item xs={6} key={i}>
                      <Box
                        sx={{
                          textAlign: 'center',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: alpha('#fff', 0.05),
                          border: i === currentStat ? `1px solid ${alpha('#fff', 0.3)}` : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                        }}
                        onClick={() => setCurrentStat(i)}
                      >
                        <Typography variant="h6" fontWeight={700} color="white">
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color={alpha('#fff', 0.6)}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// ============================================================================
// FEATURES SECTION
// ============================================================================
export const FeaturesSection: React.FC = () => {
  const theme = useTheme();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const features = [
    { icon: <Biotech />, title: 'AI Cancer Detection', description: 'Advanced deep learning models analyze medical images with 99.2% accuracy for early cancer detection.', color: '#1565c0' },
    { icon: <MonitorHeart />, title: 'Real-time Monitoring', description: 'Continuous vital signs monitoring with smartwatch integration and AI-powered anomaly detection.', color: '#00897b' },
    { icon: <Psychology />, title: 'Clinical Decision Support', description: 'Evidence-based treatment recommendations powered by analysis of millions of clinical outcomes.', color: '#7b1fa2' },
    { icon: <Science />, title: 'Genomic Analysis', description: 'Comprehensive genomic profiling to identify genetic mutations and personalized treatment paths.', color: '#e65100' },
    { icon: <Analytics />, title: 'Predictive Analytics', description: 'Risk prediction models that identify high-risk patients before symptoms appear.', color: '#2e7d32' },
    { icon: <MedicalServices />, title: 'Telehealth Integration', description: 'Seamless video consultations with AI-assisted diagnosis and real-time translation support.', color: '#c62828' },
    { icon: <Vaccines />, title: 'Drug Interaction Check', description: 'Instant analysis of drug interactions and contraindications across your full medication profile.', color: '#4527a0' },
    { icon: <Security />, title: 'HIPAA Compliance', description: 'End-to-end encryption, audit trails, and full HIPAA/GDPR compliance for healthcare data.', color: '#00695c' },
    { icon: <Speed />, title: 'Rapid Results', description: 'Get AI screening results in under 60 seconds with detailed probability scores and recommendations.', color: '#ef6c00' },
    { icon: <People />, title: 'Multi-Provider Collaboration', description: 'Secure sharing of patient records, imaging, and treatment plans across care teams.', color: '#1565c0' },
    { icon: <Notifications />, title: 'Smart Alerts', description: 'Intelligent notification system with priority-based alerts for critical findings and follow-ups.', color: '#ad1457' },
    { icon: <Devices />, title: 'Cross-Platform', description: 'Access from web, mobile, and tablet with offline-capable features and data synchronization.', color: '#283593' },
  ];

  return (
    <Box ref={ref} sx={{ py: 12, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="FEATURES" sx={{ mb: 2, fontWeight: 700, letterSpacing: 1 }} color="primary" />
            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.5px' }}>
              Everything You Need for{' '}
              <Box component="span" sx={{ color: theme.palette.primary.main }}>
                Modern Healthcare
              </Box>
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontWeight: 400 }}>
              Comprehensive tools and AI-powered features designed for healthcare professionals and patients.
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: 3,
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 12px 40px ${alpha(feature.color, 0.15)}`,
                      borderColor: alpha(feature.color, 0.3),
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: alpha(feature.color, 0.1),
                      color: feature.color,
                      mb: 2,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {feature.description}
                  </Typography>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// ============================================================================
// TESTIMONIALS SECTION
// ============================================================================
export const TestimonialsSection: React.FC = () => {
  const theme = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const testimonials = [
    { name: 'Dr. Sarah Chen', role: 'Oncologist, Stanford Medicine', avatar: '', rating: 5, text: 'CancerGuard AI has transformed our screening process. We\'ve detected 40% more early-stage cancers since implementing this system. The AI accuracy is remarkable.' },
    { name: 'Dr. Michael Rodriguez', role: 'Chief Medical Officer, City Hospital', avatar: '', rating: 5, text: 'The clinical decision support system alone has made this invaluable. Our treatment outcomes have improved significantly, and our clinicians trust the recommendations.' },
    { name: 'Dr. Emily Thompson', role: 'Radiologist, Mayo Clinic', avatar: '', rating: 5, text: 'As a radiologist, I\'m impressed by the AI\'s ability to identify subtle patterns in medical imaging. It catches things that even experienced eyes might miss.' },
    { name: 'James Wilson', role: 'Cancer Survivor & Patient', avatar: '', rating: 5, text: 'The early detection through CancerGuard literally saved my life. My cancer was caught at Stage 1 when traditional screening had missed it. I\'m forever grateful.' },
    { name: 'Dr. Priya Sharma', role: 'Research Director, Cancer Institute', avatar: '', rating: 5, text: 'The genomic analysis module has accelerated our research significantly. We can now identify genetic markers and correlations in a fraction of the time.' },
    { name: 'Nurse Patricia Davis', role: 'Head Nurse, Regional Medical Center', avatar: '', rating: 5, text: 'The platform is incredibly intuitive. Even our non-technical staff adapted quickly. The patient engagement features have improved compliance rates dramatically.' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        py: 12,
        bgcolor: alpha(theme.palette.primary.main, 0.03),
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Chip label="TESTIMONIALS" sx={{ mb: 2, fontWeight: 700, letterSpacing: 1 }} color="primary" />
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Trusted by Healthcare Leaders
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontWeight: 400 }}>
              See what medical professionals and patients say about CancerGuard AI.
            </Typography>
          </Box>
        </motion.div>

        <Box sx={{ position: 'relative', maxWidth: 800, mx: 'auto' }}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 5,
                borderRadius: 4,
                border: `1px solid ${theme.palette.divider}`,
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <FormatQuote sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.15), mb: 1 }} />
              <Typography
                variant="h6"
                sx={{ fontStyle: 'italic', lineHeight: 1.8, mb: 3, fontWeight: 400 }}
              >
                "{testimonials[currentIndex].text}"
              </Typography>
              <Rating value={testimonials[currentIndex].rating} readOnly sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: theme.palette.primary.main }}>
                  {testimonials[currentIndex].name.split(' ').map((n) => n[0]).join('')}
                </Avatar>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {testimonials[currentIndex].name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {testimonials[currentIndex].role}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
            <IconButton onClick={() => setCurrentIndex((currentIndex - 1 + testimonials.length) % testimonials.length)}>
              <KeyboardArrowLeft />
            </IconButton>
            {testimonials.map((_, i) => (
              <Box
                key={i}
                onClick={() => setCurrentIndex(i)}
                sx={{
                  width: i === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: i === currentIndex ? theme.palette.primary.main : theme.palette.grey[300],
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  my: 'auto',
                }}
              />
            ))}
            <IconButton onClick={() => setCurrentIndex((currentIndex + 1) % testimonials.length)}>
              <KeyboardArrowRight />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// ============================================================================
// PRICING SECTION
// ============================================================================
export const PricingSection: React.FC<{ onSelectPlan?: (plan: string) => void }> = ({ onSelectPlan }) => {
  const theme = useTheme();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: 'Basic',
      price: annual ? 49 : 59,
      description: 'For individual practitioners',
      features: ['AI Cancer Screening (100/mo)', 'Basic Analytics', 'Email Support', 'Patient Portal', '1 User License', 'HIPAA Compliant'],
      color: theme.palette.primary.main,
      popular: false,
    },
    {
      name: 'Professional',
      price: annual ? 149 : 179,
      description: 'For clinics and small hospitals',
      features: ['Unlimited AI Screenings', 'Advanced Analytics', 'Priority Support', 'Telehealth Module', 'Up to 25 Users', 'Clinical Decision Support', 'API Access', 'Custom Reports'],
      color: theme.palette.secondary.main,
      popular: true,
    },
    {
      name: 'Enterprise',
      price: null,
      description: 'For large healthcare networks',
      features: ['Everything in Professional', 'Unlimited Users', 'Dedicated Account Manager', 'Custom AI Models', 'On-Premise Option', 'SLA Guarantee', 'Advanced Integrations', 'Research Tools', 'White-label Options'],
      color: '#7b1fa2',
      popular: false,
    },
  ];

  return (
    <Box ref={ref} sx={{ py: 12, bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip label="PRICING" sx={{ mb: 2, fontWeight: 700, letterSpacing: 1 }} color="primary" />
            <Typography variant="h3" fontWeight={800} gutterBottom>
              Simple, Transparent Pricing
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', fontWeight: 400, mb: 3 }}>
              Choose the plan that fits your practice. All plans include a 30-day free trial.
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <Typography variant="body2" color={!annual ? 'primary' : 'text.secondary'} fontWeight={!annual ? 700 : 400}>
                Monthly
              </Typography>
              <Button
                onClick={() => setAnnual(!annual)}
                sx={{
                  minWidth: 56,
                  height: 28,
                  borderRadius: 14,
                  bgcolor: theme.palette.primary.main,
                  position: 'relative',
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: 'white',
                    position: 'absolute',
                    left: annual ? 30 : 4,
                    transition: 'left 0.3s ease',
                  }}
                />
              </Button>
              <Typography variant="body2" color={annual ? 'primary' : 'text.secondary'} fontWeight={annual ? 700 : 400}>
                Annual
              </Typography>
              {annual && (
                <Chip label="Save 20%" size="small" color="success" sx={{ fontWeight: 600 }} />
              )}
            </Stack>
          </Box>
        </motion.div>

        <Grid container spacing={3} alignItems="stretch">
          {plans.map((plan, index) => (
            <Grid item xs={12} md={4} key={plan.name}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                style={{ height: '100%' }}
              >
                <Card
                  elevation={plan.popular ? 8 : 0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: plan.popular ? `2px solid ${plan.color}` : `1px solid ${theme.palette.divider}`,
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 60px ${alpha(plan.color, 0.2)}`,
                    },
                  }}
                >
                  {plan.popular && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 700,
                        px: 1,
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      {plan.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {plan.description}
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      {plan.price ? (
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography variant="h3" fontWeight={800} color={plan.color}>
                            ${plan.price}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            /month
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="h3" fontWeight={800} color={plan.color}>
                          Custom
                        </Typography>
                      )}
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Stack spacing={1.5} sx={{ mb: 4 }}>
                      {plan.features.map((feature, fIndex) => (
                        <Box key={fIndex} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle sx={{ fontSize: 18, color: plan.color }} />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Button
                      variant={plan.popular ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      onClick={() => onSelectPlan?.(plan.name)}
                      sx={{
                        borderRadius: 3,
                        py: 1.5,
                        fontWeight: 700,
                        bgcolor: plan.popular ? plan.color : undefined,
                        borderColor: plan.color,
                        color: plan.popular ? 'white' : plan.color,
                        '&:hover': {
                          bgcolor: plan.popular ? alpha(plan.color, 0.9) : alpha(plan.color, 0.08),
                        },
                      }}
                    >
                      {plan.price ? 'Start Free Trial' : 'Contact Sales'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// ============================================================================
// CTA SECTION
// ============================================================================
export const CTASection: React.FC<{ onGetStarted?: () => void }> = ({ onGetStarted }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: 10,
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <AutoAwesome sx={{ fontSize: 48, color: alpha('#fff', 0.8), mb: 2 }} />
          <Typography variant="h3" fontWeight={800} color="white" gutterBottom>
            Ready to Transform Healthcare?
          </Typography>
          <Typography variant="h6" color={alpha('#fff', 0.8)} sx={{ mb: 4, fontWeight: 400, maxWidth: 500, mx: 'auto' }}>
            Join 1,200+ hospitals and 50,000+ healthcare professionals already using CancerGuard AI.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={onGetStarted}
              endIcon={<ArrowForward />}
              sx={{
                bgcolor: 'white',
                color: theme.palette.primary.main,
                fontWeight: 700,
                py: 1.5,
                px: 4,
                borderRadius: 3,
                '&:hover': { bgcolor: alpha('#fff', 0.9), transform: 'translateY(-2px)' },
                transition: 'all 0.3s',
              }}
            >
              Start Free Trial
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: 'white',
                borderColor: alpha('#fff', 0.5),
                py: 1.5,
                px: 4,
                borderRadius: 3,
                '&:hover': { borderColor: 'white', bgcolor: alpha('#fff', 0.1) },
              }}
            >
              Schedule Demo
            </Button>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
};

// ============================================================================
// FOOTER SECTION
// ============================================================================
export const FooterSection: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const links = {
    Product: ['Features', 'Pricing', 'Security', 'Integrations', 'API Documentation'],
    Solutions: ['Hospitals', 'Clinics', 'Research', 'Telehealth', 'Emergency Care'],
    Company: ['About Us', 'Careers', 'Blog', 'Press', 'Partners'],
    Support: ['Help Center', 'Documentation', 'Training', 'Community', 'Contact Us'],
  };

  return (
    <Box sx={{ bgcolor: '#0a1628', color: 'white', pt: 8, pb: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <HealthAndSafety sx={{ fontSize: 36, color: theme.palette.primary.light }} />
              <Typography variant="h5" fontWeight={800}>CancerGuard AI</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), mb: 3, lineHeight: 1.8, maxWidth: 300 }}>
              Advanced AI-powered cancer detection and healthcare management platform.
              Saving lives through early detection and intelligent care.
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton size="small" sx={{ color: alpha('#fff', 0.5), '&:hover': { color: '#1da1f2' } }}>
                <Twitter />
              </IconButton>
              <IconButton size="small" sx={{ color: alpha('#fff', 0.5), '&:hover': { color: '#0077b5' } }}>
                <LinkedIn />
              </IconButton>
              <IconButton size="small" sx={{ color: alpha('#fff', 0.5), '&:hover': { color: '#fff' } }}>
                <GitHub />
              </IconButton>
              <IconButton size="small" sx={{ color: alpha('#fff', 0.5), '&:hover': { color: theme.palette.primary.light } }}>
                <Email />
              </IconButton>
            </Stack>
          </Grid>
          {Object.entries(links).map(([category, items]) => (
            <Grid item xs={6} sm={3} md={2} key={category}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: alpha('#fff', 0.9) }}>
                {category}
              </Typography>
              <Stack spacing={1}>
                {items.map((item) => (
                  <Link
                    key={item}
                    href="#"
                    underline="none"
                    sx={{
                      color: alpha('#fff', 0.5),
                      fontSize: '0.85rem',
                      '&:hover': { color: 'white' },
                      transition: 'color 0.2s',
                    }}
                  >
                    {item}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ borderColor: alpha('#fff', 0.1), mb: 3 }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.4) }}>
            © {currentYear} CancerGuard AI. All rights reserved.
          </Typography>
          <Stack direction="row" spacing={3}>
            <Link href="#" underline="none" sx={{ color: alpha('#fff', 0.4), fontSize: '0.8rem', '&:hover': { color: 'white' } }}>
              Privacy Policy
            </Link>
            <Link href="#" underline="none" sx={{ color: alpha('#fff', 0.4), fontSize: '0.8rem', '&:hover': { color: 'white' } }}>
              Terms of Service
            </Link>
            <Link href="#" underline="none" sx={{ color: alpha('#fff', 0.4), fontSize: '0.8rem', '&:hover': { color: 'white' } }}>
              Cookie Policy
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

// ============================================================================
// STATS SECTION
// ============================================================================
interface CounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

const Counter: React.FC<CounterProps> = ({ end, suffix = '', prefix = '', duration = 2 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const stepTime = Math.max(10, Math.floor((duration * 1000) / end));
    const step = Math.max(1, Math.floor(end / (duration * 100)));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return (
    <Typography ref={ref} variant="h3" fontWeight={800}>
      {prefix}{count.toLocaleString()}{suffix}
    </Typography>
  );
};

export const StatsSection: React.FC = () => {
  const theme = useTheme();

  const stats = [
    { value: 500000, suffix: '+', label: 'Patients Screened', icon: <People />, color: '#1565c0' },
    { value: 1200, suffix: '+', label: 'Partner Hospitals', icon: <LocalHospital />, color: '#00897b' },
    { value: 99, suffix: '%', label: 'Detection Accuracy', icon: <Speed />, color: '#7b1fa2' },
    { value: 50, suffix: '+', label: 'Cancer Types', icon: <Biotech />, color: '#e65100' },
  ];

  return (
    <Box sx={{ py: 10, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.secondary.main, 0.04)})` }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: alpha(stat.color, 0.1),
                      color: stat.color,
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ color: stat.color }}>
                    <Counter end={stat.value} suffix={stat.suffix} />
                  </Box>
                  <Typography variant="body1" color="text.secondary" fontWeight={500} sx={{ mt: 1 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// ============================================================================
// EXPORT ALL
// ============================================================================
export { HeroSection as default };

import React from 'react';
import { Box, Container, Typography, Card, AppBar, Toolbar, IconButton, Stack, Chip, Button } from '@mui/material';
import { ArrowBack, HealthAndSafety as HealthIcon, Science as ScienceIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CancerRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}><ArrowBack /></IconButton>
          <ScienceIcon sx={{ color: '#1565c0', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', flex: 1 }}>Cancer Risk Assessment</Typography>
          <Chip label={`Health ID: ${user?.health_id || 'N/A'}`} sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>AI Cancer Risk Analysis</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Comprehensive cancer risk assessment powered by ensemble ML models analyzing your blood biomarkers,
          smartwatch data, lifestyle factors, genetic information, and medical history.
        </Typography>

        <Card sx={{ p: 4, mb: 4, textAlign: 'center', background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)' }}>
          <ScienceIcon sx={{ fontSize: 80, color: '#1565c0', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Your Cancer Risk Profile</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Run a new AI analysis to get your latest cancer risk prediction based on all available data.
          </Typography>
          <Button variant="contained" size="large" sx={{ background: 'linear-gradient(135deg, #1565c0, #0d47a1)', px: 6 }}>
            Run AI Analysis
          </Button>
        </Card>

        <Stack spacing={2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Cancer Types Monitored</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {['Lung', 'Breast', 'Colorectal', 'Prostate', 'Skin', 'Liver', 'Pancreatic', 'Kidney',
              'Bladder', 'Thyroid', 'Stomach', 'Ovarian', 'Cervical', 'Leukemia', 'Lymphoma', 'Brain'].map(type => (
              <Chip key={type} label={type} variant="outlined" sx={{ fontWeight: 500 }} />
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default CancerRiskPage;

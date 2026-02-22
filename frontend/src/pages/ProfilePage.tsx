import React, { useState } from 'react';
import {
  Box, Container, Typography, Card, CardContent, AppBar, Toolbar, IconButton,
  Stack, Chip, TextField, Button, Grid, Avatar, Divider,
} from '@mui/material';
import { ArrowBack, Person as PersonIcon, Save as SaveIcon, HealthAndSafety as HealthIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}><ArrowBack /></IconButton>
          <PersonIcon sx={{ color: '#1565c0', mr: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a237e', flex: 1 }}>Profile</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ p: 4 }}>
          <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: '#1565c0', fontSize: 32 }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>{user?.first_name} {user?.last_name}</Typography>
              <Typography variant="body1" color="text.secondary">{user?.email}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={user?.role?.replace('_', ' ').toUpperCase()} color="primary" size="small" />
                <Chip label={`Health ID: ${user?.health_id}`} variant="outlined" size="small" sx={{ fontWeight: 600 }} />
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" value={user?.first_name || ''} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" value={user?.last_name || ''} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" value={user?.email || ''} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Username" value={user?.username || ''} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={user?.phone_number || 'Not provided'} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Gender" value={user?.gender || 'Not provided'} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Health ID" value={user?.health_id || 'N/A'} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Role" value={user?.role?.replace('_', ' ').toUpperCase() || ''} disabled />
            </Grid>
          </Grid>

          <Card sx={{ p: 3, mt: 4, bgcolor: '#e8f5e9' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Your Unique Health ID</Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#2e7d32', letterSpacing: 3 }}>
              {user?.health_id || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This ID is your universal healthcare identifier. Share it with any hospital or doctor
              to give them access to your complete health records, past incidents, and medications.
            </Typography>
          </Card>
        </Card>
      </Container>
    </Box>
  );
};

export default ProfilePage;

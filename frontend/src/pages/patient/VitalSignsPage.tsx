import React, { useState } from 'react';
import {
  Box, Grid, Card, Typography, Stack, Chip, Button, Tabs, Tab,
  TextField, Alert, Divider,
} from '@mui/material';
import {
  MonitorHeart, Favorite, Thermostat, Opacity, Speed, Height,
  MonitorWeight, TrendingUp, TrendingDown, Add, History,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, AreaChart, Area } from 'recharts';
import AppLayout from '../../components/common/AppLayout';
import { patientNavItems } from './PatientDashboard';
import { StatCard, MetricGauge } from '../../components/common/SharedComponents';

const VitalSignsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const vitals = [
    { name: 'Heart Rate', value: 72, unit: 'bpm', icon: <Favorite />, color: '#c62828', normal: '60-100', trend: 'stable', history: Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, value: 65 + Math.floor(Math.random() * 20) })) },
    { name: 'Blood Pressure', value: '120/80', unit: 'mmHg', icon: <Speed />, color: '#1565c0', normal: '< 120/80', trend: 'improving', history: Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, value: 110 + Math.floor(Math.random() * 20) })) },
    { name: 'Temperature', value: 98.6, unit: '°F', icon: <Thermostat />, color: '#f57c00', normal: '97-99', trend: 'stable', history: Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, value: 97.5 + Math.random() * 2 })) },
    { name: 'SpO2', value: 98, unit: '%', icon: <Opacity />, color: '#2e7d32', normal: '95-100', trend: 'stable', history: Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, value: 95 + Math.floor(Math.random() * 4) })) },
    { name: 'Respiratory Rate', value: 16, unit: 'breaths/min', icon: <MonitorHeart />, color: '#7b1fa2', normal: '12-20', trend: 'stable', history: Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, value: 14 + Math.floor(Math.random() * 6) })) },
    { name: 'Weight', value: 165, unit: 'lbs', icon: <MonitorWeight />, color: '#00897b', normal: 'BMI 18.5-24.9', trend: 'decreasing', history: Array.from({ length: 7 }, (_, i) => ({ day: `D${i + 1}`, value: 167 - i * 0.3 })) },
  ];

  return (
    <AppLayout title="Vital Signs" subtitle="Monitor and track your vital signs" navItems={patientNavItems} portalType="patient">
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {vitals.map((v) => (
          <Grid item xs={6} sm={4} md={2} key={v.name}>
            <Card sx={{ p: 2, textAlign: 'center', borderTop: `3px solid ${v.color}`, transition: 'all 0.2s', '&:hover': { boxShadow: 4 } }}>
              <Box sx={{ color: v.color, mb: 0.5 }}>{v.icon}</Box>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: v.color }}>{v.value}</Typography>
              <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{v.unit}</Typography>
              <Typography sx={{ fontSize: 10, fontWeight: 600 }}>{v.name}</Typography>
              <Chip
                label={v.trend}
                size="small"
                icon={v.trend === 'improving' ? <TrendingUp sx={{ fontSize: 12 }} /> : v.trend === 'decreasing' ? <TrendingDown sx={{ fontSize: 12 }} /> : undefined}
                sx={{ fontSize: 9, height: 20, mt: 0.5 }}
                color={v.trend === 'improving' ? 'success' : 'default'}
              />
            </Card>
          </Grid>
        ))}
      </Grid>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
        <Tab label="Trends" />
        <Tab label="Log Entry" />
        <Tab label="Alerts" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={2}>
          {vitals.map((v) => (
            <Grid item xs={12} md={6} key={v.name}>
              <Card sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{v.name} Trend</Typography>
                  <Chip label={`Normal: ${v.normal}`} size="small" sx={{ fontSize: 10 }} color="info" variant="outlined" />
                </Stack>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={v.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RTooltip />
                    <Area type="monotone" dataKey="value" stroke={v.color} fill={`${v.color}30`} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {activeTab === 1 && (
        <Card sx={{ p: 3, maxWidth: 600 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 2 }}>Manual Vital Signs Entry</Typography>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}><TextField label="Heart Rate (bpm)" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={3}><TextField label="Systolic" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={3}><TextField label="Diastolic" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Temperature (°F)" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="SpO2 (%)" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Respiratory Rate" type="number" fullWidth size="small" /></Grid>
              <Grid item xs={6}><TextField label="Weight (lbs)" type="number" fullWidth size="small" /></Grid>
            </Grid>
            <TextField label="Notes" multiline rows={2} fullWidth size="small" />
            <TextField label="Date & Time" type="datetime-local" fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <Button variant="contained" startIcon={<Add />}>Save Vital Signs</Button>
          </Stack>
        </Card>
      )}

      {activeTab === 2 && (
        <Stack spacing={2}>
          <Alert severity="success">All vital signs are within normal range.</Alert>
          <Alert severity="info">Your blood pressure has been improving over the last 30 days. Great work!</Alert>
          <Alert severity="warning">Weight trend shows gradual decrease. Ensure this is intentional and healthy.</Alert>
          <Card sx={{ p: 2 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>Alert Configuration</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>You will be notified when any vital sign goes outside normal range.</Typography>
          </Card>
        </Stack>
      )}
    </AppLayout>
  );
};

export default VitalSignsPage;

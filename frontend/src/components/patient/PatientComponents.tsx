// ============================================================================
// Patient Dashboard Components - Health monitoring, appointments, medications
// ============================================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Avatar, Chip, IconButton,
  Grid, Stack, Badge, Tooltip, LinearProgress, Divider,
  Card, CardContent, CardHeader, List, ListItem, ListItemAvatar,
  ListItemText, ListItemSecondaryAction, Tab, Tabs, Alert,
  CircularProgress, alpha, useTheme, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Rating, Switch, FormControlLabel,
} from '@mui/material';
import {
  Favorite, MonitorHeart, Thermostat, Opacity, Speed,
  DirectionsRun, AccessTime, CalendarMonth, Medication,
  LocalHospital, Warning, TrendingUp, TrendingDown,
  ArrowForward, MoreVert, Refresh, Schedule, VideoCall,
  Phone, LocationOn, Person, Star, CheckCircle, Cancel,
  FitnessCenter, Restaurant, WaterDrop, Bedtime, Psychology,
  Timeline as TimelineIcon, BarChart, PieChart, ShowChart,
  Notifications, NavigateNext, NavigateBefore, Today,
  EmojiEvents, SentimentSatisfied, SentimentDissatisfied,
  LocalPharmacy, Science, Vaccines, BloodtypeOutlined,
  MedicalInformation, HealthAndSafety, AirlineSeatFlat,
  Edit, Add, Download, Share, Print, FilterAlt,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// HEALTH SUMMARY CARD
// ============================================================================
interface VitalSign {
  label: string;
  value: string | number;
  unit: string;
  icon: React.ReactNode;
  status: 'normal' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  range?: string;
  lastUpdated?: string;
}

interface HealthSummaryCardProps {
  vitals: VitalSign[];
  overallScore?: number;
  lastCheckup?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  vitals, overallScore = 85, lastCheckup, onRefresh, loading,
}) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return theme.palette.success.main;
      case 'warning': return theme.palette.warning.main;
      case 'critical': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.success.main, 0.02)})`,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Health Summary</Typography>
          {lastCheckup && (
            <Typography variant="caption" color="text.secondary">
              Last checkup: {lastCheckup}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {onRefresh && (
            <IconButton size="small" onClick={onRefresh} disabled={loading}>
              <Refresh />
            </IconButton>
          )}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={overallScore}
              size={60}
              thickness={4}
              sx={{ color: getScoreColor(overallScore) }}
            />
            <Box
              sx={{
                top: 0, left: 0, bottom: 0, right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" fontWeight={700} color={getScoreColor(overallScore)}>
                {overallScore}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {vitals.map((vital, index) => (
          <Grid item xs={6} sm={4} md={3} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(getStatusColor(vital.status), 0.3)}`,
                  bgcolor: alpha(getStatusColor(vital.status), 0.03),
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(getStatusColor(vital.status), 0.15)}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ color: getStatusColor(vital.status) }}>{vital.icon}</Box>
                  {vital.trend && (
                    <Chip
                      size="small"
                      icon={vital.trend === 'up' ? <TrendingUp /> : vital.trend === 'down' ? <TrendingDown /> : undefined}
                      label={vital.trend}
                      sx={{
                        height: 20,
                        fontSize: '0.65rem',
                        bgcolor: alpha(getStatusColor(vital.status), 0.1),
                        color: getStatusColor(vital.status),
                      }}
                    />
                  )}
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  {vital.value} <Typography component="span" variant="caption" color="text.secondary">{vital.unit}</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">{vital.label}</Typography>
                {vital.range && (
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontSize: '0.65rem' }}>
                    Normal: {vital.range}
                  </Typography>
                )}
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

// ============================================================================
// VITAL SIGNS MONITOR
// ============================================================================
interface VitalReading {
  time: string;
  value: number;
}

interface VitalSignsMonitorProps {
  heartRate?: VitalReading[];
  bloodPressureSystolic?: VitalReading[];
  bloodPressureDiastolic?: VitalReading[];
  temperature?: VitalReading[];
  oxygen?: VitalReading[];
  respiratoryRate?: VitalReading[];
  realtime?: boolean;
  compact?: boolean;
}

export const VitalSignsMonitor: React.FC<VitalSignsMonitorProps> = ({
  heartRate = [], bloodPressureSystolic = [], bloodPressureDiastolic = [],
  temperature = [], oxygen = [], respiratoryRate = [],
  realtime = false, compact = false,
}) => {
  const theme = useTheme();
  const [activeVital, setActiveVital] = useState('heartRate');

  const vitalConfigs = [
    { key: 'heartRate', label: 'Heart Rate', icon: <Favorite />, unit: 'BPM', color: '#e53935', data: heartRate, range: '60-100' },
    { key: 'bp', label: 'Blood Pressure', icon: <MonitorHeart />, unit: 'mmHg', color: '#1e88e5', data: bloodPressureSystolic, range: '120/80' },
    { key: 'temperature', label: 'Temperature', icon: <Thermostat />, unit: '°F', color: '#ff8f00', data: temperature, range: '97-99' },
    { key: 'oxygen', label: 'SpO2', icon: <Opacity />, unit: '%', color: '#43a047', data: oxygen, range: '95-100' },
    { key: 'respiratory', label: 'Resp. Rate', icon: <Speed />, unit: '/min', color: '#5e35b1', data: respiratoryRate, range: '12-20' },
  ];

  const activeConfig = vitalConfigs.find((v) => v.key === activeVital) || vitalConfigs[0];
  const latestValue = activeConfig.data.length > 0 ? activeConfig.data[activeConfig.data.length - 1].value : 0;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
      <Box sx={{ p: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Vital Signs {realtime && (
              <Chip size="small" label="LIVE" color="error" sx={{ ml: 1, height: 20, fontSize: '0.65rem', animation: 'pulse 2s infinite' }} />
            )}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} sx={{ overflow: 'auto', pb: 1 }}>
          {vitalConfigs.map((config) => (
            <Chip
              key={config.key}
              icon={config.icon}
              label={compact ? '' : config.label}
              onClick={() => setActiveVital(config.key)}
              sx={{
                bgcolor: activeVital === config.key ? alpha(config.color, 0.15) : 'transparent',
                color: activeVital === config.key ? config.color : 'text.secondary',
                border: `1px solid ${activeVital === config.key ? config.color : theme.palette.divider}`,
                fontWeight: activeVital === config.key ? 700 : 400,
                '&:hover': { bgcolor: alpha(config.color, 0.1) },
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <motion.div key={activeVital} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <Typography
              variant="h2"
              fontWeight={800}
              sx={{ color: activeConfig.color, lineHeight: 1 }}
            >
              {latestValue}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeConfig.unit} · Normal: {activeConfig.range}
            </Typography>
          </motion.div>
        </Box>

        {/* Mini chart placeholder */}
        <Box
          sx={{
            height: 120,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 0.5,
            mt: 2,
          }}
        >
          {activeConfig.data.slice(-24).map((reading, i) => {
            const maxVal = Math.max(...activeConfig.data.map((d) => d.value));
            const minVal = Math.min(...activeConfig.data.map((d) => d.value));
            const range = maxVal - minVal || 1;
            const height = ((reading.value - minVal) / range) * 100;
            return (
              <Tooltip key={i} title={`${reading.value} ${activeConfig.unit} at ${reading.time}`}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 5)}%` }}
                  transition={{ delay: i * 0.02, type: 'spring' }}
                  style={{
                    flex: 1,
                    minWidth: 4,
                    maxWidth: 16,
                    backgroundColor: alpha(activeConfig.color, 0.6 + (i / activeConfig.data.length) * 0.4),
                    borderRadius: 2,
                    cursor: 'pointer',
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
};

// ============================================================================
// MEDICATION TRACKER
// ============================================================================
interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string[];
  taken?: boolean[];
  prescribedBy?: string;
  startDate?: string;
  endDate?: string;
  refillsLeft?: number;
  sideEffects?: string[];
  instructions?: string;
}

interface MedicationTrackerProps {
  medications: MedicationItem[];
  onTakeMedication?: (id: string, timeIndex: number) => void;
  onRequestRefill?: (id: string) => void;
  compact?: boolean;
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({
  medications, onTakeMedication, onRequestRefill, compact = false,
}) => {
  const theme = useTheme();
  const [selectedMed, setSelectedMed] = useState<MedicationItem | null>(null);

  const takenCount = medications.reduce((acc, med) => acc + (med.taken?.filter(Boolean).length || 0), 0);
  const totalDoses = medications.reduce((acc, med) => acc + (med.time?.length || 0), 0);
  const adherence = totalDoses > 0 ? (takenCount / totalDoses) * 100 : 0;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Medications</Typography>
          <Typography variant="caption" color="text.secondary">
            {takenCount}/{totalDoses} doses taken today
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" fontWeight={700} color={adherence >= 80 ? 'success.main' : 'warning.main'}>
            {adherence.toFixed(0)}%
          </Typography>
          <Typography variant="caption" color="text.secondary">Adherence</Typography>
        </Box>
      </Box>

      <LinearProgress
        variant="determinate"
        value={adherence}
        sx={{
          height: 4,
          bgcolor: alpha(theme.palette.success.main, 0.1),
          '& .MuiLinearProgress-bar': {
            bgcolor: adherence >= 80 ? 'success.main' : 'warning.main',
          },
        }}
      />

      <List sx={{ p: 0 }}>
        {medications.map((med, index) => (
          <motion.div
            key={med.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <ListItem
              sx={{
                py: 1.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
              }}
              onClick={() => setSelectedMed(med)}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                  }}
                >
                  <Medication />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={600}>{med.name}</Typography>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {med.dosage} · {med.frequency}
                    </Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                      {med.time.map((t, i) => (
                        <Chip
                          key={i}
                          size="small"
                          label={t}
                          icon={med.taken?.[i] ? <CheckCircle /> : <AccessTime />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onTakeMedication?.(med.id, i);
                          }}
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            bgcolor: med.taken?.[i] ? alpha(theme.palette.success.main, 0.1) : 'transparent',
                            color: med.taken?.[i] ? theme.palette.success.main : 'text.secondary',
                            border: `1px solid ${med.taken?.[i] ? theme.palette.success.main : theme.palette.divider}`,
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                {med.refillsLeft !== undefined && med.refillsLeft <= 2 && (
                  <Tooltip title={`${med.refillsLeft} refills left`}>
                    <Chip
                      size="small"
                      label={`${med.refillsLeft} refills`}
                      color="warning"
                      sx={{ height: 22, fontSize: '0.65rem' }}
                    />
                  </Tooltip>
                )}
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </motion.div>
        ))}
      </List>

      {/* Medication Detail Dialog */}
      <Dialog open={!!selectedMed} onClose={() => setSelectedMed(null)} maxWidth="sm" fullWidth>
        {selectedMed && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight={700}>{selectedMed.name}</Typography>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Dosage</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedMed.dosage}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Frequency</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedMed.frequency}</Typography>
                </Grid>
                {selectedMed.prescribedBy && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Prescribed By</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedMed.prescribedBy}</Typography>
                  </Grid>
                )}
                {selectedMed.refillsLeft !== undefined && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Refills Left</Typography>
                    <Typography variant="body2" fontWeight={600}>{selectedMed.refillsLeft}</Typography>
                  </Grid>
                )}
                {selectedMed.instructions && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Instructions</Typography>
                    <Typography variant="body2">{selectedMed.instructions}</Typography>
                  </Grid>
                )}
                {selectedMed.sideEffects && selectedMed.sideEffects.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Possible Side Effects</Typography>
                    <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                      {selectedMed.sideEffects.map((se) => (
                        <Chip key={se} label={se} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              {onRequestRefill && selectedMed.refillsLeft !== undefined && selectedMed.refillsLeft <= 2 && (
                <Button onClick={() => onRequestRefill(selectedMed.id)} variant="contained" size="small">
                  Request Refill
                </Button>
              )}
              <Button onClick={() => setSelectedMed(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

// ============================================================================
// APPOINTMENT CALENDAR
// ============================================================================
interface AppointmentItem {
  id: string;
  title: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'phone';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
  avatar?: string;
}

interface AppointmentCalendarProps {
  appointments: AppointmentItem[];
  onBookAppointment?: () => void;
  onCancelAppointment?: (id: string) => void;
  onJoinCall?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  appointments, onBookAppointment, onCancelAppointment, onJoinCall, onReschedule,
}) => {
  const theme = useTheme();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppt, setSelectedAppt] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCall />;
      case 'phone': return <Phone />;
      default: return <LocationOn />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return theme.palette.info.main;
      case 'confirmed': return theme.palette.success.main;
      case 'completed': return theme.palette.grey[500];
      case 'cancelled': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const sortedAppointments = [...appointments].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const upcomingAppts = sortedAppointments.filter(
    (a) => a.status !== 'completed' && a.status !== 'cancelled'
  );
  const pastAppts = sortedAppointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled'
  );
  const displayedAppts = view === 'upcoming' ? upcomingAppts : pastAppts;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Appointments</Typography>
          {onBookAppointment && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={onBookAppointment}
              sx={{ borderRadius: 2 }}
            >
              Book
            </Button>
          )}
        </Box>

        <Tabs value={view} onChange={(_, v) => setView(v)} sx={{ mb: 2, minHeight: 36 }}>
          <Tab value="upcoming" label={`Upcoming (${upcomingAppts.length})`} sx={{ minHeight: 36, py: 0.5 }} />
          <Tab value="past" label={`Past (${pastAppts.length})`} sx={{ minHeight: 36, py: 0.5 }} />
        </Tabs>
      </Box>

      {displayedAppts.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <CalendarMonth sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No {view} appointments
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {displayedAppts.map((appt, index) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ListItem
                sx={{
                  px: 2,
                  py: 1.5,
                  borderLeft: `3px solid ${getStatusColor(appt.status)}`,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={appt.avatar} sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight={600}>{appt.title}</Typography>
                      <Chip
                        size="small"
                        icon={getTypeIcon(appt.type)}
                        label={appt.type}
                        sx={{ height: 20, fontSize: '0.6rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Dr. {appt.doctor} · {appt.specialty}
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {appt.date} at {appt.time} {appt.location && `· ${appt.location}`}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={0.5}>
                    {appt.type === 'video' && appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <Tooltip title="Join Video Call">
                        <IconButton size="small" color="primary" onClick={() => onJoinCall?.(appt.id)}>
                          <VideoCall />
                        </IconButton>
                      </Tooltip>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedAppt(appt.id);
                      }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </motion.div>
          ))}
        </List>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => { onReschedule?.(selectedAppt!); setAnchorEl(null); }}>
          <Schedule sx={{ mr: 1, fontSize: 18 }} /> Reschedule
        </MenuItem>
        <MenuItem
          onClick={() => { onCancelAppointment?.(selectedAppt!); setAnchorEl(null); }}
          sx={{ color: 'error.main' }}
        >
          <Cancel sx={{ mr: 1, fontSize: 18 }} /> Cancel
        </MenuItem>
      </Menu>
    </Paper>
  );
};

// ============================================================================
// RISK ASSESSMENT WIDGET
// ============================================================================
interface RiskFactor {
  name: string;
  level: 'low' | 'moderate' | 'high' | 'critical';
  score: number;
  description: string;
  modifiable: boolean;
  recommendations?: string[];
}

interface RiskAssessmentWidgetProps {
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number;
  riskFactors: RiskFactor[];
  cancerType?: string;
  lastAssessment?: string;
  onViewDetails?: () => void;
  onScheduleScreening?: () => void;
}

export const RiskAssessmentWidget: React.FC<RiskAssessmentWidgetProps> = ({
  overallRisk, riskScore, riskFactors, cancerType, lastAssessment,
  onViewDetails, onScheduleScreening,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const riskColors = {
    low: { main: '#4caf50', bg: '#e8f5e9' },
    moderate: { main: '#ff9800', bg: '#fff3e0' },
    high: { main: '#f44336', bg: '#ffebee' },
    critical: { main: '#b71c1c', bg: '#ffcdd2' },
  };

  const risk = riskColors[overallRisk];

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(risk.main, 0.3)}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2.5,
          background: `linear-gradient(135deg, ${alpha(risk.main, 0.05)}, ${alpha(risk.main, 0.1)})`,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">Cancer Risk Assessment</Typography>
            {cancerType && (
              <Typography variant="body2" fontWeight={600}>Type: {cancerType}</Typography>
            )}
          </Box>
          <Chip
            label={overallRisk.toUpperCase()}
            sx={{
              bgcolor: risk.main,
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={riskScore}
              size={80}
              thickness={5}
              sx={{ color: risk.main }}
            />
            <Box
              sx={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h5" fontWeight={800} sx={{ color: risk.main, lineHeight: 1 }}>
                {riskScore}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                / 100
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {riskFactors.filter((f) => f.modifiable).length} modifiable risk factors identified
            </Typography>
            {lastAssessment && (
              <Typography variant="caption" color="text.secondary">
                Last assessed: {lastAssessment}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Risk Factors List */}
      <Box sx={{ p: 2 }}>
        <Button
          size="small"
          onClick={() => setExpanded(!expanded)}
          endIcon={expanded ? <NavigateBefore sx={{ transform: 'rotate(90deg)' }} /> : <NavigateNext sx={{ transform: 'rotate(90deg)' }} />}
          sx={{ mb: 1 }}
        >
          {expanded ? 'Hide' : 'Show'} Risk Factors ({riskFactors.length})
        </Button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Stack spacing={1}>
                {riskFactors.map((factor, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${alpha(riskColors[factor.level].main, 0.2)}`,
                      bgcolor: alpha(riskColors[factor.level].main, 0.03),
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {factor.modifiable ? (
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <Warning sx={{ fontSize: 16, color: 'text.secondary' }} />
                        )}
                        <Typography variant="body2" fontWeight={600}>{factor.name}</Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={factor.level}
                        sx={{
                          height: 20,
                          fontSize: '0.6rem',
                          bgcolor: alpha(riskColors[factor.level].main, 0.1),
                          color: riskColors[factor.level].main,
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                      {factor.description}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      <Divider />
      <Box sx={{ p: 1.5, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {onViewDetails && (
          <Button size="small" onClick={onViewDetails}>View Details</Button>
        )}
        {onScheduleScreening && (
          <Button size="small" variant="contained" onClick={onScheduleScreening}>
            Schedule Screening
          </Button>
        )}
      </Box>
    </Paper>
  );
};

// ============================================================================
// QUICK ACTIONS
// ============================================================================
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  badge?: number;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  columns?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, columns = 4 }) => {
  const theme = useTheme();

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Quick Actions</Typography>
      <Grid container spacing={1.5}>
        {actions.map((action, index) => (
          <Grid item xs={12 / columns} key={action.id}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Paper
                onClick={action.disabled ? undefined : action.onClick}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  cursor: action.disabled ? 'default' : 'pointer',
                  opacity: action.disabled ? 0.5 : 1,
                  border: `1px solid ${theme.palette.divider}`,
                  transition: 'all 0.2s',
                  '&:hover': action.disabled ? {} : {
                    borderColor: action.color,
                    bgcolor: alpha(action.color, 0.04),
                    boxShadow: `0 4px 12px ${alpha(action.color, 0.15)}`,
                  },
                }}
              >
                <Badge badgeContent={action.badge} color="error" max={99}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: alpha(action.color, 0.1),
                      color: action.color,
                      mx: 'auto',
                    }}
                  >
                    {action.icon}
                  </Avatar>
                </Badge>
                <Typography variant="caption" display="block" fontWeight={600} sx={{ mt: 1 }}>
                  {action.label}
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

// ============================================================================
// WELLNESS TRACKER
// ============================================================================
interface WellnessData {
  date: string;
  exercise: number; // minutes
  water: number; // glasses
  sleep: number; // hours
  mood: number; // 1-5
  calories: number;
  steps: number;
}

interface WellnessTrackerProps {
  data: WellnessData[];
  goals?: {
    exercise: number;
    water: number;
    sleep: number;
    calories: number;
    steps: number;
  };
  onLogActivity?: () => void;
}

export const WellnessTracker: React.FC<WellnessTrackerProps> = ({
  data, goals = { exercise: 30, water: 8, sleep: 8, calories: 2000, steps: 10000 },
  onLogActivity,
}) => {
  const theme = useTheme();
  const today = data.length > 0 ? data[data.length - 1] : null;

  const categories = [
    { key: 'exercise', label: 'Exercise', icon: <FitnessCenter />, unit: 'min', value: today?.exercise || 0, goal: goals.exercise, color: '#e53935' },
    { key: 'water', label: 'Water', icon: <WaterDrop />, unit: 'glasses', value: today?.water || 0, goal: goals.water, color: '#1e88e5' },
    { key: 'sleep', label: 'Sleep', icon: <Bedtime />, unit: 'hrs', value: today?.sleep || 0, goal: goals.sleep, color: '#7b1fa2' },
    { key: 'calories', label: 'Calories', icon: <Restaurant />, unit: 'kcal', value: today?.calories || 0, goal: goals.calories, color: '#ff8f00' },
    { key: 'steps', label: 'Steps', icon: <DirectionsRun />, unit: '', value: today?.steps || 0, goal: goals.steps, color: '#43a047' },
  ];

  const getMoodEmoji = (mood: number) => {
    const emojis = ['😞', '😐', '🙂', '😊', '😄'];
    return emojis[Math.min(Math.max(mood - 1, 0), 4)];
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Wellness Tracker</Typography>
          <Typography variant="caption" color="text.secondary">Today's progress</Typography>
        </Box>
        {today && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4">{getMoodEmoji(today.mood)}</Typography>
            <Typography variant="caption" color="text.secondary">Mood</Typography>
          </Box>
        )}
      </Box>

      <Grid container spacing={1.5}>
        {categories.map((cat) => {
          const progress = Math.min((cat.value / cat.goal) * 100, 100);
          return (
            <Grid item xs={12} sm={6} key={cat.key}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(cat.color, 0.1), color: cat.color }}>
                  {cat.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" fontWeight={600}>{cat.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cat.value}/{cat.goal} {cat.unit}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      mt: 0.5,
                      bgcolor: alpha(cat.color, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        bgcolor: cat.color,
                      },
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {onLogActivity && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<Add />}
          onClick={onLogActivity}
          sx={{ mt: 2, borderRadius: 2, borderStyle: 'dashed' }}
        >
          Log Activity
        </Button>
      )}
    </Paper>
  );
};

// ============================================================================
// HEALTH TIMELINE
// ============================================================================
interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'appointment' | 'medication' | 'lab' | 'screening' | 'surgery' | 'diagnosis' | 'vaccination';
  important?: boolean;
  details?: Record<string, string>;
}

interface HealthTimelineProps {
  events: TimelineEvent[];
  maxVisible?: number;
  onViewAll?: () => void;
}

export const HealthTimeline: React.FC<HealthTimelineProps> = ({
  events, maxVisible = 5, onViewAll,
}) => {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);

  const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    appointment: { icon: <CalendarMonth />, color: '#1e88e5' },
    medication: { icon: <Medication />, color: '#43a047' },
    lab: { icon: <Science />, color: '#7b1fa2' },
    screening: { icon: <MedicalInformation />, color: '#e53935' },
    surgery: { icon: <LocalHospital />, color: '#f44336' },
    diagnosis: { icon: <HealthAndSafety />, color: '#ff8f00' },
    vaccination: { icon: <Vaccines />, color: '#00897b' },
  };

  const visibleEvents = showAll ? events : events.slice(0, maxVisible);

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Health Timeline</Typography>

      {visibleEvents.map((event, index) => {
        const config = typeConfig[event.type] || typeConfig.appointment;
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Box sx={{ display: 'flex', gap: 2, position: 'relative', pb: 2 }}>
              {/* Timeline line */}
              {index < visibleEvents.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 17,
                    top: 40,
                    bottom: 0,
                    width: 2,
                    bgcolor: theme.palette.divider,
                  }}
                />
              )}

              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: alpha(config.color, 0.1),
                  color: config.color,
                  flexShrink: 0,
                }}
              >
                {config.icon}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {event.title}
                      {event.important && <Star sx={{ fontSize: 14, color: '#ff8f00', ml: 0.5, verticalAlign: 'middle' }} />}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{event.description}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                    {event.date}
                  </Typography>
                </Box>

                {event.details && (
                  <Box sx={{ mt: 0.5 }}>
                    {Object.entries(event.details).map(([key, value]) => (
                      <Typography key={key} variant="caption" color="text.secondary" display="block">
                        {key}: <strong>{value}</strong>
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </motion.div>
        );
      })}

      {events.length > maxVisible && (
        <Button
          size="small"
          fullWidth
          onClick={() => showAll ? (onViewAll ? onViewAll() : setShowAll(false)) : setShowAll(true)}
          sx={{ mt: 1 }}
        >
          {showAll ? 'View Less' : `View All (${events.length})`}
        </Button>
      )}
    </Paper>
  );
};

export default {
  HealthSummaryCard,
  VitalSignsMonitor,
  MedicationTracker,
  AppointmentCalendar,
  RiskAssessmentWidget,
  QuickActions,
  WellnessTracker,
  HealthTimeline,
};

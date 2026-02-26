import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, CardHeader, Avatar, IconButton,
  LinearProgress, Chip, Tooltip, Button, Divider, Badge, CircularProgress, useTheme,
  Fade, Grow, Slide, Zoom, Skeleton, Alert, AlertTitle, List, ListItem, ListItemText,
  ListItemIcon, ListItemAvatar, ListItemSecondaryAction, Tab, Tabs, Switch,
  FormControlLabel, Select, MenuItem, TextField, InputAdornment, Collapse,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, People, LocalHospital, Science, Assessment,
  MonitorHeart, Biotech, Medication, HealthAndSafety, EventNote, Notifications,
  Assignment, Speed, Timer, CalendarToday, AttachMoney, ArrowUpward, ArrowDownward,
  MoreVert, Refresh, FilterList, Search, Warning, CheckCircle, Error, Info,
  Favorite, AirlineSeatFlat, Bloodtype, Visibility, BarChart, PieChart,
  Timeline, BubbleChart, ShowChart, DonutLarge, AccountTree, Hub, WbSunny,
  NightsStay, AccessTime, PersonAdd, PersonRemove, GroupAdd, GroupRemove,
} from '@mui/icons-material';
import { keyframes, styled, css } from '@mui/system';

// ==================== Animations ====================
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const glowAnimation = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.6); }
`;

const countUpAnimation = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ==================== Styled Components ====================
const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  background: '#fff',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, #667eea, #764ba2)',
  },
}));

const GradientCard = styled(Paper)<{ gradient?: string }>(({ gradient }) => ({
  padding: 24,
  borderRadius: 20,
  background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff',
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.01)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
  },
}));

const AnimatedNumber = styled(Typography)({
  animation: `${countUpAnimation} 0.8s ease-out`,
});

const GlowBadge = styled(Badge)({
  '& .MuiBadge-badge': {
    animation: `${pulseAnimation} 2s ease-in-out infinite`,
  },
});

const ProgressBar = styled(LinearProgress)<{ barcolor?: string }>(({ barcolor }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: `${barcolor || '#667eea'}20`,
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    backgroundColor: barcolor || '#667eea',
  },
}));

// ==================== Types ====================
interface StatWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  gradient?: string;
  loading?: boolean;
  onClick?: () => void;
}

interface PatientStatProps {
  totalPatients: number;
  newPatients: number;
  activeConsults: number;
  criticalPatients: number;
  dischargedToday: number;
  averageStay: number;
}

interface RevenueWidgetProps {
  totalRevenue: number;
  monthlyGrowth: number;
  pendingBills: number;
  collectedToday: number;
}

interface SystemHealthProps {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  apiLatency: number;
  uptime: string;
  activeConnections: number;
  errorRate: number;
  requestsPerMinute: number;
}

interface CancerDetectionStats {
  totalScans: number;
  positiveDetections: number;
  falsePositiveRate: number;
  accuracy: number;
  avgProcessingTime: number;
  modelsInProduction: number;
  pendingReviews: number;
  confirmedCases: number;
}

// ==================== StatWidget Component ====================
export const StatWidget: React.FC<StatWidgetProps> = ({
  title, value, subtitle, icon, trend, color = '#667eea', gradient, loading, onClick,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (typeof value === 'number') {
      let start = 0;
      const end = value;
      const duration = 1500;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setAnimatedValue(end);
          clearInterval(timer);
        } else {
          setAnimatedValue(Math.round(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [value]);

  if (loading) {
    return (
      <StatsCard elevation={0}>
        <Skeleton variant="circular" width={48} height={48} />
        <Skeleton width="60%" height={24} sx={{ mt: 2 }} />
        <Skeleton width="40%" height={36} sx={{ mt: 1 }} />
        <Skeleton width="80%" height={20} sx={{ mt: 1 }} />
      </StatsCard>
    );
  }

  return (
    <Grow in timeout={600}>
      <StatsCard elevation={0} onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              {title}
            </Typography>
            <AnimatedNumber variant="h4" fontWeight={800} sx={{ mt: 1, color }}>
              {typeof value === 'number' ? animatedValue.toLocaleString() : value}
            </AnimatedNumber>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}15`,
              color,
              width: 52,
              height: 52,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 0.5 }}>
            {trend.isPositive ? (
              <ArrowUpward sx={{ fontSize: 16, color: '#4CAF50' }} />
            ) : (
              <ArrowDownward sx={{ fontSize: 16, color: '#F44336' }} />
            )}
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ color: trend.isPositive ? '#4CAF50' : '#F44336' }}
            >
              {trend.value}%
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
              vs last month
            </Typography>
          </Box>
        )}
      </StatsCard>
    </Grow>
  );
};

// ==================== Patient Overview Widget ====================
export const PatientOverviewWidget: React.FC<PatientStatProps> = (props) => {
  const stats = [
    { label: 'Total Patients', value: props.totalPatients, icon: <People />, color: '#667eea', trend: 12 },
    { label: 'New Today', value: props.newPatients, icon: <PersonAdd />, color: '#4CAF50', trend: 8 },
    { label: 'Active Consults', value: props.activeConsults, icon: <LocalHospital />, color: '#FF9800', trend: -3 },
    { label: 'Critical', value: props.criticalPatients, icon: <Warning />, color: '#F44336', trend: -15 },
  ];

  return (
    <Fade in timeout={800}>
      <Paper sx={{ p: 3, borderRadius: 4, background: '#fff' }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Patient Overview</Typography>
          <IconButton size="small"><Refresh /></IconButton>
        </Box>
        <Grid container spacing={2}>
          {stats.map((stat, idx) => (
            <Grid item xs={6} key={idx}>
              <Box sx={{
                p: 2, borderRadius: 3, backgroundColor: `${stat.color}08`,
                transition: 'all 0.3s', '&:hover': { backgroundColor: `${stat.color}15`, transform: 'scale(1.02)' },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Avatar sx={{ bgcolor: `${stat.color}20`, color: stat.color, width: 36, height: 36 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
                <Typography variant="h5" fontWeight={800} color={stat.color}>
                  {stat.value.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  {stat.trend >= 0 ? (
                    <TrendingUp sx={{ fontSize: 14, color: '#4CAF50' }} />
                  ) : (
                    <TrendingDown sx={{ fontSize: 14, color: '#F44336' }} />
                  )}
                  <Typography variant="caption" sx={{ color: stat.trend >= 0 ? '#4CAF50' : '#F44336', fontWeight: 600 }}>
                    {Math.abs(stat.trend)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} color="#2196F3">
              {props.dischargedToday}
            </Typography>
            <Typography variant="caption" color="text.secondary">Discharged Today</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} color="#9C27B0">
              {props.averageStay} days
            </Typography>
            <Typography variant="caption" color="text.secondary">Avg. Stay</Typography>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

// ==================== Cancer Detection Stats Widget ====================
export const CancerDetectionWidget: React.FC<CancerDetectionStats> = (props) => {
  return (
    <Fade in timeout={1000}>
      <GradientCard gradient="linear-gradient(135deg, #E91E63 0%, #9C27B0 100%)" elevation={0}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Cancer Detection AI</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Real-time analytics</Typography>
            </Box>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
              <Biotech />
            </Avatar>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Total Scans</Typography>
                <Typography variant="h4" fontWeight={800}>{props.totalScans.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Accuracy</Typography>
                <Typography variant="h5" fontWeight={700}>{props.accuracy}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={props.accuracy}
                  sx={{
                    mt: 0.5, height: 6, borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#fff', borderRadius: 3 },
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Positive Detections</Typography>
                <Typography variant="h4" fontWeight={800}>{props.positiveDetections}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>False Positive Rate</Typography>
                <Typography variant="h5" fontWeight={700}>{props.falsePositiveRate}%</Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.2)' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>Avg Processing</Typography>
              <Typography variant="h6" fontWeight={700}>{props.avgProcessingTime}s</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>Models Active</Typography>
              <Typography variant="h6" fontWeight={700}>{props.modelsInProduction}</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>Pending Review</Typography>
              <GlowBadge badgeContent={props.pendingReviews} color="error">
                <Typography variant="h6" fontWeight={700}>{props.confirmedCases}</Typography>
              </GlowBadge>
            </Box>
          </Box>
        </Box>
      </GradientCard>
    </Fade>
  );
};

// ==================== System Health Widget ====================
export const SystemHealthWidget: React.FC<SystemHealthProps> = (props) => {
  const getHealthColor = (value: number) => {
    if (value < 50) return '#4CAF50';
    if (value < 80) return '#FF9800';
    return '#F44336';
  };

  const metrics = [
    { label: 'CPU Usage', value: props.cpuUsage, icon: <Speed />, suffix: '%' },
    { label: 'Memory', value: props.memoryUsage, icon: <Hub />, suffix: '%' },
    { label: 'Disk', value: props.diskUsage, icon: <DonutLarge />, suffix: '%' },
    { label: 'API Latency', value: props.apiLatency, icon: <Timer />, suffix: 'ms', threshold: 200 },
  ];

  return (
    <Fade in timeout={1200}>
      <Paper sx={{ p: 3, borderRadius: 4 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>System Health</Typography>
            <Typography variant="body2" color="text.secondary">
              Uptime: {props.uptime}
            </Typography>
          </Box>
          <Chip
            label={props.errorRate < 1 ? 'Healthy' : 'Degraded'}
            color={props.errorRate < 1 ? 'success' : 'warning'}
            size="small"
            icon={props.errorRate < 1 ? <CheckCircle /> : <Warning />}
          />
        </Box>

        <Grid container spacing={2}>
          {metrics.map((metric, idx) => (
            <Grid item xs={6} key={idx}>
              <Box sx={{
                p: 2, borderRadius: 3, backgroundColor: '#F8F9FA',
                transition: 'all 0.3s', '&:hover': { backgroundColor: '#F0F2F5' },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ color: getHealthColor(metric.value) }}>{metric.icon}</Box>
                  <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: getHealthColor(metric.value) }}>
                  {metric.value}{metric.suffix}
                </Typography>
                <ProgressBar
                  variant="determinate"
                  value={metric.label === 'API Latency' ? Math.min((metric.value / 500) * 100, 100) : metric.value}
                  barcolor={getHealthColor(metric.value)}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} color="#2196F3">
              {props.activeConnections}
            </Typography>
            <Typography variant="caption" color="text.secondary">Active Connections</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} color={props.errorRate < 1 ? '#4CAF50' : '#F44336'}>
              {props.errorRate}%
            </Typography>
            <Typography variant="caption" color="text.secondary">Error Rate</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" fontWeight={700} color="#9C27B0">
              {props.requestsPerMinute}
            </Typography>
            <Typography variant="caption" color="text.secondary">Requests/min</Typography>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

// ==================== Revenue Widget ====================
export const RevenueWidget: React.FC<RevenueWidgetProps> = (props) => {
  return (
    <Fade in timeout={800}>
      <GradientCard gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" elevation={0}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>Revenue</Typography>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <AttachMoney />
            </Avatar>
          </Box>
          <Typography variant="h3" fontWeight={800}>
            ${props.totalRevenue.toLocaleString()}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 0.5 }}>
            <TrendingUp sx={{ fontSize: 18 }} />
            <Typography variant="body2" fontWeight={600}>
              {props.monthlyGrowth}% growth
            </Typography>
          </Box>
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.3)' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Pending Bills</Typography>
              <Typography variant="h6" fontWeight={700}>${props.pendingBills.toLocaleString()}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Collected Today</Typography>
              <Typography variant="h6" fontWeight={700}>${props.collectedToday.toLocaleString()}</Typography>
            </Box>
          </Box>
        </Box>
      </GradientCard>
    </Fade>
  );
};

// ==================== Appointment Timeline Widget ====================
export const AppointmentTimelineWidget: React.FC = () => {
  const appointments = [
    { time: '9:00 AM', patient: 'Jane Cooper', type: 'Consultation', status: 'completed', color: '#4CAF50' },
    { time: '10:30 AM', patient: 'Robert Fox', type: 'Follow-up', status: 'completed', color: '#4CAF50' },
    { time: '11:00 AM', patient: 'Emily Williams', type: 'Lab Review', status: 'in_progress', color: '#FF9800' },
    { time: '2:00 PM', patient: 'Michael Johnson', type: 'Imaging', status: 'upcoming', color: '#2196F3' },
    { time: '3:30 PM', patient: 'Sarah Davis', type: 'Chemo Session', status: 'upcoming', color: '#2196F3' },
    { time: '4:00 PM', patient: 'David Wilson', type: 'Post-Op Check', status: 'upcoming', color: '#2196F3' },
  ];

  return (
    <Fade in timeout={1000}>
      <Paper sx={{ p: 3, borderRadius: 4 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Today's Appointments</Typography>
          <Chip label={`${appointments.length} total`} size="small" color="primary" variant="outlined" />
        </Box>

        <List sx={{ p: 0 }}>
          {appointments.map((apt, idx) => (
            <React.Fragment key={idx}>
              <ListItem
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  transition: 'all 0.3s',
                  '&:hover': { backgroundColor: '#F8F9FA' },
                }}
              >
                <Box sx={{
                  width: 4, height: 40, borderRadius: 2,
                  backgroundColor: apt.color, mr: 2,
                }} />
                <ListItemText
                  primary={apt.patient}
                  secondary={`${apt.time} • ${apt.type}`}
                  primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                  secondaryTypographyProps={{ fontSize: 12 }}
                />
                <Chip
                  label={apt.status.replace('_', ' ')}
                  size="small"
                  sx={{
                    backgroundColor: `${apt.color}15`,
                    color: apt.color,
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: 'capitalize',
                  }}
                />
              </ListItem>
              {idx < appointments.length - 1 && <Divider variant="inset" />}
            </React.Fragment>
          ))}
        </List>

        <Button fullWidth variant="outlined" sx={{ mt: 2, borderRadius: 3 }}>
          View All Appointments
        </Button>
      </Paper>
    </Fade>
  );
};

// ==================== Notification Widget ====================
export const NotificationWidget: React.FC = () => {
  const notifications = [
    { id: 1, type: 'critical', title: 'Critical Lab Result', message: 'Abnormal blood markers detected for patient #4521', time: '5 min ago', icon: <Warning />, color: '#F44336' },
    { id: 2, type: 'warning', title: 'Medication Interaction', message: 'Potential drug interaction flagged for Patient #2103', time: '15 min ago', icon: <Medication />, color: '#FF9800' },
    { id: 3, type: 'info', title: 'New Scan Results', message: 'MRI results ready for review - 3 patients', time: '1 hour ago', icon: <Science />, color: '#2196F3' },
    { id: 4, type: 'success', title: 'Treatment Complete', message: 'Patient #3892 completed chemotherapy cycle', time: '2 hours ago', icon: <CheckCircle />, color: '#4CAF50' },
    { id: 5, type: 'info', title: 'AI Model Updated', message: 'Cancer detection model v2.1 deployed successfully', time: '3 hours ago', icon: <Biotech />, color: '#9C27B0' },
  ];

  return (
    <Fade in timeout={1400}>
      <Paper sx={{ p: 3, borderRadius: 4 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Notifications</Typography>
          <GlowBadge badgeContent={notifications.filter(n => n.type === 'critical').length} color="error">
            <Notifications />
          </GlowBadge>
        </Box>

        {notifications.map((notification) => (
          <Box
            key={notification.id}
            sx={{
              display: 'flex', alignItems: 'flex-start', p: 2, mb: 1,
              borderRadius: 3, transition: 'all 0.3s',
              borderLeft: `3px solid ${notification.color}`,
              '&:hover': { backgroundColor: '#F8F9FA' },
            }}
          >
            <Avatar sx={{ bgcolor: `${notification.color}15`, color: notification.color, width: 36, height: 36, mr: 2, mt: 0.5 }}>
              {notification.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>{notification.title}</Typography>
              <Typography variant="caption" color="text.secondary">{notification.message}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {notification.time}
              </Typography>
            </Box>
          </Box>
        ))}

        <Button fullWidth variant="text" sx={{ mt: 1 }}>
          View All Notifications
        </Button>
      </Paper>
    </Fade>
  );
};

// ==================== Quick Actions Widget ====================
export const QuickActionsWidget: React.FC = () => {
  const actions = [
    { label: 'New Patient', icon: <PersonAdd />, color: '#4CAF50', gradient: 'linear-gradient(135deg, #4CAF50, #66BB6A)' },
    { label: 'Schedule', icon: <EventNote />, color: '#2196F3', gradient: 'linear-gradient(135deg, #2196F3, #42A5F5)' },
    { label: 'Lab Order', icon: <Science />, color: '#FF9800', gradient: 'linear-gradient(135deg, #FF9800, #FFB74D)' },
    { label: 'AI Scan', icon: <Biotech />, color: '#9C27B0', gradient: 'linear-gradient(135deg, #9C27B0, #BA68C8)' },
    { label: 'Reports', icon: <Assessment />, color: '#E91E63', gradient: 'linear-gradient(135deg, #E91E63, #F06292)' },
    { label: 'Messages', icon: <Notifications />, color: '#00BCD4', gradient: 'linear-gradient(135deg, #00BCD4, #4DD0E1)' },
  ];

  return (
    <Fade in timeout={600}>
      <Paper sx={{ p: 3, borderRadius: 4 }} elevation={0}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          {actions.map((action, idx) => (
            <Grid item xs={4} key={idx}>
              <Box
                sx={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  p: 2, borderRadius: 3, cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    background: action.gradient,
                    '& .MuiAvatar-root': { bgcolor: 'rgba(255,255,255,0.3)', color: '#fff' },
                    '& .MuiTypography-root': { color: '#fff' },
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Avatar sx={{ bgcolor: `${action.color}15`, color: action.color, mb: 1, width: 48, height: 48 }}>
                  {action.icon}
                </Avatar>
                <Typography variant="caption" fontWeight={600} color="text.secondary" textAlign="center">
                  {action.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Fade>
  );
};

// ==================== Active Treatments Widget ====================
export const ActiveTreatmentsWidget: React.FC = () => {
  const treatments = [
    { patient: 'Jane Cooper', treatment: 'Chemotherapy - Cycle 4/6', progress: 67, nextSession: 'Mar 5', cancerType: 'Breast', status: 'on_track' },
    { patient: 'Robert Fox', treatment: 'Radiation Therapy - Week 3/5', progress: 60, nextSession: 'Mar 1', cancerType: 'Lung', status: 'on_track' },
    { patient: 'Emily Williams', treatment: 'Immunotherapy - Month 2/12', progress: 17, nextSession: 'Mar 15', cancerType: 'Melanoma', status: 'monitoring' },
    { patient: 'Michael Johnson', treatment: 'Post-Surgery Recovery', progress: 85, nextSession: 'Mar 10', cancerType: 'Colon', status: 'ahead' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return '#4CAF50';
      case 'monitoring': return '#FF9800';
      case 'ahead': return '#2196F3';
      case 'behind': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <Fade in timeout={1200}>
      <Paper sx={{ p: 3, borderRadius: 4 }} elevation={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Active Treatments</Typography>
          <Chip label={`${treatments.length} patients`} size="small" color="primary" variant="outlined" />
        </Box>

        {treatments.map((treatment, idx) => (
          <Box key={idx} sx={{
            p: 2, mb: 1.5, borderRadius: 3, backgroundColor: '#F8F9FA',
            transition: 'all 0.3s', '&:hover': { backgroundColor: '#F0F2F5', transform: 'translateX(4px)' },
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{treatment.patient}</Typography>
                <Typography variant="caption" color="text.secondary">{treatment.treatment}</Typography>
              </Box>
              <Chip
                label={treatment.status.replace('_', ' ')}
                size="small"
                sx={{
                  backgroundColor: `${getStatusColor(treatment.status)}15`,
                  color: getStatusColor(treatment.status),
                  fontWeight: 600,
                  fontSize: 10,
                  textTransform: 'capitalize',
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={treatment.progress}
                sx={{
                  flex: 1, height: 6, borderRadius: 3,
                  backgroundColor: `${getStatusColor(treatment.status)}20`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: getStatusColor(treatment.status),
                    borderRadius: 3,
                  },
                }}
              />
              <Typography variant="caption" fontWeight={700} color={getStatusColor(treatment.status)}>
                {treatment.progress}%
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Chip
                label={treatment.cancerType}
                size="small"
                variant="outlined"
                sx={{ fontSize: 10, height: 20 }}
              />
              <Typography variant="caption" color="text.secondary">
                Next: {treatment.nextSession}
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>
    </Fade>
  );
};

// ==================== Export All ====================
export default {
  StatWidget,
  PatientOverviewWidget,
  CancerDetectionWidget,
  SystemHealthWidget,
  RevenueWidget,
  AppointmentTimelineWidget,
  NotificationWidget,
  QuickActionsWidget,
  ActiveTreatmentsWidget,
};

// ============================================================================
// Hospital Dashboard Components - Staff management, analytics, operations
// ============================================================================
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Avatar, Chip, IconButton,
  Grid, Stack, Badge, Tooltip, LinearProgress, Divider,
  Card, CardContent, CardHeader, List, ListItem, ListItemAvatar,
  ListItemText, ListItemSecondaryAction, Tab, Tabs, Alert,
  CircularProgress, alpha, useTheme, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, FormControl, InputLabel, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, Drawer, Collapse,
} from '@mui/material';
import {
  People, LocalHospital, CalendarMonth, TrendingUp,
  TrendingDown, Assessment, Bed, MedicalServices,
  Warning, Error as ErrorIcon, CheckCircle, Schedule,
  Person, Phone, Email, MoreVert, Add, Search,
  FilterList, ArrowForward, ArrowUpward, ArrowDownward,
  Refresh, Download, Print, Share, BarChart, PieChart,
  Timeline as TimelineIcon, Speed, Visibility, Edit,
  Delete, Assignment, NotificationsActive, LocalShipping,
  Biotech, Healing, Psychology, Vaccines, Science,
  MonitorHeart, LocalHospital as Emergency, Star, StarBorder,
  ExpandMore, ExpandLess, Circle, Groups,
  AccessTime, DoNotDisturb, EventAvailable,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// STATS OVERVIEW
// ============================================================================
interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  onClick?: () => void;
}

interface StatsOverviewProps {
  stats: StatItem[];
  loading?: boolean;
  period?: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  stats, loading = false, period = 'Today',
}) => {
  const theme = useTheme();

  return (
    <Grid container spacing={2}>
      {stats.map((stat, index) => (
        <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Paper
              onClick={stat.onClick}
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                cursor: stat.onClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': stat.onClick ? {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(stat.color, 0.15)}`,
                  borderColor: stat.color,
                } : {},
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Avatar>
                {stat.change !== undefined && (
                  <Chip
                    size="small"
                    icon={stat.change > 0 ? <TrendingUp /> : stat.change < 0 ? <TrendingDown /> : undefined}
                    label={`${stat.change > 0 ? '+' : ''}${stat.change}%`}
                    sx={{
                      height: 22,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: alpha(stat.change > 0 ? '#4caf50' : stat.change < 0 ? '#f44336' : '#9e9e9e', 0.1),
                      color: stat.change > 0 ? '#4caf50' : stat.change < 0 ? '#f44336' : '#9e9e9e',
                    }}
                  />
                )}
              </Box>
              {loading ? (
                <Box>
                  <Box sx={{ height: 24, width: '60%', bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }} />
                  <Box sx={{ height: 14, width: '80%', bgcolor: 'action.hover', borderRadius: 1 }} />
                </Box>
              ) : (
                <>
                  <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {stat.label}
                  </Typography>
                </>
              )}
            </Paper>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
};

// ============================================================================
// PATIENT QUEUE
// ============================================================================
interface QueuePatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  reason: string;
  priority: 'normal' | 'urgent' | 'emergency';
  waitTime: number; // minutes
  status: 'waiting' | 'in-progress' | 'completed';
  appointmentTime: string;
  doctor?: string;
  department?: string;
  avatar?: string;
  vitalsConcern?: boolean;
}

interface PatientQueueProps {
  patients: QueuePatient[];
  onCallNext?: () => void;
  onViewPatient?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string) => void;
  compact?: boolean;
}

export const PatientQueue: React.FC<PatientQueueProps> = ({
  patients, onCallNext, onViewPatient, onUpdateStatus, compact = false,
}) => {
  const theme = useTheme();
  const [filter, setFilter] = useState<'all' | 'waiting' | 'in-progress'>('all');

  const priorityColors = {
    normal: { main: theme.palette.info.main, bg: alpha(theme.palette.info.main, 0.1) },
    urgent: { main: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.1) },
    emergency: { main: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.1) },
  };

  const sortedPatients = [...patients].sort((a, b) => {
    const priorityOrder = { emergency: 0, urgent: 1, normal: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.waitTime - b.waitTime;
  });

  const filteredPatients = filter === 'all' ? sortedPatients : sortedPatients.filter((p) => p.status === filter);
  const waitingCount = patients.filter((p) => p.status === 'waiting').length;
  const avgWait = patients.filter((p) => p.status === 'waiting').reduce((a, p) => a + p.waitTime, 0) / (waitingCount || 1);

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Patient Queue</Typography>
            <Typography variant="caption" color="text.secondary">
              {waitingCount} waiting · Avg wait: {Math.round(avgWait)} min
            </Typography>
          </Box>
          {onCallNext && waitingCount > 0 && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={onCallNext}
              startIcon={<Person />}
              sx={{ borderRadius: 2 }}
            >
              Call Next
            </Button>
          )}
        </Box>

        <Tabs value={filter} onChange={(_, v) => setFilter(v)} sx={{ mb: 1, minHeight: 32 }}>
          <Tab value="all" label={`All (${patients.length})`} sx={{ minHeight: 32 }} />
          <Tab value="waiting" label={`Waiting (${waitingCount})`} sx={{ minHeight: 32 }} />
          <Tab value="in-progress" label={`In Progress (${patients.filter((p) => p.status === 'in-progress').length})`} sx={{ minHeight: 32 }} />
        </Tabs>
      </Box>

      <List sx={{ p: 0 }}>
        {filteredPatients.map((patient, index) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            layout
          >
            <ListItem
              sx={{
                px: 2,
                py: compact ? 1 : 1.5,
                borderLeft: `3px solid ${priorityColors[patient.priority].main}`,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
              }}
            >
              <ListItemAvatar>
                <Badge
                  variant="dot"
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: patient.status === 'waiting' ? '#ff9800' : patient.status === 'in-progress' ? '#4caf50' : '#9e9e9e',
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      border: '2px solid white',
                    },
                  }}
                >
                  <Avatar src={patient.avatar} sx={{ bgcolor: priorityColors[patient.priority].bg, color: priorityColors[patient.priority].main }}>
                    {patient.name.charAt(0)}
                  </Avatar>
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{patient.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {patient.age}y {patient.gender}
                    </Typography>
                    {patient.vitalsConcern && (
                      <Tooltip title="Vitals concern">
                        <Warning sx={{ fontSize: 16, color: 'warning.main' }} />
                      </Tooltip>
                    )}
                    {patient.priority === 'emergency' && (
                      <Chip label="EMERGENCY" size="small" color="error" sx={{ height: 18, fontSize: '0.6rem' }} />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {patient.reason} {patient.doctor && `· Dr. ${patient.doctor}`}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      <AccessTime sx={{ fontSize: 12, verticalAlign: 'middle', mr: 0.25 }} />
                      {patient.appointmentTime} · Waiting: {patient.waitTime} min
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="View Patient">
                    <IconButton size="small" onClick={() => onViewPatient?.(patient.id)}>
                      <Visibility sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  {patient.status === 'waiting' && (
                    <Tooltip title="Start Consultation">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onUpdateStatus?.(patient.id, 'in-progress')}
                      >
                        <ArrowForward sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </motion.div>
        ))}
      </List>

      {filteredPatients.length === 0 && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <EventAvailable sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3 }} />
          <Typography variant="body2" color="text.secondary">No patients in queue</Typography>
        </Box>
      )}
    </Paper>
  );
};

// ============================================================================
// DEPARTMENT VIEW
// ============================================================================
interface DepartmentInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  headDoctor: string;
  totalStaff: number;
  activePatients: number;
  bedOccupancy: number; // percentage
  avgWaitTime: number; // minutes
  todayAppointments: number;
  completedAppointments: number;
  status: 'normal' | 'busy' | 'critical';
}

interface DepartmentViewProps {
  departments: DepartmentInfo[];
  onSelectDepartment?: (id: string) => void;
}

export const DepartmentView: React.FC<DepartmentViewProps> = ({
  departments, onSelectDepartment,
}) => {
  const theme = useTheme();
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const statusColors = {
    normal: theme.palette.success.main,
    busy: theme.palette.warning.main,
    critical: theme.palette.error.main,
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Departments</Typography>
        <Chip
          label={`${departments.length} departments`}
          size="small"
          variant="outlined"
        />
      </Box>

      <Grid container spacing={2}>
        {departments.map((dept, index) => (
          <Grid item xs={12} sm={6} md={4} key={dept.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Paper
                onClick={() => {
                  setSelectedDept(dept.id);
                  onSelectDepartment?.(dept.id);
                }}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: `1px solid ${selectedDept === dept.id ? theme.palette.primary.main : theme.palette.divider}`,
                  bgcolor: selectedDept === dept.id ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      {dept.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{dept.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Dr. {dept.headDoctor}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: statusColors[dept.status],
                    }}
                  />
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Staff</Typography>
                    <Typography variant="body2" fontWeight={600}>{dept.totalStaff}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Patients</Typography>
                    <Typography variant="body2" fontWeight={600}>{dept.activePatients}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Bed Occupancy</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={dept.bedOccupancy}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        mt: 0.5,
                        bgcolor: alpha(
                          dept.bedOccupancy > 90 ? theme.palette.error.main : dept.bedOccupancy > 70 ? theme.palette.warning.main : theme.palette.success.main,
                          0.1
                        ),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: dept.bedOccupancy > 90 ? theme.palette.error.main : dept.bedOccupancy > 70 ? theme.palette.warning.main : theme.palette.success.main,
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ float: 'right' }}>
                      {dept.bedOccupancy}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Avg Wait</Typography>
                    <Typography variant="body2" fontWeight={600}>{dept.avgWaitTime} min</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Appointments</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {dept.completedAppointments}/{dept.todayAppointments}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

// ============================================================================
// ALERTS PANEL
// ============================================================================
interface AlertItemData {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
  category: 'patient' | 'system' | 'equipment' | 'staff' | 'compliance';
}

interface AlertsPanelProps {
  alerts: AlertItemData[];
  onMarkRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
  maxVisible?: number;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts, onMarkRead, onDismiss, onAction, maxVisible = 5,
}) => {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);

  const alertConfig = {
    critical: { icon: <ErrorIcon />, color: theme.palette.error.main },
    warning: { icon: <Warning />, color: theme.palette.warning.main },
    info: { icon: <NotificationsActive />, color: theme.palette.info.main },
    success: { icon: <CheckCircle />, color: theme.palette.success.main },
  };

  const unreadCount = alerts.filter((a) => !a.read).length;
  const criticalCount = alerts.filter((a) => a.type === 'critical' && !a.read).length;
  const visibleAlerts = showAll ? alerts : alerts.slice(0, maxVisible);

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsActive />
          </Badge>
          <Typography variant="h6" fontWeight={700}>Alerts</Typography>
        </Box>
        {criticalCount > 0 && (
          <Chip
            label={`${criticalCount} critical`}
            size="small"
            color="error"
            icon={<ErrorIcon />}
            sx={{ height: 24 }}
          />
        )}
      </Box>

      <List sx={{ p: 0 }}>
        <AnimatePresence>
          {visibleAlerts.map((alert, index) => {
            const config = alertConfig[alert.type];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <ListItem
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: alert.read ? 'transparent' : alpha(config.color, 0.03),
                    borderLeft: `3px solid ${config.color}`,
                    '&:hover': { bgcolor: alpha(config.color, 0.05) },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(config.color, 0.1), color: config.color }}>
                      {config.icon}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" fontWeight={alert.read ? 400 : 700}>
                          {alert.title}
                        </Typography>
                        {alert.actionRequired && (
                          <Chip label="Action Required" size="small" color="warning" sx={{ height: 18, fontSize: '0.6rem' }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary">{alert.message}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.25 }}>
                          {alert.source} · {alert.timestamp}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={0.5}>
                      {alert.actionRequired && (
                        <Tooltip title="Take Action">
                          <IconButton size="small" color="primary" onClick={() => onAction?.(alert.id)}>
                            <ArrowForward sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {!alert.read && (
                        <Tooltip title="Mark as Read">
                          <IconButton size="small" onClick={() => onMarkRead?.(alert.id)}>
                            <CheckCircle sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Dismiss">
                        <IconButton size="small" onClick={() => onDismiss?.(alert.id)}>
                          <DoNotDisturb sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </List>

      {alerts.length > maxVisible && (
        <Box sx={{ p: 1 }}>
          <Button size="small" fullWidth onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Less' : `View All (${alerts.length})`}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

// ============================================================================
// BED MANAGEMENT
// ============================================================================
interface BedInfo {
  id: string;
  number: string;
  ward: string;
  type: 'general' | 'icu' | 'nicu' | 'private' | 'semi-private';
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  patient?: { name: string; admissionDate: string; condition: string };
  expectedDischarge?: string;
}

interface BedManagementProps {
  beds: BedInfo[];
  onAssignBed?: (bedId: string) => void;
  onReleaseBed?: (bedId: string) => void;
}

export const BedManagement: React.FC<BedManagementProps> = ({
  beds, onAssignBed, onReleaseBed,
}) => {
  const theme = useTheme();
  const [filter, setFilter] = useState<string>('all');

  const statusColors: Record<string, string> = {
    available: '#4caf50',
    occupied: '#1e88e5',
    reserved: '#ff9800',
    maintenance: '#9e9e9e',
  };

  const stats = {
    total: beds.length,
    available: beds.filter((b) => b.status === 'available').length,
    occupied: beds.filter((b) => b.status === 'occupied').length,
    reserved: beds.filter((b) => b.status === 'reserved').length,
    maintenance: beds.filter((b) => b.status === 'maintenance').length,
  };

  const occupancy = ((stats.occupied + stats.reserved) / stats.total) * 100;

  const filteredBeds = filter === 'all' ? beds : beds.filter((b) => b.status === filter);

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Bed Management</Typography>
          <Typography variant="caption" color="text.secondary">
            {stats.available} beds available · {occupancy.toFixed(0)}% occupancy
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        {Object.entries(stats).filter(([key]) => key !== 'total').map(([status, count]) => (
          <Chip
            key={status}
            label={`${status}: ${count}`}
            size="small"
            onClick={() => setFilter(filter === status ? 'all' : status)}
            icon={<Circle sx={{ fontSize: '8px !important', color: `${statusColors[status]} !important` }} />}
            sx={{
              bgcolor: filter === status ? alpha(statusColors[status], 0.15) : 'transparent',
              border: `1px solid ${theme.palette.divider}`,
              fontWeight: filter === status ? 700 : 400,
            }}
          />
        ))}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: 1,
        }}
      >
        {filteredBeds.map((bed) => (
          <Tooltip
            key={bed.id}
            title={
              bed.patient
                ? `${bed.patient.name} - ${bed.patient.condition}`
                : `Bed ${bed.number} - ${bed.status}`
            }
          >
            <Paper
              onClick={() => {
                if (bed.status === 'available') onAssignBed?.(bed.id);
                if (bed.status === 'occupied') onReleaseBed?.(bed.id);
              }}
              sx={{
                p: 1,
                textAlign: 'center',
                borderRadius: 1.5,
                cursor: 'pointer',
                bgcolor: alpha(statusColors[bed.status], 0.08),
                border: `1px solid ${alpha(statusColors[bed.status], 0.3)}`,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 2px 8px ${alpha(statusColors[bed.status], 0.2)}`,
                },
              }}
            >
              <Bed sx={{ fontSize: 20, color: statusColors[bed.status] }} />
              <Typography variant="caption" display="block" fontWeight={600}>
                {bed.number}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                {bed.type}
              </Typography>
            </Paper>
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
};

// ============================================================================
// STAFF SCHEDULE
// ============================================================================
interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar?: string;
  shifts: { day: string; start: string; end: string; type: 'morning' | 'afternoon' | 'night' | 'off' }[];
  status: 'on-duty' | 'off-duty' | 'on-leave' | 'on-call';
  specialization?: string;
}

interface StaffScheduleProps {
  staff: StaffMember[];
  onEditSchedule?: (staffId: string) => void;
  compact?: boolean;
}

export const StaffSchedule: React.FC<StaffScheduleProps> = ({
  staff, onEditSchedule, compact = false,
}) => {
  const theme = useTheme();

  const shiftColors: Record<string, string> = {
    morning: '#4caf50',
    afternoon: '#ff9800',
    night: '#7b1fa2',
    off: '#e0e0e0',
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    'on-duty': { color: '#4caf50', label: 'On Duty' },
    'off-duty': { color: '#9e9e9e', label: 'Off Duty' },
    'on-leave': { color: '#ff9800', label: 'On Leave' },
    'on-call': { color: '#1e88e5', label: 'On Call' },
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Staff Schedule</Typography>
        <Stack direction="row" spacing={1}>
          {Object.entries(shiftColors).map(([type, color]) => (
            <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: color }} />
              <Typography variant="caption" color="text.secondary" textTransform="capitalize">
                {type}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Staff</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              {days.map((day) => (
                <TableCell key={day} align="center" sx={{ fontWeight: 700, minWidth: 60 }}>
                  {day}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={member.avatar} sx={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                      {member.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{member.name}</Typography>
                      {!compact && (
                        <Typography variant="caption" color="text.secondary">{member.role}</Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={statusConfig[member.status].label}
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      bgcolor: alpha(statusConfig[member.status].color, 0.1),
                      color: statusConfig[member.status].color,
                    }}
                  />
                </TableCell>
                {days.map((day) => {
                  const shift = member.shifts.find((s) => s.day === day);
                  return (
                    <TableCell key={day} align="center" sx={{ p: 0.5 }}>
                      {shift && (
                        <Tooltip title={shift.type !== 'off' ? `${shift.start}-${shift.end}` : 'Off'}>
                          <Box
                            sx={{
                              width: '100%',
                              height: 24,
                              borderRadius: 1,
                              bgcolor: alpha(shiftColors[shift.type], 0.2),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontSize: '0.55rem', fontWeight: 600, color: shiftColors[shift.type] }}
                            >
                              {shift.type !== 'off' ? `${shift.start.slice(0, 5)}` : '—'}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell>
                  {onEditSchedule && (
                    <IconButton size="small" onClick={() => onEditSchedule(member.id)}>
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================
interface RevenueData {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface RevenueAnalyticsProps {
  data: RevenueData[];
  totalRevenue: number;
  totalExpenses: number;
  growthRate: number;
  period?: string;
  targets?: { revenue: number; expenses: number };
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({
  data, totalRevenue, totalExpenses, growthRate, period = 'This Month',
  targets,
}) => {
  const theme = useTheme();
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Revenue Analytics</Typography>
        <Chip label={period} size="small" variant="outlined" />
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} color="primary.main">
              ${(totalRevenue / 1000).toFixed(0)}K
            </Typography>
            <Typography variant="caption" color="text.secondary">Revenue</Typography>
            {targets && (
              <LinearProgress
                variant="determinate"
                value={Math.min((totalRevenue / targets.revenue) * 100, 100)}
                sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
              />
            )}
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} color="error.main">
              ${(totalExpenses / 1000).toFixed(0)}K
            </Typography>
            <Typography variant="caption" color="text.secondary">Expenses</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              fontWeight={800}
              color={netProfit > 0 ? 'success.main' : 'error.main'}
            >
              ${(netProfit / 1000).toFixed(0)}K
            </Typography>
            <Typography variant="caption" color="text.secondary">Net Profit</Typography>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Chip
          icon={growthRate > 0 ? <TrendingUp /> : <TrendingDown />}
          label={`${growthRate > 0 ? '+' : ''}${growthRate}% growth`}
          size="small"
          sx={{
            bgcolor: alpha(growthRate > 0 ? '#4caf50' : '#f44336', 0.1),
            color: growthRate > 0 ? '#4caf50' : '#f44336',
          }}
        />
        <Chip
          label={`${profitMargin.toFixed(1)}% margin`}
          size="small"
          variant="outlined"
        />
      </Box>

      {/* Simple bar chart */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 120 }}>
        {data.map((item, i) => {
          const maxVal = Math.max(...data.map((d) => Math.max(d.revenue, d.expenses)));
          const revenueH = (item.revenue / maxVal) * 100;
          const expenseH = (item.expenses / maxVal) * 100;
          return (
            <Tooltip key={i} title={`${item.period}: Revenue $${(item.revenue / 1000).toFixed(0)}K | Expenses $${(item.expenses / 1000).toFixed(0)}K`}>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
                <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'flex-end', height: 100 }}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${revenueH}%` }}
                    transition={{ delay: i * 0.05, type: 'spring' }}
                    style={{
                      width: 8,
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 2,
                      minHeight: 2,
                    }}
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${expenseH}%` }}
                    transition={{ delay: i * 0.05 + 0.1, type: 'spring' }}
                    style={{
                      width: 8,
                      backgroundColor: alpha(theme.palette.error.main, 0.5),
                      borderRadius: 2,
                      minHeight: 2,
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem' }}>
                  {item.period.slice(0, 3)}
                </Typography>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Paper>
  );
};

export default {
  StatsOverview,
  PatientQueue,
  DepartmentView,
  AlertsPanel,
  BedManagement,
  StaffSchedule,
  RevenueAnalytics,
};

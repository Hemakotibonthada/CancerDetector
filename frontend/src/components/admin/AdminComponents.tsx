// ============================================================================
// Admin Dashboard Components - System management, analytics, user admin
// ============================================================================
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, Avatar, Chip, IconButton,
  Grid, Stack, Badge, Tooltip, LinearProgress, Divider,
  Card, CardContent, List, ListItem, ListItemAvatar,
  ListItemText, ListItemSecondaryAction, Tab, Tabs, Alert,
  CircularProgress, alpha, useTheme, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, FormControl, InputLabel, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, Collapse, Rating,
} from '@mui/material';
import {
  Dashboard, People, Settings, Security, Storage,
  Memory, Speed, CloudUpload, CloudDownload, Assessment,
  TrendingUp, TrendingDown, Warning, Error as ErrorIcon,
  CheckCircle, Block, VerifiedUser, AdminPanelSettings,
  PersonAdd, PersonRemove, Edit, Delete, Visibility,
  MoreVert, Search, FilterList, Download, Refresh,
  Timeline as TimelineIcon, PieChart, BarChart, ShowChart,
  Dns, CloudQueue, Api, BugReport, Schedule, Backup,
  RestoreFromTrash, Lock, LockOpen, Notifications,
  MonitorHeart, QueryStats, DataUsage, NetworkCheck,
  ExpandMore, ExpandLess, Circle, Public,
  CalendarMonth, AccessTime, Star, FormatListBulleted,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// SYSTEM HEALTH CARD
// ============================================================================
interface SystemMetric {
  name: string;
  value: number;
  max: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface SystemHealthCardProps {
  metrics: SystemMetric[];
  uptime: string;
  lastChecked: string;
  overallStatus: 'healthy' | 'warning' | 'critical';
  onRefresh?: () => void;
}

export const SystemHealthCard: React.FC<SystemHealthCardProps> = ({
  metrics, uptime, lastChecked, overallStatus, onRefresh,
}) => {
  const theme = useTheme();

  const statusConfig = {
    healthy: { color: '#4caf50', label: 'All Systems Operational', icon: <CheckCircle /> },
    warning: { color: '#ff9800', label: 'Some Issues Detected', icon: <Warning /> },
    critical: { color: '#f44336', label: 'Critical Issues', icon: <ErrorIcon /> },
  };

  const config = statusConfig[overallStatus];

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(config.color, 0.3)}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${alpha(config.color, 0.05)}, ${alpha(config.color, 0.1)})`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: alpha(config.color, 0.15), color: config.color }}>
            {config.icon}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>System Health</Typography>
            <Typography variant="body2" sx={{ color: config.color, fontWeight: 600 }}>
              {config.label}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h5" fontWeight={800} color="text.primary">{uptime}</Typography>
          <Typography variant="caption" color="text.secondary">Uptime</Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {metrics.map((metric, index) => {
            const percentage = (metric.value / metric.max) * 100;
            const metricStatusColor = statusConfig[metric.status].color;
            return (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                      <CircularProgress
                        variant="determinate"
                        value={percentage}
                        size={64}
                        thickness={4}
                        sx={{
                          color: metricStatusColor,
                          '& .MuiCircularProgress-circle': {
                            strokeLinecap: 'round',
                          },
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Box sx={{ color: metricStatusColor }}>{metric.icon}</Box>
                      </Box>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>
                      {metric.value}{metric.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{metric.name}</Typography>
                  </Box>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Divider />
      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Last checked: {lastChecked}
        </Typography>
        {onRefresh && (
          <Button size="small" startIcon={<Refresh />} onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </Box>
    </Paper>
  );
};

// ============================================================================
// USER MANAGEMENT TABLE
// ============================================================================
interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
  verified: boolean;
  loginCount: number;
}

interface UserManagementTableProps {
  users: UserRecord[];
  onEditUser?: (id: string) => void;
  onDeleteUser?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onResetPassword?: (id: string) => void;
  loading?: boolean;
  totalUsers?: number;
  page?: number;
  onPageChange?: (page: number) => void;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({
  users, onEditUser, onDeleteUser, onToggleStatus, onResetPassword,
  loading = false,
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    active: '#4caf50',
    inactive: '#9e9e9e',
    suspended: '#f44336',
    pending: '#ff9800',
  };

  const roleColors: Record<string, string> = {
    system_admin: '#b71c1c',
    super_admin: '#e53935',
    hospital_admin: '#1565c0',
    doctor: '#00897b',
    nurse: '#7b1fa2',
    patient: '#546e7a',
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const uniqueRoles = [...new Set(users.map((u) => u.role))];

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>User Management</Typography>
          <Chip label={`${filteredUsers.length} users`} size="small" variant="outlined" />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} />,
            }}
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              {uniqueRoles.map((role) => (
                <MenuItem key={role} value={role}>{role.replace('_', ' ')}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Logins</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Verified</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}>
                      <Box sx={{ height: 16, width: '80%', bgcolor: 'action.hover', borderRadius: 1 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={user.avatar} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={user.role.replace('_', ' ')}
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        bgcolor: alpha(roleColors[user.role] || '#546e7a', 0.1),
                        color: roleColors[user.role] || '#546e7a',
                        textTransform: 'capitalize',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={<Circle sx={{ fontSize: '8px !important' }} />}
                      label={user.status}
                      sx={{
                        height: 22,
                        fontSize: '0.65rem',
                        bgcolor: alpha(statusColors[user.status], 0.1),
                        color: statusColors[user.status],
                        textTransform: 'capitalize',
                        '& .MuiChip-icon': { color: `${statusColors[user.status]} !important` },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{user.lastLogin}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{user.loginCount}</Typography>
                  </TableCell>
                  <TableCell>
                    {user.verified ? (
                      <VerifiedUser sx={{ fontSize: 18, color: 'success.main' }} />
                    ) : (
                      <Warning sx={{ fontSize: 18, color: 'warning.main' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedUser(user.id);
                      }}
                    >
                      <MoreVert sx={{ fontSize: 18 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { onEditUser?.(selectedUser!); setAnchorEl(null); }}>
          <Edit sx={{ mr: 1, fontSize: 18 }} /> Edit User
        </MenuItem>
        <MenuItem onClick={() => { onToggleStatus?.(selectedUser!); setAnchorEl(null); }}>
          <Block sx={{ mr: 1, fontSize: 18 }} /> Toggle Status
        </MenuItem>
        <MenuItem onClick={() => { onResetPassword?.(selectedUser!); setAnchorEl(null); }}>
          <Lock sx={{ mr: 1, fontSize: 18 }} /> Reset Password
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { onDeleteUser?.(selectedUser!); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1, fontSize: 18 }} /> Delete User
        </MenuItem>
      </Menu>
    </Paper>
  );
};

// ============================================================================
// ACTIVITY LOG
// ============================================================================
interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  ip?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details?: string;
}

interface ActivityLogProps {
  activities: ActivityEntry[];
  onViewDetails?: (id: string) => void;
  onExport?: () => void;
  maxVisible?: number;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  activities, onViewDetails, onExport, maxVisible = 10,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const severityColors: Record<string, string> = {
    info: theme.palette.info.main,
    warning: theme.palette.warning.main,
    error: theme.palette.error.main,
    critical: '#b71c1c',
  };

  const filtered = filter === 'all' ? activities : activities.filter((a) => a.severity === filter);
  const visible = expanded ? filtered : filtered.slice(0, maxVisible);

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>Activity Log</Typography>
        <Stack direction="row" spacing={1}>
          {['all', 'info', 'warning', 'error', 'critical'].map((sev) => (
            <Chip
              key={sev}
              label={sev}
              size="small"
              onClick={() => setFilter(sev)}
              sx={{
                height: 22,
                fontSize: '0.65rem',
                textTransform: 'capitalize',
                bgcolor: filter === sev ? alpha(sev === 'all' ? theme.palette.primary.main : severityColors[sev] || '', 0.15) : 'transparent',
                border: `1px solid ${theme.palette.divider}`,
              }}
            />
          ))}
          {onExport && (
            <IconButton size="small" onClick={onExport}>
              <Download sx={{ fontSize: 18 }} />
            </IconButton>
          )}
        </Stack>
      </Box>

      <List sx={{ p: 0 }}>
        {visible.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.02 }}
          >
            <ListItem
              sx={{
                px: 2,
                py: 1,
                borderLeft: `3px solid ${severityColors[activity.severity]}`,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                cursor: onViewDetails ? 'pointer' : 'default',
              }}
              onClick={() => onViewDetails?.(activity.id)}
            >
              <ListItemAvatar sx={{ minWidth: 32 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: severityColors[activity.severity],
                  }}
                />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    <strong>{activity.user}</strong> {activity.action} <Chip label={activity.resource} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {activity.timestamp} {activity.ip && `· IP: ${activity.ip}`}
                  </Typography>
                }
              />
            </ListItem>
            <Divider />
          </motion.div>
        ))}
      </List>

      {filtered.length > maxVisible && (
        <Box sx={{ p: 1 }}>
          <Button size="small" fullWidth onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show Less' : `View All (${filtered.length})`}
          </Button>
        </Box>
      )}
    </Paper>
  );
};

// ============================================================================
// API MONITOR
// ============================================================================
interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  avgResponseTime: number;
  requestCount: number;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'down';
  lastError?: string;
}

interface ApiMonitorProps {
  endpoints: ApiEndpoint[];
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

export const ApiMonitor: React.FC<ApiMonitorProps> = ({
  endpoints, totalRequests, avgResponseTime, errorRate, uptime,
}) => {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState<'requests' | 'responseTime' | 'errorRate'>('requests');

  const methodColors: Record<string, string> = {
    GET: '#4caf50',
    POST: '#1e88e5',
    PUT: '#ff9800',
    DELETE: '#f44336',
    PATCH: '#7b1fa2',
  };

  const sortedEndpoints = [...endpoints].sort((a, b) => {
    switch (sortBy) {
      case 'requests': return b.requestCount - a.requestCount;
      case 'responseTime': return b.avgResponseTime - a.avgResponseTime;
      case 'errorRate': return b.errorRate - a.errorRate;
      default: return 0;
    }
  });

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>API Monitor</Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800}>{(totalRequests / 1000).toFixed(1)}K</Typography>
              <Typography variant="caption" color="text.secondary">Total Requests</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800}>{avgResponseTime}ms</Typography>
              <Typography variant="caption" color="text.secondary">Avg Response</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800} color={errorRate > 5 ? 'error.main' : 'success.main'}>
                {errorRate}%
              </Typography>
              <Typography variant="caption" color="text.secondary">Error Rate</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800} color="success.main">{uptime}%</Typography>
              <Typography variant="caption" color="text.secondary">Uptime</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Endpoint</TableCell>
              <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => setSortBy('requests')}>
                Requests {sortBy === 'requests' && '↓'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => setSortBy('responseTime')}>
                Avg Time {sortBy === 'responseTime' && '↓'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, cursor: 'pointer' }} onClick={() => setSortBy('errorRate')}>
                Errors {sortBy === 'errorRate' && '↓'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedEndpoints.slice(0, 10).map((endpoint) => (
              <TableRow key={`${endpoint.method}-${endpoint.path}`} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={endpoint.method}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        bgcolor: alpha(methodColors[endpoint.method], 0.1),
                        color: methodColors[endpoint.method],
                      }}
                    />
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {endpoint.path}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{endpoint.requestCount.toLocaleString()}</Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={endpoint.avgResponseTime > 1000 ? 'error.main' : endpoint.avgResponseTime > 500 ? 'warning.main' : 'text.primary'}
                  >
                    {endpoint.avgResponseTime}ms
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color={endpoint.errorRate > 5 ? 'error.main' : endpoint.errorRate > 1 ? 'warning.main' : 'success.main'}
                  >
                    {endpoint.errorRate}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={endpoint.status}
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      bgcolor: alpha(
                        endpoint.status === 'healthy' ? '#4caf50' : endpoint.status === 'degraded' ? '#ff9800' : '#f44336',
                        0.1
                      ),
                      color: endpoint.status === 'healthy' ? '#4caf50' : endpoint.status === 'degraded' ? '#ff9800' : '#f44336',
                    }}
                  />
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
// DATABASE STATS
// ============================================================================
interface DbStats {
  tableName: string;
  rowCount: number;
  sizeBytes: number;
  lastModified: string;
  indexCount: number;
}

interface DatabaseStatsProps {
  tables: DbStats[];
  totalSize: string;
  connectionPoolUsage: number;
  activeConnections: number;
  maxConnections: number;
  queryCount24h: number;
  slowQueries24h: number;
}

export const DatabaseStats: React.FC<DatabaseStatsProps> = ({
  tables, totalSize, connectionPoolUsage, activeConnections,
  maxConnections, queryCount24h, slowQueries24h,
}) => {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const sortedTables = [...tables].sort((a, b) => b.rowCount - a.rowCount);
  const visibleTables = showAll ? sortedTables : sortedTables.slice(0, 8);

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Database Statistics</Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={4}>
          <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <Storage sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700}>{totalSize}</Typography>
            <Typography variant="caption" color="text.secondary">Total Size</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <Dns sx={{ color: 'success.main' }} />
            <Typography variant="h6" fontWeight={700}>{activeConnections}/{maxConnections}</Typography>
            <Typography variant="caption" color="text.secondary">Connections</Typography>
          </Paper>
        </Grid>
        <Grid item xs={4}>
          <Paper elevation={0} sx={{ p: 1.5, textAlign: 'center', borderRadius: 2, bgcolor: alpha(slowQueries24h > 10 ? theme.palette.warning.main : theme.palette.info.main, 0.05) }}>
            <QueryStats sx={{ color: slowQueries24h > 10 ? 'warning.main' : 'info.main' }} />
            <Typography variant="h6" fontWeight={700}>{(queryCount24h / 1000).toFixed(1)}K</Typography>
            <Typography variant="caption" color="text.secondary">Queries (24h)</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Connection Pool</Typography>
          <Typography variant="caption" fontWeight={600}>{connectionPoolUsage}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={connectionPoolUsage}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(connectionPoolUsage > 80 ? theme.palette.error.main : theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: connectionPoolUsage > 80 ? 'error.main' : 'primary.main',
            },
          }}
        />
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Table</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Rows</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Size</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Indexes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleTables.map((table) => (
              <TableRow key={table.tableName} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {table.tableName}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{table.rowCount.toLocaleString()}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{formatSize(table.sizeBytes)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2">{table.indexCount}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {tables.length > 8 && (
        <Button size="small" fullWidth onClick={() => setShowAll(!showAll)} sx={{ mt: 1 }}>
          {showAll ? 'Show Less' : `Show All (${tables.length})`}
        </Button>
      )}
    </Paper>
  );
};

// ============================================================================
// PLATFORM ANALYTICS
// ============================================================================
interface PlatformMetrics {
  dailyActiveUsers: number[];
  weeklyActiveUsers: number[];
  monthlyActiveUsers: number[];
  registrations: number[];
  sessionDuration: number; // avg in minutes
  bounceRate: number;
  retentionRate: number;
  featureUsage: { feature: string; usage: number }[];
  topPages: { page: string; views: number }[];
  deviceBreakdown: { device: string; percentage: number }[];
}

interface PlatformAnalyticsProps {
  metrics: PlatformMetrics;
  period?: string;
}

export const PlatformAnalytics: React.FC<PlatformAnalyticsProps> = ({
  metrics, period = 'Last 30 Days',
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  const dauToday = metrics.dailyActiveUsers[metrics.dailyActiveUsers.length - 1] || 0;
  const dauYesterday = metrics.dailyActiveUsers[metrics.dailyActiveUsers.length - 2] || 0;
  const dauChange = dauYesterday > 0 ? ((dauToday - dauYesterday) / dauYesterday * 100).toFixed(1) : '0';

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Platform Analytics</Typography>
          <Chip label={period} size="small" variant="outlined" />
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800}>{dauToday.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">DAU</Typography>
              <Chip
                size="small"
                label={`${Number(dauChange) > 0 ? '+' : ''}${dauChange}%`}
                sx={{
                  height: 18, fontSize: '0.6rem', ml: 0.5,
                  bgcolor: alpha(Number(dauChange) > 0 ? '#4caf50' : '#f44336', 0.1),
                  color: Number(dauChange) > 0 ? '#4caf50' : '#f44336',
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800}>{metrics.sessionDuration}m</Typography>
              <Typography variant="caption" color="text.secondary">Avg Session</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800}>{metrics.retentionRate}%</Typography>
              <Typography variant="caption" color="text.secondary">Retention</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h5" fontWeight={800}>{metrics.bounceRate}%</Typography>
              <Typography variant="caption" color="text.secondary">Bounce Rate</Typography>
            </Box>
          </Grid>
        </Grid>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2, minHeight: 36 }}>
          <Tab label="Feature Usage" sx={{ minHeight: 36 }} />
          <Tab label="Top Pages" sx={{ minHeight: 36 }} />
          <Tab label="Devices" sx={{ minHeight: 36 }} />
        </Tabs>

        {activeTab === 0 && (
          <Stack spacing={1}>
            {metrics.featureUsage.sort((a, b) => b.usage - a.usage).slice(0, 8).map((feature) => {
              const maxUsage = Math.max(...metrics.featureUsage.map((f) => f.usage));
              return (
                <Box key={feature.feature}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography variant="caption" fontWeight={600}>{feature.feature}</Typography>
                    <Typography variant="caption" color="text.secondary">{feature.usage.toLocaleString()}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(feature.usage / maxUsage) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    }}
                  />
                </Box>
              );
            })}
          </Stack>
        )}

        {activeTab === 1 && (
          <Stack spacing={1}>
            {metrics.topPages.slice(0, 8).map((page, i) => (
              <Box key={page.page} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 20 }}>
                  #{i + 1}
                </Typography>
                <Typography variant="body2" sx={{ flex: 1 }}>{page.page}</Typography>
                <Typography variant="body2" fontWeight={600}>{page.views.toLocaleString()}</Typography>
              </Box>
            ))}
          </Stack>
        )}

        {activeTab === 2 && (
          <Stack spacing={1.5}>
            {metrics.deviceBreakdown.map((device) => (
              <Box key={device.device}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="body2" fontWeight={600}>{device.device}</Typography>
                  <Typography variant="body2" fontWeight={700}>{device.percentage}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={device.percentage}
                  sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.primary.main, 0.08) }}
                />
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default {
  SystemHealthCard,
  UserManagementTable,
  ActivityLog,
  ApiMonitor,
  DatabaseStats,
  PlatformAnalytics,
};

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar, Badge, Stack, Chip,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Divider,
  Menu, MenuItem, Tooltip, Switch, useMediaQuery, useTheme,
  InputBase, Paper, alpha, Collapse, ListSubheader,
} from '@mui/material';
import {
  Menu as MenuIcon, Notifications as NotifIcon, Search as SearchIcon,
  DarkMode, LightMode, ExitToApp as LogoutIcon, Person as PersonIcon,
  Settings as SettingsIcon, Help as HelpIcon, HealthAndSafety as HealthIcon,
  KeyboardArrowDown, ExpandLess, ExpandMore, Close as CloseIcon,
  LocalHospital as HospitalIcon, AdminPanelSettings as AdminIcon,
  Dashboard as DashIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  children?: NavItem[];
  section?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  navItems: NavItem[];
  portalType: 'patient' | 'hospital' | 'admin';
  subtitle?: string;
}

const portalColors = {
  patient: { primary: '#0d1b2a', accent: '#5e92f3', gradient: 'linear-gradient(180deg, #0d1b2a 0%, #1b2838 100%)' },
  hospital: { primary: '#1a237e', accent: '#82b1ff', gradient: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)' },
  admin: { primary: '#1b1b2f', accent: '#ff6f00', gradient: 'linear-gradient(180deg, #1b1b2f 0%, #2d2d44 100%)' },
};

const portalIcons = {
  patient: <HealthIcon />,
  hospital: <HospitalIcon />,
  admin: <AdminIcon />,
};

const portalNames = {
  patient: 'CancerGuard AI',
  hospital: 'Hospital Portal',
  admin: 'Admin Panel',
};

const DRAWER_WIDTH = 280;

const AppLayout: React.FC<AppLayoutProps> = ({ children, title, navItems, portalType, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifMenuAnchor, setNotifMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const colors = portalColors[portalType];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const groupedNavItems = navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section || 'Main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f4f8' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerOpen ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            background: colors.gradient,
            color: 'white',
            border: 'none',
            transition: 'width 0.3s ease',
          },
        }}
      >
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3, px: 1 }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: 2,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {React.cloneElement(portalIcons[portalType] as React.ReactElement, { sx: { fontSize: 22, color: 'white' } })}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>{portalNames[portalType]}</Typography>
              <Typography sx={{ fontSize: 10, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase' }}>Healthcare Platform</Typography>
            </Box>
          </Stack>

          {/* User Card */}
          <Box sx={{
            p: 2, mb: 2, borderRadius: 3,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 40, height: 40, bgcolor: colors.accent, fontSize: 15, fontWeight: 700 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography sx={{ fontSize: 11, opacity: 0.6 }}>
                  {user?.role?.replace(/_/g, ' ')}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Navigation */}
          <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', mx: -1, px: 1, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 } }}>
            {Object.entries(groupedNavItems).map(([section, items]) => (
              <Box key={section} sx={{ mb: 1 }}>
                {section !== 'Main' && (
                  <Typography sx={{ px: 2, py: 1, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.4, mt: 1 }}>
                    {section}
                  </Typography>
                )}
                <List disablePadding>
                  {items.map((item, index) => (
                    <ListItemButton
                      key={index}
                      onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
                      sx={{
                        borderRadius: 2,
                        mb: 0.3,
                        py: 1,
                        px: 2,
                        bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.12)' : 'transparent',
                        borderLeft: isActive(item.path) ? `3px solid ${colors.accent}` : '3px solid transparent',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                        transition: 'all 0.2s',
                      }}
                    >
                      <ListItemIcon sx={{
                        color: isActive(item.path) ? colors.accent : 'rgba(255,255,255,0.5)',
                        minWidth: 36, fontSize: 20,
                      }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        sx={{ '& .MuiTypography-root': { fontSize: 13, fontWeight: isActive(item.path) ? 600 : 400 } }}
                      />
                      {item.badge && item.badge > 0 && (
                        <Chip label={item.badge} size="small" sx={{ height: 20, fontSize: 11, bgcolor: colors.accent, color: 'white', fontWeight: 700 }} />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            ))}
          </Box>

          {/* Bottom */}
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1 }} />
          <ListItemButton
            onClick={logout}
            sx={{ borderRadius: 2, py: 1, '&:hover': { bgcolor: 'rgba(255,70,70,0.15)' } }}
          >
            <ListItemIcon sx={{ color: 'rgba(255,255,255,0.5)', minWidth: 36 }}><LogoutIcon sx={{ fontSize: 20 }} /></ListItemIcon>
            <ListItemText primary="Sign Out" sx={{ '& .MuiTypography-root': { fontSize: 13 } }} />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* Main Area */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            color: '#1a1a2e',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)} size="small">
              <MenuIcon />
            </IconButton>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: -0.5, display: 'block' }}>
                  {subtitle}
                </Typography>
              )}
            </Box>

            {/* Search */}
            {searchOpen ? (
              <Paper sx={{
                display: 'flex', alignItems: 'center', px: 2, py: 0.5,
                width: 300, borderRadius: 3, border: '1px solid #e0e0e0',
              }}>
                <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                <InputBase
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ flex: 1, fontSize: 14 }}
                  autoFocus
                />
                <IconButton size="small" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Paper>
            ) : (
              <Tooltip title="Search">
                <IconButton onClick={() => setSearchOpen(true)} size="small">
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="Help & Support">
              <IconButton size="small"><HelpIcon /></IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton onClick={(e) => setNotifMenuAnchor(e.currentTarget)} size="small">
                <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }}>
                  <NotifIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={notifMenuAnchor}
              open={!!notifMenuAnchor}
              onClose={() => setNotifMenuAnchor(null)}
              PaperProps={{ sx: { width: 360, maxHeight: 420, borderRadius: 3 } }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Notifications</Typography>
              </Box>
              {[
                { title: 'Cancer Risk Assessment Updated', msg: 'Your latest risk score has been calculated.', time: '2m ago', color: '#1565c0' },
                { title: 'Blood Test Results Ready', msg: 'Your CBC panel results are now available.', time: '1h ago', color: '#00897b' },
                { title: 'Appointment Reminder', msg: 'Dr. Smith consultation tomorrow at 10:00 AM.', time: '3h ago', color: '#f57c00' },
              ].map((n, i) => (
                <MenuItem key={i} onClick={() => setNotifMenuAnchor(null)} sx={{ py: 1.5, px: 2, whiteSpace: 'normal' }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: n.color, mr: 1.5, mt: 0.5, flexShrink: 0 }} />
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{n.title}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{n.msg}</Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 0.5 }}>{n.time}</Typography>
                  </Box>
                </MenuItem>
              ))}
              <Box sx={{ p: 1.5, borderTop: '1px solid #f0f0f0', textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: 'primary.main', fontWeight: 600, cursor: 'pointer' }}>
                  View All Notifications
                </Typography>
              </Box>
            </Menu>

            {/* Health ID Badge */}
            {user?.health_id && (
              <Chip
                label={user.health_id}
                size="small"
                sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600, fontSize: 11, display: { xs: 'none', md: 'flex' } }}
              />
            )}

            {/* Profile Menu */}
            <Tooltip title="Account">
              <IconButton onClick={(e) => setProfileMenuAnchor(e.currentTarget)} size="small">
                <Avatar sx={{ width: 36, height: 36, bgcolor: colors.accent, fontSize: 14, fontWeight: 700 }}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={profileMenuAnchor}
              open={!!profileMenuAnchor}
              onClose={() => setProfileMenuAnchor(null)}
              PaperProps={{ sx: { width: 220, borderRadius: 3 } }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{user?.first_name} {user?.last_name}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{user?.email}</Typography>
              </Box>
              <MenuItem onClick={() => { navigate('/profile'); setProfileMenuAnchor(null); }}>
                <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Profile" primaryTypographyProps={{ fontSize: 13 }} />
              </MenuItem>
              <MenuItem onClick={() => { navigate('/settings'); setProfileMenuAnchor(null); }}>
                <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 13 }} />
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { logout(); setProfileMenuAnchor(null); }}>
                <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: 13 }} />
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;

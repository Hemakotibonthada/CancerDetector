import React, { useState, useMemo } from 'react';
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
  Dashboard as DashIcon, Palette as PaletteIcon,
  WaterDrop, Park, WbSunny, NightsStay, LocalHospital, ColorLens,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext, ThemeVariant, themeVariants } from '../../context/ThemeContext';

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

const DRAWER_WIDTH = 260;

const variantIcons: Record<ThemeVariant, React.ReactNode> = {
  default: <ColorLens sx={{ fontSize: 16 }} />,
  ocean: <WaterDrop sx={{ fontSize: 16 }} />,
  emerald: <Park sx={{ fontSize: 16 }} />,
  sunset: <WbSunny sx={{ fontSize: 16 }} />,
  midnight: <NightsStay sx={{ fontSize: 16 }} />,
  clinical: <LocalHospital sx={{ fontSize: 16 }} />,
};

const AppLayout = ({ children, title, navItems, portalType, subtitle }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const theme = useTheme();
  const { isDark, toggleTheme, variant, setVariant, sidebarColors, appbarColors } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifMenuAnchor, setNotifMenuAnchor] = useState<null | HTMLElement>(null);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const colors = { ...portalColors[portalType], accent: sidebarColors.accent, gradient: sidebarColors.bg };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const groupedNavItems = useMemo(() => navItems.reduce<Record<string, NavItem[]>>((acc, item) => {
    const section = item.section || 'Main';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {}), [navItems]);

  const isActive = (path: string) => {
    // Match exact path or path with /patient prefix
    if (location.pathname === path) return true;
    if (portalType === 'patient' && location.pathname === `/patient${path}`) return true;
    if (portalType === 'patient' && path === '/dashboard' && location.pathname === '/patient') return true;
    return false;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default', transition: 'background-color 0.3s ease' }}>
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
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo - compact */}
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2, py: 1.5, flexShrink: 0 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: 1.5,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {React.cloneElement(portalIcons[portalType] as React.ReactElement, { sx: { fontSize: 20, color: 'white' } })}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{portalNames[portalType]}</Typography>
              <Typography sx={{ fontSize: 9, opacity: 0.5, letterSpacing: 1.2, textTransform: 'uppercase' }}>Healthcare Platform</Typography>
            </Box>
          </Stack>

          {/* User Card - compact */}
          <Box sx={{
            mx: 1.5, mb: 1, px: 1.5, py: 1, borderRadius: 2,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
          }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Avatar sx={{ width: 32, height: 32, bgcolor: colors.accent, fontSize: 13, fontWeight: 700 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography sx={{ fontSize: 10, opacity: 0.5, textTransform: 'capitalize' }}>
                  {user?.role?.replace(/_/g, ' ')}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Navigation - scrollable area */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            px: 1,
            pb: 1,
            '&::-webkit-scrollbar': { width: 3 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: 4,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.15) transparent',
          }}>
            {Object.entries(groupedNavItems).map(([section, items]) => {
              const isCollapsed = collapsedSections[section] ?? false;
              return (
                <Box key={section} sx={{ mb: 0.25 }}>
                  {section !== 'Main' ? (
                    <ListItemButton
                      onClick={() => toggleSection(section)}
                      dense
                      sx={{
                        borderRadius: 1.5,
                        py: 0.25,
                        px: 1.5,
                        mt: 0.5,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                      }}
                    >
                      <Typography sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        opacity: 0.4,
                        flex: 1,
                      }}>
                        {section}
                      </Typography>
                      {isCollapsed ? (
                        <ExpandMore sx={{ fontSize: 14, opacity: 0.3 }} />
                      ) : (
                        <ExpandLess sx={{ fontSize: 14, opacity: 0.3 }} />
                      )}
                    </ListItemButton>
                  ) : null}
                  <Collapse in={section === 'Main' || !isCollapsed} timeout={200}>
                    <List disablePadding>
                      {items.map((item, index) => {
                        const active = isActive(item.path);
                        return (
                          <ListItemButton
                            key={index}
                            onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
                            dense
                            sx={{
                              borderRadius: 1.5,
                              mb: 0.15,
                              py: 0.5,
                              px: 1.5,
                              minHeight: 36,
                              bgcolor: active ? `${colors.accent}22` : 'transparent',
                              borderLeft: active ? `3px solid ${colors.accent}` : '3px solid transparent',
                              '&:hover': { bgcolor: active ? `${colors.accent}30` : 'rgba(255,255,255,0.06)' },
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <ListItemIcon sx={{
                              color: active ? colors.accent : 'rgba(255,255,255,0.45)',
                              minWidth: 30,
                              '& .MuiSvgIcon-root': { fontSize: 18 },
                            }}>
                              {item.icon}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.label}
                              sx={{
                                '& .MuiTypography-root': {
                                  fontSize: 12.5,
                                  fontWeight: active ? 600 : 400,
                                  color: active ? 'white' : 'rgba(255,255,255,0.7)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                },
                              }}
                            />
                            {item.badge && item.badge > 0 && (
                              <Chip
                                label={item.badge}
                                size="small"
                                sx={{
                                  height: 18, fontSize: 10, minWidth: 18,
                                  bgcolor: colors.accent, color: 'white', fontWeight: 700,
                                  '& .MuiChip-label': { px: 0.5 },
                                }}
                              />
                            )}
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                </Box>
              );
            })}
          </Box>

          {/* Bottom - Sign Out */}
          <Box sx={{ flexShrink: 0, px: 1, pb: 1.5, pt: 0.5 }}>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 0.5 }} />
            <ListItemButton
              onClick={logout}
              dense
              sx={{
                borderRadius: 1.5,
                py: 0.6,
                px: 1.5,
                '&:hover': { bgcolor: 'rgba(255,70,70,0.12)' },
              }}
            >
              <ListItemIcon sx={{ color: '#ef5350', minWidth: 30 }}>
                <LogoutIcon sx={{ fontSize: 18 }} />
              </ListItemIcon>
              <ListItemText
                primary="Sign Out"
                sx={{ '& .MuiTypography-root': { fontSize: 12.5, fontWeight: 500, color: '#ef9a9a' } }}
              />
            </ListItemButton>
          </Box>
        </Box>
      </Drawer>

      {/* Main Area */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: appbarColors.bg,
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            color: appbarColors.text,
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)} size="small" sx={{ color: appbarColors.text }}>
              <MenuIcon />
            </IconButton>

            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 18, color: appbarColors.text }}>
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
                width: 300, borderRadius: 3, border: `1px solid ${theme.palette.divider}`,
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
              <IconButton size="small" sx={{ color: appbarColors.text }}><HelpIcon /></IconButton>
            </Tooltip>

            {/* Dark/Light Mode Toggle */}
            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={toggleTheme} size="small" sx={{ color: appbarColors.text }}>
                {isDark ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            {/* Theme Variant Selector */}
            <Tooltip title="Change Theme">
              <IconButton onClick={(e) => setThemeMenuAnchor(e.currentTarget)} size="small" sx={{ color: appbarColors.text }}>
                <PaletteIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={themeMenuAnchor}
              open={!!themeMenuAnchor}
              onClose={() => setThemeMenuAnchor(null)}
              PaperProps={{ sx: { width: 240, borderRadius: 3 } }}
            >
              <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>Theme Variant</Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Customize your experience</Typography>
              </Box>
              {(Object.keys(themeVariants) as ThemeVariant[]).map((v) => (
                <MenuItem
                  key={v}
                  onClick={() => { setVariant(v); setThemeMenuAnchor(null); }}
                  selected={variant === v}
                  sx={{ py: 1, px: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>{variantIcons[v]}</ListItemIcon>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: variant === v ? 700 : 500 }}>
                      {themeVariants[v].label}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                      {themeVariants[v].description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>

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
              <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
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
              <Box sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
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
                sx={{
                  bgcolor: isDark ? alpha(theme.palette.primary.main, 0.15) : '#e3f2fd',
                  color: theme.palette.primary.main,
                  fontWeight: 600, fontSize: 11, display: { xs: 'none', md: 'flex' },
                }}
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
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
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

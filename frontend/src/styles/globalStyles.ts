/**
 * Global Styles - Comprehensive CSS-in-JS styles, mixins, keyframes,
 * and utility classes for the CancerGuard AI platform.
 */

import { Theme } from '@mui/material/styles';
import { keyframes, css } from '@emotion/react';

// ============================================================================
// Keyframe Animations
// ============================================================================

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const fadeInDown = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const fadeInLeft = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
`;

export const fadeInRight = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

export const slideInUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

export const slideInDown = keyframes`
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
`;

export const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

export const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

export const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(21, 101, 192, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(21, 101, 192, 0); }
  100% { box-shadow: 0 0 0 0 rgba(21, 101, 192, 0); }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-15px); }
  60% { transform: translateY(-7px); }
`;

export const heartbeat = keyframes`
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
`;

export const ripple = keyframes`
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
`;

export const typewriter = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

export const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

export const waveAnimation = keyframes`
  0% { transform: translateX(0) translateZ(0) scaleY(1); }
  50% { transform: translateX(-25%) translateZ(0) scaleY(0.55); }
  100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
`;

// ============================================================================
// Style Mixins (as SX props)
// ============================================================================

export const glassMixin = (opacity: number = 0.1) => ({
  background: `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
});

export const glassMixinDark = (opacity: number = 0.15) => ({
  background: `rgba(0, 0, 0, ${opacity})`,
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
});

export const cardElevation = (level: number = 1) => {
  const shadows = {
    0: 'none',
    1: '0 2px 8px rgba(0,0,0,0.08)',
    2: '0 4px 16px rgba(0,0,0,0.12)',
    3: '0 8px 32px rgba(0,0,0,0.16)',
    4: '0 16px 48px rgba(0,0,0,0.20)',
  };
  return { boxShadow: shadows[level as keyof typeof shadows] || shadows[1] };
};

export const textGradient = (gradient: string) => ({
  background: gradient,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
});

export const hoverLift = {
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
};

export const hoverScale = {
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
};

export const hoverGlow = (color: string = '#1565c0') => ({
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: `0 0 20px ${color}40`,
  },
});

export const truncateText = (lines: number = 1) => ({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  ...(lines === 1
    ? { whiteSpace: 'nowrap' as const }
    : {
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical' as const,
      }),
});

export const scrollbarStyle = (width: number = 6) => ({
  '&::-webkit-scrollbar': { width: `${width}px` },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: `${width / 2}px`,
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: 'rgba(0,0,0,0.3)',
  },
  scrollbarWidth: 'thin' as const,
});

export const absoluteCenter = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
};

export const flexCenter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const flexBetween = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const flexColumn = {
  display: 'flex',
  flexDirection: 'column' as const,
};

// ============================================================================
// Gradient Presets
// ============================================================================

export const gradients = {
  primary: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
  secondary: 'linear-gradient(135deg, #00897b 0%, #00695c 100%)',
  accent: 'linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)',
  success: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
  warning: 'linear-gradient(135deg, #f57f17 0%, #e65100 100%)',
  danger: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
  info: 'linear-gradient(135deg, #0277bd 0%, #01579b 100%)',
  cool: 'linear-gradient(135deg, #1565c0 0%, #00897b 100%)',
  warm: 'linear-gradient(135deg, #ff6f00 0%, #e65100 100%)',
  sunset: 'linear-gradient(135deg, #ff6f00 0%, #c62828 100%)',
  ocean: 'linear-gradient(135deg, #0277bd 0%, #00695c 100%)',
  aurora: 'linear-gradient(135deg, #7b1fa2 0%, #0277bd 50%, #00897b 100%)',
  dark: 'linear-gradient(135deg, #263238 0%, #37474f 100%)',
  light: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
  medical: 'linear-gradient(135deg, #1565c0 0%, #00897b 100%)',
  health: 'linear-gradient(135deg, #2e7d32 0%, #00897b 100%)',
  emergency: 'linear-gradient(135deg, #c62828 0%, #ff6f00 100%)',
  genomic: 'linear-gradient(135deg, #7b1fa2 0%, #1565c0 100%)',
};

// ============================================================================
// Risk Level Colors
// ============================================================================

export const riskColors = {
  critical: { main: '#b71c1c', light: '#ffcdd2', text: '#fff' },
  high: { main: '#c62828', light: '#ef9a9a', text: '#fff' },
  elevated: { main: '#e65100', light: '#ffcc80', text: '#fff' },
  moderate: { main: '#f57f17', light: '#fff59d', text: '#000' },
  low: { main: '#2e7d32', light: '#a5d6a7', text: '#fff' },
  minimal: { main: '#1b5e20', light: '#c8e6c9', text: '#fff' },
};

// ============================================================================
// Status Colors
// ============================================================================

export const statusColors = {
  active: '#2e7d32',
  inactive: '#9e9e9e',
  pending: '#f57f17',
  completed: '#1565c0',
  cancelled: '#c62828',
  in_progress: '#0277bd',
  scheduled: '#7b1fa2',
  overdue: '#e65100',
  draft: '#78909c',
};

// ============================================================================
// Responsive Breakpoints (matching MUI)
// ============================================================================

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

export const mediaQuery = {
  xs: `@media (max-width: ${breakpoints.sm - 1}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  md: `@media (min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  mobile: `@media (max-width: ${breakpoints.sm - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.lg}px)`,
};

// ============================================================================
// Page Layout Styles
// ============================================================================

export const pageContainer = {
  minHeight: '100vh',
  padding: { xs: 2, sm: 3, md: 4 },
  maxWidth: 1400,
  margin: '0 auto',
};

export const pageHeader = {
  mb: { xs: 2, md: 4 },
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' } as const,
  alignItems: { xs: 'flex-start', md: 'center' },
  justifyContent: 'space-between',
  gap: 2,
};

export const sectionStyles = {
  mb: 4,
  p: { xs: 2, md: 3 },
  borderRadius: 3,
  ...cardElevation(1),
};

// ============================================================================
// Component Style Presets
// ============================================================================

export const dashboardCard = (theme: Theme) => ({
  p: 3,
  borderRadius: 3,
  height: '100%',
  transition: 'all 0.3s ease',
  border: `1px solid ${theme.palette.divider}`,
  ...hoverLift,
});

export const statCard = (color: string) => ({
  p: 3,
  borderRadius: 3,
  background: `linear-gradient(135deg, ${color}08 0%, ${color}15 100%)`,
  border: `1px solid ${color}30`,
  position: 'relative' as const,
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: `${color}10`,
  },
});

export const metricValue = {
  fontSize: { xs: '1.5rem', md: '2rem' },
  fontWeight: 700,
  lineHeight: 1.2,
};

export const metricLabel = {
  fontSize: '0.875rem',
  color: 'text.secondary',
  fontWeight: 500,
  mt: 0.5,
};

export const chipStyles = {
  borderRadius: 2,
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 28,
};

export const iconButton = (color: string) => ({
  width: 40,
  height: 40,
  borderRadius: 2,
  background: `${color}10`,
  color: color,
  '&:hover': {
    background: `${color}20`,
  },
});

export const tableHeader = (theme: Theme) => ({
  '& .MuiTableHead-root': {
    '& .MuiTableCell-head': {
      fontWeight: 700,
      fontSize: '0.75rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: theme.palette.text.secondary,
      borderBottom: `2px solid ${theme.palette.divider}`,
      py: 2,
    },
  },
});

export const searchInput = (theme: Theme) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    '& fieldset': {
      borderColor: 'transparent',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
});

export const filterChip = (active: boolean, theme: Theme) => ({
  borderRadius: 3,
  border: `1px solid ${active ? theme.palette.primary.main : theme.palette.divider}`,
  background: active ? `${theme.palette.primary.main}10` : 'transparent',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  fontWeight: active ? 600 : 400,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    background: `${theme.palette.primary.main}08`,
  },
});

// ============================================================================
// Loading & Skeleton Styles
// ============================================================================

export const loadingOverlay = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.8)',
  backdropFilter: 'blur(4px)',
  zIndex: 10,
};

export const skeletonPulse = {
  background: `linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)`,
  backgroundSize: '200% 100%',
  animation: `${shimmer} 1.5s ease-in-out infinite`,
  borderRadius: 1,
};

// ============================================================================
// Form Styles
// ============================================================================

export const formSection = {
  p: 3,
  mb: 3,
  borderRadius: 3,
  border: '1px solid',
  borderColor: 'divider',
};

export const formLabel = {
  fontWeight: 600,
  fontSize: '0.875rem',
  mb: 0.5,
  color: 'text.primary',
};

export const formHelperText = {
  fontSize: '0.75rem',
  color: 'text.secondary',
  mt: 0.5,
};

// ============================================================================
// Medical-Specific Styles
// ============================================================================

export const vitalSignBadge = (status: 'normal' | 'warning' | 'critical') => {
  const colors = {
    normal: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
    warning: { bg: '#fff3e0', text: '#e65100', border: '#ffcc80' },
    critical: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
  };
  const c = colors[status];
  return {
    px: 1.5,
    py: 0.5,
    borderRadius: 2,
    backgroundColor: c.bg,
    color: c.text,
    border: `1px solid ${c.border}`,
    fontSize: '0.75rem',
    fontWeight: 600,
  };
};

export const timelineConnector = {
  position: 'relative' as const,
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 20,
    top: 40,
    bottom: 0,
    width: 2,
    backgroundColor: 'divider',
  },
};

export const progressRing = (size: number, strokeWidth: number, progress: number, color: string) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: `conic-gradient(${color} ${progress * 3.6}deg, #e0e0e0 0deg)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: '""',
    width: size - strokeWidth * 2,
    height: size - strokeWidth * 2,
    borderRadius: '50%',
    backgroundColor: 'background.paper',
  },
});

// ============================================================================
// Global Style Overrides
// ============================================================================

export const globalStyles = {
  '*': {
    boxSizing: 'border-box',
    margin: 0,
    padding: 0,
  },
  'html, body': {
    height: '100%',
    fontFamily: '"Inter", "system-ui", sans-serif',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  '#root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  'a': {
    textDecoration: 'none',
    color: 'inherit',
  },
  ':focus-visible': {
    outline: '2px solid #1565c0',
    outlineOffset: 2,
  },
  '.animate-fade-in': {
    animation: `${fadeIn} 0.3s ease-in-out`,
  },
  '.animate-slide-up': {
    animation: `${fadeInUp} 0.4s ease-out`,
  },
  '.animate-pulse': {
    animation: `${pulse} 2s ease-in-out infinite`,
  },
  '.animate-float': {
    animation: `${float} 3s ease-in-out infinite`,
  },
};

export default globalStyles;

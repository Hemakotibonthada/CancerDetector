import { createTheme, alpha } from '@mui/material';

declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    glass: { main: string; light: string; dark: string };
  }
  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
    glass?: { main: string; light: string; dark: string };
  }
}

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1565c0', light: '#5e92f3', dark: '#003c8f' },
    secondary: { main: '#00897b', light: '#4ebaaa', dark: '#005b4f' },
    tertiary: { main: '#7b1fa2', light: '#ae52d4', dark: '#4a0072' },
    error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
    warning: { main: '#f57c00', light: '#ff9800', dark: '#e65100' },
    success: { main: '#388e3c', light: '#4caf50', dark: '#2e7d32' },
    info: { main: '#0288d1', light: '#03a9f4', dark: '#01579b' },
    background: { default: '#f0f4f8', paper: '#ffffff' },
    glass: { main: 'rgba(255,255,255,0.72)', light: 'rgba(255,255,255,0.88)', dark: 'rgba(255,255,255,0.48)' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.025em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    body2: { lineHeight: 1.7 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          padding: '10px 24px',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.16)', transform: 'translateY(-1px)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 6px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.05)',
          transition: 'all 0.25s ease',
          '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s',
            '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    ...lightTheme.palette,
    mode: 'dark',
    primary: { main: '#5e92f3', light: '#90caf9', dark: '#1565c0' },
    secondary: { main: '#4ebaaa', light: '#80cbc4', dark: '#00897b' },
    tertiary: { main: '#ae52d4', light: '#ce93d8', dark: '#7b1fa2' },
    background: { default: '#0a1929', paper: '#132f4c' },
    glass: { main: 'rgba(19,47,76,0.72)', light: 'rgba(19,47,76,0.88)', dark: 'rgba(19,47,76,0.48)' },
  },
});

// Glassmorphism mixin
export const glassMixin = (opacity = 0.72) => ({
  background: `rgba(255,255,255,${opacity})`,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.18)',
});

// Gradient presets
export const gradients = {
  primary: 'linear-gradient(135deg, #1565c0 0%, #5e92f3 100%)',
  secondary: 'linear-gradient(135deg, #00897b 0%, #4ebaaa 100%)',
  tertiary: 'linear-gradient(135deg, #7b1fa2 0%, #ae52d4 100%)',
  danger: 'linear-gradient(135deg, #c62828 0%, #ef5350 100%)',
  warning: 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)',
  success: 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)',
  dark: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 100%)',
  ocean: 'linear-gradient(135deg, #0d47a1 0%, #00bcd4 100%)',
  sunset: 'linear-gradient(135deg, #ff6f00 0%, #ff1744 100%)',
  aurora: 'linear-gradient(135deg, #1a237e 0%, #00e676 100%)',
  cosmic: 'linear-gradient(135deg, #311b92 0%, #e040fb 100%)',
  health: 'linear-gradient(135deg, #00695c 0%, #66bb6a 100%)',
};

export const riskColors: Record<string, string> = {
  very_low: '#4caf50',
  low: '#8bc34a',
  moderate: '#ff9800',
  high: '#f44336',
  very_high: '#d32f2f',
  critical: '#b71c1c',
  not_assessed: '#9e9e9e',
};

export const getRiskColor = (level: string) => riskColors[level] || '#9e9e9e';
export const getRiskLabel = (level: string) => level ? level.replace(/_/g, ' ').toUpperCase() : 'NOT ASSESSED';

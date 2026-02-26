import { createTheme, alpha } from '@mui/material/styles';
type PaletteMode = 'light' | 'dark';
import { keyframes } from '@mui/system';

// ==================== Animation Keyframes ====================

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

export const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

export const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.6); }
`;

export const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

export const breathe = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;

export const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export const slideInUp = keyframes`
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const bounceIn = keyframes`
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
`;

export const ripple = keyframes`
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
`;

// ==================== Color Palette ====================

const primaryColor = '#667eea';
const secondaryColor = '#764ba2';

const palette = {
  primary: {
    50: '#ede7f6',
    100: '#d1c4e9',
    200: '#b39ddb',
    300: '#9575cd',
    400: '#7e57c2',
    500: primaryColor,
    600: '#5c6bc0',
    700: '#512da8',
    800: '#4527a0',
    900: '#311b92',
    main: primaryColor,
    light: '#9fa8da',
    dark: '#512da8',
    contrastText: '#ffffff',
  },
  secondary: {
    50: '#fce4ec',
    100: '#f8bbd0',
    200: '#f48fb1',
    300: '#f06292',
    400: '#ec407a',
    500: secondaryColor,
    600: '#d81b60',
    700: '#c2185b',
    800: '#ad1457',
    900: '#880e4f',
    main: secondaryColor,
    light: '#ba68c8',
    dark: '#6a1b9a',
    contrastText: '#ffffff',
  },
  success: {
    main: '#4caf50',
    light: '#e8f5e9',
    dark: '#2e7d32',
  },
  warning: {
    main: '#ff9800',
    light: '#fff3e0',
    dark: '#e65100',
  },
  error: {
    main: '#f44336',
    light: '#ffebee',
    dark: '#c62828',
  },
  info: {
    main: '#2196f3',
    light: '#e3f2fd',
    dark: '#1565c0',
  },
};

// ==================== Common Theme Options ====================

const commonThemeOptions = {
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.6,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.938rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.813rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.02em',
    },
    overline: {
      fontSize: '0.688rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none' as const,
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
  },
};

// ==================== Component Overrides ====================

const getComponentOverrides = (mode: PaletteMode) => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin' as const,
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: mode === 'light' ? '#f5f5f5' : '#1a1a2e',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: mode === 'light' ? '#bdbdbd' : '#4a5568',
          borderRadius: '4px',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        padding: '8px 20px',
        fontWeight: 600,
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },
      contained: {
        boxShadow: '0 4px 14px rgba(102, 126, 234, 0.25)',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
        },
      },
      outlined: {
        borderWidth: 2,
        '&:hover': {
          borderWidth: 2,
        },
      },
    },
    defaultProps: {
      disableElevation: true,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#2d3748'}`,
        boxShadow: mode === 'light'
          ? '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)'
          : '0 1px 3px rgba(0,0,0,0.3)',
        transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: mode === 'light'
            ? '0 10px 25px rgba(0,0,0,0.08)'
            : '0 10px 25px rgba(0,0,0,0.4)',
          transform: 'translateY(-2px)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      },
      elevation2: {
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
      },
      elevation3: {
        boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 10,
          transition: 'all 200ms ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: primaryColor,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 600,
        fontSize: '0.75rem',
      },
      filled: {
        '&.MuiChip-colorSuccess': {
          background: '#e8f5e9',
          color: '#2e7d32',
        },
        '&.MuiChip-colorWarning': {
          background: '#fff3e0',
          color: '#e65100',
        },
        '&.MuiChip-colorError': {
          background: '#ffebee',
          color: '#c62828',
        },
        '&.MuiChip-colorInfo': {
          background: '#e3f2fd',
          color: '#1565c0',
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 8,
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: '6px 12px',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 20,
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRadius: 0,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        borderBottom: `1px solid ${mode === 'light' ? '#e2e8f0' : '#2d3748'}`,
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        fontWeight: 600,
        textTransform: 'none' as const,
        minHeight: 48,
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
        backgroundColor: mode === 'light' ? '#e2e8f0' : '#2d3748',
      },
      bar: {
        borderRadius: 4,
        background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        fontWeight: 500,
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      root: {
        width: 48,
        height: 26,
        padding: 0,
      },
      switchBase: {
        padding: 2,
        '&.Mui-checked': {
          transform: 'translateX(22px)',
          '& + .MuiSwitch-track': {
            opacity: 1,
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          },
        },
      },
      thumb: {
        width: 22,
        height: 22,
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      },
      track: {
        borderRadius: 13,
        opacity: 1,
        backgroundColor: mode === 'light' ? '#e0e0e0' : '#4a5568',
      },
    },
  },
  MuiAvatar: {
    styleOverrides: {
      root: {
        fontWeight: 600,
      },
      colorDefault: {
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        color: '#fff',
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        fontWeight: 700,
        fontSize: '0.65rem',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        fontWeight: 700,
        fontSize: '0.75rem',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        color: mode === 'light' ? '#718096' : '#a0aec0',
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        boxShadow: '0 4px 14px rgba(102,126,234,0.4)',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(102,126,234,0.5)',
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 10,
        marginBottom: 2,
        '&.Mui-selected': {
          backgroundColor: alpha(primaryColor, 0.08),
          '&:hover': {
            backgroundColor: alpha(primaryColor, 0.12),
          },
        },
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: mode === 'light' ? '#e2e8f0' : '#2d3748',
      },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
});

// ==================== Light Theme ====================

export const lightTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'light',
    ...palette,
    background: {
      default: '#f7f8fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#718096',
    },
    divider: '#e2e8f0',
  },
  components: getComponentOverrides('light'),
});

// ==================== Dark Theme ====================

export const darkTheme = createTheme({
  ...commonThemeOptions,
  palette: {
    mode: 'dark',
    ...palette,
    background: {
      default: '#0f0f1a',
      paper: '#1a1a2e',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#a0aec0',
    },
    divider: '#2d3748',
  },
  components: getComponentOverrides('dark'),
});

// ==================== Theme Helpers ====================

export const gradients = {
  primary: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
  primaryHorizontal: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
  success: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
  warning: 'linear-gradient(135deg, #ff9800 0%, #e65100 100%)',
  error: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
  info: 'linear-gradient(135deg, #2196f3 0%, #1565c0 100%)',
  ocean: 'linear-gradient(135deg, #667eea 0%, #00bcd4 100%)',
  sunset: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  forest: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  aurora: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  midnight: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  glass: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
};

export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  cardHover: '0 10px 25px rgba(0,0,0,0.08)',
  button: '0 4px 14px rgba(102, 126, 234, 0.25)',
  buttonHover: '0 6px 20px rgba(102, 126, 234, 0.35)',
  modal: '0 25px 50px rgba(0,0,0,0.15)',
  colored: '0 10px 30px rgba(102, 126, 234, 0.3)',
  dropdown: '0 10px 40px rgba(0,0,0,0.1)',
};

export const animations = {
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  pulseGlow,
  shimmer,
  float,
  breathe,
  gradientShift,
  slideInUp,
  spinAnimation,
  bounceIn,
  ripple,
};

export type ThemeMode = 'light' | 'dark';
export { primaryColor, secondaryColor };
export default lightTheme;

// ============================================================================
// Theme Context - Comprehensive theme management with multiple theme variants
// ============================================================================
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, PaletteMode, alpha } from '@mui/material';

// ============================================================================
// THEME VARIANTS
// ============================================================================
export type ThemeVariant = 'default' | 'ocean' | 'emerald' | 'sunset' | 'midnight' | 'clinical';

interface ThemeDefinition {
  label: string;
  description: string;
  light: {
    primary: { main: string; light: string; dark: string };
    secondary: { main: string; light: string; dark: string };
    background: { default: string; paper: string };
    sidebar: { bg: string; text: string; accent: string };
    appbar: { bg: string; text: string };
  };
  dark: {
    primary: { main: string; light: string; dark: string };
    secondary: { main: string; light: string; dark: string };
    background: { default: string; paper: string };
    sidebar: { bg: string; text: string; accent: string };
    appbar: { bg: string; text: string };
  };
}

export const themeVariants: Record<ThemeVariant, ThemeDefinition> = {
  default: {
    label: 'CancerGuard Blue',
    description: 'Professional healthcare blue',
    light: {
      primary: { main: '#1565c0', light: '#5e92f3', dark: '#003c8f' },
      secondary: { main: '#00897b', light: '#4ebaaa', dark: '#005b4f' },
      background: { default: '#f0f4f8', paper: '#ffffff' },
      sidebar: { bg: 'linear-gradient(180deg, #0d1b2a 0%, #1b2838 100%)', text: '#ffffff', accent: '#5e92f3' },
      appbar: { bg: 'rgba(255,255,255,0.88)', text: '#1a1a2e' },
    },
    dark: {
      primary: { main: '#5e92f3', light: '#90caf9', dark: '#1565c0' },
      secondary: { main: '#4ebaaa', light: '#80cbc4', dark: '#00897b' },
      background: { default: '#0a1929', paper: '#132f4c' },
      sidebar: { bg: 'linear-gradient(180deg, #060e1a 0%, #0d1b2a 100%)', text: '#ffffff', accent: '#5e92f3' },
      appbar: { bg: 'rgba(10,25,41,0.92)', text: '#e2e8f0' },
    },
  },
  ocean: {
    label: 'Ocean Teal',
    description: 'Calming ocean-inspired teal',
    light: {
      primary: { main: '#0097a7', light: '#56c8d8', dark: '#006978' },
      secondary: { main: '#5c6bc0', light: '#8e99f3', dark: '#26418f' },
      background: { default: '#ecf7f8', paper: '#ffffff' },
      sidebar: { bg: 'linear-gradient(180deg, #004d57 0%, #00838f 100%)', text: '#ffffff', accent: '#4dd0e1' },
      appbar: { bg: 'rgba(236,247,248,0.92)', text: '#004d57' },
    },
    dark: {
      primary: { main: '#4dd0e1', light: '#88ffff', dark: '#009faf' },
      secondary: { main: '#9fa8da', light: '#d1d9ff', dark: '#6f79a8' },
      background: { default: '#0a1a1e', paper: '#0f2b30' },
      sidebar: { bg: 'linear-gradient(180deg, #061214 0%, #0a1a1e 100%)', text: '#ffffff', accent: '#4dd0e1' },
      appbar: { bg: 'rgba(10,26,30,0.92)', text: '#e0f7fa' },
    },
  },
  emerald: {
    label: 'Emerald Health',
    description: 'Fresh and natural green',
    light: {
      primary: { main: '#2e7d32', light: '#60ad5e', dark: '#005005' },
      secondary: { main: '#00838f', light: '#4fb3bf', dark: '#005662' },
      background: { default: '#f1f8e9', paper: '#ffffff' },
      sidebar: { bg: 'linear-gradient(180deg, #1b3e1f 0%, #2e7d32 100%)', text: '#ffffff', accent: '#69f0ae' },
      appbar: { bg: 'rgba(241,248,233,0.92)', text: '#1b5e20' },
    },
    dark: {
      primary: { main: '#69f0ae', light: '#9fffe0', dark: '#2bbd7e' },
      secondary: { main: '#80deea', light: '#b4ffff', dark: '#4bacb8' },
      background: { default: '#0a1f0d', paper: '#142a16' },
      sidebar: { bg: 'linear-gradient(180deg, #061208 0%, #0a1f0d 100%)', text: '#ffffff', accent: '#69f0ae' },
      appbar: { bg: 'rgba(10,31,13,0.92)', text: '#c8e6c9' },
    },
  },
  sunset: {
    label: 'Warm Sunset',
    description: 'Warm and inviting tones',
    light: {
      primary: { main: '#e65100', light: '#ff833a', dark: '#ac1900' },
      secondary: { main: '#6d4c41', light: '#9c786c', dark: '#40241a' },
      background: { default: '#fff3e0', paper: '#ffffff' },
      sidebar: { bg: 'linear-gradient(180deg, #4e2600 0%, #bf360c 100%)', text: '#ffffff', accent: '#ffab40' },
      appbar: { bg: 'rgba(255,243,224,0.92)', text: '#4e2600' },
    },
    dark: {
      primary: { main: '#ffab40', light: '#ffdd71', dark: '#c77c02' },
      secondary: { main: '#a1887f', light: '#d3b8ae', dark: '#725b53' },
      background: { default: '#1a0e05', paper: '#2a1a0e' },
      sidebar: { bg: 'linear-gradient(180deg, #0f0802 0%, #1a0e05 100%)', text: '#ffffff', accent: '#ffab40' },
      appbar: { bg: 'rgba(26,14,5,0.92)', text: '#ffe0b2' },
    },
  },
  midnight: {
    label: 'Midnight Purple',
    description: 'Deep and modern purple',
    light: {
      primary: { main: '#5e35b1', light: '#9162e4', dark: '#280680' },
      secondary: { main: '#00897b', light: '#4ebaaa', dark: '#005b4f' },
      background: { default: '#f3f0ff', paper: '#ffffff' },
      sidebar: { bg: 'linear-gradient(180deg, #1a0a3e 0%, #311b92 100%)', text: '#ffffff', accent: '#b388ff' },
      appbar: { bg: 'rgba(243,240,255,0.92)', text: '#1a0a3e' },
    },
    dark: {
      primary: { main: '#b388ff', light: '#e7b9ff', dark: '#805acb' },
      secondary: { main: '#4ebaaa', light: '#80cbc4', dark: '#00897b' },
      background: { default: '#0e0a1a', paper: '#1a1232' },
      sidebar: { bg: 'linear-gradient(180deg, #08050f 0%, #0e0a1a 100%)', text: '#ffffff', accent: '#b388ff' },
      appbar: { bg: 'rgba(14,10,26,0.92)', text: '#e1d5ff' },
    },
  },
  clinical: {
    label: 'Clinical White',
    description: 'Clean clinical environment',
    light: {
      primary: { main: '#1976d2', light: '#63a4ff', dark: '#004ba0' },
      secondary: { main: '#455a64', light: '#718792', dark: '#1c313a' },
      background: { default: '#fafafa', paper: '#ffffff' },
      sidebar: { bg: 'linear-gradient(180deg, #37474f 0%, #546e7a 100%)', text: '#ffffff', accent: '#64b5f6' },
      appbar: { bg: 'rgba(255,255,255,0.95)', text: '#37474f' },
    },
    dark: {
      primary: { main: '#64b5f6', light: '#9be7ff', dark: '#2286c3' },
      secondary: { main: '#90a4ae', light: '#c1d5e0', dark: '#62757f' },
      background: { default: '#121212', paper: '#1e1e1e' },
      sidebar: { bg: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)', text: '#ffffff', accent: '#64b5f6' },
      appbar: { bg: 'rgba(18,18,18,0.95)', text: '#e0e0e0' },
    },
  },
};

// ============================================================================
// THEME BUILDER
// ============================================================================
const buildTheme = (mode: PaletteMode, variant: ThemeVariant): Theme => {
  const v = themeVariants[variant];
  const colors = mode === 'light' ? v.light : v.dark;

  return createTheme({
    palette: {
      mode,
      primary: colors.primary,
      secondary: colors.secondary,
      tertiary: { main: '#7b1fa2', light: '#ae52d4', dark: '#4a0072' },
      error: { main: '#d32f2f', light: '#ef5350', dark: '#c62828' },
      warning: { main: '#f57c00', light: '#ff9800', dark: '#e65100' },
      success: { main: '#388e3c', light: '#4caf50', dark: '#2e7d32' },
      info: { main: '#0288d1', light: '#03a9f4', dark: '#01579b' },
      background: colors.background,
      glass: mode === 'light'
        ? { main: 'rgba(255,255,255,0.72)', light: 'rgba(255,255,255,0.88)', dark: 'rgba(255,255,255,0.48)' }
        : { main: 'rgba(19,47,76,0.72)', light: 'rgba(19,47,76,0.88)', dark: 'rgba(19,47,76,0.48)' },
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
            boxShadow: mode === 'light'
              ? '0 2px 8px rgba(0,0,0,0.12)'
              : '0 2px 8px rgba(0,0,0,0.4)',
            '&:hover': {
              boxShadow: mode === 'light'
                ? '0 4px 16px rgba(0,0,0,0.16)'
                : '0 4px 16px rgba(0,0,0,0.5)',
              transform: 'translateY(-1px)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 16,
            boxShadow: mode === 'light'
              ? '0 1px 6px rgba(0,0,0,0.06), 0 2px 12px rgba(0,0,0,0.04)'
              : '0 1px 6px rgba(0,0,0,0.3), 0 2px 12px rgba(0,0,0,0.2)',
            border: mode === 'light'
              ? '1px solid rgba(0,0,0,0.05)'
              : '1px solid rgba(255,255,255,0.06)',
            transition: 'all 0.25s ease',
            '&:hover': {
              boxShadow: mode === 'light'
                ? '0 4px 20px rgba(0,0,0,0.08)'
                : '0 4px 20px rgba(0,0,0,0.4)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 12,
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } } },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              transition: 'all 0.2s',
              '&:hover': {
                boxShadow: mode === 'light'
                  ? '0 2px 8px rgba(0,0,0,0.06)'
                  : '0 2px 8px rgba(0,0,0,0.3)',
              },
            },
          },
        },
      },
      MuiTab: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 20, backgroundImage: 'none' } } },
      MuiDrawer: { styleOverrides: { paper: { borderRadius: 0 } } },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.8rem',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            borderRadius: 12,
            border: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : undefined,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
            scrollbarColor: mode === 'dark'
              ? 'rgba(255,255,255,0.15) transparent'
              : 'rgba(0,0,0,0.15) transparent',
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
              borderRadius: 4,
              '&:hover': {
                background: mode === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
              },
            },
          },
        },
      },
    },
  });
};

// ============================================================================
// CONTEXT
// ============================================================================
interface ThemeContextType {
  mode: PaletteMode;
  variant: ThemeVariant;
  toggleTheme: () => void;
  setMode: (mode: PaletteMode) => void;
  setVariant: (variant: ThemeVariant) => void;
  isDark: boolean;
  sidebarColors: { bg: string; text: string; accent: string };
  appbarColors: { bg: string; text: string };
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  variant: 'default',
  toggleTheme: () => {},
  setMode: () => {},
  setVariant: () => {},
  isDark: false,
  sidebarColors: themeVariants.default.light.sidebar,
  appbarColors: themeVariants.default.light.appbar,
});

export const useThemeContext = () => useContext(ThemeContext);

// ============================================================================
// PROVIDER
// ============================================================================
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: PaletteMode;
  defaultVariant?: ThemeVariant;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children, defaultMode = 'light', defaultVariant = 'default',
}) => {
  const [mode, setModeState] = useState<PaletteMode>(() => {
    try {
      const saved = localStorage.getItem('theme-mode');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {}
    return defaultMode;
  });

  const [variant, setVariantState] = useState<ThemeVariant>(() => {
    try {
      const saved = localStorage.getItem('theme-variant') as ThemeVariant;
      if (saved && themeVariants[saved]) return saved;
    } catch {}
    return defaultVariant;
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
    // Update meta theme-color for mobile browsers
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = mode === 'dark'
      ? themeVariants[variant].dark.background.default
      : themeVariants[variant].light.background.default;
    if (meta) meta.setAttribute('content', bg);
  }, [mode, variant]);

  useEffect(() => {
    localStorage.setItem('theme-variant', variant);
  }, [variant]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('theme-mode');
      if (!saved) setModeState(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setMode = useCallback((m: PaletteMode) => setModeState(m), []);
  const setVariant = useCallback((v: ThemeVariant) => {
    if (themeVariants[v]) setVariantState(v);
  }, []);

  const theme = useMemo(() => buildTheme(mode, variant), [mode, variant]);

  const sidebarColors = useMemo(() => {
    const v = themeVariants[variant];
    return mode === 'light' ? v.light.sidebar : v.dark.sidebar;
  }, [mode, variant]);

  const appbarColors = useMemo(() => {
    const v = themeVariants[variant];
    return mode === 'light' ? v.light.appbar : v.dark.appbar;
  }, [mode, variant]);

  const contextValue = useMemo(() => ({
    mode, variant, toggleTheme, setMode, setVariant, isDark: mode === 'dark',
    sidebarColors, appbarColors,
  }), [mode, variant, toggleTheme, setMode, setVariant, sidebarColors, appbarColors]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

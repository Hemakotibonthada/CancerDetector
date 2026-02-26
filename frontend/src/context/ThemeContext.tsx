// ============================================================================
// Theme Context - Dark/Light mode management with persistence
// ============================================================================
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, PaletteMode } from '@mui/material';

// ============================================================================
// THEME CONFIGURATION
// ============================================================================
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#1565c0', light: '#42a5f5', dark: '#0d47a1' },
          secondary: { main: '#00897b', light: '#4db6ac', dark: '#00695c' },
          background: { default: '#f5f7fa', paper: '#ffffff' },
          text: { primary: '#1a1a2e', secondary: '#64748b' },
        }
      : {
          primary: { main: '#42a5f5', light: '#64b5f6', dark: '#1e88e5' },
          secondary: { main: '#4db6ac', light: '#80cbc4', dark: '#00897b' },
          background: { default: '#0a0e1a', paper: '#111827' },
          text: { primary: '#e2e8f0', secondary: '#94a3b8' },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

// ============================================================================
// CONTEXT
// ============================================================================
interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
  setMode: (mode: PaletteMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
  setMode: () => {},
  isDark: false,
});

export const useThemeContext = () => useContext(ThemeContext);

// ============================================================================
// PROVIDER
// ============================================================================
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: PaletteMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children, defaultMode = 'light',
}) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return defaultMode;
  });

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem('theme-mode');
      if (!saved) setMode(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const contextValue = useMemo(() => ({
    mode, toggleTheme, setMode, isDark: mode === 'dark',
  }), [mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

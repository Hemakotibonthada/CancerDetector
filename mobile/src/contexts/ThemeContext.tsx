// ============================================================================
// Mobile Theme Context - Light/Dark mode support for React Native
// ============================================================================
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'system',
  isDark: true,
  toggleTheme: () => {},
  setMode: () => {},
});

export const useThemeContext = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = '@cancerguard_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  // Load saved preference
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setModeState(saved);
        }
      } catch {}
      setLoaded(true);
    })();
  }, []);

  // Save preference when it changes
  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
    }
  }, [mode, loaded]);

  const isDark = useMemo(() => {
    if (mode === 'system') return systemScheme === 'dark';
    return mode === 'dark';
  }, [mode, systemScheme]);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      if (prev === 'system') return isDark ? 'light' : 'dark';
      return prev === 'dark' ? 'light' : 'dark';
    });
  }, [isDark]);

  const setMode = useCallback((m: ThemeMode) => setModeState(m), []);

  const contextValue = useMemo(() => ({
    mode, isDark, toggleTheme, setMode,
  }), [mode, isDark, toggleTheme, setMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;

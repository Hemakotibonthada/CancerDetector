import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  displayLarge: { fontFamily: 'System', fontSize: 57, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 64 },
  displayMedium: { fontFamily: 'System', fontSize: 45, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 52 },
  displaySmall: { fontFamily: 'System', fontSize: 36, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 44 },
  headlineLarge: { fontFamily: 'System', fontSize: 32, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 40 },
  headlineMedium: { fontFamily: 'System', fontSize: 28, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 36 },
  headlineSmall: { fontFamily: 'System', fontSize: 24, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 32 },
  titleLarge: { fontFamily: 'System', fontSize: 22, fontWeight: '500' as const, letterSpacing: 0, lineHeight: 28 },
  titleMedium: { fontFamily: 'System', fontSize: 16, fontWeight: '500' as const, letterSpacing: 0.15, lineHeight: 24 },
  titleSmall: { fontFamily: 'System', fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1, lineHeight: 20 },
  bodyLarge: { fontFamily: 'System', fontSize: 16, fontWeight: '400' as const, letterSpacing: 0.15, lineHeight: 24 },
  bodyMedium: { fontFamily: 'System', fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.25, lineHeight: 20 },
  bodySmall: { fontFamily: 'System', fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.4, lineHeight: 16 },
  labelLarge: { fontFamily: 'System', fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1, lineHeight: 20 },
  labelMedium: { fontFamily: 'System', fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5, lineHeight: 16 },
  labelSmall: { fontFamily: 'System', fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5, lineHeight: 16 },
};

export const colors = {
  // Primary palette
  primary: '#4fc3f7',
  primaryDark: '#0288d1',
  primaryLight: '#81d4fa',

  // Secondary
  secondary: '#7c4dff',
  secondaryDark: '#651fff',

  // Accent colors
  accent: '#00e5ff',
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350',
  info: '#42a5f5',

  // Portal colors
  patientPortal: '#4fc3f7',
  hospitalPortal: '#66bb6a',
  adminPortal: '#7c4dff',

  // Background
  background: '#0a0a1a',
  surface: '#1a1a2e',
  surfaceVariant: '#16213e',
  card: '#1e1e3a',
  cardHover: '#252550',

  // Text
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.7)',
  textTertiary: 'rgba(255,255,255,0.5)',
  textDisabled: 'rgba(255,255,255,0.3)',

  // Borders
  border: 'rgba(255,255,255,0.1)',
  borderLight: 'rgba(255,255,255,0.05)',
  divider: 'rgba(255,255,255,0.08)',

  // Status colors
  statusActive: '#66bb6a',
  statusInactive: '#9e9e9e',
  statusPending: '#ffa726',
  statusCritical: '#ef5350',
  statusScheduled: '#42a5f5',

  // Chart colors
  chart: ['#4fc3f7', '#66bb6a', '#ffa726', '#ef5350', '#7c4dff', '#00e5ff', '#ff6090', '#69f0ae'],

  // Gradients
  gradientPrimary: ['#1a1a2e', '#16213e'] as const,
  gradientCard: ['#1e1e3a', '#252550'] as const,
  gradientAccent: ['#0288d1', '#4fc3f7'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 999,
};

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.error,
    onPrimary: '#000000',
    onSecondary: '#ffffff',
    onBackground: colors.text,
    onSurface: colors.text,
    onError: '#ffffff',
    outline: colors.border,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.card,
      level3: colors.cardHover,
      level4: '#2a2a5a',
      level5: '#303060',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: borderRadius.md,
};

// ============================================================================
// Light Color Palette
// ============================================================================
export const lightColors = {
  // Primary palette
  primary: '#0288d1',
  primaryDark: '#01579b',
  primaryLight: '#4fc3f7',

  // Secondary
  secondary: '#651fff',
  secondaryDark: '#4a148c',

  // Accent colors
  accent: '#0097a7',
  success: '#2e7d32',
  warning: '#f57c00',
  error: '#d32f2f',
  info: '#1565c0',

  // Portal colors
  patientPortal: '#0288d1',
  hospitalPortal: '#2e7d32',
  adminPortal: '#651fff',

  // Background
  background: '#f5f7fa',
  surface: '#ffffff',
  surfaceVariant: '#f0f4f8',
  card: '#ffffff',
  cardHover: '#f5f5f5',

  // Text
  text: '#1a1a2e',
  textSecondary: 'rgba(0,0,0,0.6)',
  textTertiary: 'rgba(0,0,0,0.45)',
  textDisabled: 'rgba(0,0,0,0.26)',

  // Borders
  border: 'rgba(0,0,0,0.12)',
  borderLight: 'rgba(0,0,0,0.06)',
  divider: 'rgba(0,0,0,0.08)',

  // Status colors
  statusActive: '#2e7d32',
  statusInactive: '#757575',
  statusPending: '#f57c00',
  statusCritical: '#d32f2f',
  statusScheduled: '#1565c0',

  // Chart colors
  chart: ['#0288d1', '#2e7d32', '#f57c00', '#d32f2f', '#651fff', '#0097a7', '#e91e63', '#00c853'],

  // Gradients
  gradientPrimary: ['#f5f7fa', '#e8edf2'] as const,
  gradientCard: ['#ffffff', '#fafbfc'] as const,
  gradientAccent: ['#0288d1', '#4fc3f7'] as const,
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary,
    secondary: lightColors.secondary,
    background: lightColors.background,
    surface: lightColors.surface,
    surfaceVariant: lightColors.surfaceVariant,
    error: lightColors.error,
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onBackground: lightColors.text,
    onSurface: lightColors.text,
    onError: '#ffffff',
    outline: lightColors.border,
    elevation: {
      level0: 'transparent',
      level1: lightColors.surface,
      level2: lightColors.card,
      level3: lightColors.cardHover,
      level4: '#e8e8e8',
      level5: '#e0e0e0',
    },
  },
  fonts: configureFonts({ config: fontConfig }),
  roundness: borderRadius.md,
};

// Helper to get colors based on dark mode
export const getColors = (isDark: boolean) => isDark ? colors : lightColors;
export const getTheme = (isDark: boolean) => isDark ? theme : lightTheme;

export type AppTheme = typeof theme;

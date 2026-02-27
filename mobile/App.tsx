import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useThemeContext } from './src/contexts/ThemeContext';
import { getTheme, colors, lightColors } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';

const darkNavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#4fc3f7',
    background: '#0a0a1a',
    card: '#0d0d1f',
    text: '#e0e0e0',
    border: '#1e1e3a',
    notification: '#ef5350',
  },
};

const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0288d1',
    background: '#f5f7fa',
    card: '#ffffff',
    text: '#1a1a2e',
    border: '#e0e0e0',
    notification: '#d32f2f',
  },
};

function AppContent() {
  const { isDark } = useThemeContext();
  const paperTheme = getTheme(isDark);
  const navigationTheme = isDark ? darkNavigationTheme : lightNavigationTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <AuthProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

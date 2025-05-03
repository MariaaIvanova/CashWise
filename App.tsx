import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './ThemeContext';
import AppNavigator from './AppNavigator';
import { StatusBar } from 'react-native';

// Create a non-animating theme
const noAnimationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#5A66C4',
    secondary: '#CBB028',
    surface: '#1B2541',
    background: '#1B2541',
    error: '#FF5252'
  },
  animation: {
    scale: 0 // This disables animations
  }
};

// Define navigation theme
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#5A66C4',
    background: '#1B2541',
    card: '#232F4D',
    text: '#FFFFFF',
    border: 'rgba(255, 255, 255, 0.15)',
    notification: '#FF5252'
  }
};

// Main app component wrapped with ThemeProvider and SafeAreaProvider
export default function App() {
  return (
    <PaperProvider theme={noAnimationTheme}>
      <ThemeProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1B2541" />
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </PaperProvider>
  );
} 
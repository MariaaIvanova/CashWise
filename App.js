import React from 'react';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import AppNavigator from './AppNavigator';
import { ThemeProvider, useTheme } from './ThemeContext';

// Default theme as fallback
const fallbackTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000',
  }
};

// Main app component wrapped with ThemeProvider
export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

// Component that uses the theme context
function ThemedApp() {
  try {
    const { theme } = useTheme();
    const paperTheme = theme || fallbackTheme;
    
    return (
      <PaperProvider theme={paperTheme}>
        <AppNavigator />
      </PaperProvider>
    );
  } catch (error) {
    console.error('Error in ThemedApp:', error);
    
    // If theme fails, use fallback
    return (
      <PaperProvider theme={fallbackTheme}>
        <AppNavigator />
      </PaperProvider>
    );
  }
}

import React, { createContext, useState, useContext } from 'react';
import { DefaultTheme, DarkTheme } from 'react-native-paper';

// Define custom light theme
const CustomLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6200ee',
    accent: '#03dac4',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#000000',
    error: '#B00020',
  },
};

// Define custom dark theme
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#BB86FC',
    accent: '#03dac4',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#ffffff',
    error: '#CF6679',
  },
};

// Create theme context with default values to avoid 'undefined' errors
const defaultContextValue = {
  theme: CustomLightTheme,
  isDarkTheme: false,
  toggleTheme: () => {},
};

// Create the context with default value
const ThemeContext = createContext(defaultContextValue);

// Provider component - simplified with no useColorScheme dependency
export const ThemeProvider = ({ children }) => {
  // Start with light theme by default
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [theme, setTheme] = useState(CustomLightTheme);

  // Toggle theme function with error handling
  const toggleTheme = () => {
    try {
      setIsDarkTheme(previousState => {
        const newIsDarkTheme = !previousState;
        setTheme(newIsDarkTheme ? CustomDarkTheme : CustomLightTheme);
        return newIsDarkTheme;
      });
    } catch (error) {
      console.warn('Error toggling theme:', error);
    }
  };

  // Create a stable context value object
  const contextValue = {
    theme,
    isDarkTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  try {
    const context = useContext(ThemeContext);
    return context || defaultContextValue;
  } catch (error) {
    console.warn('Error in useTheme hook:', error);
    return defaultContextValue;
  }
}; 
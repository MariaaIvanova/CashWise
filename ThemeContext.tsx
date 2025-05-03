import React, { createContext, useContext, useState } from 'react';
import { DefaultTheme } from 'react-native-paper';

// Define our custom theme type
interface CustomTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    onSurface: string;
    placeholder: string;
    disabled: string;
    elevation: {
      level0: string;
      level1: string;
      level2: string;
      level3: string;
    };
  };
}

// Define our custom theme
export const THEME: CustomTheme = {
  colors: {
    ...DefaultTheme.colors,
    primary: '#5A66C4',
    secondary: '#CBB028',
    background: '#1B2541',
    surface: '#1B2541',
    text: '#FFFFFF',
    onSurface: '#FFFFFF',
    placeholder: 'rgba(255, 255, 255, 0.6)',
    disabled: 'rgba(255, 255, 255, 0.38)',
    elevation: {
      level0: '#1B2541',
      level1: '#232F4D',
      level2: '#2B3959',
      level3: '#334365',
    },
  },
};

// Define context interface
interface ThemeContextType {
  theme: CustomTheme;
  toggleTheme: () => void;
}

// Create the context with default values
const ThemeContext = createContext({
  theme: THEME,
  toggleTheme: () => {},
});

// Create the provider component
type ThemeProviderProps = {
  children: any;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState(THEME);

  const toggleTheme = () => {
    // For now, we just have one theme
    setTheme(THEME);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme
export function useTheme() {
  return useContext(ThemeContext);
} 
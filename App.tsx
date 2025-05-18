import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './ThemeContext';
import AppNavigator from './AppNavigator';
import { StatusBar, Platform } from 'react-native';
import NotificationService from './services/NotificationService';
import { auth, database, supabase } from './supabase';

// Create a non-animating theme
const noAnimationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#5A66C4',
    secondary: '#CBB028',
    surface: '#FFFFFF',
    background: '#FFFFFF',
    error: '#FF5252'
  },
  animation: {
    scale: 0 // This disables animations
  }
};

// Define navigation theme
const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: '#5A66C4',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#000000',
    border: 'rgba(0, 0, 0, 0.15)',
    notification: '#FF5252'
  }
};

// Main app component wrapped with ThemeProvider and SafeAreaProvider
export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Get initial session
        const { session, error } = await auth.getSession();
        if (error) throw error;

        // Set initial auth state
        setIsAuthenticated(!!session);

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', {
            event,
            hasSession: !!session,
            userId: session?.user?.id,
            accessToken: !!session?.access_token,
            refreshToken: !!session?.refresh_token
          });
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // Get the latest session to ensure we have the most up-to-date data
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            console.log('Updated session after sign in:', {
              hasSession: !!currentSession,
              userId: currentSession?.user?.id,
              accessToken: !!currentSession?.access_token
            });
            setIsAuthenticated(!!currentSession);
          } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            setIsAuthenticated(false);
          } else if (event === 'INITIAL_SESSION') {
            console.log('Initial session check:', {
              hasSession: !!session,
              userId: session?.user?.id
            });
            setIsAuthenticated(!!session);
          } else {
            // For other events, just update the auth state
            console.log('Other auth event:', event);
            setIsAuthenticated(!!session);
          }
        });

        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    // You might want to show a loading screen here
    return null;
  }

  return (
    <PaperProvider theme={noAnimationTheme}>
      <ThemeProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator isAuthenticated={isAuthenticated} />
        </NavigationContainer>
      </ThemeProvider>
    </PaperProvider>
  );
} 
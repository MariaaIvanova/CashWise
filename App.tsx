import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './ThemeContext';
import AppNavigator from './AppNavigator';
import { StatusBar, Platform, View, Text, TouchableOpacity } from 'react-native';
import NotificationService from './services/NotificationService';
import { auth, database, supabase } from './supabase';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [initError, setInitError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});

  const MAX_RETRIES = 3;
  const INITIAL_TIMEOUT = 5000; // Reduced timeout to 5 seconds

  const getSessionWithRetry = async (timeout: number, attempt: number = 1) => {
    try {
      // Get current user with timeout
      const userTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`getCurrentUser timed out after ${timeout}ms`)), timeout)
      );
      
      const userPromise = auth.getCurrentUser();
      const userResult = await Promise.race([userPromise, userTimeoutPromise]) as any;
      
      const { user, error: userError } = userResult;

      if (userError && !userError.message.includes('Auth session missing')) {
        throw userError;
      }

      // Get session with timeout
      const sessionTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`getSession timed out after ${timeout}ms`)), timeout)
      );
      
      const getSessionPromise = auth.getSession();
      const sessionResult = await Promise.race([getSessionPromise, sessionTimeoutPromise]) as any;
      
      const { session: currentSession, error: sessionError } = sessionResult;

      if (sessionError && !sessionError.message.includes('Auth session missing')) {
        throw sessionError;
      }

      return { session: currentSession, error: null };
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error && 
          !(error instanceof Error && error.message.includes('Auth session missing'))) {
        if (attempt < MAX_RETRIES) {
          const nextTimeout = Math.min(timeout * 1.2, 10000);
          return getSessionWithRetry(nextTimeout, attempt + 1);
        }
        throw error;
      }
      return { session: null, error: null };
    }
  };

  // Helper function to get network info
  const getNetworkInfo = async () => {
    try {
      const response = await fetch('https://tvjrolyteabegukldhln.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': Constants.expoConfig?.extra?.supabaseAnonKey || '',
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.supabaseAnonKey || ''}`
        }
      });
      return {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const clearPersistedSession = async () => {
    try {
      await AsyncStorage.removeItem('supabase.auth.token');
      await AsyncStorage.removeItem('supabase.auth.refreshToken');
      await AsyncStorage.removeItem('supabase.auth.expiresAt');
      await AsyncStorage.removeItem('supabase.auth.user');
    } catch (error) {
      // Silently fail on error clearing persisted session
    }
  };

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      setRetryCount(0);
      setDebugInfo({});
      
      // Try to get session with retry logic
      const { session, error } = await getSessionWithRetry(INITIAL_TIMEOUT);

      if (error) {
        const errorObj = error as { message?: string };
        const errorMessage = errorObj?.message || String(error);
          
        if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          setIsAuthenticated(false);
        } else {
          throw error;
        }
      } else {
        setIsAuthenticated(!!session);
        if (!session) {
          setInitError(null);
        }
      }

      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setIsAuthenticated(!!currentSession);
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!session);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      setInitError(error as Error);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsInitialized(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear any persisted auth state before initializing
    clearPersistedSession().then(() => {
      initializeApp();
    });
  }, []);

  const handleRetry = () => {
    setInitError(null);
    setIsLoading(true);
    setRetryCount(0);
    initializeApp();
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ color: '#5A66C4', fontSize: 16 }}>Loading...</Text>
        {retryCount > 0 && (
          <Text style={{ color: '#666666', fontSize: 14, marginTop: 10 }}>
            Retry attempt {retryCount}/{MAX_RETRIES}
          </Text>
        )}
      </View>
    );
  }

  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ color: '#FF5252', fontSize: 16, textAlign: 'center', padding: 20 }}>
          Error initializing app: {initError.message}
        </Text>
        <Text style={{ color: '#666666', fontSize: 14, textAlign: 'center', padding: 20 }}>
          {retryCount >= MAX_RETRIES 
            ? 'Unable to connect to the server. Please check your internet connection and try again.'
            : 'Retrying connection...'}
        </Text>
        {retryCount >= MAX_RETRIES && (
          <>
            <TouchableOpacity 
              onPress={handleRetry}
              style={{
                backgroundColor: '#5A66C4',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 5,
                marginTop: 20
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Retry Connection</Text>
            </TouchableOpacity>
            <Text style={{ color: '#666666', fontSize: 12, marginTop: 20, padding: 10 }}>
              Debug Info: {JSON.stringify(debugInfo, null, 2)}
            </Text>
          </>
        )}
      </View>
    );
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
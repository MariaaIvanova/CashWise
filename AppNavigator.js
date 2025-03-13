// AppNavigator.js
import React from 'react';
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import LessonScreen from './screens/LessonScreen';
import QuizScreen from './screens/QuizScreen';
import ProfileScreen from './screens/ProfileScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import SplashScreen from './screens/SplashScreen';
import { useTheme } from './ThemeContext';

const Stack = createStackNavigator();

// Default navigation theme in case the theme context is not available
const defaultNavTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: '#6200ee',
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#000000',
    border: '#e0e0e0',
    notification: '#f50057',
  },
};

const AppNavigator = () => {
  // Get theme from context with fallback to default theme
  const themeContext = useTheme();
  const isDarkTheme = themeContext?.isDarkTheme || false;
  
  // Create navigation-specific theme with the required properties
  const navigationTheme = {
    dark: isDarkTheme,
    colors: {
      primary: themeContext?.theme?.colors?.primary || '#6200ee',
      background: themeContext?.theme?.colors?.background || '#f5f5f5',
      card: themeContext?.theme?.colors?.surface || '#ffffff',
      text: themeContext?.theme?.colors?.text || '#000000',
      border: isDarkTheme ? '#333333' : '#e0e0e0',
      notification: themeContext?.theme?.colors?.notification || '#f50057',
    },
  };
  
  const headerBackgroundColor = themeContext?.theme?.colors?.primary || '#6200ee';
  const cardBackgroundColor = themeContext?.theme?.colors?.background || '#f5f5f5';
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerStyle: {
            backgroundColor: headerBackgroundColor,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: { backgroundColor: cardBackgroundColor }
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SignIn" 
          component={SignInScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen} 
          options={{ title: 'Регистрация' }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Финансова Грамотност' }}
        />
        <Stack.Screen 
          name="Lesson" 
          component={LessonScreen} 
          options={({ route }) => ({ title: route.params?.topic || 'Урок' })}
        />
        <Stack.Screen 
          name="Quiz" 
          component={QuizScreen} 
          options={({ route }) => ({ title: `${route.params?.topic || 'Общи познания'} - Тест` })}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{ title: 'Моят профил' }}
        />
        <Stack.Screen 
          name="Leaderboard" 
          component={LeaderboardScreen} 
          options={{ title: 'Класация' }}
        />
        <Stack.Screen 
          name="Feedback" 
          component={FeedbackScreen} 
          options={{ title: 'Обратна връзка' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

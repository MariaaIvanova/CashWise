import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import LessonScreen from './screens/LessonScreen';
import QuizScreen from './screens/QuizScreen';
import CalendarScreen from './screens/CalendarScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import FeedbackScreen from './screens/FeedbackScreen';
import ProfileScreen from './screens/ProfileScreen';

interface LessonRouteParams {
  lessonId: string;
  topic: string;
  description: string;
  topics: {
    title: string;
    content: string;
    image?: string;
    keyPoints?: string[];
  }[];
}

// Define the root stack parameter list
export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  Lesson: LessonRouteParams;
  Quiz: { lessonId: string };
  Calendar: undefined;
  Leaderboard: undefined;
  Feedback: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen as React.ComponentType<any>} />
      <Stack.Screen name="Quiz" component={QuizScreen as React.ComponentType<any>} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
} 
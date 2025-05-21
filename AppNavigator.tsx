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
import ChallengesScreen from './screens/ChallengesScreen';
import InvitationScreen from './screens/InvitationScreen';

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
  isSpecialLesson?: boolean;
}

// Define the root stack parameter list
export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Home: undefined;
  Lesson: LessonRouteParams;
  Quiz: { 
    lessonId: string;
    onComplete?: () => Promise<void>;
    questions?: Array<{
      id: string;
      question: string;
      type: 'single' | 'multiple' | 'matching';
      options: string[];
      correctAnswer: string;
      correctAnswers: string[];
      explanation?: string;
    }>;
  };
  Calendar: undefined;
  Leaderboard: undefined;
  Feedback: undefined;
  Profile: {
    onComplete?: () => Promise<void>;
  };
  Challenges: undefined;
  Invitation: { userId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isAuthenticated: boolean;
}

export default function AppNavigator({ isAuthenticated }: AppNavigatorProps) {
  return (
    <Stack.Navigator
      initialRouteName={isAuthenticated ? "Home" : "SignIn"}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="Invitation" component={InvitationScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen as React.ComponentType<any>} />
      <Stack.Screen name="Quiz" component={QuizScreen as React.ComponentType<any>} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
    </Stack.Navigator>
  );
} 
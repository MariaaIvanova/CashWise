import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, ActivityIndicator } from 'react-native';
import { Title, Paragraph, Button, Card, RadioButton, Text, IconButton, Surface, ProgressBar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeContext';
import { Appbar } from 'react-native-paper';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { auth, database, supabase } from '../supabase';
import BottomNavigationBar, { TabKey } from '../components/BottomNavigationBar';
import { quizService, QuizCompletionData, QuizResult } from '../services/quizService';

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  xp: number;
  streak: number;
  completed_lessons: number;
  completed_quizzes: number;
  social_links: { [key: string]: string };
  created_at: string;
  updated_at: string;
}

interface SocialLinks {
  facebook: string;
  linkedin: string;
  instagram: string;
}

interface ProfileUpdate {
  name?: string;
  age?: number;
  interests?: string[];
  socialLinks?: SocialLinks;
  avatar_url?: string | null;
  xp?: number;
  streak?: number;
  completed_lessons?: number;
  completed_quizzes?: number;
}

interface QuizQuestion {
  question: string;
  type: 'single' | 'multiple' | 'matching';
  options?: string[];
  correctAnswers?: number[];
  pairs?: Array<{
    situation: string;
    answer: string;
  }>;
  explanation?: string;
}

interface RootStackParamList extends ParamListBase {
  Quiz: { lessonId: string };
  Home: undefined;
}

type QuizScreenProps = {
  navigation: NativeStackNavigationProp<import('../AppNavigator').RootStackParamList>;
  route: RouteProp<import('../AppNavigator').RootStackParamList, 'Quiz'>;
};

interface QuizAttempt {
  id: string;
  profile_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  time_taken: number;
  created_at: string;
  personality_type?: string;
}

interface Question {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'matching';
  options: string[];
  correctAnswer: string;
  correctAnswers: string[];
  explanation?: string;
}

interface MatchingPair {
  situation: string;
  answer: string;
}

interface QuizState {
  loading: boolean;
  error: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswer: string | null;
  selectedAnswers: string[];
  matchingAnswers: { [key: string]: string };
  score: number;
  quizCompleted: boolean;
  showResult: boolean;
  timeRemaining: number;
  hasAttemptedTest: boolean;
  loadingAttempts: boolean;
  loadingCompletion: boolean;
  completionData: QuizCompletionData | null;
  answeredCorrectly: boolean;
  currentQuestion: Question | null;
}

export default function QuizScreen({ navigation, route }: QuizScreenProps) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const scrollViewRef = useRef<ScrollView>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [state, setState] = useState<QuizState>({
    loading: true,
    error: null,
    questions: [],
    currentQuestionIndex: 0,
    selectedAnswer: null,
    selectedAnswers: [],
    matchingAnswers: {},
    score: 0,
    quizCompleted: false,
    showResult: false,
    timeRemaining: 60,
    hasAttemptedTest: false,
    loadingAttempts: true,
    loadingCompletion: false,
    completionData: null,
    answeredCorrectly: false,
    currentQuestion: null
  });

  // Add effect for auto-scrolling when completion data is loaded
  useEffect(() => {
    if (state.completionData && !state.loadingCompletion) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [state.completionData, state.loadingCompletion]);

  const updateState = (updates: Partial<QuizState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (!state.loading && !state.error) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [state.loading, state.error]);

  const handleAnswerSelect = (answer: string) => {
    if (state.quizCompleted) return;

    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (currentQuestion.type === 'multiple') {
      // Toggle the answer - remove if already selected, add if not selected
      const newSelectedAnswers = state.selectedAnswers.includes(answer)
        ? state.selectedAnswers.filter(a => a !== answer)
        : [...state.selectedAnswers, answer];
      
      updateState({
        selectedAnswers: newSelectedAnswers
      });
    } else if (currentQuestion.type === 'matching') {
      updateState({
        matchingAnswers: { ...state.matchingAnswers, [currentQuestion.id]: answer }
      });
    } else {
      updateState({ selectedAnswer: answer });
    }

    if (route.params.lessonId === 'daily-challenge') {
      handleNextQuestion();
    }
  };

  const handleAnswerSubmit = () => {
    if (route.params.lessonId === 'daily-challenge') {
      handleNextQuestion();
      return;
    }

    const currentQuestion = state.questions[state.currentQuestionIndex];
    let isCorrect = false;

    if (currentQuestion.type === 'multiple') {
      // For multiple choice, check that:
      // 1. All correct answers are selected
      // 2. No incorrect answers are selected
      const correctAnswers = currentQuestion.correctAnswers || [];
      const hasAllCorrect = correctAnswers.every(answer => 
        state.selectedAnswers.includes(answer)
      );
      const hasNoIncorrect = state.selectedAnswers.every(answer =>
        correctAnswers.includes(answer)
      );
      isCorrect = hasAllCorrect && hasNoIncorrect;
    } else if (currentQuestion.type === 'matching') {
      isCorrect = Object.entries(state.matchingAnswers).every(([questionId, answer]) => {
        const question = state.questions.find(q => q.id === questionId);
        return question?.correctAnswer === answer;
      });
    } else {
      isCorrect = currentQuestion.correctAnswer === state.selectedAnswer;
    }

      updateState({
      score: isCorrect ? state.score + 1 : state.score,
      showResult: true,
      answeredCorrectly: isCorrect
      });
  };

  const handleNextQuestion = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      const nextIndex = state.currentQuestionIndex + 1;
      updateState({
        currentQuestionIndex: nextIndex,
        currentQuestion: state.questions[nextIndex],
        selectedAnswer: null,
        selectedAnswers: [],
        matchingAnswers: {},
        showResult: false,
        timeRemaining: 60
      });
    } else {
      // Calculate final score and determine if passed
      const scorePercentage = (state.score / state.questions.length) * 100;
      const passedQuiz = scorePercentage >= 80;
      const isPerfectScore = state.score === state.questions.length;
      
      // Update state to show completion screen immediately
      updateState({ 
        quizCompleted: true,
        loadingCompletion: true,
        currentQuestion: null
      });

      // Calculate completion data and save results
      const completeQuiz = async () => {
        try {
          const { user, error: userError } = await auth.getCurrentUser();
          if (userError || !user) {
            throw new Error('User not found');
          }

          const quizResult: QuizResult = {
            score: state.score,
            totalQuestions: state.questions.length,
            timeRemaining: state.timeRemaining,
            passed: passedQuiz,
            perfectScore: isPerfectScore
          };

          const completionData = await quizService.completeQuiz(
            route.params.lessonId,
            quizResult
          );

          // Update state with completion data
          updateState({
            completionData,
            loadingCompletion: false
          });

          // Update navigation params with XP information
          navigation.setParams({
            ...route.params,
            completed: true,
            score: completionData.score,
            totalQuestions: completionData.totalQuestions,
            xpEarned: completionData.xpEarned,
            currentXP: completionData.currentXP,
            newXP: completionData.newXP
          });

          // Remove automatic navigation
          // if (passedQuiz) {
          //   setTimeout(() => {
          //     navigation.goBack();
          //   }, 1000);
          // }
        } catch (error) {
          console.error('Error in quiz completion:', error);
          // Even if saving fails, show the completion screen with error state
          updateState({
            loadingCompletion: false,
            completionData: {
              score: state.score,
              totalQuestions: state.questions.length,
              xpEarned: 0,
              timeBonus: 0,
              perfectScore: isPerfectScore,
              passedQuiz,
              previousBestScore: 0,
              attemptsCount: 0,
              currentXP: 0,
              newXP: 0,
              recommendations: [
                "Възникна грешка при запазване на резултата.",
                "Моля, опитайте отново по-късно."
              ],
              tips: [
                "Вашият резултат е записан локално.",
                "Можете да опитате отново по-късно."
              ]
            }
          });
        }
      };

      // Start the completion process
      completeQuiz();
    }
  };

  const saveQuizResults = async () => {
    // This function is now just a wrapper for the completion logic
    // The actual logic has been moved to handleNextQuestion
    console.log('saveQuizResults is deprecated, using handleNextQuestion instead');
  };

  const checkPreviousAttempts = async () => {
    console.log('checkPreviousAttempts: Starting check for lessonId:', route.params.lessonId);
    
    // For regular quizzes, we don't need to check attempts
    if (route.params.lessonId !== 'daily-challenge') {
      console.log('checkPreviousAttempts: This is a regular quiz, no need to check attempts');
      updateState({ loadingAttempts: false });
      return;
    }

    console.log('checkPreviousAttempts: This is a daily challenge quiz');
    updateState({ loadingAttempts: true });
    
    try {
      const hasAttempted = await quizService.checkPreviousAttempts(route.params.lessonId);
      console.log('checkPreviousAttempts: Has attempted:', hasAttempted);
      updateState({ 
        hasAttemptedTest: hasAttempted,
        loadingAttempts: false 
      });
    } catch (err) {
      console.error('checkPreviousAttempts: Error:', err);
      Alert.alert(
        'Error',
        'Failed to check previous attempts. Please try again.',
        [{ text: 'OK' }]
      );
      updateState({ loadingAttempts: false });
    }
  };

  // Add useEffect to load questions from route params
  useEffect(() => {
    console.log('QuizScreen: Received route params:', route.params);
    console.log('QuizScreen: Current state:', state);
    
    if (route.params.questions) {
      console.log('QuizScreen: Questions received:', route.params.questions);
      const questions = route.params.questions;
      setState(prev => {
        const newState = {
          ...prev,
          loading: false,
          questions: questions,
          currentQuestion: questions[0] || null,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          selectedAnswers: [],
          matchingAnswers: {},
          score: 0,
          quizCompleted: false,
          showResult: false,
          timeRemaining: 60,
          answeredCorrectly: false
        };
        console.log('QuizScreen: New state after setting questions:', newState);
        return newState;
      });
    } else {
      console.log('QuizScreen: No questions received in route params');
      setState(prev => {
        const newState = {
          ...prev,
          loading: false,
          error: 'No questions available for this quiz',
          currentQuestion: null
        };
        console.log('QuizScreen: New state after setting error:', newState);
        return newState;
      });
    }
  }, [route.params.questions]);

  // Add useEffect to check for previous attempts
  useEffect(() => {
    console.log('QuizScreen: Checking previous attempts for lessonId:', route.params.lessonId);
    checkPreviousAttempts();
  }, [route.params.lessonId]);

  // Add effect to reset personality answers when starting a new quiz
  useEffect(() => {
    if (route.params.lessonId === 'daily-challenge') {
      setState({ ...state, selectedAnswers: [] });
    }
  }, [route.params.lessonId]);

  const calculateQuizCompletion = async (userId: string): Promise<QuizCompletionData> => {
    console.log('calculateQuizCompletion: Starting calculation');
    const baseXP = 100;
    const perfectScoreBonus = 50;
    const timeBonus = Math.floor((state.timeRemaining / 60) * 10);
    const scorePercentage = (state.score / state.questions.length) * 100;
    const passedQuiz = scorePercentage >= 80;
    const isPerfectScore = state.score === state.questions.length;

    console.log('calculateQuizCompletion: Initial values:', {
      baseXP,
      perfectScoreBonus,
      timeBonus,
      scorePercentage,
      passedQuiz,
      isPerfectScore
    });

    // Get previous quiz attempts
    const { data: previousAttempts, error: attemptsError } = await database.getQuizAttempts(userId);
    if (attemptsError) {
      console.error('calculateQuizCompletion: Error fetching previous attempts:', attemptsError);
      throw attemptsError;
    }

    // Filter attempts for this specific quiz
    const attempts = (previousAttempts as QuizAttempt[] || [])
      .filter(attempt => attempt.quiz_id === route.params.lessonId);
    
    const previousBestScore = attempts.length > 0 
      ? Math.max(...attempts.map(attempt => (attempt.score / attempt.total_questions) * 100))
      : 0;

    console.log('calculateQuizCompletion: Previous attempts data:', {
      attemptsCount: attempts.length,
      previousBestScore
    });

    let xpEarned = 0;
    if (passedQuiz) {
      // Calculate XP based on score improvement
      if (attempts.length === 0) {
        // First attempt - award full XP
        xpEarned = baseXP + timeBonus;
        if (isPerfectScore) {
          xpEarned += perfectScoreBonus;
        }
      } else if (scorePercentage > previousBestScore) {
        // Score improvement - award difference in XP
        const previousXP = Math.floor((previousBestScore / 100) * baseXP);
        const currentXP = Math.floor((scorePercentage / 100) * baseXP);
        xpEarned = Math.max(0, currentXP - previousXP);
        
        // Add time bonus and perfect score bonus if applicable
        if (isPerfectScore && previousBestScore < 100) {
          xpEarned += perfectScoreBonus;
        }
        xpEarned += timeBonus;
      }
    }

    console.log('calculateQuizCompletion: XP calculation:', {
      xpEarned,
      isPerfectScore,
      passedQuiz
    });

    const recommendations: string[] = [];
    const tips: string[] = [];

    if (!passedQuiz) {
      recommendations.push(
        "За да преминете урока и получите XP, трябва да наберете поне 80% от възможните точки.",
        "Препоръчваме да прегледате урока отново внимателно."
      );
      tips.push(
        "Направете бележки по време на четенето за по-добро разбиране.",
        "Не бързайте с отговорите - внимателно прочетете всеки въпрос.",
        "Използвайте обясненията след всеки въпрос за по-добро разбиране."
      );
    } else if (attempts.length > 0) {
      if (scorePercentage > previousBestScore) {
        recommendations.push(
          "Поздравления! Подобрихте резултата си!",
          "Продължете да подобрявате знанията си с други уроци."
        );
        tips.push(
          "Запазете знанията си свежи, като редовно преглеждате материалите.",
          "Споделете успеха си с приятели и покани ги да се присъединят!"
        );
      } else {
        recommendations.push(
          "Добър резултат, но не подобрихте предишния си най-добър резултат.",
          "Опитайте отново, за да подобрите резултата си и да спечелите допълнителна XP."
        );
        tips.push(
          "Фокусирайте се върху темите, в които имате затруднения.",
          "Направете бележки по време на урока за по-лесно запомняне."
        );
      }
    } else {
      // First attempt and passed
      if (isPerfectScore) {
        recommendations.push(
          "Перфектен резултат! Отлично представяне!",
          "Продължете към по-напреднали теми за още знания."
        );
        tips.push(
          "Вашите знания са на отлично ниво - споделете ги с други!",
          "Пробвайте ежедневните предизвикателства за допълнителна XP.",
          "Помогнете на други потребители в общността."
        );
      } else {
        recommendations.push(
          "Отлично представяне! Можете да продължите към по-напреднали теми.",
          "Пробвайте ежедневните предизвикателства за допълнителна XP."
        );
        tips.push(
          "Запазете знанията си свежи, като редовно преглеждате материалите.",
          "Споделете успеха си с приятели и покани ги да се присъединят!"
        );
      }
    }

    const completionData: QuizCompletionData = {
      score: state.score,
      totalQuestions: state.questions.length,
      xpEarned,
      timeBonus,
      perfectScore: isPerfectScore,
      passedQuiz,
      previousBestScore,
      attemptsCount: attempts.length,
      recommendations,
      tips
    };

    console.log('calculateQuizCompletion: Final completion data:', completionData);
    return completionData;
  };

  const renderQuizCompletion = () => {
    console.log('renderQuizCompletion: Starting render with state:', {
      loadingCompletion: state.loadingCompletion,
      hasCompletionData: !!state.completionData,
      quizCompleted: state.quizCompleted
    });

    if (state.loadingCompletion) {
      console.log('renderQuizCompletion: Still loading completion data');
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Обработка на резултата...</Text>
        </View>
      );
    }

    if (!state.completionData) {
      console.log('renderQuizCompletion: No completion data available');
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Грешка при зареждане на резултата</Text>
        </View>
      );
    }

    const { completionData } = state;
    const scorePercentage = (completionData.score / completionData.totalQuestions) * 100;
    const isPerfect = completionData.perfectScore;
    const passedQuiz = completionData.passedQuiz;

    // Define colors based on result
    const primaryColor = passedQuiz ? (isPerfect ? "#4CAF50" : "#4CAF50") : "#FF6B6B";
    const secondaryColor = passedQuiz ? (isPerfect ? "#E8F5E9" : "#E8F5E9") : "#FFEBEE";
    const textColor = passedQuiz ? (isPerfect ? "#1B5E20" : "#1B5E20") : "#C62828";

    return (
      <ScrollView 
        ref={scrollViewRef}
        style={styles.completionContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        <Surface style={[styles.resultCard, { backgroundColor: secondaryColor }]}>
          {/* Header Section */}
          <View style={[styles.completionHeader, { backgroundColor: primaryColor }]}>
            <MaterialCommunityIcons 
              name={isPerfect ? "trophy" : (passedQuiz ? "check-circle" : "alert-circle")} 
              size={48} 
              color="#FFFFFF" 
            />
            <Title style={styles.completionTitle}>
              {isPerfect 
                ? "Перфектен резултат!" 
                : (passedQuiz ? "Тест завършен успешно!" : "Тестът не е преминат")}
            </Title>
          </View>

          {/* Score Section */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scorePercentage, { color: textColor }]}>
                {Math.round(scorePercentage)}%
              </Text>
              <Text style={styles.scoreLabel}>
                {completionData.score} от {completionData.totalQuestions}
              </Text>
            </View>
            
            {completionData.attemptsCount > 0 && (
              <Text style={styles.previousScoreText}>
                Предишен най-добър резултат: {Math.round(completionData.previousBestScore)}%
              </Text>
            )}
            
            {!passedQuiz && (
              <Text style={styles.passingScoreText}>
                Необходими са поне 80% за преминаване
              </Text>
            )}
          </View>

          {/* XP Section - Only show if passed */}
          {passedQuiz && completionData.xpEarned > 0 && (
            <View style={styles.xpSection}>
              <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
              <View style={styles.xpTextContainer}>
                <Text style={styles.xpText}>
                  Печелите {completionData.xpEarned} XP
                </Text>
                {completionData.currentXP !== undefined && completionData.newXP !== undefined && (
                  <Text style={styles.xpTotalText}>
                    Нова XP: {completionData.newXP}
                  </Text>
                )}
                {completionData.timeBonus > 0 && (
                  <Text style={styles.bonusText}>
                    (+{completionData.timeBonus} бонус за бързина)
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Recommendations Section */}
          <View style={styles.recommendationsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb" size={24} color={primaryColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Препоръки</Text>
            </View>
            {completionData.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color={primaryColor} 
                />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="school" size={24} color={primaryColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>Съвети</Text>
            </View>
            {completionData.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <MaterialCommunityIcons 
                  name="arrow-right" 
                  size={20} 
                  color={primaryColor} 
                />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Action Button */}
          <View style={styles.actionButtonsContainer}>
            {passedQuiz ? (
              <Button
                mode="contained"
                onPress={() => navigation.goBack()}
                style={[styles.completionButton, { backgroundColor: primaryColor }]}
                labelStyle={styles.completionButtonLabel}
                icon="home"
              >
                Към началната страница
              </Button>
            ) : (
              <>
          <Button
            mode="contained"
            onPress={() => {
                setState({
                  ...state,
                  currentQuestionIndex: 0,
                      currentQuestion: state.questions[0],
                  selectedAnswer: null,
                  selectedAnswers: [],
                  matchingAnswers: {},
                  score: 0,
                  showResult: false,
                  timeRemaining: 60,
                      quizCompleted: false,
                  completionData: null,
                  answeredCorrectly: false
                });
            }}
                  style={[styles.completionButton, { backgroundColor: primaryColor }]}
                  labelStyle={styles.completionButtonLabel}
                  icon="refresh"
          >
                  Опитайте отново
          </Button>
                <Button
                  mode="contained"
                  onPress={() => navigation.goBack()}
                  style={[styles.completionButton, { backgroundColor: primaryColor, marginTop: 12 }]}
                  labelStyle={styles.completionButtonLabel}
                  icon="book-open-page-variant"
                >
                  Обратно към урока
                </Button>
              </>
            )}
          </View>
        </Surface>
      </ScrollView>
    );
  };

  const renderMatchingQuestion = () => {
    if (!state.currentQuestion) return null;

    // For now, we'll just show a message that matching questions are not supported yet
    return (
      <View style={styles.matchingContainer}>
        <Text style={styles.matchingText}>
          Matching questions are not supported in this version.
                  </Text>
      </View>
    );
  };

  const renderQuestion = () => {
    // First check if quiz is completed - this should take priority
    if (state.quizCompleted) {
      return renderQuizCompletion();
    }

    if (state.loadingAttempts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      );
    }

    if (!state.currentQuestion) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No questions available</Text>
        </View>
      );
    }

    const currentQuestion = state.currentQuestion;

    return (
      <View style={styles.questionContainer}>
        <Surface style={[styles.questionCard, { backgroundColor: themeColors.surface }]}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>
              Въпрос {state.currentQuestionIndex + 1} от {state.questions.length}
            </Text>
            <View style={styles.timerContainer}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={themeColors.primary} />
              <Text style={styles.timerText}>{state.timeRemaining} сек</Text>
          </View>
          </View>

          <View style={styles.questionContent}>
            <Title style={[styles.questionText, { color: '#222' }]}>
              {currentQuestion.question}
            </Title>
            
            {currentQuestion.type === 'matching' ? (
                renderMatchingQuestion()
              ) : (
                <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                      currentQuestion.type === 'multiple' 
                          ? state.selectedAnswers.includes(option) && styles.optionButtonSelected
                          : state.selectedAnswer === option && styles.optionButtonSelected
                      ]}
                      onPress={() => handleAnswerSelect(option)}
                    >
                    <View style={styles.optionContent}>
                      <MaterialCommunityIcons 
                        name={currentQuestion.type === 'multiple' 
                          ? (state.selectedAnswers.includes(option) ? "checkbox-marked-circle" : "checkbox-blank-circle-outline")
                          : (state.selectedAnswer === option ? "radiobox-marked" : "radiobox-blank")
                        } 
                        size={24} 
                        color={currentQuestion.type === 'multiple' 
                          ? (state.selectedAnswers.includes(option) ? themeColors.primary : "#666")
                          : (state.selectedAnswer === option ? themeColors.primary : "#666")
                        } 
                      />
                      <Text style={[
                        styles.optionText,
                        currentQuestion.type === 'multiple'
                          ? state.selectedAnswers.includes(option) && styles.optionTextSelected
                          : state.selectedAnswer === option && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
          </View>

          {state.showResult && (
            <View style={[
              styles.resultContainer,
              { backgroundColor: state.answeredCorrectly ? '#e8f5e9' : '#ffebee' }
            ]}>
              <Text style={[
                styles.resultText,
                { color: state.answeredCorrectly ? '#2e7d32' : '#c62828' }
              ]}>
                {state.answeredCorrectly ? 'Правилен отговор!' : 'Грешен отговор'}
              </Text>
              {!state.answeredCorrectly && currentQuestion.explanation && (
                <Text style={styles.explanationText}>
                  {currentQuestion.explanation}
                </Text>
              )}
            </View>
          )}

          <View style={styles.navigationButtons}>
            {!state.showResult ? (
          <Button
            mode="contained"
            onPress={handleAnswerSubmit}
                style={[styles.submitButton, { backgroundColor: themeColors.primary }]}
                labelStyle={styles.submitButtonLabel}
                disabled={(!currentQuestion) || (!state.selectedAnswer && state.selectedAnswers.length === 0)}
                icon="check"
          >
            Потвърди
          </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleNextQuestion}
                style={[styles.nextButton, { backgroundColor: themeColors.primary }]}
                labelStyle={styles.nextButtonLabel}
                icon="arrow-right"
              >
                {state.currentQuestionIndex < state.questions.length - 1 ? 'Следващ въпрос' : 'Завърши теста'}
              </Button>
            )}
          </View>
        </Surface>
      </View>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: themeColors.background,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  contentWrapper: {
    flex: 1,
  },
    loadingContainer: {
    flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
    questionContainer: {
      flex: 1,
    padding: 16,
    },
    questionCard: {
      padding: 20,
      borderRadius: 16,
      elevation: 2,
    marginBottom: 16,
  },
    questionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    marginBottom: 16,
  },
    questionNumber: {
      fontSize: 16,
      color: '#666',
      fontWeight: '500',
    },
    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    timerText: {
      marginLeft: 4,
      fontSize: 14,
      color: '#666',
      fontWeight: '500',
  },
    questionContent: {
      marginBottom: 20,
  },
  questionText: {
      fontSize: 20,
    fontWeight: 'bold',
      color: '#222',
      marginBottom: 20,
      lineHeight: 28,
  },
  optionsContainer: {
      marginTop: 8,
  },
  optionButton: {
      marginBottom: 12,
      borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
      backgroundColor: '#f8f9fa',
      overflow: 'hidden',
  },
  optionButtonSelected: {
      backgroundColor: '#e8f0fe',
      borderColor: themeColors.primary,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#222',
      marginLeft: 12,
      flex: 1,
  },
  optionTextSelected: {
      color: themeColors.primary,
      fontWeight: '500',
    },
    resultContainer: {
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
      marginBottom: 16,
    },
    resultText: {
      fontSize: 18,
    fontWeight: 'bold',
      marginBottom: 8,
    },
    explanationText: {
      fontSize: 14,
      color: '#666',
      lineHeight: 20,
    },
    navigationButtons: {
      marginTop: 20,
  },
  submitButton: {
      borderRadius: 12,
      paddingVertical: 8,
    },
    submitButtonLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    nextButton: {
      borderRadius: 12,
      paddingVertical: 8,
    },
    nextButtonLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    errorText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
  },
  completionContainer: {
    flex: 1,
      padding: 16,
      backgroundColor: '#F5F5F5',
  },
  resultCard: {
      borderRadius: 24,
      overflow: 'hidden',
      elevation: 4,
  },
  completionHeader: {
      padding: 24,
    alignItems: 'center',
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
  },
  completionTitle: {
      fontSize: 24,
    fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 16,
      textAlign: 'center',
  },
    scoreSection: {
      padding: 24,
    alignItems: 'center',
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
    marginBottom: 16,
  },
    scorePercentage: {
      fontSize: 32,
    fontWeight: 'bold',
  },
    scoreLabel: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
  },
  previousScoreText: {
    fontSize: 14,
    color: '#666',
      marginTop: 8,
  },
  passingScoreText: {
    fontSize: 14,
      color: '#FF6B6B',
      marginTop: 8,
      fontWeight: '500',
  },
    xpSection: {
    flexDirection: 'row',
    alignItems: 'center',
      backgroundColor: '#FFFFFF',
      padding: 16,
      marginHorizontal: 24,
      marginBottom: 24,
      borderRadius: 12,
      elevation: 2,
    },
    xpTextContainer: {
      marginLeft: 12,
  },
  xpText: {
      fontSize: 18,
    fontWeight: 'bold',
      color: '#222',
  },
  bonusText: {
    fontSize: 14,
    color: '#666',
      marginTop: 2,
    },
    recommendationsSection: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    tipsSection: {
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    marginBottom: 16,
  },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 8,
    },
  recommendationItem: {
    flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 8,
      elevation: 1,
  },
  recommendationText: {
      flex: 1,
    marginLeft: 8,
      fontSize: 14,
      lineHeight: 20,
      color: '#444',
  },
  tipItem: {
    flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 8,
      elevation: 1,
  },
  tipText: {
      flex: 1,
    marginLeft: 8,
      fontSize: 14,
      lineHeight: 20,
      color: '#444',
    },
    actionButtonsContainer: {
      margin: 24,
  },
  completionButton: {
      paddingVertical: 8,
      borderRadius: 12,
  },
    completionButtonLabel: {
      color: '#FFFFFF',
      fontSize: 16,
    fontWeight: 'bold',
      paddingVertical: 4,
  },
    loadingText: {
      marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  matchingContainer: {
    marginBottom: 16,
  },
    matchingText: {
    fontSize: 16,
      color: '#666',
  },
  xpTotalText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4
  },
});

  return (
    <View style={styles.container}>
      {state.quizCompleted ? (
        renderQuizCompletion()
      ) : (
        <ScrollView 
          style={styles.mainScrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View style={styles.contentWrapper}>
            {renderQuestion()}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
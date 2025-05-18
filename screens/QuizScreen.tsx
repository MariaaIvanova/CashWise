import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated, Alert, ActivityIndicator } from 'react-native';
import { Title, Paragraph, Button, Card, RadioButton, Text, IconButton, Surface, ProgressBar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, THEME } from '../ThemeContext';
import { Appbar } from 'react-native-paper';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { auth, database } from '../supabase';
import BottomNavigationBar, { TabKey } from '../components/BottomNavigationBar';

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

interface QuizCompletionData {
  score: number;
  totalQuestions: number;
  xpEarned: number;
  timeBonus: number;
  perfectScore: boolean;
  passedQuiz: boolean;
  previousBestScore: number;
  attemptsCount: number;
  recommendations: string[];
  tips: string[];
  personalityType?: string;
  description?: string;
  explanation?: string;
  personalityColor?: string;
}

interface Question {
  id: string;
  text: string;
  question: string;
  options: string[];
  correctAnswer: string;
  type: 'single' | 'multiple' | 'matching';
  correctAnswers?: string[];
  pairs?: MatchingPair[];
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
  const colors = theme.colors || THEME.colors;
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
  const [fadeAnim] = useState(new Animated.Value(0));

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
      updateState({
        selectedAnswers: [...state.selectedAnswers, answer]
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
      isCorrect = state.selectedAnswers.every(answer => 
        currentQuestion.correctAnswers?.includes(answer)
      );
    } else if (currentQuestion.type === 'matching') {
      isCorrect = Object.entries(state.matchingAnswers).every(([questionId, answer]) => {
        const question = state.questions.find(q => q.id === questionId);
        return question?.correctAnswer === answer;
      });
    } else {
      isCorrect = currentQuestion.correctAnswer === state.selectedAnswer;
    }

    if (isCorrect) {
      updateState({
        score: state.score + 1,
        showResult: true
      });
      setTimeout(handleNextQuestion, 1500);
    } else {
      updateState({ showResult: true });
      setTimeout(handleNextQuestion, 1500);
    }
  };

  const handleNextQuestion = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      updateState({
        currentQuestionIndex: state.currentQuestionIndex + 1,
        selectedAnswer: null,
        selectedAnswers: [],
        matchingAnswers: {},
        showResult: false,
        timeRemaining: 60
      });
    } else {
      updateState({ quizCompleted: true });
      saveQuizResults();
    }
  };

  const saveQuizResults = async () => {
    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError) throw userError;
      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
        return;
      }

      if (route.params.lessonId === 'daily-challenge') {
        // Use personalityAnswers instead of selectedAnswers
        const answers = state.selectedAnswers.filter((answer: string) => answer !== undefined);
        
        const counts = {
          A: answers.filter((a: string) => a === 'A').length,
          B: answers.filter((a: string) => a === 'B').length,
          C: answers.filter((a: string) => a === 'C').length
        };

        console.log('Answer counts:', counts); // Debug log

        let personalityType = '';
        let description = '';
        let explanation = '';
        let recommendations: string[] = [];
        let tips: string[] = [];
        let color = '';

        // Determine personality type based on actual answer counts
        if (counts.A > counts.B && counts.A > counts.C) {
          personalityType = 'Импулсивен харчещ';
          description = 'Парите за теб са начин да се наслаждаваш на живота, но внимавай – прекаленият импулс може да води до стрес и дългове.';
          explanation = 'Повечето от твоите отговори показват, че имаш склонност към импулсивно харчене. Например, когато получиш неочаквани пари, предпочиташ да ги похарчиш веднага за нещо приятно. Също така, когато си под стрес, използваш пазаруването като начин да се почувстваш по-добре. Това показва, че гледаш на парите предимно като средство за незабавно удоволствие.';
          recommendations = [
            'Помисли за по-дългосрочни цели',
            'Създай бюджет и се придържай към него',
            'Изчаквай 24 часа преди да направиш голяма покупка'
          ];
          tips = [
            'Започни с малки стъпки към по-добро финансово планиране',
            'Създай спестовна сметка за неочаквани разходи',
            'Следвай своите разходи за един месец, за да разбереш къде отиват парите'
          ];
          color = '#FF6B6B';
        } else if (counts.B > counts.A && counts.B > counts.C) {
          personalityType = 'Балансиран реалист';
          description = 'Имаш разумно отношение към парите, но може биometimes се колебаеш.';
          explanation = 'Твоите отговори показват балансиран подход към финансите. Например, когато получиш неочаквани пари, предпочиташ да ги разделиш – част за харчене, част за спестяване. При стресови ситуацииometimes се изкушаваш да пазаруваш, но се стараеш да се контролираш. Това показва, че умееш да балансираш между удоволствието от харчене и отговорността към бъдещето.';
          recommendations = [
            'Усъвършенствай планирането',
            'Създай ясни финансови цели',
            'Разгледай възможности за инвестиране'
          ];
          tips = [
            'Запази част от дохода си автоматично',
            'Диверсифицирай спестяванията си',
            'Редовно преглеждай финансовите си цели'
          ];
          color = '#FFD700';
        } else if (counts.C > counts.A && counts.C > counts.B) {
          personalityType = 'Стратегически планиращ';
          description = 'Ти си дисциплиниран и гледаш на парите като на инструмент, а не само източник на удоволствие.';
          explanation = 'Твоите отговори показват силна склонност към стратегическо планиране. Например, когато получиш неочаквани пари, предпочиташ да ги спестиш или инвестираш. При стресови ситуации имаш други начини да се справяш, различни от пазаруването. Това показва, че гледаш на парите като на инструмент за постигане на дългосрочни цели и финансова сигурност.';
          recommendations = [
            'Продължавай да инвестираш в знания',
            'Разгледай по-сложни инвестиционни стратегии',
            'Помогни на другите да подобрят финансовото си поведение'
          ];
          tips = [
            'Разгледай възможности за пасивен доход',
            'Създай финансов план за дългосрочни цели',
            'Диверсифицирай инвестициите си'
          ];
          color = '#4CAF50';
        } else {
          // If there's a tie, determine based on specific answers
          const hasImpulsiveAnswers = state.selectedAnswers.includes('A') && (state.selectedAnswers[0] === 'A' || state.selectedAnswers[2] === 'A');
          const hasStrategicAnswers = state.selectedAnswers.includes('C') && (state.selectedAnswers[0] === 'C' || state.selectedAnswers[4] === 'C');
          
          if (hasImpulsiveAnswers) {
            personalityType = 'Импулсивен харчещ';
            // ... rest of impulsive spender data ...
          } else if (hasStrategicAnswers) {
            personalityType = 'Стратегически планиращ';
            // ... rest of strategic planner data ...
          } else {
            personalityType = 'Балансиран реалист';
            // ... rest of balanced realist data ...
          }
        }

        // Create completion data with all necessary fields
        const completionData: QuizCompletionData = {
          score: 0,
          totalQuestions: state.questions.length,
          xpEarned: 250,
          timeBonus: 0,
          perfectScore: false,
          passedQuiz: true,
          previousBestScore: 0,
          attemptsCount: 0,
          personalityType,
          description,
          explanation,
          recommendations,
          tips,
          personalityColor: color
        };

        // Set completion data immediately
        setState({ ...state, completionData });

        // Save quiz attempt and update profile
        await database.saveQuizAttempt({
          profile_id: user.id,
          quiz_id: route.params.lessonId,
          score: 0,
          total_questions: state.questions.length,
          time_taken: 60 - state.timeRemaining,
          personality_type: personalityType
        });

        await database.addLearningActivity({
          user_id: user.id,
          activity_type: 'quiz',
          quiz_id: route.params.lessonId,
          xp_earned: 250
        });

        const { data: profile, error: profileError } = await database.getProfile(user.id);
        if (profileError) throw profileError;

        if (profile) {
          const typedProfile = profile as Profile;
          const completedQuizzes = typedProfile.completed_quizzes || 0;

          await database.updateProfile(user.id, {
            xp: 250,
            completed_quizzes: completedQuizzes + 1
          } as ProfileUpdate);
        }

        return;
      }

      // For regular quizzes, use the existing completion logic
      const completionData = await calculateQuizCompletion(user.id);
      setState({ ...state, completionData });

      // Save quiz attempt for regular quizzes
      await database.saveQuizAttempt({
        profile_id: user.id,
        quiz_id: route.params.lessonId,
        score: state.score,
        total_questions: state.questions.length,
        time_taken: 60 - state.timeRemaining,
        personality_type: completionData.personalityType
      });

      // Only update profile and record activity if XP was earned for regular quizzes
      if (completionData.passedQuiz && completionData.xpEarned > 0) {
        await database.addLearningActivity({
          user_id: user.id,
          activity_type: 'quiz',
          quiz_id: route.params.lessonId,
          xp_earned: completionData.xpEarned
        });

        const { data: profile, error: profileError } = await database.getProfile(user.id);
        if (profileError) throw profileError;

        if (profile) {
          const typedProfile = profile as Profile;
          const completedQuizzes = typedProfile.completed_quizzes || 0;

          await database.updateProfile(user.id, {
            xp: completionData.xpEarned,
            completed_quizzes: completedQuizzes + 1
          } as ProfileUpdate);
        }
      }

      setState({ ...state, quizCompleted: true });
    } catch (err) {
      console.error('Error completing quiz:', err);
      Alert.alert(
        'Error',
        'Failed to record quiz completion. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Modify the checkPreviousAttempts function to properly set all personality data
  const checkPreviousAttempts = async () => {
    if (route.params.lessonId === 'daily-challenge') {
      setState({ ...state, loadingAttempts: true });
      try {
        const { user, error: userError } = await auth.getCurrentUser();
        if (userError) throw userError;
        if (!user) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'SignIn' }],
          });
          return;
        }

        // Check if user has already taken the personality test
        const { data: attempts, error: attemptsError } = await database.getQuizAttempts(user.id);
        if (attemptsError) throw attemptsError;

        const hasAttempted = (attempts as QuizAttempt[] || []).some(
          attempt => attempt.quiz_id === 'daily-challenge'
        );

        if (hasAttempted) {
          setState({ ...state, hasAttemptedTest: true });
          // Load the previous attempt data
          const previousAttempt = (attempts as QuizAttempt[]).find(
            attempt => attempt.quiz_id === 'daily-challenge'
          );
          
          if (previousAttempt) {
            // Set personality type specific data based on the stored type
            let description = '';
            let explanation = '';
            let recommendations: string[] = [];
            let tips: string[] = [];
            let color = '';

            switch (previousAttempt.personality_type) {
              case 'Импулсивен харчещ':
                description = 'Парите за теб са начин да се наслаждаваш на живота, но внимавай – прекаленият импулс може да води до стрес и дългове.';
                explanation = 'Повечето от твоите отговори показват, че имаш склонност към импулсивно харчене. Например, когато получиш неочаквани пари, предпочиташ да ги похарчиш веднага за нещо приятно. Също така, когато си под стрес, използваш пазаруването като начин да се почувстваш по-добре. Това показва, че гледаш на парите предимно като средство за незабавно удоволствие.';
                recommendations = [
                  'Помисли за по-дългосрочни цели',
                  'Създай бюджет и се придържай към него',
                  'Изчаквай 24 часа преди да направиш голяма покупка'
                ];
                tips = [
                  'Започни с малки стъпки към по-добро финансово планиране',
                  'Създай спестовна сметка за неочаквани разходи',
                  'Следвай своите разходи за един месец, за да разбереш къде отиват парите'
                ];
                color = '#FF6B6B';
                break;
              case 'Балансиран реалист':
                description = 'Имаш разумно отношение към парите, но може биometimes се колебаеш.';
                explanation = 'Твоите отговори показват балансиран подход към финансите. Например, когато получиш неочаквани пари, предпочиташ да ги разделиш – част за харчене, част за спестяване. При стресови ситуацииometimes се изкушаваш да пазаруваш, но се стараеш да се контролираш. Това показва, че умееш да балансираш между удоволствието от харчене и отговорността към бъдещето.';
                recommendations = [
                  'Усъвършенствай планирането',
                  'Създай ясни финансови цели',
                  'Разгледай възможности за инвестиране'
                ];
                tips = [
                  'Запази част от дохода си автоматично',
                  'Диверсифицирай спестяванията си',
                  'Редовно преглеждай финансовите си цели'
                ];
                color = '#FFD700';
                break;
              case 'Стратегически планиращ':
                description = 'Ти си дисциплиниран и гледаш на парите като на инструмент, а не само източник на удоволствие.';
                explanation = 'Твоите отговори показват силна склонност към стратегическо планиране. Например, когато получиш неочаквани пари, предпочиташ да ги спестиш или инвестираш. При стресови ситуации имаш други начини да се справяш, различни от пазаруването. Това показва, че гледаш на парите като на инструмент за постигане на дългосрочни цели и финансова сигурност.';
                recommendations = [
                  'Продължавай да инвестираш в знания',
                  'Разгледай по-сложни инвестиционни стратегии',
                  'Помогни на другите да подобрят финансовото си поведение'
                ];
                tips = [
                  'Разгледай възможности за пасивен доход',
                  'Създай финансов план за дългосрочни цели',
                  'Диверсифицирай инвестициите си'
                ];
                color = '#4CAF50';
                break;
            }

            setState({
              ...state,
              completionData: {
                score: 0,
                totalQuestions: state.questions.length,
                xpEarned: 250,
                timeBonus: 0,
                perfectScore: false,
                passedQuiz: true,
                previousBestScore: 0,
                attemptsCount: 1,
                personalityType: previousAttempt.personality_type || '',
                description,
                explanation,
                recommendations,
                tips,
                personalityColor: color
              },
              quizCompleted: true
            });
          }
        }
      } catch (err) {
        console.error('Error checking previous attempts:', err);
        Alert.alert(
          'Error',
          'Failed to check previous attempts. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setState({ ...state, loadingAttempts: false });
      }
    }
  };

  // Add useEffect to check for previous attempts
  useEffect(() => {
    checkPreviousAttempts();
  }, [route.params.lessonId]);

  // Add effect to reset personality answers when starting a new quiz
  useEffect(() => {
    if (route.params.lessonId === 'daily-challenge') {
      setState({ ...state, selectedAnswers: [] });
    }
  }, [route.params.lessonId]);

  const calculateQuizCompletion = async (userId: string): Promise<QuizCompletionData> => {
    const baseXP = 100;
    const perfectScoreBonus = 50;
    const timeBonus = Math.floor((state.timeRemaining / 60) * 10);
    const scorePercentage = (state.score / state.questions.length) * 100;
    const passedQuiz = scorePercentage >= 80;

    // Get previous quiz attempts
    const { data: previousAttempts, error: attemptsError } = await database.getQuizAttempts(userId);
    if (attemptsError) {
      console.error('Error fetching previous attempts:', attemptsError);
      throw attemptsError;
    }

    // Filter attempts for this specific quiz
    const attempts = (previousAttempts as QuizAttempt[] || [])
      .filter(attempt => attempt.quiz_id === route.params.lessonId);
    
    const previousBestScore = attempts.length > 0 
      ? Math.max(...attempts.map(attempt => (attempt.score / attempt.total_questions) * 100))
      : 0;

    let xpEarned = 0;
    if (passedQuiz) {
      // Calculate XP based on score improvement
      if (attempts.length === 0) {
        // First attempt - award full XP
        xpEarned = baseXP + timeBonus;
        if (state.score === state.questions.length) {
          xpEarned += perfectScoreBonus;
        }
      } else if (scorePercentage > previousBestScore) {
        // Score improvement - award difference in XP
        const previousXP = Math.floor((previousBestScore / 100) * baseXP);
        const currentXP = Math.floor((scorePercentage / 100) * baseXP);
        xpEarned = Math.max(0, currentXP - previousXP);
        
        // Add time bonus and perfect score bonus if applicable
        if (state.score === state.questions.length && previousBestScore < 100) {
          xpEarned += perfectScoreBonus;
        }
        xpEarned += timeBonus;
      }
    }

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
    } else if (scorePercentage >= 90) {
      recommendations.push(
        "Отлично представяне! Можете да продължите към по-напреднали теми.",
        "Пробвайте ежедневните предизвикателства за допълнителна XP."
      );
      tips.push(
        "Запазете знанията си свежи, като редовно преглеждате материалите.",
        "Споделете успеха си с приятели и покани ги да се присъединят!"
      );
    } else {
      recommendations.push(
        "Добър резултат! Прегледайте грешните отговори за по-добро разбиране.",
        "Пробвайте урока отново за по-добро усвояване на материала."
      );
      tips.push(
        "Фокусирайте се върху темите, в които имате затруднения.",
        "Направете бележки по време на урока за по-лесно запомняне."
      );
    }

    return {
      score: state.score,
      totalQuestions: state.questions.length,
      xpEarned,
      timeBonus,
      perfectScore: state.score === state.questions.length,
      passedQuiz,
      previousBestScore,
      attemptsCount: attempts.length,
      recommendations,
      tips
    };
  };

  const renderQuizCompletion = () => {
    if (state.loadingCompletion || !state.completionData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    const { completionData } = state;

    if (route.params.lessonId === 'daily-challenge') {
      return (
        <View style={styles.completionContainer}>
          <Surface style={styles.resultCard}>
            <View style={[styles.personalityHeader, { backgroundColor: completionData.personalityColor }]}>
              <Text style={styles.personalityTitle}>{completionData.personalityType}</Text>
            </View>
            
            <Text style={styles.personalityDescription}>{completionData.description}</Text>
            
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationText}>{completionData.explanation}</Text>
            </View>
            
            <View style={styles.recommendationsContainer}>
              <Text style={styles.sectionTitle}>Препоръки</Text>
              {completionData.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <MaterialCommunityIcons 
                    name="lightbulb" 
                    size={20} 
                    color={completionData.personalityColor} 
                  />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.tipsContainer}>
              <Text style={styles.sectionTitle}>Съвети</Text>
              {completionData.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <MaterialCommunityIcons 
                    name="school" 
                    size={20} 
                    color={completionData.personalityColor} 
                  />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.xpContainer}>
              <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
              <Text style={styles.xpText}>Спечелихте {completionData.xpEarned} XP!</Text>
            </View>

            <Button
              mode="contained"
              onPress={() => navigation.goBack()}
              style={[styles.completionButton, { backgroundColor: completionData.personalityColor }]}
            >
              Завърши
            </Button>
          </Surface>
        </View>
      );
    }

    const scorePercentage = (completionData.score / completionData.totalQuestions) * 100;

    return (
      <View style={styles.completionContainer}>
        <Surface style={styles.resultCard}>
          <View style={styles.completionHeader}>
            <MaterialCommunityIcons 
              name={completionData.passedQuiz ? (completionData.perfectScore ? "trophy" : "star") : "alert-circle"} 
              size={48} 
              color={completionData.passedQuiz ? (completionData.perfectScore ? "#FFD700" : "#8A97FF") : "#FF6B6B"} 
            />
            <Title style={styles.completionTitle}>
              {completionData.passedQuiz 
                ? (completionData.perfectScore ? "Перфектен резултат!" : "Тест завършен!")
                : "Тестът не е преминат"}
            </Title>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              {completionData.score} от {completionData.totalQuestions} точки
            </Text>
            <Text style={[
              styles.scorePercentage,
              { color: completionData.passedQuiz ? "#8A97FF" : "#FF6B6B" }
            ]}>
              {Math.round(scorePercentage)}%
            </Text>
            {completionData.attemptsCount > 0 && (
              <Text style={styles.previousScoreText}>
                Предишен най-добър резултат: {Math.round(completionData.previousBestScore)}%
              </Text>
            )}
            {!completionData.passedQuiz && (
              <Text style={styles.passingScoreText}>
                Необходими са поне 80% за преминаване
              </Text>
            )}
          </View>

          {completionData.passedQuiz && completionData.xpEarned > 0 && (
            <View style={styles.xpContainer}>
              <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
              <Text style={styles.xpText}>
                Печелите {completionData.xpEarned} XP
              </Text>
              {completionData.timeBonus > 0 && (
                <Text style={styles.bonusText}>
                  (+{completionData.timeBonus} бонус за бързина)
                </Text>
              )}
            </View>
          )}

          <View style={styles.recommendationsContainer}>
            <Title style={styles.sectionTitle}>Препоръки</Title>
            {completionData.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <MaterialCommunityIcons name="lightbulb" size={20} color="#8A97FF" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tipsContainer}>
            <Title style={styles.sectionTitle}>Съвети</Title>
            {completionData.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <MaterialCommunityIcons name="school" size={20} color="#FFE266" />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={() => {
              if (completionData.passedQuiz) {
                navigation.goBack();
              } else {
                // Reset quiz state and restart
                setState({
                  ...state,
                  currentQuestionIndex: 0,
                  selectedAnswer: null,
                  selectedAnswers: [],
                  matchingAnswers: {},
                  score: 0,
                  showResult: false,
                  timeRemaining: 60,
                  completionData: null,
                  answeredCorrectly: false
                });
              }
            }}
            style={styles.completionButton}
            icon="home"
          >
            {completionData.passedQuiz ? "Към началната страница" : "Опитайте отново"}
          </Button>
        </Surface>
      </View>
    );
  };

  const renderMatchingQuestion = () => {
    if (!state.currentQuestion || !state.currentQuestion.pairs) return null;

    return (
      <View style={styles.matchingContainer}>
        {state.currentQuestion.pairs.map((pair: MatchingPair, index: number) => (
          <View key={index} style={styles.matchingPair}>
            <Text style={styles.matchingSituation}>{pair.situation}</Text>
            <View style={styles.matchingOptions}>
              {state.currentQuestion && state.currentQuestion.options.map((answer: string, optionIndex: number) => (
                <TouchableOpacity
                  key={optionIndex}
                  style={[
                    styles.matchingButton,
                    state.matchingAnswers[pair.situation] === answer && styles.matchingButtonSelected
                  ]}
                  onPress={() => handleAnswerSelect(answer)}
                >
                  <Text style={[
                    styles.matchingButtonText,
                    state.matchingAnswers[pair.situation] === answer && styles.matchingButtonTextSelected
                  ]}>
                    {answer}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderQuestion = () => {
    if (state.loadingAttempts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (!state.currentQuestion) {
      return null;
    }

    // If the test was previously taken, immediately show the completion screen
    if (route.params.lessonId === 'daily-challenge' && state.hasAttemptedTest) {
      return renderQuizCompletion();
    }

    return (
      <View style={styles.questionContainer}>
        {state.showResult && route.params.lessonId !== 'daily-challenge' && (
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
            {!state.answeredCorrectly && state.currentQuestion && state.currentQuestion.explanation && (
              <>
                <Text style={styles.explanationText}>
                  {state.currentQuestion.explanation}
                </Text>
                <Button
                  mode="contained"
                  onPress={handleNextQuestion}
                  style={[styles.nextButton, { backgroundColor: colors.primary }]}
                >
                  Следващ въпрос
                </Button>
              </>
            )}
          </View>
        )}

        {state.currentQuestion && (
          <Card style={[styles.questionCard, { backgroundColor: '#fff' }]}> 
            <Card.Content>
              <Title style={[styles.questionText, { color: '#000' }]}>{state.currentQuestion!.question}</Title>
              {state.currentQuestion!.type === 'matching' ? (
                renderMatchingQuestion()
              ) : (
                <View style={styles.optionsContainer}>
                  {state.currentQuestion!.options.map((option: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        state.currentQuestion!.type === 'multiple' 
                          ? state.selectedAnswers.includes(option) && styles.optionButtonSelected
                          : state.selectedAnswer === option && styles.optionButtonSelected
                      ]}
                      onPress={() => handleAnswerSelect(option)}
                    >
                      <Text style={[
                        styles.optionText,
                        state.currentQuestion!.type === 'multiple'
                          ? state.selectedAnswers.includes(option) && styles.optionTextSelected
                          : state.selectedAnswer === option && styles.optionTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {!state.showResult && route.params.lessonId !== 'daily-challenge' && (
          <Button
            mode="contained"
            onPress={handleAnswerSubmit}
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            disabled={(!state.currentQuestion) || (!state.selectedAnswer && state.selectedAnswers.length === 0)}
          >
            Потвърди
          </Button>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
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

      <BottomNavigationBar 
        navigation={navigation}
        activeTab={"quiz" as TabKey}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  questionContainer: {
    flex: 1,
  },
  resultContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  explanationText: {
    marginBottom: 16,
  },
  nextButton: {
    marginTop: 16,
  },
  questionCard: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionsContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
  },
  optionButtonSelected: {
    backgroundColor: '#8A97FF',
    borderColor: '#8A97FF',
  },
  optionText: {
    fontSize: 16,
    color: '#222',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    padding: 16,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scorePercentage: {
    fontSize: 16,
  },
  previousScoreText: {
    fontSize: 14,
    color: '#666',
  },
  passingScoreText: {
    fontSize: 14,
    color: '#666',
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bonusText: {
    fontSize: 14,
    color: '#666',
  },
  recommendationsContainer: {
    marginBottom: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationText: {
    marginLeft: 8,
  },
  tipsContainer: {
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    marginLeft: 8,
  },
  completionButton: {
    marginTop: 16,
  },
  personalityHeader: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  personalityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  personalityDescription: {
    fontSize: 16,
    color: '#666',
  },
  explanationContainer: {
    marginBottom: 16,
  },
  matchingContainer: {
    marginBottom: 16,
  },
  matchingPair: {
    marginBottom: 8,
  },
  matchingSituation: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchingOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchingButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  matchingButtonSelected: {
    backgroundColor: '#8A97FF',
    borderColor: '#8A97FF',
  },
  matchingButtonText: {
    fontSize: 16,
  },
  matchingButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#222',
  },
});
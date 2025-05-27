import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  Title,
  Paragraph,
  Button,
  Card,
  RadioButton,
  Text,
  IconButton,
  Surface,
  ProgressBar,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { Appbar } from "react-native-paper";
import { ParamListBase } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import BottomNavigationBar, { TabKey } from "../components/BottomNavigationBar";
import type { RootStackParamList as AppRootStackParamList } from "../AppNavigator";

// Define types locally
interface QuizCompletionData {
  score: number;
  totalQuestions: number;
  xpEarned: number;
  timeBonus: number;
  perfectScore: boolean;
  passed: boolean;
  previousBestScore?: number;
  attemptsCount?: number;
  currentXP?: number;
  newXP?: number;
  profileId?: string;
  personalityType?: string;
  recommendations?: string[];
  tips?: string[];
}

interface QuizResult {
  score: number;
  totalQuestions: number;
  passed: boolean;
  perfectScore: boolean;
  xpEarned: number;
  currentXP: number;
  newXP: number;
  personalityType?: string;
}

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
  type: "single" | "multiple" | "matching";
  options?: string[];
  correctAnswers?: number[];
  pairs?: Array<{
    situation: string;
    answer: string;
  }>;
  explanation?: string;
}

// Use the imported type with a different name
type RootStackParamList = AppRootStackParamList;

type QuizScreenProps = {
  navigation: NativeStackNavigationProp<
    import("../AppNavigator").RootStackParamList
  >;
  route: RouteProp<import("../AppNavigator").RootStackParamList, "Quiz">;
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
  type: "single" | "multiple" | "matching";
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
  matchingAnswers: Record<string, string>;
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
  // 1. All hooks must be called at the top level, before any conditional logic
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
    currentQuestion: null,
  });

  // 2. All useEffects should be grouped together
  useEffect(() => {
    if (state.completionData && !state.loadingCompletion) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [state.completionData, state.loadingCompletion]);

  useEffect(() => {
    if (!state.loading && !state.error) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [state.loading, state.error]);

  useEffect(() => {
    if (route.params.questions) {
      const questions = route.params.questions;
      setState((prev) => ({
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
        answeredCorrectly: false,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "No questions available for this quiz",
        currentQuestion: null,
      }));
    }
  }, [route.params.questions]);

  useEffect(() => {
    checkPreviousAttempts();
  }, [route.params.lessonId]);

  useEffect(() => {
    if (route.params.lessonId === "daily-challenge") {
      setState((prev) => ({ ...prev, selectedAnswers: [] }));
    }
  }, [route.params.lessonId]);

  // 3. useLayoutEffect should be after all useEffects
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => null,
    });
  }, [navigation]);

  const updateState = (updates: Partial<QuizState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleAnswerSelect = (answer: string) => {
    if (state.quizCompleted) return;

    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (currentQuestion.type === "multiple") {
      // Toggle the answer - remove if already selected, add if not selected
      const newSelectedAnswers = state.selectedAnswers.includes(answer)
        ? state.selectedAnswers.filter((a) => a !== answer)
        : [...state.selectedAnswers, answer];

      updateState({
        selectedAnswers: newSelectedAnswers,
      });
    } else if (currentQuestion.type === "matching") {
      updateState({
        matchingAnswers: {
          ...state.matchingAnswers,
          [currentQuestion.id]: answer,
        },
      });
    } else {
      updateState({ selectedAnswer: answer });
    }

    if (route.params.lessonId === "daily-challenge") {
      handleNextQuestion();
    }
  };

  const handleAnswerSubmit = () => {
    if (route.params.lessonId === "daily-challenge") {
      handleNextQuestion();
      return;
    }

    const currentQuestion = state.questions[state.currentQuestionIndex];
    let isCorrect = false;

    if (currentQuestion.type === "multiple") {
      // For multiple choice, check that:
      // 1. All correct answers are selected
      // 2. No incorrect answers are selected
      const correctAnswers = currentQuestion.correctAnswers || [];
      const hasAllCorrect = correctAnswers.every((answer) =>
        state.selectedAnswers.includes(answer)
      );
      const hasNoIncorrect = state.selectedAnswers.every((answer) =>
        correctAnswers.includes(answer)
      );
      isCorrect = hasAllCorrect && hasNoIncorrect;
    } else if (currentQuestion.type === "matching") {
      isCorrect = Object.entries(state.matchingAnswers).every(
        ([questionId, answer]) => {
          const question = state.questions.find((q) => q.id === questionId);
          return question?.correctAnswer === answer;
        }
      );
    } else {
      isCorrect = currentQuestion.correctAnswer === state.selectedAnswer;
    }

    updateState({
      score: isCorrect ? state.score + 1 : state.score,
      showResult: true,
      answeredCorrectly: isCorrect,
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
        timeRemaining: 60,
      });
    } else {
      console.log("Quiz completed, calculating final score...");
      // Calculate final score and determine if passed
      const scorePercentage = (state.score / state.questions.length) * 100;
      const passedQuiz = scorePercentage >= 80;
      const isPerfectScore = state.score === state.questions.length;

      console.log(
        "Score:",
        state.score,
        "Total:",
        state.questions.length,
        "Percentage:",
        scorePercentage,
        "Passed:",
        passedQuiz
      );

      // Update state to show completion screen immediately
      updateState({
        quizCompleted: true,
        loadingCompletion: true,
        currentQuestion: null,
      });

      // Calculate completion data and save results
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    console.log("Starting quiz completion process...");
    try {
      // Get the current user directly from supabase auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log(
        "User auth check:",
        user ? "User found" : "No user",
        "Error:",
        userError
      );

      if (userError || !user) {
        throw new Error("User not found");
      }

      const userId = user.id;
      console.log("Processing quiz for user:", userId);

      // First, check if the user has completed this quiz before
      const { data: previousAttempts, error: attemptsError } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("profile_id", userId)
        .eq("quiz_id", route.params.lessonId)
        .order("completed_at", { ascending: false });

      console.log(
        "Previous attempts check:",
        previousAttempts?.length || 0,
        "attempts found",
        "Error:",
        attemptsError
      );

      if (attemptsError) {
        throw attemptsError;
      }

      const hasCompletedBefore =
        previousAttempts && previousAttempts.length > 0;
      const currentScorePercentage =
        (state.score / state.questions.length) * 100;
      const passedQuiz = currentScorePercentage >= 80;
      const isPerfectScore = state.score === state.questions.length;

      console.log("Quiz status:", {
        hasCompletedBefore,
        currentScorePercentage,
        passedQuiz,
        isPerfectScore,
      });

      // If already completed before, just show the UI without saving
      if (hasCompletedBefore) {
        console.log("Quiz was completed before, showing UI only");
        const completionData = {
          score: state.score,
          totalQuestions: state.questions.length,
          xpEarned: 0,
          timeBonus: 0,
          perfectScore: isPerfectScore,
          passed: passedQuiz,
          previousBestScore: Math.max(
            ...previousAttempts.map(
              (attempt) => (attempt.score / attempt.total_questions) * 100
            )
          ),
          attemptsCount: previousAttempts.length + 1,
          currentXP: previousAttempts[0].xp_earned || 0,
          newXP: previousAttempts[0].xp_earned || 0,
          profileId: userId,
          personalityType: previousAttempts[0].personality_type,
          recommendations: [
            passedQuiz
              ? "Поздравления! Преминахте теста успешно!"
              : "Опитайте отново, за да преминете теста.",
            isPerfectScore
              ? "Перфектен резултат! Отлично представяне!"
              : "Добър резултат!",
            "Вече сте завършили този тест преди.",
            previousAttempts[0].personality_type
              ? `Вашият финансов тип е: ${previousAttempts[0].personality_type}`
              : "",
          ].filter(Boolean),
          tips: [
            "Можете да опитате отново за по-добър резултат.",
            "Регулярното обучение е ключът към успеха.",
          ],
        };

        console.log(
          "Setting completion data for repeat attempt:",
          completionData
        );

        updateState({
          completionData,
          loadingCompletion: false,
        });

        navigation.setParams({
          ...route.params,
          completed: true,
          score: state.score,
          totalQuestions: state.questions.length,
          xpEarned: 0,
          currentXP: previousAttempts[0].xp_earned || 0,
          newXP: previousAttempts[0].xp_earned || 0,
          personalityType: previousAttempts[0].personality_type,
        });
        return;
      }

      console.log("First time completion, proceeding with save");
      // For first-time completion, proceed with normal save
      const quizResult = {
        score: state.score,
        totalQuestions: state.questions.length,
        timeRemaining: state.timeRemaining,
        passed: passedQuiz,
        perfectScore: isPerfectScore,
      };

      // Determine personality type for financial personality quiz
      let personalityType = null;
      if (route.params.lessonId === "financial_personality") {
        const answerCounts = state.selectedAnswers.reduce((acc, answer) => {
          acc[answer] = (acc[answer] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const maxCount = Math.max(...Object.values(answerCounts));
        const dominantType = Object.entries(answerCounts).find(
          ([_, count]) => count === maxCount
        )?.[0];

        personalityType = dominantType || "balanced";
      }

      console.log("Calling RPC function for quiz completion");
      // Call the appropriate RPC function based on quiz type
      const { data, error } = await supabase.rpc(
        route.params.lessonId === "financial_personality"
          ? "complete_financial_personality"
          : "complete_quiz",
        {
          p_profile_id: user.id,
          p_quiz_id: route.params.lessonId,
          p_score: state.score,
          p_time_taken: 300 - state.timeRemaining,
          p_total_questions: state.questions.length,
          ...(route.params.lessonId === "financial_personality"
            ? { p_personality_type: personalityType }
            : {}),
        }
      );

      console.log("RPC response:", { data, error });

      if (error) {
        console.error("Error completing quiz:", error);
        throw error;
      }

      if (!data) {
        throw new Error("No data returned from quiz completion");
      }

      const completionData = {
        score: state.score,
        totalQuestions: state.questions.length,
        xpEarned: data.xp_earned,
        timeBonus: 0,
        perfectScore: data.is_perfect,
        passed: data.passed,
        previousBestScore: 0,
        attemptsCount: 1,
        currentXP: data.current_xp || 0,
        newXP: data.new_xp || 0,
        profileId: user.id,
        personalityType: data.personality_type || undefined,
        recommendations: [
          data.passed
            ? "Поздравления! Преминахте теста успешно и спечелихте XP!"
            : "Опитайте отново, за да преминете теста.",
          data.is_perfect
            ? "Перфектен резултат! Отлично представяне!"
            : "Добър резултат!",
          data.personality_type
            ? `Вашият финансов тип е: ${data.personality_type}`
            : "",
        ].filter(Boolean),
        tips: [
          "Продължете да учите и да подобрявате знанията си.",
          "Регулярното обучение е ключът към успеха.",
        ],
      };

      console.log("Setting completion data for first attempt:", completionData);

      // Update state with completion data
      updateState({
        completionData,
        loadingCompletion: false,
      });

      // Update navigation params
      navigation.setParams({
        ...route.params,
        completed: true,
        score: state.score,
        totalQuestions: state.questions.length,
        xpEarned: data.xp_earned,
        currentXP: data.current_xp || 0,
        newXP: data.new_xp || 0,
        personalityType: data.personality_type,
      });
    } catch (error) {
      console.error("Error in quiz completion:", error);
      // Even if saving fails, show the completion screen with error state
      const errorCompletionData = {
        score: state.score,
        totalQuestions: state.questions.length,
        xpEarned: 0,
        timeBonus: 0,
        perfectScore: state.score === state.questions.length,
        passed: false,
        previousBestScore: 0,
        attemptsCount: 0,
        currentXP: 0,
        newXP: 0,
        profileId: "",
        personalityType: undefined,
        recommendations: [
          "Възникна грешка при запазване на резултата.",
          "Моля, опитайте отново по-късно.",
        ],
        tips: [
          "Вашият резултат е записан локално.",
          "Можете да опитате отново по-късно.",
        ],
      };

      console.log("Setting error completion data:", errorCompletionData);

      updateState({
        completionData: errorCompletionData,
        loadingCompletion: false,
      });
    }
  };

  const saveQuizResults = async () => {
    // This function is now just a wrapper for the completion logic
    // The actual logic has been moved to handleNextQuestion
  };

  const checkPreviousAttempts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: "SignIn" }],
        });
        return;
      }

      const { data: attempts, error } = await supabase
        .from("quiz_attempts")
        .select("*")
        .eq("profile_id", user.id)
        .eq("quiz_id", route.params.lessonId)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      const hasAttempted = !!attempts;
      updateState({
        hasAttemptedTest: hasAttempted,
        loadingAttempts: false,
      });
    } catch (err) {
      console.error("checkPreviousAttempts: Error:", err);
      Alert.alert(
        "Error",
        "Failed to check previous attempts. Please try again.",
        [{ text: "OK" }]
      );
      updateState({ loadingAttempts: false });
    }
  };

  const calculateQuizCompletion = async (
    userId: string
  ): Promise<QuizCompletionData> => {
    const baseXP = 100;
    const perfectScoreBonus = 50;
    const timeBonus = Math.floor((state.timeRemaining / 60) * 10);
    const scorePercentage = (state.score / state.questions.length) * 100;
    const passedQuiz = scorePercentage >= 80;
    const isPerfectScore = state.score === state.questions.length;

    // Get previous quiz attempts using supabase
    const { data: previousAttempts, error: attemptsError } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("profile_id", userId)
      .eq("quiz_id", route.params.lessonId);

    if (attemptsError) {
      throw attemptsError;
    }

    // Filter attempts for this specific quiz
    const attempts = previousAttempts || [];
    const previousBestScore =
      attempts.length > 0
        ? Math.max(
            ...attempts.map(
              (attempt) => (attempt.score / attempt.total_questions) * 100
            )
          )
        : 0;

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
      passed: passedQuiz,
      previousBestScore,
      attemptsCount: attempts.length,
      profileId: userId,
      recommendations,
      tips,
      personalityType: undefined,
    };

    return completionData;
  };

  const renderQuizCompletion = () => {
    const passedQuiz = state.completionData?.passed;
    const isPerfectScore = state.completionData?.perfectScore;
    const xpEarned = state.completionData?.xpEarned || 0;
    const totalQuestions = state.completionData?.totalQuestions || 0;
    const score = state.completionData?.score || 0;
    const personalityType = state.completionData?.personalityType;
    const scorePercentage = Math.round((score / totalQuestions) * 100);
    const previousBestScore = state.completionData?.previousBestScore || 0;
    const attemptsCount = state.completionData?.attemptsCount || 0;

    return (
      <ScrollView
        style={[
          styles.container,
          { backgroundColor: passedQuiz ? "#F8FFF8" : "#FFF8F8" },
        ]}
        contentContainerStyle={styles.completionScrollContent}
      >
        <Surface
          style={[
            styles.completionCard,
            {
              backgroundColor: passedQuiz ? "#FFFFFF" : "#FFFFFF",
              borderColor: passedQuiz ? "#4CAF50" : "#FF6B6B",
              borderWidth: 1,
            },
          ]}
        >
          {/* Header Section with Status Icon and Score */}
          <View style={styles.completionHeader}>
            <View
              style={[
                styles.statusIconContainer,
                {
                  backgroundColor: passedQuiz ? "#E8F5E9" : "#FFEBEE",
                },
              ]}
            >
              <MaterialCommunityIcons
                name={passedQuiz ? "check-circle" : "alert-circle"}
                size={64}
                color={passedQuiz ? "#4CAF50" : "#FF6B6B"}
              />
            </View>

            <View style={styles.scoreDisplay}>
              <Text
                style={[
                  styles.scorePercentage,
                  {
                    color: passedQuiz ? "#4CAF50" : "#FF6B6B",
                  },
                ]}
              >
                {scorePercentage}%
              </Text>
              <Text style={styles.scoreFraction}>
                {score}/{totalQuestions} правилни отговора
              </Text>
              {previousBestScore > 0 && (
                <View style={styles.previousScoreContainer}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={16}
                    color="#FFD700"
                  />
                  <Text style={styles.previousScoreText}>
                    Най-добър резултат: {previousBestScore}%
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status and Stats Section */}
          <View style={styles.statsSection}>
            <Text
              style={[
                styles.statusMessage,
                {
                  color: passedQuiz ? "#4CAF50" : "#FF6B6B",
                },
              ]}
            >
              {passedQuiz
                ? isPerfectScore
                  ? "Перфектен резултат! Преминахте теста!"
                  : "Поздравления! Преминахте теста!"
                : "Не успяхте да преминете теста"}
            </Text>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
                <Text style={styles.statValue}>{xpEarned}</Text>
                <Text style={styles.statLabel}>XP Печели</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color="#666"
                />
                <Text style={styles.statValue}>{attemptsCount}</Text>
                <Text style={styles.statLabel}>Опити</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="target" size={24} color="#666" />
                <Text style={styles.statValue}>{scorePercentage}%</Text>
                <Text style={styles.statLabel}>Точност</Text>
              </View>
            </View>
          </View>

          {/* Personality Type Section (if applicable) */}
          {personalityType && (
            <View style={styles.personalitySection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="account" size={24} color="#666" />
                <Text style={styles.sectionTitle}>Вашият Финансов Профил</Text>
              </View>
              <View style={styles.personalityContainer}>
                <Text style={styles.personalityText}>{personalityType}</Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="#666"
                />
              </View>
            </View>
          )}

          {/* Recommendations Section */}
          <View style={styles.recommendationsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb" size={24} color="#666" />
              <Text style={styles.sectionTitle}>Препоръки</Text>
            </View>
            <View style={styles.recommendationsList}>
              {state.completionData?.recommendations?.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={passedQuiz ? "#4CAF50" : "#FF6B6B"}
                  />
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.tipsSection}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="bookmark" size={24} color="#666" />
              <Text style={styles.sectionTitle}>Съвети</Text>
            </View>
            <View style={styles.tipsList}>
              {state.completionData?.tips?.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <MaterialCommunityIcons
                    name="star"
                    size={20}
                    color="#FFD700"
                  />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {!passedQuiz ? (
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
                      answeredCorrectly: false,
                    });
                  }}
                  style={[styles.actionButton, { backgroundColor: "#FF6B6B" }]}
                  labelStyle={styles.actionButtonLabel}
                  icon="refresh"
                >
                  Опитайте отново
                </Button>
                <br />
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={[styles.actionButton, { borderColor: "#FF6B6B" }]}
                  labelStyle={[styles.actionButtonLabel, { color: "#FF6B6B" }]}
                >
                  Обратно към урока
                </Button>
              </>
            ) : (
              <>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("Home")}
                  style={[styles.actionButton, { backgroundColor: "#4CAF50" }]}
                  labelStyle={styles.actionButtonLabel}
                  icon="home"
                >
                  Към началната страница
                </Button>
                <br />
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  style={[styles.actionButton, { borderColor: "#4CAF50" }]}
                  labelStyle={[styles.actionButtonLabel, { color: "#4CAF50" }]}
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
        <Surface
          style={[
            styles.questionCard,
            { backgroundColor: themeColors.surface },
          ]}
        >
          <View style={styles.questionHeader}>
            <Text style={styles.questionNumber}>
              Въпрос {state.currentQuestionIndex + 1} от{" "}
              {state.questions.length}
            </Text>
            <View style={styles.timerContainer}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={themeColors.primary}
              />
              <Text style={styles.timerText}>{state.timeRemaining} сек</Text>
            </View>
          </View>

          <View style={styles.questionContent}>
            <Title style={[styles.questionText, { color: "#222" }]}>
              {currentQuestion.question}
            </Title>

            {currentQuestion.type === "matching" ? (
              renderMatchingQuestion()
            ) : (
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map(
                  (option: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        currentQuestion.type === "multiple"
                          ? state.selectedAnswers.includes(option) &&
                            styles.optionButtonSelected
                          : state.selectedAnswer === option &&
                            styles.optionButtonSelected,
                      ]}
                      onPress={() => handleAnswerSelect(option)}
                    >
                      <View style={styles.optionContent}>
                        <MaterialCommunityIcons
                          name={
                            currentQuestion.type === "multiple"
                              ? state.selectedAnswers.includes(option)
                                ? "checkbox-marked-circle"
                                : "checkbox-blank-circle-outline"
                              : state.selectedAnswer === option
                              ? "radiobox-marked"
                              : "radiobox-blank"
                          }
                          size={24}
                          color={
                            currentQuestion.type === "multiple"
                              ? state.selectedAnswers.includes(option)
                                ? themeColors.primary
                                : "#666"
                              : state.selectedAnswer === option
                              ? themeColors.primary
                              : "#666"
                          }
                        />
                        <Text
                          style={[
                            styles.optionText,
                            currentQuestion.type === "multiple"
                              ? state.selectedAnswers.includes(option) &&
                                styles.optionTextSelected
                              : state.selectedAnswer === option &&
                                styles.optionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )
                )}
              </View>
            )}
          </View>

          {state.showResult && (
            <View
              style={[
                styles.resultContainer,
                {
                  backgroundColor: state.answeredCorrectly
                    ? "#e8f5e9"
                    : "#ffebee",
                },
              ]}
            >
              <Text
                style={[
                  styles.resultText,
                  { color: state.answeredCorrectly ? "#2e7d32" : "#c62828" },
                ]}
              >
                {state.answeredCorrectly
                  ? "Правилен отговор!"
                  : "Грешен отговор"}
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
                style={[
                  styles.submitButton,
                  { backgroundColor: themeColors.primary },
                ]}
                labelStyle={styles.submitButtonLabel}
                disabled={
                  !currentQuestion ||
                  (!state.selectedAnswer && state.selectedAnswers.length === 0)
                }
                icon="check"
              >
                Потвърди
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleNextQuestion}
                style={[
                  styles.nextButton,
                  { backgroundColor: themeColors.primary },
                ]}
                labelStyle={styles.nextButtonLabel}
                icon="arrow-right"
              >
                {state.currentQuestionIndex < state.questions.length - 1
                  ? "Следващ въпрос"
                  : "Завърши теста"}
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
      justifyContent: "center",
      alignItems: "center",
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    questionNumber: {
      fontSize: 16,
      color: "#666",
      fontWeight: "500",
    },
    timerContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    timerText: {
      marginLeft: 4,
      fontSize: 14,
      color: "#666",
      fontWeight: "500",
    },
    questionContent: {
      marginBottom: 20,
    },
    questionText: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#222",
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
      borderColor: "#e0e0e0",
      backgroundColor: "#f8f9fa",
      overflow: "hidden",
    },
    optionButtonSelected: {
      backgroundColor: "#e8f0fe",
      borderColor: themeColors.primary,
    },
    optionContent: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
    },
    optionText: {
      fontSize: 16,
      color: "#222",
      marginLeft: 12,
      flex: 1,
    },
    optionTextSelected: {
      color: themeColors.primary,
      fontWeight: "500",
    },
    resultContainer: {
      padding: 16,
      borderRadius: 12,
      marginTop: 16,
      marginBottom: 16,
    },
    resultText: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 8,
    },
    explanationText: {
      fontSize: 14,
      color: "#666",
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
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    nextButton: {
      borderRadius: 12,
      paddingVertical: 8,
    },
    nextButtonLabel: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
    errorText: {
      fontSize: 16,
      color: "#666",
      textAlign: "center",
    },
    completionContainer: {
      flex: 1,
      padding: 16,
      backgroundColor: "#F5F5F5",
    },
    resultCard: {
      borderRadius: 24,
      overflow: "hidden",
      elevation: 4,
    },
    completionHeader: {
      padding: 24,
      alignItems: "center",
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    completionTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#FFFFFF",
      marginTop: 16,
      textAlign: "center",
    },
    scoreSection: {
      padding: 24,
      alignItems: "center",
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "#FFFFFF",
      justifyContent: "center",
      alignItems: "center",
      elevation: 2,
      marginBottom: 16,
    },
    scorePercentage: {
      fontSize: 32,
      fontWeight: "bold",
    },
    scoreLabel: {
      fontSize: 14,
      color: "#666",
      marginTop: 4,
    },
    previousScoreText: {
      fontSize: 14,
      color: "#666",
      marginTop: 8,
    },
    passingScoreText: {
      fontSize: 14,
      color: "#FF6B6B",
      marginTop: 8,
      fontWeight: "500",
    },
    xpSection: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
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
      fontWeight: "bold",
      color: "#222",
    },
    bonusText: {
      fontSize: 14,
      color: "#666",
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
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      marginLeft: 8,
    },
    recommendationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
      backgroundColor: "#FFFFFF",
      padding: 12,
      borderRadius: 8,
      elevation: 1,
    },
    recommendationText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      lineHeight: 20,
      color: "#444",
    },
    tipItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 12,
      backgroundColor: "#FFFFFF",
      padding: 12,
      borderRadius: 8,
      elevation: 1,
    },
    tipText: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      lineHeight: 20,
      color: "#444",
    },
    actionButtonsContainer: {
      margin: 24,
    },
    completionButton: {
      paddingVertical: 8,
      borderRadius: 12,
    },
    completionButtonLabel: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
      paddingVertical: 4,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: "#666",
    },
    matchingContainer: {
      marginBottom: 16,
    },
    matchingText: {
      fontSize: 16,
      color: "#666",
    },
    xpTotalText: {
      fontSize: 16,
      color: "#4CAF50",
      fontWeight: "bold",
      marginTop: 4,
    },
    testButton: {},
    debugButton: {},
    debugButtonLabel: {},
    completionSubtitle: {
      fontSize: 16,
      color: "#666",
      marginTop: 8,
    },
    scoreContainer: {
      padding: 24,
      alignItems: "center",
    },
    scoreText: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#222",
    },
    perfectScoreText: {
      fontSize: 16,
      color: "#4CAF50",
      fontWeight: "bold",
    },
    personalityText: {
      fontSize: 16,
      color: "#666",
    },
    completionScrollContent: {
      flexGrow: 1,
      padding: 16,
      minHeight: "100%",
    },
    completionCard: {
      borderRadius: 24,
      padding: 24,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      marginBottom: 24,
    },
    completionHeader: {
      alignItems: "center",
      marginBottom: 32,
    },
    statusIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
      elevation: 2,
    },
    scoreDisplay: {
      alignItems: "center",
    },
    scorePercentage: {
      fontSize: 48,
      fontWeight: "bold",
      marginBottom: 8,
    },
    scoreFraction: {
      fontSize: 18,
      color: "#666",
      marginBottom: 8,
    },
    previousScoreContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFDE7",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
    },
    previousScoreText: {
      fontSize: 14,
      color: "#666",
      marginLeft: 4,
    },
    statsSection: {
      marginBottom: 32,
    },
    statusMessage: {
      fontSize: 24,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 24,
    },
    statsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
    },
    statItem: {
      flex: 1,
      alignItems: "center",
      backgroundColor: "#F8F9FA",
      padding: 16,
      borderRadius: 16,
      marginHorizontal: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#222",
      marginTop: 8,
    },
    statLabel: {
      fontSize: 14,
      color: "#666",
      marginTop: 4,
    },
    personalitySection: {
      marginBottom: 32,
    },
    personalityContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#F5F5F5",
      padding: 16,
      borderRadius: 16,
    },
    personalityText: {
      fontSize: 18,
      color: "#222",
      fontWeight: "500",
    },
    recommendationsList: {
      gap: 12,
    },
    actionButton: {
      width: "100%",
      borderRadius: 16,
      paddingVertical: 12,
    },
    actionButtonLabel: {
      fontSize: 18,
      fontWeight: "bold",
      paddingVertical: 4,
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
        >
          {renderQuestion()}
        </ScrollView>
      )}
    </View>
  );
}

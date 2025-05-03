import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Title, Paragraph, Button, Card, RadioButton, Text, IconButton, Surface, ProgressBar, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, THEME } from '../ThemeContext';
import { Appbar } from 'react-native-paper';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface RootStackParamList extends ParamListBase {
  Quiz: { topic: string };
  Home: undefined;
}

type QuizScreenProps = {
  route: RouteProp<RootStackParamList, 'Quiz'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Quiz'>;
};

export default function QuizScreen({ route, navigation }: QuizScreenProps) {
  // Safely extract parameters
  const { topic = 'General Knowledge' } = route.params;
  
  // Use simplified useTheme hook
  const { theme } = useTheme();
  const themeToUse = theme || THEME;
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean>(false);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(30); // seconds per question
  const [timeElapsed, setTimeElapsed] = useState<number>(0); // total time elapsed
  const [timeRunOut, setTimeRunOut] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Mock quiz data - would come from backend
  const quizQuestions: QuizQuestion[] = [
    {
      question: 'Which of the following is NOT a key element of a personal budget?',
      options: [
        'Income',
        'Expenses',
        'Credit score',
        'Savings'
      ],
      correctAnswer: 2,
      explanation: 'Credit score is an important financial indicator, but it is not part of the basic structure of a personal budget, which consists of income, expenses, and savings.'
    },
    {
      question: 'What is the "50/30/20 rule" in budgeting?',
      options: [
        '50% needs, 30% wants, 20% savings',
        '50% housing, 30% food, 20% other expenses',
        '50% savings, 30% investments, 20% expenses',
        '50% expenses, 30% taxes, 20% savings'
      ],
      correctAnswer: 0,
      explanation: 'The 50/30/20 rule suggests allocating income as follows: 50% for basic needs, 30% for personal wants, and 20% for savings and debt repayment.'
    },
    {
      question: 'What is an emergency fund?',
      options: [
        'Stock investment for emergencies',
        'Health insurance',
        'Saved funds for unexpected expenses',
        'Low-interest credit line'
      ],
      correctAnswer: 2,
      explanation: 'An emergency fund consists of easily accessible saved funds that cover 3-6 months of your expenses in unforeseen situations such as job loss or medical expenses.'
    }
  ];
  
  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  // Timer effect for tracking time elapsed
  useEffect(() => {
    // Don't start timer if quiz is already complete
    if (quizComplete) return;
    
    const timeElapsedTimer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timeElapsedTimer);
  }, [quizComplete]);
  
  // Timer effect for question time limit
  useEffect(() => {
    if (showResult || quizComplete) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Show time run out animation
          setTimeRunOut(true);
          
          // Fade in animation
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.delay(1000),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start(() => {
            // Mark as incorrect and move to next question
            handleTimeUp();
          });
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentQuestionIndex, showResult, quizComplete, fadeAnim]);
  
  // Reset timer when moving to next question
  useEffect(() => {
    setTimeRemaining(30);
  }, [currentQuestionIndex]);
  
  const handleAnswerSubmit = () => {
    // If no answer is selected and time ran out, treat it as incorrect
    if (selectedAnswer === null && timeRemaining <= 0) {
      setAnsweredCorrectly(false);
      setShowResult(true);
      return;
    }
    
    // If no answer is selected and timer hasn't run out, don't proceed
    if (selectedAnswer === null) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
      setAnsweredCorrectly(true);
    } else {
      setAnsweredCorrectly(false);
    }
    
    setShowResult(true);
  };
  
  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeRunOut(false); // Reset time run out state
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizComplete(true);
    }
  };
  
  const handleSelectAnswer = (index: number) => {
    setSelectedAnswer(index);
  };
  
  const handleSubmitAnswer = () => {
    handleAnswerSubmit();
    handleNextQuestion();
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const renderQuizCompletion = () => {
    const earnedXP = score * 25; // XP earned depends on score
    const passedPercent = 70; // Consider 70% correct answers as passing score
    const scorePercent = (score / quizQuestions.length) * 100;
    const passed = scorePercent >= passedPercent;
    
    return (
      <View style={[styles.questionContainer, { backgroundColor: '#efefef' }]}>
        <Surface style={[styles.questionCard, { backgroundColor: '#efefef', paddingVertical: 24 }]} elevation={0}>
          <View style={styles.completionTitleContainer}>
            <MaterialCommunityIcons 
              name={passed ? "trophy" : "school"} 
              size={40} 
              color={passed ? "#FFD700" : themeToUse.colors?.primary} 
            />
            <Title style={[styles.completionTitleText, { color: '#000', textAlign: 'center', marginLeft: 12 }]}>
              Quiz Completed!
            </Title>
          </View>
          
          <View style={styles.scoreDisplay}>
            <View style={[styles.scoreCircle, { borderWidth: 4, borderColor: passed ? '#4CAF50' : '#F44336' }]}>
              <Text style={[styles.scoreCircleText, { color: passed ? '#4CAF50' : '#F44336' }]}>
                {scorePercent.toFixed(0)}%
              </Text>
            </View>
            <Text style={{ color: '#000', fontSize: 18, textAlign: 'center', marginTop: 12, fontWeight: '500' }}>
              {score} out of {quizQuestions.length} correct answers
            </Text>
          </View>
          
          <View style={styles.resultDetailsContainer}>
            <View style={[styles.resultDetailItem, { backgroundColor: '#ffffff' }]}>
              <MaterialCommunityIcons name="star" size={28} color="#FFD700" />
              <Text style={{ color: '#000', marginLeft: 12, fontSize: 16, fontWeight: '500' }}>{earnedXP} XP earned</Text>
            </View>
            
            <View style={[styles.resultDetailItem, { backgroundColor: '#ffffff' }]}>
              <MaterialCommunityIcons name="clock-outline" size={28} color="#000" />
              <Text style={{ color: '#000', marginLeft: 12, fontSize: 16, fontWeight: '500' }}>{formatTime(timeElapsed)}</Text>
            </View>
            
            {score === quizQuestions.length && (
              <View style={[styles.resultDetailItem, { backgroundColor: '#ffffff' }]}>
                <MaterialCommunityIcons name="medal" size={28} color="#FF6F00" />
                <Text style={{ color: '#000', marginLeft: 12, fontSize: 16, fontWeight: '500' }}>Badge "Financial Expert"</Text>
              </View>
            )}
          </View>
          
          {passed ? (
            <View style={[styles.feedbackContainer, { backgroundColor: '#E8F5E9' }]}>
              <View style={styles.explanationHeader}>
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={28} 
                  color="#4CAF50" 
                />
                <Text style={{ color: '#2E7D32', fontSize: 20, fontWeight: 'bold', marginLeft: 12 }}>
                  Congratulations!
                </Text>
              </View>
              <Text style={{ color: '#2E7D32', marginTop: 12, fontSize: 16, lineHeight: 22 }}>
                You have successfully passed this quiz. Great job on your financial knowledge!
              </Text>
            </View>
          ) : (
            <View style={[styles.feedbackContainer, { backgroundColor: '#FFEBEE' }]}>
              <View style={styles.explanationHeader}>
                <MaterialCommunityIcons 
                  name="alert-circle" 
                  size={28} 
                  color="#F44336" 
                />
                <Text style={{ color: '#C62828', fontSize: 20, fontWeight: 'bold', marginLeft: 12 }}>
                  Try Again!
                </Text>
              </View>
              <Text style={{ color: '#C62828', marginTop: 12, fontSize: 16, lineHeight: 22 }}>
                You need to achieve at least {passedPercent}% to pass the quiz. Keep learning and you'll get there!
              </Text>
            </View>
          )}
          
          <View style={styles.completionButtonContainer}>
            <Button 
              mode="contained" 
              onPress={() => {
                setCurrentQuestionIndex(0);
                setScore(0);
                setQuizComplete(false);
                setShowResult(false);
                setSelectedAnswer(null);
                setTimeElapsed(0);
                setTimeRemaining(30);
              }}
              style={[styles.completionButton, { marginBottom: 12 }]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              color={themeToUse.colors?.primary}
            >
              Try Again
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()}
              style={styles.completionButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              color={themeToUse.colors?.primary}
            >
              Back to Lesson
            </Button>
          </View>
        </Surface>
      </View>
    );
  };
  
  const renderQuestion = () => {
    return (
      <View style={[styles.questionContainer, { backgroundColor: '#efefef' }]}>
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={[styles.questionCounter, { color: '#000' }]}>
              Question {currentQuestionIndex + 1}/{quizQuestions.length}
            </Text>
            <View style={styles.timerContainer}>
              <MaterialCommunityIcons 
                name="clock-outline" 
                size={20} 
                color={timeRemaining < 10 ? '#F44336' : '#000'} 
              />
              <Text 
                style={[
                  styles.timerText, 
                  { 
                    color: timeRemaining < 10 ? '#F44336' : '#000',
                    fontWeight: timeRemaining < 10 ? 'bold' : 'normal' 
                  }
                ]}
              >
                {timeRemaining}s
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarWrapper}>
            <ProgressBar
              progress={(currentQuestionIndex) / quizQuestions.length}
              color={themeToUse.colors?.primary}
              style={styles.progressBar}
            />
            <View style={styles.percentageContainer}>
              <Text style={styles.percentageText}>
                {Math.round((currentQuestionIndex / quizQuestions.length) * 100)}%
              </Text>
            </View>
          </View>
        </View>
        
        <Surface style={[styles.questionCard, { backgroundColor: '#efefef' }]} elevation={0}>
          {/* Time Run Out Overlay */}
          {timeRunOut && (
            <Animated.View 
              style={[
                styles.timeRunOutOverlay,
                {
                  opacity: fadeAnim,
                }
              ]}
            >
              <MaterialCommunityIcons name="timer-off" size={64} color="#fff" />
              <Text style={styles.timeRunOutText}>Time's Up!</Text>
            </Animated.View>
          )}
          
          <Title style={[styles.questionText, { color: '#000' }]}>
            {currentQuestion.question}
          </Title>
          
          <RadioButton.Group
            onValueChange={(value) => handleSelectAnswer(parseInt(value))}
            value={selectedAnswer?.toString() || ''}
          >
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectAnswer(index)}
                disabled={showResult}
                style={[
                  styles.optionContainer,
                  { backgroundColor: '#ffffff' },
                  selectedAnswer === index && !showResult && styles.selectedOption,
                  showResult && index === currentQuestion.correctAnswer && styles.correctOption,
                  showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && styles.incorrectOption
                ]}
              >
                <RadioButton 
                  value={index.toString()} 
                  disabled={showResult}
                  color={
                    showResult
                      ? index === currentQuestion.correctAnswer 
                        ? '#4CAF50' 
                        : selectedAnswer === index 
                          ? '#F44336' 
                          : themeToUse.colors?.primary
                      : themeToUse.colors?.primary
                  }
                />
                <Text style={[
                  styles.optionText,
                  { color: '#000000' },
                  showResult && index === currentQuestion.correctAnswer && { color: '#2E7D32', fontWeight: 'bold' },
                  showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && { color: '#C62828' }
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
          
          <View style={styles.buttonContainer}>
            {!showResult ? (
              <Button 
                mode="contained"
                disabled={selectedAnswer === null}
                onPress={handleAnswerSubmit}
                style={styles.button}
                color={themeToUse.colors?.primary}
              >
                Submit Answer
              </Button>
            ) : (
              <Button 
                mode="contained"
                onPress={handleNextQuestion}
                style={styles.button}
                color={themeToUse.colors?.primary}
              >
                {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
              </Button>
            )}
          </View>

          {showResult && (
            <View style={[styles.explanationContainer, { backgroundColor: answeredCorrectly ? '#E8F5E9' : '#FFEBEE' }]}>
              <View style={styles.explanationHeader}>
                <MaterialCommunityIcons 
                  name={answeredCorrectly ? 'check-circle' : 'close-circle'} 
                  size={24} 
                  color={answeredCorrectly ? '#4CAF50' : '#F44336'} 
                />
                <Text style={[styles.explanationTitle, { color: answeredCorrectly ? '#2E7D32' : '#C62828' }]}>
                  {answeredCorrectly ? 'Correct!' : 'Incorrect!'}
                </Text>
              </View>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}
        </Surface>
      </View>
    );
  };
  
  // New handler for when time runs out
  const handleTimeUp = () => {
    // Mark current question as incorrect (no points awarded)
    setAnsweredCorrectly(false);
    
    // Move to next question or complete quiz
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setTimeRunOut(false);
      setSelectedAnswer(null);
    } else {
      setQuizComplete(true);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: themeToUse.colors?.background }]}>
      <Appbar.Header style={{ backgroundColor: themeToUse.colors?.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title={`Quiz: ${topic}`} color="#fff" />
      </Appbar.Header>
      
      <ScrollView contentContainerStyle={styles.scrollContent} >
        {quizComplete ? renderQuizCompletion() : renderQuestion()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  questionContainer: {
    flex: 1,
    padding: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questionCounter: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 16,
    marginLeft: 8,
  },
  progressBarWrapper: {
    position: 'relative',
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 12,
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  questionCard: {
    marginVertical: 16,
  },
  questionText: {
    fontSize: 20,
    marginBottom: 24,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  incorrectOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  optionText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  explanationContainer: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  explanationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  explanationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  scoreDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreCircleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultDetailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  resultDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: '30%',
  },
  feedbackContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  completionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completionTitleText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  completionButtonContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  completionButton: {
    width: '100%',
    borderRadius: 12,
  },
  buttonContent: {
    height: 52,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeRunOutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  timeRunOutText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 
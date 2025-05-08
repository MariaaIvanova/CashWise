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
  correctAnswer: number | number[];
  explanation: string;
  isMultipleChoice?: boolean;
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
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
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
      question: 'Каква е основната цел на потребителския кредит?',
      options: [
        'Закупуване на жилище',
        'Покупка на дребни стоки като техника',
        'Инвестиране на фондовата борса'
      ],
      correctAnswer: 1,
      explanation: 'Потребителските кредити са предназначени за покупка на дребни стоки като техника, мебели и други потребителски стоки.'
    },
    {
      question: 'Ако не можеш да изплатиш кредита си навреме…',
      options: [
        'Ще заведат дело срещу теб',
        'Ще намалят лихвата',
        'Ще започнат наказателни лихви'
      ],
      correctAnswer: 2,
      explanation: 'При забавяне на плащанията по кредита, банката започва да начислява наказателни лихви, които значително увеличават общата сума за погасяване.'
    },
    {
      question: 'Кои от изброените характеристики се отнасят за бързите кредити?',
      options: [
        'Лесно достъпни',
        'Подходящи само в извънредни случаи',
        'Изискват ипотека на жилище',
        'Обикновено с висока лихва',
        'Погасяват се за 20–30 години'
      ],
      correctAnswer: [0, 1, 3],
      isMultipleChoice: true,
      explanation: 'Бързите кредити са лесно достъпни, подходящи само за спешни случаи и обикновено имат висока лихва. Те не изискват ипотека и имат кратък срок на погасяване.'
    },
    {
      question: 'Кой от изброените кредити обикновено изисква най-дълъг срок на погасяване?',
      options: [
        'Потребителски',
        'Бърз',
        'Ипотечен'
      ],
      correctAnswer: 2,
      explanation: 'Ипотечните кредити обикновено имат най-дълъг срок на погасяване, тъй като са за големи суми и закупуване на недвижим имот.'
    },
    {
      question: 'Свържете термините с тяхното обяснение:',
      options: [
        'Лихва - Сума, която се изплаща допълнително към заема',
        'Вноска - Част от кредита, която се плаща всеки месец',
        'Гратисен период - Време, в което не се изисква плащане'
      ],
      correctAnswer: [0, 1, 2],
      isMultipleChoice: true,
      explanation: 'Лихвата е допълнителната сума, която се плаща за използването на кредита. Вноската е редовното месечно плащане. Гратисният период е време, през което не се изисква плащане.'
    },
    {
      question: 'Какъв е основният риск при бързите кредити?',
      options: [
        'Бавна процедура по одобрение',
        'Висока лихва и риск от задлъжняване',
        'Трудност при намиране на кредитори'
      ],
      correctAnswer: 1,
      explanation: 'Основният риск при бързите кредити е високата лихва и възможността за задлъжняване поради бързото одобрение и по-малко строги изисквания.'
    },
    {
      question: 'Кое от следните твърдения е вярно за потребителските кредити?',
      options: [
        'Изискват ипотека като обезпечение',
        'Предназначени са за покупка на жилище',
        'Обикновено са в размер до 10 000 лв.'
      ],
      correctAnswer: 2,
      explanation: 'Потребителските кредити обикновено са за по-малки суми (до 10 000 лв.) и не изискват ипотека като обезпечение.'
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
    if ((selectedAnswer === null && !currentQuestion.isMultipleChoice) && timeRemaining <= 0) {
      setAnsweredCorrectly(false);
      setShowResult(true);
      return;
    }
    
    // If no answer is selected and timer hasn't run out, don't proceed
    if ((selectedAnswer === null && !currentQuestion.isMultipleChoice) || 
        (currentQuestion.isMultipleChoice && selectedAnswers.length === 0)) return;
    
    let isCorrect: boolean;
    if (currentQuestion.isMultipleChoice) {
      const correctAnswers = currentQuestion.correctAnswer as number[];
      isCorrect = correctAnswers.length === selectedAnswers.length &&
                 correctAnswers.every(answer => selectedAnswers.includes(answer));
    } else {
      isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    }

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
    setSelectedAnswers([]);
    setShowResult(false);
    setTimeRunOut(false);
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizComplete(true);
    }
  };
  
  const handleSelectAnswer = (index: number) => {
    if (currentQuestion.isMultipleChoice) {
      setSelectedAnswers(prev => {
        if (prev.includes(index)) {
          return prev.filter(i => i !== index);
        } else {
          return [...prev, index];
        }
      });
    } else {
      setSelectedAnswer(index);
    }
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
              Тестът завършен!
            </Title>
          </View>
          
          <View style={styles.scoreDisplay}>
            <View style={[styles.scoreCircle, { borderWidth: 4, borderColor: passed ? '#4CAF50' : '#F44336' }]}>
              <Text style={[styles.scoreCircleText, { color: passed ? '#4CAF50' : '#F44336' }]}>
                {scorePercent.toFixed(0)}%
              </Text>
            </View>
            <Text style={{ color: '#000', fontSize: 18, textAlign: 'center', marginTop: 12, fontWeight: '500' }}>
              {score} от {quizQuestions.length} правилни отговора
            </Text>
          </View>
          
          <View style={styles.resultDetailsContainer}>
            <View style={[styles.resultDetailItem, { backgroundColor: '#ffffff' }]}>
              <MaterialCommunityIcons name="star" size={28} color="#FFD700" />
              <Text style={{ color: '#000', marginLeft: 12, fontSize: 16, fontWeight: '500' }}>{earnedXP} точки спечелени</Text>
            </View>
            
            <View style={[styles.resultDetailItem, { backgroundColor: '#ffffff' }]}>
              <MaterialCommunityIcons name="clock-outline" size={28} color="#000" />
              <Text style={{ color: '#000', marginLeft: 12, fontSize: 16, fontWeight: '500' }}>{formatTime(timeElapsed)}</Text>
            </View>
            
            {score === quizQuestions.length && (
              <View style={[styles.resultDetailItem, { backgroundColor: '#ffffff' }]}>
                <MaterialCommunityIcons name="medal" size={28} color="#FF6F00" />
                <Text style={{ color: '#000', marginLeft: 12, fontSize: 16, fontWeight: '500' }}>Значка "Финансов експерт"</Text>
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
                  Поздравления!
                </Text>
              </View>
              <Text style={{ color: '#2E7D32', marginTop: 12, fontSize: 16, lineHeight: 22 }}>
                Успешно преминахте този тест. Отлична работа с вашите финансови познания!
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
                  Опитайте отново!
                </Text>
              </View>
              <Text style={{ color: '#C62828', marginTop: 12, fontSize: 16, lineHeight: 22 }}>
                Трябва да постигнете поне {passedPercent}% за да преминете теста. Продължете да учите и ще успеете!
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
                setSelectedAnswers([]);
                setTimeElapsed(0);
                setTimeRemaining(30);
              }}
              style={[styles.completionButton, { marginBottom: 12 }]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              color={themeToUse.colors?.primary}
            >
              Опитайте отново
            </Button>
            <Button 
              mode="outlined" 
              onPress={() => navigation.goBack()}
              style={styles.completionButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              color={themeToUse.colors?.primary}
            >
              Назад към урока
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
              Въпрос {currentQuestionIndex + 1}/{quizQuestions.length}
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
          <Title style={[styles.questionText, { color: '#000' }]}>
            {currentQuestion.question}
          </Title>
          
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  (currentQuestion.isMultipleChoice ? selectedAnswers.includes(index) : selectedAnswer === index) && 
                  styles.selectedOption,
                  showResult && index === currentQuestion.correctAnswer && styles.correctOption,
                  showResult && 
                  ((currentQuestion.isMultipleChoice ? selectedAnswers.includes(index) : selectedAnswer === index)) && 
                  index !== currentQuestion.correctAnswer && 
                  styles.incorrectOption
                ]}
                onPress={() => !showResult && handleSelectAnswer(index)}
                activeOpacity={0.7}
              >
                <RadioButton
                  value={index.toString()}
                  status={
                    currentQuestion.isMultipleChoice
                      ? selectedAnswers.includes(index) ? 'checked' : 'unchecked'
                      : selectedAnswer === index ? 'checked' : 'unchecked'
                  }
                  onPress={() => !showResult && handleSelectAnswer(index)}
                  color={themeToUse.colors?.primary}
                />
                <Text style={[
                  styles.optionText,
                  showResult && index === currentQuestion.correctAnswer && { color: '#4CAF50', fontWeight: 'bold' },
                  showResult && 
                  ((currentQuestion.isMultipleChoice ? selectedAnswers.includes(index) : selectedAnswer === index)) && 
                  index !== currentQuestion.correctAnswer && 
                  { color: '#F44336' }
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {!showResult ? (
            <Button
              mode="contained"
              onPress={handleAnswerSubmit}
              style={styles.submitButton}
              disabled={
                currentQuestion.isMultipleChoice
                  ? selectedAnswers.length === 0
                  : selectedAnswer === null
              }
            >
              Провери отговора
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleNextQuestion}
              style={styles.submitButton}
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'Завърши' : 'Следващ въпрос'}
            </Button>
          )}

          {showResult && (
            <View style={[styles.explanationContainer, { backgroundColor: answeredCorrectly ? '#E8F5E9' : '#FFEBEE' }]}>
              <View style={styles.explanationHeader}>
                <MaterialCommunityIcons 
                  name={answeredCorrectly ? 'check-circle' : 'close-circle'} 
                  size={24} 
                  color={answeredCorrectly ? '#4CAF50' : '#F44336'} 
                />
                <Text style={[styles.explanationTitle, { color: answeredCorrectly ? '#2E7D32' : '#C62828' }]}>
                  {answeredCorrectly ? 'Правилен отговор!' : 'Грешен отговор!'}
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
        <Appbar.Content title={`Тест: ${topic}`} color="#fff" />
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
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
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
  submitButton: {
    marginTop: 24,
    width: '100%',
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
  correctOption: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  incorrectOption: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
}); 
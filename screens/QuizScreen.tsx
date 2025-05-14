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
  route: RouteProp<RootStackParamList, 'Quiz'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Quiz'>;
};

// Quiz data for Lesson 1: Credits
const creditQuizQuestions: QuizQuestion[] = [
  {
    question: 'Каква е основната цел на потребителския кредит?',
    type: 'single',
    options: [
      'Закупуване на жилище',
      'Покупка на дребни стоки като техника',
      'Инвестиране на фондовата борса'
    ],
    correctAnswers: [1],
    explanation: 'Потребителските кредити са предназначени за покупка на дребни стоки като техника, мебели и други потребителски стоки.'
  },
  {
    question: 'Ако не можеш да изплатиш кредита си навреме…',
    type: 'single',
    options: [
      'Ще заведат дело срещу теб',
      'Ще намалят лихвата',
      'Ще започнат наказателни лихви'
    ],
    correctAnswers: [2],
    explanation: 'При забавяне на плащанията по кредита, банката започва да начислява наказателни лихви, които значително увеличават общата сума за погасяване.'
  },
  {
    question: 'Кои от изброените характеристики се отнасят за бързите кредити?',
    type: 'multiple',
    options: [
      'Лесно достъпни',
      'Подходящи само в извънредни случаи',
      'Изискват ипотека на жилище',
      'Обикновено с висока лихва',
      'Погасяват се за 20–30 години'
    ],
    correctAnswers: [0, 1, 3],
    explanation: 'Бързите кредити са лесно достъпни, подходящи само за спешни случаи и обикновено имат висока лихва. Те не изискват ипотека и имат кратък срок на погасяване.'
  },
  {
    question: 'Кой от изброените кредити обикновено изисква най-дълъг срок на погасяване?',
    type: 'single',
    options: [
      'Потребителски',
      'Бърз',
      'Ипотечен'
    ],
    correctAnswers: [2],
    explanation: 'Ипотечните кредити обикновено имат най-дълъг срок на погасяване, тъй като са за големи суми и закупуване на недвижим имот.'
  },
  {
    question: 'Свържете термините с тяхното обяснение:',
    type: 'matching',
    pairs: [
      {
        situation: 'Сума, която се изплаща допълнително към заема',
        answer: 'Лихва'
      },
      {
        situation: 'Част от кредита, която се плаща всеки месец',
        answer: 'Вноска'
      },
      {
        situation: 'Време, в което не се изисква плащане',
        answer: 'Гратисен период'
      }
    ]
  }
];

// Quiz data for Lesson 2: Investments
const investmentQuizQuestions: QuizQuestion[] = [
  {
    question: 'Кои от следните твърдения са верни за инвестирането в имоти?',
    type: 'multiple',
    options: [
      'Изисква по-голям първоначален капитал',
      'Може да носи доход чрез наем',
      'Подходящо е само за краткосрочни вложения',
      'Позволява печалба при препродажба',
      'Носи по-висок риск от облигации, но и по-малък от акциите'
    ],
    correctAnswers: [0, 1, 3]
  },
  {
    question: 'Какъв е основният риск при инвестирането в акции?',
    type: 'single',
    options: [
      'Да не получиш лихва',
      'Да загубиш пари, ако компанията се провали',
      'Да не намериш купувач за имота'
    ],
    correctAnswers: [1]
  },
  {
    question: 'Кое твърдение е вярно за облигациите?',
    type: 'single',
    options: [
      'Генерират голяма печалба, но с висок риск',
      'Те са по-сигурни, но носят по-малка печалба',
      'Купуват се само от банки'
    ],
    correctAnswers: [1]
  },
  {
    question: 'Какво може да се случи, ако компанията, в която си инвестирал чрез акции, започне да губи пари?',
    type: 'single',
    options: [
      'Ще получиш фиксирана лихва, независимо от резултатите',
      'Може да загубиш част или цялата си инвестиция',
      'Ще получиш по-високи дивиденти'
    ],
    correctAnswers: [1]
  },
  {
    question: 'Какъв е основният източник на доход при инвестиция в имоти?',
    type: 'single',
    options: [
      'От дивиденти',
      'От наеми или препродажба',
      'От държавна субсидия'
    ],
    correctAnswers: [1]
  },
  {
    question: 'Коя инвестиция обикновено се смята за най-сигурна?',
    type: 'single',
    options: [
      'Акции',
      'Облигации',
      'Имоти'
    ],
    correctAnswers: [1]
  },
  {
    question: 'Коя от следните инвестиции гарантира висока и сигурна печалба?',
    type: 'single',
    options: [
      'Акции на известна компания',
      'Облигации с гарантирана лихва',
      'Нито една – всяка инвестиция носи риск'
    ],
    correctAnswers: [2]
  },
  {
    question: 'Свържете ситуациите с правилния вид инвестиция:',
    type: 'matching',
    pairs: [
      {
        situation: 'Иван купува акции на технологична фирма и следи дали ще се покачат цените.',
        answer: 'Акции'
      },
      {
        situation: 'Мария дава пари на държавата и получава фиксирана лихва всяка година.',
        answer: 'Облигации'
      },
      {
        situation: 'Петър купува апартамент и го отдава под наем.',
        answer: 'Имоти'
      }
    ]
  }
];

export default function QuizScreen({ route, navigation }: QuizScreenProps) {
  const { lessonId } = route.params;
  const { theme } = useTheme();
  const themeToUse = theme || THEME;
  
  // Select quiz questions based on lessonId
  const getQuizQuestions = () => {
    switch (lessonId) {
      case '1':
        return creditQuizQuestions;
      case '2':
        return investmentQuizQuestions;
      default:
        return [];
    }
  };

  // Get quiz title based on lessonId
  const getQuizTitle = () => {
    switch (lessonId) {
      case '1':
        return 'Тест: Кредити';
      case '2':
        return 'Тест: Инвестиции';
      default:
        return 'Тест';
    }
  };

  const quizQuestions = getQuizQuestions();
  const quizTitle = getQuizTitle();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [matchingAnswers, setMatchingAnswers] = useState<{ [key: string]: string }>({});
  const [score, setScore] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean>(false);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60); // More time for matching questions
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = quizQuestions[currentQuestionIndex];

  useEffect(() => {
    if (quizComplete) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentQuestionIndex, showResult, quizComplete]);

  useEffect(() => {
    // Reset timer based on question type
    setTimeRemaining(currentQuestion.type === 'matching' ? 90 : 60);
  }, [currentQuestionIndex]);

  const handleAnswerSubmit = () => {
    let isCorrect = false;

    switch (currentQuestion.type) {
      case 'single':
        isCorrect = selectedAnswer === currentQuestion.correctAnswers?.[0];
        break;
      case 'multiple':
        isCorrect = currentQuestion.correctAnswers?.length === selectedAnswers.length &&
                   currentQuestion.correctAnswers.every(answer => selectedAnswers.includes(answer));
        break;
      case 'matching':
        if (currentQuestion.pairs) {
          isCorrect = currentQuestion.pairs.every(pair => 
            matchingAnswers[pair.situation] === pair.answer
          );
        }
        break;
    }

    if (isCorrect) {
      setScore(score + 1);
      setAnsweredCorrectly(true);
    } else {
      setAnsweredCorrectly(false);
    }
    
    setShowResult(true);
    // Automatically move to next question after a short delay
    setTimeout(handleNextQuestion, 1500);
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setSelectedAnswers([]);
    setMatchingAnswers({});
    setShowResult(false);
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (currentQuestion.type === 'multiple') {
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

  const handleMatchingAnswer = (situation: string, answer: string) => {
    setMatchingAnswers(prev => ({
      ...prev,
      [situation]: answer
    }));
  };

  const handleTimeUp = () => {
    setAnsweredCorrectly(false);
    setShowResult(true);
    setTimeout(handleNextQuestion, 1500);
  };

  const renderQuizCompletion = () => (
    <View style={styles.completionContainer}>
      <Title style={styles.completionTitle}>Тест завършен!</Title>
      <Paragraph style={styles.completionScore}>
        Резултат: {score} от {quizQuestions.length} точки
      </Paragraph>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Home')}
        style={styles.completionButton}
      >
        Към началото
      </Button>
    </View>
  );

  const renderMatchingQuestion = () => {
    if (!currentQuestion.pairs) return null;

    return (
      <View style={styles.matchingContainer}>
        {currentQuestion.pairs.map((pair, index) => (
          <View key={index} style={styles.matchingPair}>
            <Text style={styles.matchingSituation}>{pair.situation}</Text>
            <View style={styles.matchingAnswers}>
              {['Акции', 'Облигации', 'Имоти'].map((answer, answerIndex) => (
                <TouchableOpacity
                  key={answerIndex}
                  style={[
                    styles.matchingButton,
                    matchingAnswers[pair.situation] === answer && styles.matchingButtonSelected
                  ]}
                  onPress={() => handleMatchingAnswer(pair.situation, answer)}
                >
                  <Text style={[
                    styles.matchingButtonText,
                    matchingAnswers[pair.situation] === answer && styles.matchingButtonTextSelected
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

  const renderQuestion = () => (
    <View style={styles.questionContainer}>
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={(currentQuestionIndex + 1) / quizQuestions.length}
          color={themeToUse.colors.primary}
          style={styles.progressBar}
        />
        <Text style={[styles.progressText, { color: '#000' }]}>
          {currentQuestionIndex + 1}/{quizQuestions.length}
        </Text>
      </View>

      <Card style={[styles.questionCard, { backgroundColor: '#fff' }]}>
        <Card.Content>
          <Title style={[styles.questionText, { color: '#000' }]}>{currentQuestion.question}</Title>
          
          {currentQuestion.type === 'matching' ? (
            renderMatchingQuestion()
          ) : (
            <RadioButton.Group
              onValueChange={(value) => handleSelectAnswer(Number(value))}
              value={
                currentQuestion.type === 'multiple'
                  ? selectedAnswers[selectedAnswers.length - 1]?.toString() || ''
                  : selectedAnswer?.toString() || ''
              }
            >
              {currentQuestion.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleSelectAnswer(index)}
                  style={[styles.optionContainer, { backgroundColor: '#f5f5f5' }]}
                >
                  {currentQuestion.type === 'multiple' ? (
                    <IconButton
                      icon={selectedAnswers.includes(index) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={24}
                      onPress={() => handleSelectAnswer(index)}
                      iconColor={themeToUse.colors.primary}
                    />
                  ) : (
                    <RadioButton 
                      value={index.toString()} 
                      color={themeToUse.colors.primary}
                    />
                  )}
                  <Text style={[styles.optionText, { color: '#000' }]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </RadioButton.Group>
          )}
        </Card.Content>
      </Card>

      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: '#000' }]}>
          Оставащо време: {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
        </Text>
      </View>

      {showResult && (
        <View style={[
          styles.resultContainer,
          { backgroundColor: answeredCorrectly ? '#e8f5e9' : '#ffebee' }
        ]}>
          <Text style={[
            styles.resultText,
            { color: answeredCorrectly ? '#2e7d32' : '#c62828' }
          ]}>
            {answeredCorrectly ? 'Правилен отговор!' : 'Грешен отговор!'}
          </Text>
        </View>
      )}

      <Button
        mode="contained"
        onPress={handleAnswerSubmit}
        style={[styles.submitButton, { backgroundColor: themeToUse.colors.primary }]}
        disabled={
          (currentQuestion.type === 'single' && selectedAnswer === null) ||
          (currentQuestion.type === 'multiple' && selectedAnswers.length === 0) ||
          (currentQuestion.type === 'matching' && 
           !currentQuestion.pairs?.every(pair => matchingAnswers[pair.situation]))
        }
      >
        Продължи
      </Button>
    </View>
  );

  const styles = StyleSheet.create({
    questionContainer: {
      flex: 1,
      padding: 16,
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
    },
    progressText: {
      textAlign: 'center',
      marginTop: 8,
    },
    questionCard: {
      marginBottom: 16,
    },
    questionText: {
      fontSize: 18,
      marginBottom: 16,
    },
    optionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8,
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#f5f5f5',
    },
    optionText: {
      flex: 1,
      marginLeft: 8,
    },
    timerContainer: {
      alignItems: 'center',
      marginVertical: 16,
    },
    timerText: {
      fontSize: 16,
    },
    submitButton: {
      marginTop: 16,
    },
    resultContainer: {
      padding: 16,
      borderRadius: 8,
      marginVertical: 16,
      alignItems: 'center',
    },
    resultText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    completionContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: '#fff',
    },
    completionTitle: {
      fontSize: 24,
      marginBottom: 16,
      color: '#000',
    },
    completionScore: {
      fontSize: 18,
      marginBottom: 24,
      color: '#000',
    },
    completionButton: {
      width: '100%',
    },
    matchingContainer: {
      marginTop: 16,
    },
    matchingPair: {
      marginBottom: 24,
    },
    matchingSituation: {
      fontSize: 16,
      marginBottom: 8,
      color: '#000',
    },
    matchingAnswers: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      flexWrap: 'wrap',
      gap: 8,
    },
    matchingButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: themeToUse.colors.primary,
      backgroundColor: '#fff',
    },
    matchingButtonSelected: {
      backgroundColor: themeToUse.colors.primary,
    },
    matchingButtonText: {
      color: themeToUse.colors.primary,
      fontWeight: '500',
    },
    matchingButtonTextSelected: {
      color: '#fff',
      fontWeight: '500',
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Appbar.Header style={{ backgroundColor: themeToUse.colors.primary }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content title={quizTitle} color="#fff" titleStyle={{ color: '#fff' }} />
      </Appbar.Header>
      
      <ScrollView style={{ flex: 1 }}>
        {quizComplete ? renderQuizCompletion() : renderQuestion()}
      </ScrollView>
    </View>
  );
}
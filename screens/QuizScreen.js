import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Title, Paragraph, Button, Card, RadioButton, Text, IconButton, Surface, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function QuizScreen({ route, navigation }) {
  const { topic } = route.params || { topic: 'Общи познания' };
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30); // seconds per question
  
  // Mock quiz data - would come from backend
  const quizQuestions = [
    {
      question: 'Кое от следните НЕ е основен елемент на личния бюджет?',
      options: [
        'Приходи',
        'Разходи',
        'Кредитен рейтинг',
        'Спестявания'
      ],
      correctAnswer: 2,
      explanation: 'Кредитният рейтинг е важен финансов показател, но не е част от основната структура на личния бюджет, който се състои от приходи, разходи и спестявания.'
    },
    {
      question: 'Какво представлява "правилото 50/30/20" при бюджетиране?',
      options: [
        '50% нужди, 30% желания, 20% спестявания',
        '50% жилище, 30% храна, 20% други разходи',
        '50% спестявания, 30% инвестиции, 20% разходи',
        '50% разходи, 30% данъци, 20% спестявания'
      ],
      correctAnswer: 0,
      explanation: 'Правилото 50/30/20 предполага разпределение на доходите: 50% за основни нужди, 30% за лични желания и 20% за спестявания и погасяване на дългове.'
    },
    {
      question: 'Какво е аварийният фонд?',
      options: [
        'Инвестиция в акции за спешни случаи',
        'Здравна застраховка',
        'Спестени средства за непредвидени разходи',
        'Кредитна линия с нисък лихвен процент'
      ],
      correctAnswer: 2,
      explanation: 'Аварийният фонд представлява лесно достъпни спестени средства, които покриват 3-6 месеца от разходите ви при непредвидени ситуации като загуба на работа или медицински разходи.'
    }
  ];
  
  const currentQuestion = quizQuestions[currentQuestionIndex];
  
  // Timer effect
  useEffect(() => {
    if (showResult || quizComplete) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit if time runs out
          handleAnswerSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [currentQuestionIndex, showResult, quizComplete]);
  
  // Reset timer when moving to next question
  useEffect(() => {
    setTimeRemaining(30);
  }, [currentQuestionIndex]);
  
  const handleAnswerSubmit = () => {
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
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizComplete(true);
    }
  };
  
  const renderQuizCompletion = () => {
    const earnedXP = score * 25; // XP earned depends on score
    
    return (
      <View style={styles.completionContainer}>
        <Title style={styles.completionTitle}>Тест завършен!</Title>
        
        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.scoreContainer}>
              <MaterialCommunityIcons
                name={score === quizQuestions.length ? 'trophy' : 'check-circle'}
                size={64}
                color={score === quizQuestions.length ? '#FFD700' : '#4CAF50'}
              />
              <View style={styles.scoreTextContainer}>
                <Title>Твоят резултат:</Title>
                <Title style={styles.scoreText}>{score}/{quizQuestions.length}</Title>
              </View>
            </View>
            
            <View style={styles.rewardsContainer}>
              <Text style={styles.rewardText}>Получени награди:</Text>
              <View style={styles.xpContainer}>
                <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
                <Text style={styles.xpText}>{earnedXP} XP</Text>
              </View>
              {score === quizQuestions.length && (
                <View style={styles.badgeContainer}>
                  <MaterialCommunityIcons name="medal" size={24} color="#FF6F00" />
                  <Text style={styles.badgeText}>Значка "Финансов експерт"</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={() => navigation.navigate('Home')}
            style={styles.button}
          >
            Към начало
          </Button>
          <Button 
            mode="outlined" 
            onPress={() => {
              setCurrentQuestionIndex(0);
              setSelectedAnswer(null);
              setScore(0);
              setShowResult(false);
              setQuizComplete(false);
            }}
            style={styles.button}
          >
            Нов опит
          </Button>
        </View>
      </View>
    );
  };
  
  if (quizComplete) {
    return renderQuizCompletion();
  }
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quiz Header */}
        <View style={styles.header}>
          <Title style={styles.topic}>{topic}: Тест</Title>
          <Text style={styles.progress}>Въпрос {currentQuestionIndex + 1}/{quizQuestions.length}</Text>
        </View>
        
        {/* Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeRemaining} сек.</Text>
          <ProgressBar
            progress={timeRemaining / 30}
            color={timeRemaining < 10 ? '#F44336' : '#4CAF50'}
            style={styles.timerBar}
          />
        </View>
        
        {/* Question Card */}
        <Card style={styles.questionCard}>
          <Card.Content>
            <Title style={styles.question}>{currentQuestion.question}</Title>
            
            <RadioButton.Group
              onValueChange={value => setSelectedAnswer(Number(value))}
              value={selectedAnswer !== null ? selectedAnswer.toString() : null}
            >
              {currentQuestion.options.map((option, index) => (
                <Surface 
                  key={index} 
                  style={[
                    styles.optionSurface,
                    selectedAnswer === index && styles.selectedOption,
                    showResult && index === currentQuestion.correctAnswer && styles.correctOption,
                    showResult && selectedAnswer === index && selectedAnswer !== currentQuestion.correctAnswer && styles.incorrectOption
                  ]}
                >
                  <RadioButton.Item
                    label={option}
                    value={index.toString()}
                    disabled={showResult}
                    style={styles.radioItem}
                  />
                </Surface>
              ))}
            </RadioButton.Group>
            
            {showResult && (
              <View style={styles.explanationContainer}>
                <Text style={styles.resultText}>
                  {answeredCorrectly 
                    ? '✓ Правилен отговор!' 
                    : '✗ Грешен отговор'}
                </Text>
                <Paragraph style={styles.explanation}>
                  {currentQuestion.explanation}
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>
        
        <View style={styles.buttonContainer}>
          {!showResult ? (
            <Button 
              mode="contained" 
              onPress={handleAnswerSubmit}
              disabled={selectedAnswer === null}
              style={styles.button}
            >
              Потвърди отговор
            </Button>
          ) : (
            <Button 
              mode="contained" 
              onPress={handleNextQuestion}
              style={styles.button}
            >
              {currentQuestionIndex < quizQuestions.length - 1 ? 'Следващ въпрос' : 'Завърши теста'}
            </Button>
          )}
          
          <Button 
            mode="text" 
            icon="close"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
          >
            Прекрати теста
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  header: {
    marginBottom: 16,
  },
  topic: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  progress: {
    fontSize: 16,
    color: '#666',
  },
  timerContainer: {
    marginBottom: 16,
  },
  timerText: {
    textAlign: 'right',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  timerBar: {
    height: 8,
    borderRadius: 4,
  },
  questionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  question: {
    fontSize: 18,
    marginBottom: 16,
  },
  optionSurface: {
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  correctOption: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  incorrectOption: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
    borderWidth: 1,
  },
  radioItem: {
    paddingVertical: 8,
  },
  explanationContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  resultText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  explanation: {
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    marginBottom: 12,
  },
  cancelButton: {
    marginTop: 8,
  },
  completionContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  resultCard: {
    marginBottom: 24,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scoreTextContainer: {
    marginLeft: 16,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rewardsContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  xpText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  badgeText: {
    marginLeft: 8,
    fontSize: 16,
  },
}); 
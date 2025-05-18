import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useTheme, ProgressBar, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../ThemeContext';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface Question {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
  };
}

interface TestResult {
  type: 'impulsive' | 'balanced' | 'strategic';
  title: string;
  description: string;
  tips: string[];
  color: string;
  icon: string;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'Когато получиш неочаквани пари (бонус, подарък, печалба), ти:',
    options: {
      A: 'Веднага ги харчиш за нещо приятно',
      B: 'Разделяш ги – част харчиш, част спестяваш',
      C: 'Спестяваш всичко или инвестираш',
    },
  },
  {
    id: 2,
    text: 'Как реагираш, когато видиш, че някой твой познат показва луксозен начин на живот в социалните мрежи?',
    options: {
      A: 'Чувстваш се зле и искаш да си купиш нещо подобно',
      B: 'Радваш се за него, но си мислиш дали това е реално',
      C: 'Не ти влияе – знаеш, че всеки има свой път',
    },
  },
  {
    id: 3,
    text: 'Когато си тъжен или под стрес, ти:',
    options: {
      A: 'Пазаруваш неща, които те карат да се почувстваш по-добре',
      B: 'Понякога се изкушаваш, но се стараеш да се контролираш',
      C: 'Имаш други начини да се справяш със стреса – не чрез харчене',
    },
  },
  {
    id: 4,
    text: 'Как планираш месечния си бюджет?',
    options: {
      A: 'Не го планираш – караш ден за ден',
      B: 'Имаш идея какво можеш да си позволиш',
      C: 'Правиш конкретен план и се придържаш към него',
    },
  },
  {
    id: 5,
    text: 'Когато искаш нещо скъпо, ти:',
    options: {
      A: 'Вземаш го веднага, дори на кредит',
      B: 'Разглеждаш опциите и мислиш',
      C: 'Изчакваш, планираш и събираш пари, ако решиш, че си струва',
    },
  },
  {
    id: 6,
    text: 'Как гледаш на дълговете?',
    options: {
      A: 'Те са нормална част от живота',
      B: 'Използваш ги само при нужда',
      C: 'Избягваш ги колкото се може повече',
    },
  },
  {
    id: 7,
    text: 'Какво значат парите за теб?',
    options: {
      A: 'Свобода да си купувам каквото искам',
      B: 'Средство за по-добър живот, но не всичко',
      C: 'Инструмент за сигурност и възможности в бъдещето',
    },
  },
  {
    id: 8,
    text: 'Коя от следните фрази най-точно описва отношението ти към парите?',
    options: {
      A: '„Живей днес, утре не е гарантирано."',
      B: '„Животът е баланс – и удоволствие, и отговорност."',
      C: '„Планирай днес, за да си свободен утре."',
    },
  },
];

const results: Record<string, TestResult> = {
  impulsive: {
    type: 'impulsive',
    title: 'Импулсивен харчещ',
    description: 'Парите за теб са начин да се наслаждаваш на живота, но внимавай – прекаленият импулс може да води до стрес и дългове. Помисли за по-дългосрочни цели и създаване на бюджет.',
    tips: [
      'Създай месечен бюджет и се придържай към него',
      'Изчаквай 24 часа преди да направиш голяма покупка',
      'Постави си дългосрочни финансови цели',
      'Използвай приложения за проследяване на разходите',
    ],
    color: '#FF6B6B',
    icon: 'flash',
  },
  balanced: {
    type: 'balanced',
    title: 'Балансиран реалист',
    description: 'Имаш разумно отношение към парите, но може биometimes се колебаеш. Усъвършенствай планирането и създай ясни финансови цели.',
    tips: [
      'Установи ясни приоритети за спестяванията си',
      'Разнообразявай инвестициите си',
      'Създай спешен фонд за непредвидени разходи',
      'Регулярно преглеждай финансовите си цели',
    ],
    color: '#FFD93D',
    icon: 'scale',
  },
  strategic: {
    type: 'strategic',
    title: 'Стратегически планиращ',
    description: 'Ти си дисциплиниран и гледаш на парите като на инструмент, а не само източник на удоволствие. Това е стабилна основа за финансово благополучие.',
    tips: [
      'Фокусирай се върху дългосрочното финансово планиране',
      'Разгледай възможности за пасивен доход',
      'Оптимизирай данъчното си планиране',
      'Помогни на другите да развият финансови умения',
    ],
    color: '#4CAF50',
    icon: 'trending-up',
  },
};

export const FinancialPersonalityTest = ({ onComplete, onClose }: { 
  onComplete: (result: TestResult) => void;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B' | 'C'>>({});
  const [progress] = useState(new Animated.Value(0));
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const animationRef = useRef<LottieView>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(progress, {
        toValue: (currentQuestion + 1) / questions.length,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      fadeAnim.setValue(1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  }, [currentQuestion]);

  useEffect(() => {
    if (showResult) {
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
      animationRef.current?.play();
    }
  }, [showResult]);

  const handleAnswer = (answer: 'A' | 'B' | 'C') => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    const counts = { A: 0, B: 0, C: 0 };
    Object.values(answers).forEach(answer => {
      counts[answer]++;
    });

    let type: 'impulsive' | 'balanced' | 'strategic';
    if (counts.A >= counts.B && counts.A >= counts.C) {
      type = 'impulsive';
    } else if (counts.B >= counts.A && counts.B >= counts.C) {
      type = 'balanced';
    } else {
      type = 'strategic';
    }

    const finalResult = results[type];
    setResult(finalResult);
    setShowResult(true);
    onComplete(finalResult);
  };

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.headerContent}>
        {currentQuestion > 0 && (
          <TouchableOpacity 
            onPress={() => setCurrentQuestion(prev => prev - 1)}
            style={styles.navButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#666" />
          </TouchableOpacity>
        )}
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress as unknown as number}
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            {currentQuestion + 1}/{questions.length}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onClose}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderQuestion = () => {
    const question = questions[currentQuestion];
    return (
      <Animated.View 
        style={[
          styles.questionContainer,
          { opacity: fadeAnim }
        ]}
      >
        {renderHeader()}
        <View style={styles.questionContent}>
          <View style={styles.questionNumberContainer}>
            <Text style={styles.questionNumber}>Въпрос {currentQuestion + 1}</Text>
          </View>
          <Text style={styles.questionText}>{question.text}</Text>
          <View style={styles.optionsContainer}>
            {Object.entries(question.options).map(([key, value]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.optionButton,
                  answers[currentQuestion] === key && styles.selectedOption,
                ]}
                onPress={() => handleAnswer(key as 'A' | 'B' | 'C')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[
                    styles.optionCircle,
                    answers[currentQuestion] === key && styles.selectedOptionCircle,
                  ]}>
                    <Text style={[
                      styles.optionLetter,
                      answers[currentQuestion] === key && styles.selectedOptionLetter,
                    ]}>
                      {key}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionText,
                    answers[currentQuestion] === key && styles.selectedOptionText,
                  ]}>
                    {value}
                  </Text>
                </View>
                {answers[currentQuestion] === key && (
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <Animated.View 
        style={[
          styles.resultContainer,
          {
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
            opacity: slideAnim,
          },
        ]}
      >
        <ScrollView 
          style={styles.resultScroll}
          contentContainerStyle={styles.resultScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.resultHeader, { backgroundColor: result.color }]}>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.resultCloseButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.resultIconContainer}>
              <Ionicons name={result.icon as any} size={48} color="#fff" />
            </View>
            <Text style={styles.resultTitle}>{result.title}</Text>
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>Твоят финансов тип</Text>
            </View>
          </View>

          <View style={styles.resultContent}>
            <View style={styles.resultCard}>
              <Text style={styles.resultDescription}>{result.description}</Text>
            </View>

            <View style={styles.tipsContainer}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb-outline" size={24} color={result.color} />
                <Text style={[styles.tipsTitle, { color: result.color }]}>
                  Съвети за подобрение
                </Text>
              </View>
              
              {result.tips.map((tip, index) => (
                <Animated.View 
                  key={index}
                  style={[
                    styles.tipItem,
                    {
                      opacity: slideAnim,
                      transform: [{
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0],
                        }),
                      }],
                    },
                  ]}
                >
                  <View style={[styles.tipIconContainer, { backgroundColor: `${result.color}15` }]}>
                    <Text style={[styles.tipNumber, { color: result.color }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </Animated.View>
              ))}
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.shareButton, { backgroundColor: result.color }]}
                onPress={() => {
                  Alert.alert('Сподели', 'Сподели резултата си с приятели!');
                }}
              >
                <Ionicons name="share-social" size={20} color="#fff" />
                <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                  Сподели резултата
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.resultNote}>
              <Ionicons name="information-circle-outline" size={20} color="#666" />
              <Text style={styles.resultNoteText}>
                Този тест може да се направи само веднъж, за да се запази точността на резултата.
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {!showResult ? renderQuestion() : renderResult()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  questionContainer: {
    flex: 1,
  },
  questionContent: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 90 : (StatusBar.currentHeight || 0) + 90,
  },
  questionNumberContainer: {
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 16,
    color: THEME.colors.primary,
    fontWeight: '600',
    opacity: 0.8,
  },
  questionText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#333',
    lineHeight: 34,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    borderRadius: 16,
    backgroundColor: '#f8f8f8',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedOption: {
    borderColor: THEME.colors.primary,
    backgroundColor: `${THEME.colors.primary}08`,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingRight: 48, // Space for checkmark
  },
  optionCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedOptionCircle: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.primary,
  },
  optionLetter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  selectedOptionLetter: {
    color: '#fff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: THEME.colors.primary,
    fontWeight: '600',
  },
  checkmarkContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultScroll: {
    flex: 1,
  },
  resultScrollContent: {
    paddingBottom: 40,
  },
  resultHeader: {
    padding: 30,
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 30,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resultBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultContent: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultDescription: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
    textAlign: 'center',
  },
  tipsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tipsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipText: {
    fontSize: 16,
    flex: 1,
    color: '#333',
    lineHeight: 24,
  },
  resultActions: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  shareButton: {
    backgroundColor: THEME.colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  resultNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  resultNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 
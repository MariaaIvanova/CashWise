import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  Modal,
  TextInput,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../supabase';
import emailjs from '@emailjs/browser';
import { RootStackParamList } from '../AppNavigator';
import { THEME } from '../ThemeContext';
import { useTheme, Button as PaperButton } from 'react-native-paper';
import { auth, database } from '../supabase';
import { FinancialPersonalityTest } from '../components/FinancialPersonalityTest';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

interface QuizAttempt {
  id: string;
  profile_id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  personality_type?: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Challenge {
  id: number;
  title: string;
  description: string;
  xp: number;
  icon: string;
  completed: boolean;
  action: () => Promise<void>;
}

interface TestResult {
  type: 'impulsive' | 'balanced' | 'strategic';
  title: string;
  description: string;
  tips: string[];
  color: string;
}

const ChallengesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [hasAttemptedTest, setHasAttemptedTest] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const slideAnim = useSharedValue(0);

  const updateUserXP = async (xpAmount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Грешка', 'Моля, влезте в профила си, за да печелите XP');
        return false;
      }

      // First get current XP and streak
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('xp, streak')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const today = new Date().toISOString().split('T')[0];
      
      // Calculate new streak (simplified version)
      let newStreak = (profile?.streak || 0) + 1;

      // Update XP and streak
      const newXP = (profile?.xp || 0) + xpAmount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          xp: newXP,
          streak: newStreak,
          last_activity_date: today
        })
        .eq('id', user.id);

      if (updateError) {
        // If update fails due to last_activity_date, try without it
        if (updateError.code === '42703') {
          const { error: retryError } = await supabase
            .from('profiles')
            .update({ 
              xp: newXP,
              streak: newStreak
            })
            .eq('id', user.id);
          
          if (retryError) throw retryError;
        } else {
          throw updateError;
        }
      }

      Alert.alert(
        'Успех!', 
        `Поздравления! Спечелихте ${xpAmount} XP!\nТекуща серия: ${newStreak} дни`
      );
      return true;
    } catch (error) {
      console.error('Error updating XP:', error);
      Alert.alert('Грешка', 'Неуспешно обновяване на XP. Моля, опитайте отново.');
      return false;
    }
  };

  const loadCompletedChallenges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date().toISOString().split('T')[0];
      const { data: completedChallenges } = await supabase
        .from('completed_challenges')
        .select('challenge_id')
        .eq('user_id', user.id)
        .eq('completed_date', today);

      return completedChallenges?.map(c => c.challenge_id) || [];
    } catch (error) {
      console.error('Error loading completed challenges:', error);
      return [];
    }
  };

  const markChallengeCompleted = async (challengeId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('completed_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          completed_date: today
        });

      if (error) throw error;

      // Update local state
      setChallenges(prev =>
        prev.map(c =>
          c.id === challengeId ? { ...c, completed: true } : c
        )
      );
      return true;
    } catch (error) {
      console.error('Error marking challenge completed:', error);
      return false;
    }
  };

  const handleInviteFriend = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Please sign in to invite friends');
        return;
      }

      // Get user's name for the email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        Alert.alert('Error', 'Failed to get your profile information');
        return;
      }

      // Send email using EmailJS
      const templateParams = {
        to_email: inviteEmail,
        inviter_name: profile?.name || 'Потребител на CashWise',
        message: 'Присъедини се към CashWise и нека заедно да научим повече за финансите!'
      };

      await emailjs.send(
        'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
        'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
        templateParams,
        'YOUR_PUBLIC_KEY' // Replace with your EmailJS public key
      );

      // Award XP for sending the invite
      const success = await updateUserXP(300);
      if (success) {
        await markChallengeCompleted(1);
        setShowInviteModal(false);
        setInviteEmail('');
        Alert.alert('Успех', 'Поканата е изпратена успешно!');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      Alert.alert('Грешка', 'Неуспешно изпращане на поканата. Моля, опитайте отново.');
    }
  };

  const checkPreviousAttempts = async () => {
    setLoadingAttempts(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'SignIn' }],
        });
        return;
      }

      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('personality_type')
        .eq('profile_id', user.id)
        .eq('quiz_id', 'financial_personality')
        .single();

      if (attempts) {
        setHasAttemptedTest(true);
        // Load the result based on personality type
        const resultMap: Record<string, TestResult> = {
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
          },
        };
        setTestResult(resultMap[attempts.personality_type]);
      }
    } catch (error) {
      console.error('Error checking previous attempts:', error);
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    const initializeChallenges = async () => {
      setLoading(true);
      const completedToday = await loadCompletedChallenges() || [];
      
      const personalityTestChallenge: Challenge = {
        id: 0,
        title: 'Финансов личностен тест',
        description: hasAttemptedTest 
          ? 'Прегледай своя финансов профил и съвети за подобрение'
          : 'Открий своя финансов тип и получи персонализирани съвети',
        xp: 500,
        icon: 'analytics-outline',
        completed: hasAttemptedTest,
        action: async () => {
          if (hasAttemptedTest) {
            setShowTestModal(true);
          } else {
            setShowTestModal(true);
          }
        },
      };

      const challengesList: Challenge[] = [
        {
          id: 1,
          title: 'Покани приятел',
          description: 'Изпрати покана на приятел да се присъедини към CashWise',
          xp: 300,
          icon: 'person-add',
          completed: completedToday.includes(1),
          action: async () => {
            if (completedToday.includes(1)) {
              Alert.alert('Вече е изпълнено', 'Вече сте изпълнили това предизвикателство днес!');
              return;
            }
            setShowInviteModal(true);
          },
        },
        {
          id: 2,
          title: 'Тест',
          description: 'Направи бърз тест, за да провериш финансовите си познания',
          xp: 250,
          icon: 'school',
          completed: completedToday.includes(2) || hasAttemptedTest,
          action: async () => {
            if (completedToday.includes(2) || hasAttemptedTest) {
              Alert.alert(
                'Вече е изпълнено', 
                hasAttemptedTest 
                  ? 'Вече сте направили този тест. Можете да видите резултатите си в профила си.' 
                  : 'Вече сте изпълнили това предизвикателство днес!'
              );
              return;
            }
            navigation.navigate('Quiz', { 
              lessonId: 'daily-challenge',
              onComplete: async () => {
                const success = await updateUserXP(250);
                if (success) {
                  await markChallengeCompleted(2);
                  setHasAttemptedTest(true);
                }
              }
            });
          },
        },
        {
          id: 3,
          title: 'Попълни профила си',
          description: 'Попълни цялата информация в профила си',
          xp: 100,
          icon: 'person-circle',
          completed: completedToday.includes(3),
          action: async () => {
            if (completedToday.includes(3)) {
              Alert.alert('Вече е изпълнено', 'Вече сте изпълнили това предизвикателство днес!');
              return;
            }
            navigation.navigate('Profile', {
              onComplete: async () => {
                const success = await updateUserXP(100);
                if (success) {
                  await markChallengeCompleted(3);
                }
              }
            });
          },
        },
        {
          id: 4,
          title: 'Дневна серия',
          description: 'Завърши поне един урок днес, за да поддържаш серията си',
          xp: 300,
          icon: 'flame',
          completed: completedToday.includes(4),
          action: async () => {
            if (completedToday.includes(4)) {
              Alert.alert('Вече е изпълнено', 'Вече сте изпълнили това предизвикателство днес!');
              return;
            }
            Alert.alert(
              'Дневна серия',
              'Завърши който и да е урок, за да получиш наградата. XP ще бъдат добавени автоматично след завършване на урока.'
            );
          },
        },
      ];

      setChallenges([personalityTestChallenge, ...challengesList]);
      setLoading(false);
    };

    initializeChallenges();
  }, []);

  useEffect(() => {
    checkPreviousAttempts();
  }, []);

  useEffect(() => {
    if (showTestModal && hasAttemptedTest) {
      slideAnim.value = withSpring(1, {
        damping: 15,
        stiffness: 100,
      });
    } else {
      slideAnim.value = 0;
    }
  }, [showTestModal, hasAttemptedTest]);

  const handleTestComplete = async (result: TestResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Грешка', 'Моля, влезте в профила си, за да запазите резултата');
        return;
      }

      // Save the test result
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          profile_id: user.id,
          quiz_id: 'financial_personality',
          score: 0,
          total_questions: 8,
          time_taken: 0,
          personality_type: result.type,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Award XP for completing the test
      await updateUserXP(500);
      setHasAttemptedTest(true);
      setTestResult(result);
      setShowTestModal(false);
      
      Alert.alert(
        'Поздравления!',
        'Успешно завършихте теста и спечелихте 500 XP!'
      );
    } catch (error) {
      console.error('Error saving test result:', error);
      Alert.alert('Грешка', 'Възникна проблем при запазване на резултата');
    }
  };

  const renderInviteModal = () => (
    <Modal
      visible={showInviteModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInviteModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Покани приятел</Text>
          <TextInput
            style={styles.input}
            placeholder="Email на приятел"
            value={inviteEmail}
            onChangeText={setInviteEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.modalButtons}>
            <PaperButton
              mode="outlined"
              onPress={() => setShowInviteModal(false)}
              style={styles.modalButton}
            >
              Отказ
            </PaperButton>
            <PaperButton
              mode="contained"
              onPress={handleInviteFriend}
              style={styles.modalButton}
              disabled={!inviteEmail}
            >
              Покани
            </PaperButton>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTestModal = () => (
    <Modal
      visible={showTestModal}
      animationType="slide"
      onRequestClose={() => setShowTestModal(false)}
    >
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {hasAttemptedTest && testResult ? (
          <View style={styles.resultContainer}>
            <View style={[styles.resultHeader, { backgroundColor: testResult.color }]}>
              <View style={styles.resultHeaderContent}>
                <TouchableOpacity 
                  onPress={() => setShowTestModal(false)}
                  style={styles.resultCloseButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                <View style={styles.resultHeaderInfo}>
                  <View style={styles.resultIconContainer}>
                    <Ionicons 
                      name={testResult.type === 'impulsive' ? 'flash-outline' : 
                            testResult.type === 'balanced' ? 'scale-outline' : 'trending-up-outline'} 
                      size={24} 
                      color="#fff" 
                    />
                  </View>
                  <Text style={[styles.resultTitle, { color: '#fff' }]}>{testResult.title}</Text>
                </View>
              </View>
            </View>

            <ScrollView 
              style={styles.resultScrollView}
              contentContainerStyle={styles.resultScrollContent}
            >
              <View style={styles.resultContent}>
                <View style={styles.resultCard}>
                  <Text style={styles.resultDescription}>{testResult.description}</Text>
                </View>

                <View style={styles.tipsSection}>
                  <View style={styles.tipsHeader}>
                    <Ionicons name="bulb-outline" size={24} color={testResult.color} />
                    <Text style={[styles.tipsTitle, { color: testResult.color }]}>
                      Съвети за подобрение
                    </Text>
                  </View>
                  
                  {testResult.tips.map((tip, index) => (
                    <View key={index} style={styles.tipCard}>
                      <View style={[styles.tipNumber, { backgroundColor: `${testResult.color}15` }]}>
                        <Text style={[styles.tipNumberText, { color: testResult.color }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.resultActions}>
                  <TouchableOpacity
                    style={[styles.shareButton, { backgroundColor: testResult.color }]}
                    onPress={() => {
                      Share.share({
                        message: `Моят финансов тип е "${testResult.title}"!\n\n${testResult.description}\n\nОткрий своя финансов тип с CashWise!`,
                      });
                    }}
                  >
                    <Ionicons name="share-social" size={20} color="#fff" />
                    <Text style={styles.shareButtonText}>
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
          </View>
        ) : (
          <FinancialPersonalityTest 
            onComplete={handleTestComplete} 
            onClose={() => setShowTestModal(false)}
          />
        )}
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={[styles.header, { 
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0'
      }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#333333' }]}>Дневни предизвикателства</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {challenges.map((challenge) => (
          <TouchableOpacity
            key={challenge.id}
            style={[
              styles.challengeCard,
              { 
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E0E0E0'
              },
              challenge.completed && styles.completedCard
            ]}
            onPress={() => challenge.action()}
            disabled={challenge.completed}
          >
            <View style={[
              styles.challengeIcon,
              { 
                backgroundColor: challenge.completed ? 
                  'rgba(76, 175, 80, 0.1)' : 
                  `${THEME.colors.primary}10`
              }
            ]}>
              <Ionicons 
                name={challenge.completed ? 'checkmark-circle' : challenge.icon as any} 
                size={32} 
                color={challenge.completed ? '#4CAF50' : THEME.colors.primary} 
              />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={[
                styles.challengeTitle,
                { color: '#333333' },
                challenge.completed && { color: '#4CAF50' }
              ]}>
                {challenge.title}
              </Text>
              <Text style={[
                styles.challengeDescription,
                { color: '#666666' },
                challenge.completed && { color: '#4CAF50', opacity: 0.8 }
              ]}>
                {challenge.description}
              </Text>
            </View>
            <View style={[
              styles.xpContainer,
              { 
                backgroundColor: challenge.completed ? 
                  'rgba(76, 175, 80, 0.1)' : 
                  `${THEME.colors.primary}10`
              }
            ]}>
              <Text style={[
                styles.xpText,
                { 
                  color: challenge.completed ? '#4CAF50' : THEME.colors.primary
                }
              ]}>
                {challenge.xp} XP
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {renderInviteModal()}
      {renderTestModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  challengeCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  completedCard: {
    opacity: 0.9,
    backgroundColor: '#FFFFFF',
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  xpContainer: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  xpText: {
    fontWeight: 'bold',
  },
  completedText: {
    color: '#4CAF50',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: (StatusBar.currentHeight || 0) + 30,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  resultCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  resultIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  resultScrollView: {
    flex: 1,
    marginTop: (StatusBar.currentHeight || 0) + 120,
    backgroundColor: '#fff',
  },
  resultScrollContent: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  resultContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultDescription: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    textAlign: 'center',
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
  },
  resultNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  resultNoteText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultScroll: {
    flex: 1,
  },
  resultBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
  },
  resultBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  actionButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ChallengesScreen; 
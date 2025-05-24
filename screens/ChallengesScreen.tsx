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
import { EMAILJS_CONFIG } from '../config';

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

interface ProfileData {
  xp: number;
  streak: number;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  age?: number;
  interests?: string[];
  social_links: { [key: string]: string };
  xp: number;
  streak: number;
  completed_lessons: number;
  completed_quizzes: number;
  created_at: string;
  updated_at: string;
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
  const [isInviting, setIsInviting] = useState(false);
  const [lastInviteTime, setLastInviteTime] = useState(0);
  const INVITE_COOLDOWN = 2000; // 2 seconds cooldown between invites

  const updateUserXP = async (xpAmount: number, challengeId?: number): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Грешка', 'Моля, влезте в профила си, за да печелите XP');
        return false;
      }

      // If challengeId is provided, use the new complete_challenge function
      if (challengeId) {
        try {
          await supabase.rpc('complete_challenge', {
            p_user_id: user.id,
            p_challenge_id: challengeId,
            p_xp_amount: xpAmount
          });

          // Get updated profile to show correct XP and streak
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('xp, streak')
            .eq('id', user.id)
            .single();

          if (profileError) throw profileError;

          const typedProfile = profile as ProfileData;

          Alert.alert(
            'Успех!', 
            `Поздравления! Спечелихте ${xpAmount} XP!\nТекуща серия: ${typedProfile.streak} дни`
          );
          return true;
        } catch (error: any) {
          if (error.message === 'Challenge already completed today') {
            Alert.alert('Вече изпълнено', 'Вече сте получили XP за това предизвикателство днес.');
            return false;
          }
          throw error;
        }
      }

      // For non-challenge XP updates (legacy support)
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('xp, streak')
        .eq('id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const typedProfile = profile as ProfileData;
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate new streak (simplified version)
      let newStreak = (typedProfile?.streak || 0) + 1;

      // Update XP and streak
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          xp: (typedProfile?.xp || 0) + xpAmount,
          streak: newStreak,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Record learning activity
      await database.addLearningActivity({
        user_id: user.id,
        activity_type: 'other',
        xp_earned: xpAmount
      });

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
      
      // First check if already completed
      const { data: existing } = await supabase
        .from('completed_challenges')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .eq('completed_date', today)
        .maybeSingle();

      if (existing) {
        // Already completed, just update UI
        setChallenges(prev =>
          prev.map(c =>
            c.id === challengeId ? { ...c, completed: true } : c
          )
        );
        return true;
      }

      // Not completed, insert new record
      const { error } = await supabase
        .from('completed_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          completed_date: today
        });

      if (error) {
        // If it's a duplicate key error, just update UI
        if (error.code === '23505') {
          setChallenges(prev =>
            prev.map(c =>
              c.id === challengeId ? { ...c, completed: true } : c
            )
          );
          return true;
        }
        throw error;
      }

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
      // Check cooldown
      const now = Date.now();
      if (now - lastInviteTime < INVITE_COOLDOWN) {
        Alert.alert('Моля, изчакайте', 'Трябва да изчакате малко преди да изпратите нова покана.');
        return;
      }

      // Validate email
      if (!inviteEmail || !inviteEmail.includes('@')) {
        Alert.alert('Грешка', 'Моля, въведете валиден имейл адрес.');
        return;
      }

      setIsInviting(true);
      setLastInviteTime(now);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Грешка', 'Моля, влезте в профила си, за да поканите приятел');
        return;
      }

      // Get user's name for the email
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .maybeSingle();

      if (userProfileError) {
        console.error('Profile fetch error:', userProfileError);
        Alert.alert('Грешка', 'Възникна проблем при зареждане на профила ви');
        return;
      }

      // Validate EmailJS configuration
      if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
        console.error('EmailJS configuration is missing');
        Alert.alert('Грешка', 'Имейл услугата не е конфигурирана правилно. Моля, свържете се с поддръжката.');
        return;
      }

      // Send email using EmailJS
      const templateParams = {
        to_email: inviteEmail,
        inviter_name: userProfile?.name || 'Потребител на CashWise',
        message: 'Присъедини се към CashWise и нека заедно да научим повече за финансите!'
      };

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      // Award XP for sending the invite
      const success = await updateUserXP(100);
      if (success) {
        try {
          await markChallengeCompleted(1);
        } catch (error: any) {
          // Ignore duplicate key errors as they just mean the challenge was already completed
          if (error.code !== '23505') {
            throw error;
          }
        }
        setShowInviteModal(false);
        setInviteEmail('');
        Alert.alert('Успех', 'Поканата е изпратена успешно!');
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      Alert.alert('Грешка', 'Възникна проблем при изпращане на поканата. Моля, опитайте отново.');
    } finally {
      setIsInviting(false);
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

      // Check for any previous attempts in the new personality_test_results table
      const { data: attempts, error } = await supabase
        .from('personality_test_results')
        .select('personality_type, completed_at')
        .eq('profile_id', user.id)
        .eq('test_id', 'financial_personality')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking previous attempts:', error);
        throw error;
      }

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
            description: 'Имаш разумно отношение към парите, но може биsometimes се колебаеш. Усъвършенствай планирането и създай ясни финансови цели.',
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
      } else {
        setHasAttemptedTest(false);
        setTestResult(null);
      }
    } catch (error) {
      console.error('Error checking previous attempts:', error);
      Alert.alert('Грешка', 'Възникна проблем при проверка на предишни опити');
    } finally {
      setLoadingAttempts(false);
    }
  };

  // Call checkPreviousAttempts when the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkPreviousAttempts();
    });

    return unsubscribe;
  }, [navigation]);

  // Initial check when component mounts
  useEffect(() => {
    checkPreviousAttempts();
  }, []);

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
            // Show the results modal if test is completed
            setShowTestModal(true);
          } else {
            // Show the test if not completed
            setShowTestModal(true);
          }
        },
      };

      const challengesList: Challenge[] = [
        {
          id: 1,
          title: 'Покани приятел',
          description: 'Изпрати покана на приятел да се присъедини към CashWise (еднократно на месец)',
          xp: 100,
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
          id: 4,
          title: 'Дневна серия',
          description: 'Завърши поне един урок и тест днес, за да поддържаш серията си',
          xp: 25,
          icon: 'flame',
          completed: completedToday.includes(4),
          action: async () => {
            if (completedToday.includes(4)) {
              Alert.alert('Вече е изпълнено', 'Вече сте изпълнили това предизвикателство днес!');
              return;
            }

            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) {
                Alert.alert('Грешка', 'Моля, влезте в профила си, за да печелите XP');
                return;
              }

              // Get today's date in YYYY-MM-DD format
              const today = new Date().toISOString().split('T')[0];

              // Check if user has completed both a lesson and a quiz today
              const { data: activities, error: activityError } = await supabase
                .from('learning_activity')
                .select('activity_type, activity_date')
                .eq('user_id', user.id)
                .eq('activity_date', today);

              if (activityError) throw activityError;

              // Log activities for debugging
              console.log('Today\'s activities:', activities);

              const hasLesson = activities?.some(a => a.activity_type === 'lesson');
              const hasQuiz = activities?.some(a => a.activity_type === 'quiz');

              console.log('Has lesson:', hasLesson, 'Has quiz:', hasQuiz);

              if (!hasLesson || !hasQuiz) {
                Alert.alert(
                  'Не е изпълнено',
                  'За да получите XP за дневната серия, трябва да завършите поне един урок И един тест днес.'
                );
                return;
              }

              // If both conditions are met, award XP
              const success = await updateUserXP(25, 4);
              if (success) {
                setChallenges(prev => 
                  prev.map(c => c.id === 4 ? { ...c, completed: true } : c)
                );
                Alert.alert(
                  'Успех!',
                  'Поздравления! Завършихте дневната серия и спечелихте 25 XP!'
                );
              }
            } catch (error) {
              console.error('Error checking daily streak:', error);
              Alert.alert('Грешка', 'Възникна проблем при проверка на дневната серия. Моля, опитайте отново.');
            }
          },
        },
      ];

      setChallenges([personalityTestChallenge, ...challengesList]);
      setLoading(false);
    };

    initializeChallenges();
  }, [hasAttemptedTest]);

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

      // Update local state immediately before any async operations
      setHasAttemptedTest(true);
      setTestResult(result);
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => 
          challenge.id === 0 
            ? { 
                ...challenge, 
                completed: true, 
                description: 'Прегледай своя финансов профил и съвети за подобрение',
                action: async () => {
                  setShowTestModal(true);
                  slideAnim.value = withSpring(1, {
                    damping: 15,
                    stiffness: 100,
                  });
                }
              }
            : challenge
        )
      );

      // Check if user has already taken the test
      const { data: existingAttempt } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('profile_id', user.id)
        .eq('quiz_id', 'financial_personality')
        .single();

      if (existingAttempt) {
        Alert.alert('Грешка', 'Вече сте направили този тест');
        setShowTestModal(false);
        return;
      }

      // First get current profile to ensure we have the latest XP
      const { data: profile, error: profileError } = await database.getProfile(user.id);
      if (profileError) throw profileError;

      const typedProfile = profile as Profile;

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

      // Update profile with new XP and record learning activity
      const { data: updatedProfile, error: updateError } = await database.updateProfile(user.id, {
        xp: 500,  // This will be added to current XP by database.updateProfile
        completed_quizzes: (typedProfile?.completed_quizzes || 0) + 1
      });

      if (updateError) throw updateError;

      // Record the learning activity
      await database.addLearningActivity({
        user_id: user.id,
        activity_type: 'quiz',
        quiz_id: 'financial_personality',
        xp_earned: 500
      });

      // Close the modal after a short delay to show the completion state
      setTimeout(() => {
        setShowTestModal(false);
        Alert.alert(
          'Поздравления!',
          `Успешно завършихте теста и спечелихте 500 XP!\nНова XP: ${updatedProfile?.xp}`
        );
      }, 500);
    } catch (error) {
      console.error('Error completing test:', error);
      Alert.alert('Грешка', 'Възникна проблем при запазване на резултата');
      // Revert the local state if there was an error
      setHasAttemptedTest(false);
      setTestResult(null);
      setChallenges(prevChallenges => 
        prevChallenges.map(challenge => 
          challenge.id === 0 
            ? { ...challenge, completed: false, description: 'Открий своя финансов тип и получи персонализирани съвети' }
            : challenge
        )
      );
    }
  };

  const renderInviteModal = () => (
    <Modal
      visible={showInviteModal}
      transparent
      animationType="slide"
      onRequestClose={() => !isInviting && setShowInviteModal(false)}
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
            editable={!isInviting}
          />
          <View style={styles.modalButtons}>
            <PaperButton
              mode="outlined"
              onPress={() => !isInviting && setShowInviteModal(false)}
              style={styles.modalButton}
              disabled={isInviting}
            >
              Отказ
            </PaperButton>
            <PaperButton
              mode="contained"
              onPress={handleInviteFriend}
              style={styles.modalButton}
              disabled={!inviteEmail || isInviting}
              loading={isInviting}
            >
              {isInviting ? 'Изпращане...' : 'Покани'}
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
            activeOpacity={0.7}
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
              {challenge.id === 0 && challenge.completed && (
                <Text style={styles.completedNote}>
                  Натисни за да видиш резултата си
                </Text>
              )}
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
  completedChallenge: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  completedNote: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ChallengesScreen; 
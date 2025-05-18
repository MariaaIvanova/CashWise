import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Text, Button, Surface, ProgressBar, IconButton, Badge, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme as useCustomTheme, THEME } from '../ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { auth, database } from '../supabase';
import { RootStackParamList } from '../AppNavigator';
import BottomNavigationBar from '../components/BottomNavigationBar';
import { LinearGradient } from 'expo-linear-gradient';

interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  personality_type?: string;
}

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

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

interface Lesson {
  id: string;
  title: string;
  description: string;
  progress: number;
  isPremium?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  topics: {
    title: string;
    content: string;
    image?: string;
    videoUrl?: string;
    keyPoints?: string[];
    quiz?: {
      title: string;
      questions: {
        question: string;
        type: string;
        options: string[];
        correctAnswers: number[];
      }[];
    };
  }[];
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
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

interface Topic {
  title: string;
  content: string;
  image?: string;
  videoUrl?: string;
  keyPoints?: string[];
  quiz?: Quiz;
}

type TabKey = 'home' | 'leaderboard' | 'calendar' | 'profile';

const defaultLessons: Lesson[] = [
  {
    id: '1',
    title: 'Основи на кредитирането',
    description: 'Научете основните принципи на кредитирането и как да вземате информирани решения.',
    progress: 0,
    isPremium: false,
    icon: 'credit-card-outline' as keyof typeof MaterialCommunityIcons.glyphMap,
    topics: [
      {
        title: 'Как работят кредитите',
        content: 'Кредитите са инструмент – полезен, но и опасен, ако не се използва правилно. Те позволяват да закупите нещо сега и да го изплатите постепенно, но внимавайте с лихвите и условията.',
        image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        videoUrl: 'lesson1.mp4',
        keyPoints: [
          'Потребителски кредит – За по-малки покупки (телефон, уред). Обикновено до 10 000 лв. Погасява се на месечни вноски с лихва.',
          'Ипотечен кредит – За закупуване на жилище. Елена сума (често над 100 000 лв.), дълъг срок (20–30 години). Изисква стабилен доход.',
          'Бързи кредити – Достъпни, но с висока лихва. Подходящи само при крайна необходимост.',
          'Лихва – Допълнителната сума, която плащате за използването на кредита.',
          'Гратисен период – Време, през което не се изисква плащане на лихва.'
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Какво означава да инвестираш?',
    description: 'Научете за основните видове инвестиции и как да започнете да инвестирате разумно.',
    progress: 0,
    isPremium: false,
    icon: 'chart-line' as keyof typeof MaterialCommunityIcons.glyphMap,
    topics: [
      {
        title: 'Основи на инвестирането',
        content: 'Инвестирането е процес на разполагане с пари с цел получаване на доход или печалба в бъдеще. В България има различни възможности за инвестиране, като всеки инвеститор трябва да разбира основните принципи и рискове.',
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
        videoUrl: 'lesson7.mp4',
        keyPoints: [
          'Разнообразие от инвестиционни възможности',
          'Връзка между риск и възвръщаемост',
          'Важност на диверсификацията',
          'Определяне на инвестиционни цели',
          'Разбиране на инвестиционните инструменти'
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'ДДС в България',
    description: 'Научете за данъка върху добавената стойност, кога се прилага и какви са ставките.',
    progress: 0,
    isPremium: false,
    icon: 'cash-multiple' as keyof typeof MaterialCommunityIcons.glyphMap,
    topics: [
      {
        title: 'ДДС в България – кога се прилага и какви са ставките',
        content: 'Данъкът върху добавената стойност (ДДС) е косвен данък, който се начислява върху почти всички стоки и услуги в България. В момента основната ставка е 20%, като за някои стоки, като книги и ресторантьорски услуги, има намалена ставка от 9%.',
        videoUrl: 'lesson3.mp4',
        keyPoints: [
          'Основна ставка на ДДС: 20%',
          'Намалена ставка: 9% (за книги и ресторантьорски услуги)',
          'Задължителна регистрация за фирми с оборот над 100 000 лв. от 2024 г.',
          'ДДС се включва в крайната цена на стоките и услугите',
          'Фирмите отчитат и превеждат ДДС към държавата'
        ]
      }
    ]
  },
  {
    id: '4',
    title: 'Данък върху доходите на физическите лица',
    description: 'Научете за ДДФЛ, как се изчислява и кога трябва да плащате.',
    progress: 0,
    isPremium: false,
    icon: 'account-cash' as keyof typeof MaterialCommunityIcons.glyphMap,
    topics: [
      {
        title: 'Данък върху доходите на физическите лица (ДДФЛ)',
        content: 'Данъкът върху доходите на физическите лица (ДДФЛ) е основен директ данък, който се прилага върху доходите на физическите лица в България. От 2008 г. България има единна ставка от 10%, което я прави една от страните с най-ниски данъчни ставки в Европейския съюз.',
        videoUrl: 'lesson4.mp4',
        keyPoints: [
          'Единна ставка на ДДФЛ: 10%',
          'Прилага се върху трудови доходи, доходи от свободна практика, наеми и др.',
          'Годишно данъчно приключване до 30 април',
          'Възможност за данъчни облекчения и приспадане на разходи',
          'Някои доходи са освободени от облагане'
        ]
      }
    ]
  },
  {
    id: '5',
    title: 'Данък върху доходите на юридическите лица',
    description: 'Научете за ДДЮЛ, как се изчислява и какви са задълженията на фирмите.',
    progress: 0,
    isPremium: false,
    icon: 'office-building' as keyof typeof MaterialCommunityIcons.glyphMap,
    topics: [
      {
        title: 'Данък върху доходите на юридическите лица (ДДЮЛ)',
        content: 'Данъкът върху доходите на юридическите лица (ДДЮЛ) е основен данък, който се прилага върху печалбата на компаниите в България. От 2007 г. България има единна ставка от 10%, което я прави привлекателна дестинация за бизнес.',
        videoUrl: 'lesson5.mp4',
        keyPoints: [
          'Единна ставка на ДДЮЛ: 10%',
          'Прилага се върху облагаемата печалба',
          'Месечни данъчни декларации и авансови вноски',
          'Годишно приключване до 31 март',
          'Възможност за данъчни облекчения и инвестиционни стимули'
        ]
      }
    ]
  },
  {
    id: '6',
    title: 'Социално осигуряване',
    description: 'Научете за системата на социално осигуряване в България и вашите права.',
    progress: 0,
    isPremium: false,
    icon: 'shield-account' as keyof typeof MaterialCommunityIcons.glyphMap,
    topics: [
      {
        title: 'Социално осигуряване в България',
        content: 'Социалното осигуряване в България е система, която осигурява защита на гражданите при различни социални рискове като безработица, болест, майчинство, инвалидност и старост. Системата се финансира чрез задължителни осигуровки, които се плащат от работодателите и работниците.',
        videoUrl: 'lesson6.mp4',
        keyPoints: [
          'Общ размер на осигуровките: 32.8%',
          'Работодател: 18.92%',
          'Работник: 13.88%',
          'Минимална основа: 933 лв. (2024)',
          'Максимална основа: 3000 лв. (2024)'
        ]
      }
    ]
  }
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STAT_PILL_WIDTH = (SCREEN_WIDTH - 48 - 12) / 2; // 48 for padding, 12 for gap

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useCustomTheme();
  const paperTheme = useTheme();
  const colors = theme.colors || THEME.colors;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [userName, setUserName] = useState('');
  const [userLevel, setUserLevel] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>(defaultLessons);
  const [hasAttemptedTest, setHasAttemptedTest] = useState(false);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [scrollY] = useState(new Animated.Value(0));

  useEffect(() => {
    loadUserData();
    setLessons(defaultLessons);
    setLoading(false);
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { user, error: userError } = await auth.getCurrentUser();
      if (userError) throw userError;
      if (!user) {
        navigation.replace('SignIn');
        return;
      }

      // Get profile data for XP and other info
      const { data: profile, error: profileError } = await database.getProfile(user.id);
      if (profileError) throw profileError;

      // Get streak info separately
      const { data: streakInfo, error: streakError } = await database.getStreakInfo(user.id);
      if (streakError) throw streakError;

      if (profile) {
        const typedProfile = profile as Profile;
        setUserName(typedProfile.name || '');
        setUserLevel(Math.floor((typedProfile.xp || 0) / 1000));
        setUserXP(typedProfile.xp || 0);
        // Use streak from streakInfo instead of profile
        setStreakDays(streakInfo?.currentStreak || 0);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const checkPreviousAttempts = async () => {
    setLoadingAttempts(true);
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
      setHasAttemptedTest(hasAttempted);
    } catch (err) {
      console.error('Error checking previous attempts:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    checkPreviousAttempts();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, error]);

  const renderHeroSection = () => (
    <Animated.View style={[
      styles.heroContainer,
      {
        transform: [{
          translateY: scrollY.interpolate({
            inputRange: [-100, 0, 100],
            outputRange: [50, 0, -50],
            extrapolate: 'clamp'
          })
        }]
      }
    ]}>
      <LinearGradient
        colors={['#4A5AE8', '#3A4AD8']}
        style={styles.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>
              Здравей, {userName || 'Потребител'}!
            </Text>
            <Text style={styles.welcomeSubtext}>
              Продължи към следващия си финансов успех
            </Text>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <Surface style={[styles.statPill, { width: STAT_PILL_WIDTH }]}>
                <MaterialCommunityIcons name="star" size={18} color="#FFD700" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>{userXP}</Text>
                  <Text style={styles.statLabel}>XP</Text>
                </View>
              </Surface>
              
              <Surface style={[styles.statPill, { width: STAT_PILL_WIDTH }]}>
                <MaterialCommunityIcons name="trophy" size={18} color="#FFD700" />
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>{userLevel}</Text>
                  <Text style={styles.statLabel}>Ниво</Text>
                </View>
              </Surface>
            </View>
            
            <Surface style={[styles.statPill, styles.streakPill]}>
              <MaterialCommunityIcons name="fire" size={18} color="#FF6B6B" />
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{streakDays}</Text>
                <Text style={styles.statLabel}>Поредни дни</Text>
              </View>
            </Surface>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderLessonCard = (lesson: Lesson) => (
    <Animated.View
      style={[
        styles.lessonCardContainer,
        {
          opacity: fadeAnim,
          transform: [{
            scale: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1]
            })
          }]
        }
      ]}
    >
      <Surface style={styles.lessonCard} elevation={2}>
        <View style={styles.lessonHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: lesson.isPremium ? '#FFD700' : colors.primary + '20' }
          ]}>
            <MaterialCommunityIcons 
              name={lesson.icon} 
              size={24} 
              color={lesson.isPremium ? '#000' : colors.primary} 
            />
          </View>
          <View style={styles.lessonTitleContainer}>
            <Text style={styles.lessonTitle}>
              {lesson.title}
            </Text>
            {lesson.isPremium && (
              <Badge style={styles.premiumBadge}>Premium</Badge>
            )}
          </View>
        </View>

        <Text style={styles.lessonDescription}>
          {lesson.description}
        </Text>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Прогрес</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(lesson.progress * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={lesson.progress}
            color={lesson.isPremium ? '#FFD700' : colors.primary}
            style={styles.progressBar}
          />
        </View>

        <View style={styles.buttonContainer}>
          <Button 
            mode="contained"
            style={[
              styles.actionButton,
              lesson.isPremium && styles.premiumButton
            ]}
            labelStyle={styles.buttonLabel}
            onPress={() => navigation.navigate('Lesson', { 
              lessonId: lesson.id,
              topic: lesson.title,
              description: lesson.description,
              topics: lesson.topics
            })}
          >
            Започни урок
          </Button>
          
          <Button 
            mode="outlined"
            style={[
              styles.actionButton,
              styles.quizButton,
              lesson.isPremium && styles.premiumOutlinedButton
            ]}
            labelStyle={[
              styles.buttonLabel,
              lesson.isPremium && styles.premiumButtonLabel
            ]}
            onPress={() => {
              if (lesson.id === 'daily-challenge' && hasAttemptedTest) {
                Alert.alert(
                  'Вече е изпълнено',
                  'Вече сте направили този тест. Можете да видите резултатите си в профила си.'
                );
                return;
              }
              navigation.navigate('Quiz', { lessonId: lesson.id });
            }}
          >
            Тест
          </Button>
        </View>
      </Surface>
    </Animated.View>
  );

  const renderSkeletonLoader = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* User Stats Skeleton */}
      <Surface style={[styles.userStatsContainer, styles.skeletonContainer]}>
        <View style={styles.skeletonUserInfo}>
          <View style={[styles.skeletonCircle, { width: 60, height: 60, borderRadius: 30 }]} />
          <View style={styles.skeletonTextContainer}>
            <View style={[styles.skeletonText, { width: 150, height: 24 }]} />
            <View style={[styles.skeletonText, { width: 100, height: 16, marginTop: 8 }]} />
          </View>
        </View>
        <View style={styles.skeletonStats}>
          <View style={styles.skeletonStatItem}>
            <View style={[styles.skeletonCircle, { width: 32, height: 32 }]} />
            <View style={[styles.skeletonText, { width: 40, height: 20, marginTop: 4 }]} />
          </View>
          <View style={styles.skeletonStatItem}>
            <View style={[styles.skeletonCircle, { width: 32, height: 32 }]} />
            <View style={[styles.skeletonText, { width: 40, height: 20, marginTop: 4 }]} />
          </View>
        </View>
      </Surface>

      {/* Progress Skeleton */}
      <Surface style={[styles.progressSection, styles.skeletonContainer]}>
        <View style={[styles.skeletonText, { width: 120, height: 20, marginBottom: 16 }]} />
        <View style={[styles.skeletonText, { width: '100%', height: 8, borderRadius: 4 }]} />
        <View style={[styles.skeletonText, { width: 100, height: 16, marginTop: 8 }]} />
      </Surface>

      {/* Lessons Skeleton */}
      {[1, 2, 3].map((_, index) => (
        <Surface key={index} style={[styles.lessonCard, styles.skeletonContainer]}>
          <View style={styles.skeletonLessonHeader}>
            <View style={[styles.skeletonCircle, { width: 40, height: 40 }]} />
            <View style={styles.skeletonLessonInfo}>
              <View style={[styles.skeletonText, { width: 200, height: 20 }]} />
              <View style={[styles.skeletonText, { width: 250, height: 16, marginTop: 8 }]} />
            </View>
          </View>
          <View style={styles.skeletonProgress}>
            <View style={[styles.skeletonText, { width: '100%', height: 4, borderRadius: 2 }]} />
            <View style={[styles.skeletonText, { width: 80, height: 16, marginTop: 8 }]} />
          </View>
          <View style={styles.skeletonButtons}>
            <View style={[styles.skeletonButton, { width: 100, height: 36 }]} />
            <View style={[styles.skeletonButton, { width: 100, height: 36 }]} />
          </View>
        </Surface>
      ))}
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.mainContainer, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.mainContainer, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={loadUserData} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <Animated.ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {loading ? (
          renderSkeletonLoader()
        ) : (
          <>
            {renderHeroSection()}
            
            <Surface style={styles.challengesSection}>
              <LinearGradient
                colors={['#4A5AE8', '#3A4AD8']}
                style={styles.challengesContent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.challengesInnerContent}>
                  <View style={styles.challengesHeader}>
                    <View style={styles.challengesIconContainer}>
                      <MaterialCommunityIcons name="flag-checkered" size={24} color="#FF6B6B" />
                    </View>
                    <Text style={styles.challengesTitle}>Ежедневни предизвикателства</Text>
                  </View>
                  <Text style={styles.challengesDescription}>
                    Участвайте в ежедневни предизвикателства и печелете допълнителни точки
                  </Text>
                  <TouchableOpacity 
                    style={styles.challengesButton}
                    onPress={() => navigation.navigate('Challenges')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.challengesButtonInner}>
                      <Text style={styles.challengesButtonText}>Започнете сега</Text>
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Surface>

            <View style={styles.lessonsSection}>
              <Text style={styles.sectionTitle}>
                Финансово образование
              </Text>
              <Text style={styles.sectionSubtitle}>
                Изберете урок, който искате да изучавате
              </Text>
              
              {lessons.map((lesson, index) => (
                <Animated.View
                  key={lesson.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      })
                    }]
                  }}
                >
                  {renderLessonCard(lesson)}
                </Animated.View>
              ))}
            </View>
          </>
        )}
      </Animated.ScrollView>

      <BottomNavigationBar 
        navigation={navigation}
        activeTab={activeTab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    height: 200, // Adjusted to account for all content + padding
    marginBottom: 24,
    overflow: 'hidden', // Ensure content doesn't overflow
  },
  heroGradient: {
    flex: 1,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    padding: 16,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 0, // Important: allows content to shrink within flex container
  },
  welcomeContainer: {
    marginBottom: 12, // Reduced to fit better
  },
  welcomeText: {
    fontSize: 24, // Slightly reduced
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    gap: 8,
    width: '100%',
    paddingTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 10,
    borderRadius: 16,
    gap: 8,
    height: 40,
    flex: 1,
  },
  streakPill: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
  },
  statTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 13,
    fontFamily: 'System',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  lessonsSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  lessonCardContainer: {
    marginBottom: 16,
  },
  lessonCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lessonTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    color: '#000000',
    fontSize: 12,
    paddingHorizontal: 8,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666666',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  premiumButton: {
    backgroundColor: '#FFD700',
  },
  premiumOutlinedButton: {
    borderColor: '#FFD700',
  },
  premiumButtonLabel: {
    color: '#FFD700',
  },
  quizButton: {
    borderWidth: 1.5,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  userStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  skeletonContainer: {
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  skeletonUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  skeletonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
  },
  skeletonStatItem: {
    alignItems: 'center',
  },
  skeletonCircle: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
  },
  skeletonText: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonLessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  skeletonLessonInfo: {
    flex: 1,
    marginLeft: 12,
  },
  skeletonProgress: {
    marginBottom: 16,
  },
  skeletonButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  skeletonButton: {
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    height: 36,
    flex: 1,
  },
  challengesSection: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  challengesContent: {
    width: '100%',
  },
  challengesInnerContent: {
    padding: 24,
    height: '100%',
  },
  challengesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  challengesIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  challengesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  challengesDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 24,
    lineHeight: 22,
  },
  challengesButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    height: 48,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  challengesButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  challengesButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default HomeScreen; 
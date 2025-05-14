import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Button, ProgressBar, Badge, ActivityIndicator } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { auth, database, videoStorage } from '../supabase';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
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

interface Lesson {
  id: string;
  title: string;
  description: string;
  progress: number;
  isPremium?: boolean;
  icon: string;
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

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userLevel, setUserLevel] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  
  useEffect(() => {
    loadUserData();
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

      const { data: profile, error: profileError } = await database.getProfile(user.id);
      if (profileError) throw profileError;

      if (profile) {
        const typedProfile = profile as Profile;
        setUserName(typedProfile.name || '');
        setUserLevel(Math.floor((typedProfile.xp || 0) / 1000));
        setUserXP(typedProfile.xp || 0);
        setStreakDays(typedProfile.streak || 0);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for lessons
  const lessons: Lesson[] = [
    {
      id: '1',
      title: 'Как работят кредитите',
      description: 'Научете основните принципи на кредитирането, видовете кредити и как да изберете най-подходящия за вас.',
      progress: 0.1,
      isPremium: false,
      icon: 'credit-card-outline',
      topics: [
        {
          title: 'Как работят кредитите',
          content: 'Кредитите са инструмент – полезен, но и опасен, ако не се използва правилно. Те позволяват да закупите нещо сега и да го изплатите постепенно, но внимавайте с лихвите и условията.',
          image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
          videoUrl: videoStorage.getVideoUrl('lesson1/lesson1.mp4'),
          keyPoints: [
            'Потребителски кредит – За по-малки покупки (телефон, уред). Обикновено до 10 000 лв. Погасява се на месечни вноски с лихва.',
            'Ипотечен кредит – За закупуване на жилище. Елена сума (често над 100 000 лв.), дълъг срок (20–30 години). Изисква стабилен доход.',
            'Бързи кредити – Достъпни, но с висока лихва. Подходящи само при крайна необходимост.',
            'Лихва – Допълнителната сума, която плащате за използването на кредита. Колкото по-ниска е лихвата, толкова по-изгоден е кредитът.',
            'Гратисен период – Време, през което не се изисква плащане на лихва. Използвайте го разумно.'
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Какво означава да инвестираш?',
      description: 'Научете за основните видове инвестиции и как да започнете да инвестирате разумно.',
      progress: 0,
      icon: 'chart-line',
      topics: [
        {
          title: 'Какво означава да инвестираш?',
          content: 'Инвестицията е начин да увеличиш парите си, вместо просто да ги държиш. Има три основни вида:\n\nАкции – Купуваш малка част от дадена компания. Ако тя печели – печелиш и ти. Но има риск – ако се провали, губиш пари.\n\nОблигации – Като заем. Държавата или фирма ти "взема назаем" пари и ти плаща лихва. По-сигурно, но и по-малко печелившо.\n\nИмоти – Купуваш жилище или земя и печелиш от наем или препродажба. Изисква повече капитал.',
          image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
          videoUrl: 'https://tvjrolyteabegukldhln.supabase.co/storage/v1/object/sign/lesson-videos/lesson2/lesson2.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzI1ZjJhMzUyLTMxOTYtNGI5NS05ODUzLTI1NzFlZmUzOGZmZSJ9.eyJ1cmwiOiJsZXNzb24tdmlkZW9zL2xlc3NvbjIvbGVzc29uMi5tcDQiLCJpYXQiOjE3NDcyMDQ2NjYsImV4cCI6MTc3ODc0MDY2Nn0.azIK1w89Y_85ErkDky04D1raw2reTcE9K1KJS7-yXDE',
          keyPoints: [
            'Акции – Дял от компания с потенциал за печалба, но и риск от загуба',
            'Облигации – По-сигурна инвестиция с фиксирана доходност',
            'Имоти – Инвестиция в недвижима собственост за наем или препродажба'
          ],
          quiz: {
            title: 'Основни видове инвестиции',
            questions: [
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
            ]
          }
        }
      ]
    },
    {
      id: '3',
      title: 'ДДС в България',
      description: 'Научете кога се прилага ДДС, какви са ставките и как влияе на бизнеса и потребителите.',
      progress: 0,
      icon: 'percent-outline',
      topics: [
        {
          title: 'Какво е ДДС и защо ни засяга?',
          content: 'Данъкът върху добавената стойност (ДДС) е косвен данък, който се начислява върху почти всички стоки и услуги в България. В момента основната ставка е 20%, като за някои стоки, като книги и ресторантьорски услуги, има намалена ставка от 9%.\n\nКога се прилага ДДС?\nКогато пазаруваш в магазин, цената, която плащаш, вече включва ДДС. За фирмите, които надвишават определен годишен оборот (100 000 лв. от 2024 г.), регистрацията по ДДС е задължителна.\n\nКой го плаща?\nВъпреки че потребителят го плаща на касата, ДДС реално се отчита и превежда към държавата от фирмата-продавач. Тази система позволява прозрачност и контрол върху икономическите потоци.',
          image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
          videoUrl: 'https://tvjrolyteabegukldhln.supabase.co/storage/v1/object/sign/lesson-videos/lesson3/lesson3.mp4?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzI1ZjJhMzUyLTMxOTYtNGI5NS05ODUzLTI1NzFlZmUzOGZmZSJ9.eyJ1cmwiOiJsZXNzb24tdmlkZW9zL2xlc3NvbjMvbGVzc29uMy5tcDQiLCJpYXQiOjE3NDcyMDU1NTgsImV4cCI6MTc3ODc0MTU1OH0.4CJ-0N6G11U27agcDA8N41K3OwfhJGI8HSC06V986pw',
          keyPoints: [
            'ДДС е косвен данък върху стоки и услуги',
            'Основна ставка 20%, намалена 9% за определени стоки',
            'Задължителна регистрация при оборот над 100 000 лв.',
            'Плаща се от потребителя, отчита се от фирмата'
          ]
        }
      ]
    },
    {
      id: '4',
      title: 'Пенсионно осигуряване',
      description: 'Планиране на пенсията и разбиране на пенсионните системи.',
      progress: 0,
      icon: 'account-group-outline',
      topics: [
        {
          title: 'Пенсионни системи в България',
          content: 'Българската пенсионна система се състои от три стълба: държавна, допълнителна и лична пенсия.',
          image: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
          keyPoints: [
            'Първи стълб – Държавна пенсия, финансирана от задължителните осигуровки.',
            'Втори стълб – Допълнителна пенсия, където работодателите могат да допринасят.',
            'Трети стълб – Лична пенсия, където хората могат да спестяват допълнително.',
            'Пенсионни фондове – Инвестиционни инструменти за дългосрочно спестяване.'
          ]
        }
      ]
    }
  ];

  const [activeTab, setActiveTab] = useState('home');
  
  const tabs = [
    { key: 'home', icon: 'home', label: 'Начало' },
    { key: 'leaderboard', icon: 'trophy', label: 'Класация' },
    { key: 'calendar', icon: 'calendar', label: 'Календар' },
    { key: 'profile', icon: 'account', label: 'Профил' },
  ];

  const handleTabPress = (tabKey: string) => {
    setActiveTab(tabKey);
    switch (tabKey) {
      case 'home':
        // Already on home
        break;
      case 'leaderboard':
        navigation.navigate('Leaderboard');
        break;
      case 'calendar':
        navigation.navigate('Calendar');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
    }
  };

  const renderLessonCard = (lesson: Lesson) => (
    <Surface 
      key={lesson.id} 
      style={[styles.lessonCard, { backgroundColor: '#fafafa' }]}
      elevation={2}
    >
      <View style={styles.lessonHeader}>
        <Icon 
          name={lesson.icon} 
          size={28} 
          color={lesson.isPremium ? '#FFD700' : colors.primary} 
        />
        <View style={styles.lessonTitleContainer}>
          <Text 
            style={[
              styles.lessonTitle, 
              { 
                color: lesson.isPremium ? '#FFD700' : colors.onSurface 
              }
            ]}
          >
            {lesson.title}
          </Text>
          {lesson.isPremium && (
            <Badge style={styles.premiumBadge}>PREMIUM</Badge>
          )}
        </View>
      </View>
      <Text style={[styles.lessonDescription, { color: colors.onSurfaceVariant }]}>
        {lesson.description}
      </Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBarWrapper}>
          <ProgressBar
            progress={lesson.progress}
            color={lesson.isPremium ? '#FFD700' : colors.primary}
            style={styles.progressBar}
          />
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageText, { 
              color: '#ffffff',
              textShadowColor: 'rgba(0, 0, 0, 0.75)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 2
            }]}>
              {Math.round(lesson.progress * 100)}%
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <Button 
          mode="outlined" 
          style={[
            styles.lessonButton, 
            lesson.isPremium && { backgroundColor: '#FFD700', borderColor: '#FFD700'}
          ]}
          textColor={lesson.isPremium ? '#fff' : colors.primary}
          onPress={() => navigation.navigate('Lesson', { 
            lessonId: lesson.id,
            topic: lesson.title,
            description: lesson.description,
            topics: lesson.topics
          })}
        >
          Уроци
        </Button>
        <Button 
          mode="outlined" 
          style={[
            styles.lessonButton,
            lesson.isPremium && { backgroundColor: '#FFD700', borderColor: '#FFD700' }
          ]}
          textColor={lesson.isPremium ? '#fff' : colors.primary}
          onPress={() => navigation.navigate('Quiz', { lessonId: lesson.id })}
        >
          Тест
        </Button>
      </View>
    </Surface>
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
      <ScrollView 
        style={[styles.container, { backgroundColor: '#efefef' }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User profile section */}
        <View style={styles.profileSection}>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.onSurface }]}>
              Здравей, {userName || 'Потребител'}!
            </Text>
            <Text style={[styles.userStatus, { color: colors.onSurfaceVariant }]}>
              Начинаещ
            </Text>
          </View>
          <View style={styles.badgesContainer}>
            <View style={[styles.badge, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
              <Icon name="star" size={16} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                XP: {userXP}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
              <Icon name="trophy" size={16} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                Level: {userLevel}
              </Text>
            </View>
          </View>
        </View>

        {/* Daily challenge card */}
        <Surface 
          style={[styles.challengeCard, { backgroundColor: '#fafafa' }]}
          elevation={2}
        >
          <Text style={[styles.challengeTitle, { color: colors.onSurface }]}>
            Дневно предизвикателство
          </Text>
          <Text style={[styles.challengeDescription, { color: colors.onSurfaceVariant }]}>
            Изпълнете днешното предизвикателство, за да тествате финансовите си познания и да поддържате серията си.
          </Text>
          <View style={styles.challengeFooter}>
            <View style={styles.streakContainer}>
              <Icon name="fire" size={20} color="#FF6B00" />
              <Text style={[styles.streakText, { color: '#FF6B00' }]}>
                {streakDays} дни серия
              </Text>
            </View>
            <Button 
              mode="contained" 
              onPress={() => {}}
              style={{ backgroundColor: colors.primary }}
            >
              Започни предизвикателство
            </Button>
          </View>
        </Surface>

        {/* Financial education section */}
        <View style={styles.educationSection}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Финансово образование
          </Text>
          {lessons.map(renderLessonCard)}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              activeTab === tab.key && styles.activeTabItem
            ]}
            onPress={() => handleTabPress(tab.key)}
          >
            <Icon
              name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline`}
              size={24}
              color={activeTab === tab.key ? colors.primary : '#FFFFFF'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    backgroundColor: '#1B2541',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  activeTabItem: {
    backgroundColor: 'rgba(90, 102, 196, 0.1)',
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userStatus: {
    fontSize: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  challengeDescription: {
    fontSize: 16,
    marginBottom: 16,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
  },
  educationSection: {
    marginTop: 20,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  lessonCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  lessonTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 8,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lessonDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  progressContainer: {
    marginBottom: 16,
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
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  lessonButton: {
    flex: 1,
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
});

export default HomeScreen; 
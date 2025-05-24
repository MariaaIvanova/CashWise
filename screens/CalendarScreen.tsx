import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated, ActivityIndicator, Platform } from 'react-native';
import { Text, IconButton, Surface, useTheme, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import BottomNavigationBar from '../components/BottomNavigationBar';
import { auth, database } from '../supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

type CalendarScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

type TabKey = 'home' | 'leaderboard' | 'calendar' | 'profile';

interface MarkedDate {
  marked: boolean;
  selected?: boolean;
  selectedColor?: string;
  dotColor?: string;
  customContainerStyle?: {
    borderWidth?: number;
    borderColor?: string;
    borderRadius?: number;
  };
  customTextStyle?: {
    color?: string;
    fontWeight?: string;
  };
}

interface MarkedDates {
  [date: string]: MarkedDate;
}

interface LearningData {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  markedDates: MarkedDates;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [streakAnimation] = useState<Animated.Value>(new Animated.Value(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [learningData, setLearningData] = useState<LearningData>({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    markedDates: {}
  });
  const [activeTab, setActiveTab] = useState<TabKey>('calendar');
  const [isCalendarReady, setIsCalendarReady] = useState(false);
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  const initializeScreen = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user and streak data in parallel
      const [userResult, streakResult] = await Promise.all([
        auth.getCurrentUser(),
        database.getStreakInfo((await auth.getCurrentUser()).user?.id || '')
      ]);

      const { user, error: userError } = userResult;
      if (userError) throw userError;
      if (!user) {
        navigation.replace('SignIn');
        return;
      }

      const { data, error: streakError } = streakResult;
      if (streakError) throw streakError;

      if (data) {
        setLearningData(data);
        // Start calendar initialization
        setIsCalendarReady(true);
        // Animate streak after a short delay
        setTimeout(() => {
          Animated.spring(streakAnimation, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }, 100);
      }
    } catch (err) {
      console.error('Error loading learning data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeScreen();
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

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: '#efefef' }]}>
      <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Моят Прогрес</Text>
    </View>
  );

  const renderStreakInfo = () => (
    <Surface style={[styles.streakContainer, { backgroundColor: '#3A46A4' }]}>
      <LinearGradient
        colors={['#2A3694', '#4A56B4']}
        style={styles.gradientBackground}
      />
      <Animated.View
        style={[
          styles.streakContent,
          {
            transform: [
              {
                scale: streakAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons
          name="fire"
          size={48}
          color="#FF6B00"
          style={styles.fireIcon}
        />
        <Text style={[styles.streakNumber, { color: '#FFFFFF' }]}>
          {learningData.currentStreak}
        </Text>
        <Text style={[styles.streakLabel, { color: '#FFFFFF' }]}>
          Текуща серия
        </Text>
      </Animated.View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>
            {learningData.longestStreak}
          </Text>
          <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>
            Най-дълга серия
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>
            {learningData.totalDays}
          </Text>
          <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>
            Общо дни
          </Text>
        </View>
      </View>
      <View style={[styles.achievementsContainer, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' }]}>
        <Text style={[styles.comingSoonText, { color: '#FFFFFF' }]}>Постижения - Скоро</Text>
        <Text style={[styles.comingSoonSubtext, { color: 'rgba(255,255,255,0.7)' }]}>Следете за нови постижения и награди!</Text>
      </View>
    </Surface>
  );

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.legendText, { color: colors.onSurface }]}>Дни с учене</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendTodayBox, { 
          borderColor: colors.primary,
          backgroundColor: colors.primary + '30' 
        }]} />
        <Text style={[styles.legendText, { color: colors.onSurface }]}>Днешен ден</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendSelectedBox, { backgroundColor: colors.primary }]} />
        <Text style={[styles.legendText, { color: colors.onSurface }]}>Избран ден</Text>
      </View>
    </View>
  );

  const renderSkeletonLoader = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.headerContainer, styles.skeletonContainer]} />
      <Surface style={[styles.streakContainer, styles.skeletonContainer]}>
        <View style={styles.skeletonStreakContent}>
          <View style={[styles.skeletonCircle, { width: 48, height: 48 }]} />
          <View style={[styles.skeletonText, { width: 80, height: 48 }]} />
          <View style={[styles.skeletonText, { width: 120, height: 20 }]} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.skeletonText, { width: 60, height: 24 }]} />
            <View style={[styles.skeletonText, { width: 100, height: 16 }]} />
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.skeletonText, { width: 60, height: 24 }]} />
            <View style={[styles.skeletonText, { width: 100, height: 16 }]} />
          </View>
        </View>
      </Surface>
      <Surface style={[styles.calendarContainer, styles.skeletonContainer]}>
        <View style={[styles.skeletonCalendar, { height: 350 }]} />
      </Surface>
    </Animated.View>
  );

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Button mode="contained" onPress={initializeScreen} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          renderSkeletonLoader()
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderStreakInfo()}
            {isCalendarReady && (
              <Surface style={[styles.calendarContainer, { backgroundColor: '#fafafa' }]}>
                <Calendar
                  theme={{
                    calendarBackground: 'transparent',
                    textSectionTitleColor: '#000000',
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary,
                    dayTextColor: '#000000',
                    textDisabledColor: '#666666',
                    dotColor: colors.primary,
                    selectedDotColor: colors.primary,
                    arrowColor: colors.primary,
                    monthTextColor: '#000000',
                    textMonthFontWeight: 'bold',
                    textDayFontSize: 14,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 14,
                    'stylesheet.calendar.header': {
                      dayTextAtIndex0: {
                        color: '#000000'
                      },
                      dayTextAtIndex6: {
                        color: '#000000'
                      }
                    }
                  }}
                  current={today}
                  minDate={new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0]}
                  maxDate={today}
                  firstDay={1}
                  markingType="custom"
                  markedDates={{
                    ...(learningData?.markedDates || {}),
                    [selectedDate]: selectedDate !== today ? {
                      ...(learningData?.markedDates?.[selectedDate] || {}),
                      selected: true,
                      selectedColor: colors.primary,
                      customTextStyle: {
                        color: '#FFFFFF',
                        fontWeight: 'bold',
                      }
                    } : learningData?.markedDates?.[selectedDate]
                  }}
                  onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
                  enableSwipeMonths={true}
                  style={styles.calendar}
                />
                {renderLegend()}
              </Surface>
            )}
          </Animated.View>
        )}
      </ScrollView>

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
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Increased padding for bottom nav
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#efefef',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  streakContainer: {
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  streakContent: {
    alignItems: 'center',
    padding: 24,
  },
  fireIcon: {
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 16,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  calendarContainer: {
    margin: 16,
    borderRadius: 20,
    elevation: 4,
    overflow: 'hidden',
  },
  calendar: {
    padding: 16,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendTodayBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  legendSelectedBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  skeletonContainer: {
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  skeletonStreakContent: {
    alignItems: 'center',
    padding: 24,
  },
  skeletonCircle: {
    backgroundColor: '#e0e0e0',
    borderRadius: 24,
    marginBottom: 8,
  },
  skeletonText: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 8,
  },
  skeletonCalendar: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    margin: 16,
  },
  achievementsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comingSoonSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CalendarScreen; 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { Text, IconButton, Surface, useTheme, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import BottomNavBar from '../components/BottomNavBar';
import { auth, database } from '../supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;

type CalendarScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Calendar'>;
};

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

export default function CalendarScreen({ navigation }: CalendarScreenProps) {
  const theme = useTheme();
  const colors = theme.colors;
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [streakAnimation] = useState<Animated.Value>(new Animated.Value(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [learningData, setLearningData] = useState<LearningData>({
    currentStreak: 0,
    longestStreak: 0,
    totalDays: 0,
    markedDates: {}
  });
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { user, error: userError } = await auth.getCurrentUser();
      if (userError) throw userError;
      if (!user) {
        navigation.replace('SignIn');
        return;
      }

      const { data, error: streakError } = await database.getStreakInfo(user.id);
      if (streakError) throw streakError;

      if (data) {
        setLearningData(data);
        // Animate the streak number
        Animated.spring(streakAnimation, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      }
    } catch (err) {
      console.error('Error loading learning data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load learning data');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: '#efefef' }]}>
      <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Моят Прогрес</Text>
    </View>
  );

  const renderStreakInfo = () => (
    <Surface style={[styles.streakContainer, { backgroundColor: colors.surface }]}>
      <LinearGradient
        colors={[colors.primary + '20', colors.primary + '05']}
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Button mode="contained" onPress={loadLearningData} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#efefef' }]}>
      {renderHeader()}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderStreakInfo()}
        
        <Surface style={[styles.calendarContainer, { backgroundColor: '#fafafa' }]}>
          <Calendar
            theme={{
              calendarBackground: 'transparent',
              textSectionTitleColor: colors.primary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: colors.primary,
              dayTextColor: colors.onSurface,
              textDisabledColor: colors.onSurfaceVariant,
              dotColor: colors.primary,
              selectedDotColor: colors.primary,
              arrowColor: colors.primary,
              monthTextColor: colors.primary,
              textMonthFontWeight: 'bold',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
              'stylesheet.calendar.header': {
                dayTextAtIndex0: {
                  color: colors.primary
                },
                dayTextAtIndex6: {
                  color: colors.primary
                }
              }
            }}
            current={today}
            minDate={new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0]}
            maxDate={today}
            firstDay={1}
            markingType="custom"
            markedDates={{
              ...learningData.markedDates,
              [selectedDate]: selectedDate !== today ? {
                ...(learningData.markedDates[selectedDate] || {}),
                selected: true,
                selectedColor: colors.primary,
                customTextStyle: {
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }
              } : learningData.markedDates[selectedDate]
            }}
            onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
            enableSwipeMonths={true}
            style={styles.calendar}
          />
          {renderLegend()}
        </Surface>
      </ScrollView>

      <BottomNavBar navigation={navigation} activeTab="calendar" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#efefef',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
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
}); 
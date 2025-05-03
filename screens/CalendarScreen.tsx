import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated } from 'react-native';
import { Text, IconButton, Surface, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import BottomNavBar from '../components/BottomNavBar';

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
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Mock data - replace with real data from your backend
  const mockLearningData: LearningData = {
    currentStreak: 7,
    longestStreak: 14,
    totalDays: 25,
    // Generate learning days data
    markedDates: (() => {
      const dates: MarkedDates = {};
      // Add some past learning days (last 7 days)
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Special marking for today
        if (dateString === today) {
          dates[dateString] = {
            marked: true,
            selected: true,
            selectedColor: colors.primary + '30',
            dotColor: colors.primary,
            customContainerStyle: {
              borderWidth: 2,
              borderColor: colors.primary,
              borderRadius: 20,
            },
            customTextStyle: {
              color: colors.primary,
              fontWeight: 'bold',
            }
          };
        } else {
          // Regular learning days
          dates[dateString] = {
            marked: true,
            dotColor: colors.primary,
            customContainerStyle: {
              borderRadius: 20,
            },
            customTextStyle: {
              color: colors.onSurface,
            }
          };
        }
      }
      
      // Add some random past learning days
      const pastDays = [8, 9, 11, 12, 15, 16, 18, 20];
      pastDays.forEach(daysAgo => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateString = date.toISOString().split('T')[0];
        dates[dateString] = {
          marked: true,
          dotColor: colors.primary,
          customContainerStyle: {
            borderRadius: 20,
          },
          customTextStyle: {
            color: colors.onSurface,
          }
        };
      });
      
      return dates;
    })()
  };

  useEffect(() => {
    // Animate the streak number on mount
    Animated.spring(streakAnimation, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

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
          {mockLearningData.currentStreak}
        </Text>
        <Text style={[styles.streakLabel, { color: '#FFFFFF' }]}>
          Текуща серия
        </Text>
      </Animated.View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>
            {mockLearningData.longestStreak}
          </Text>
          <Text style={[styles.statLabel, { color: '#FFFFFF' }]}>
            Най-дълга серия
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FFFFFF' }]}>
            {mockLearningData.totalDays}
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
              ...mockLearningData.markedDates,
              [selectedDate]: selectedDate !== today ? {
                ...(mockLearningData.markedDates[selectedDate] || {}),
                selected: true,
                selectedColor: colors.primary,
                customTextStyle: {
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                }
              } : mockLearningData.markedDates[selectedDate]
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
}); 
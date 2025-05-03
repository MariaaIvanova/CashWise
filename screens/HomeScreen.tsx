import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Button, ProgressBar, Badge } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

interface Lesson {
  id: string;
  title: string;
  description: string;
  progress: number;
  isPremium?: boolean;
  icon: string;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors } = useTheme();
  const userName = "Maria"; // This would come from user state in a real app
  const userLevel = 3;
  const userXP = 240;
  const streakDays = 5;
  
  // Mock data for lessons
  const lessons: Lesson[] = [
    {
      id: '1',
      title: 'Taxes In Bulgaria',
      description: 'Learn about the Bulgarian tax system and how to efficiently manage your taxes.',
      progress: 0.3,
      icon: 'file-document-outline',
    },
    {
      id: '2',
      title: 'Mortgage and Credits',
      description: 'Understanding mortgage options, interest rates, and credit systems.',
      progress: 0.8,
      icon: 'home-city-outline',
    },
    {
      id: '3',
      title: 'Savings/Financial Planning',
      description: 'Build a solid financial plan and learn effective saving strategies.',
      progress: 0.5,
      icon: 'piggy-bank-outline',
    },
    {
      id: '4',
      title: 'Investing',
      description: 'Introduction to investment vehicles, strategies, and risk management.',
      progress: 0.2,
      icon: 'chart-line',
    },
    {
      id: '5',
      title: 'Insurance',
      description: 'Comprehensive guide to different insurance types and how to choose the right coverage.',
      progress: 0,
      isPremium: true,
      icon: 'shield-check-outline',
    },
  ];

  const [activeTab, setActiveTab] = useState('home');
  
  const tabs = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'leaderboard', icon: 'trophy', label: 'Leaderboard' },
    { key: 'calendar', icon: 'calendar', label: 'Calendar' },
    { key: 'profile', icon: 'account', label: 'Profile' },
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
          onPress={() => navigation.navigate('Lesson', { lessonId: lesson.id })}
        >
          Lessons
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
          Exam
        </Button>
      </View>
    </Surface>
  );

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
              Hello, {userName}!
            </Text>
            <Text style={[styles.userStatus, { color: colors.onSurfaceVariant }]}>
              Beginner
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
            Daily Challenge
          </Text>
          <Text style={[styles.challengeDescription, { color: colors.onSurfaceVariant }]}>
            Complete today's challenge to test your financial knowledge and maintain your streak.
          </Text>
          <View style={styles.challengeFooter}>
            <View style={styles.streakContainer}>
              <Icon name="fire" size={20} color="#FF6B00" />
              <Text style={[styles.streakText, { color: '#FF6B00' }]}>
                {streakDays} day streak
              </Text>
            </View>
            <Button 
              mode="contained" 
              onPress={() => {}}
              style={{ backgroundColor: colors.primary }}
            >
              Start Challenge
            </Button>
          </View>
        </Surface>

        {/* Financial education section */}
        <View style={styles.educationSection}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Financial Education
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
}

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
}); 
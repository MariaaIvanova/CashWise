import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Text, Surface, Button, ProgressBar, IconButton, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, THEME } from '../ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { auth, database, supabase } from '../supabase';
import { RootStackParamList } from '../AppNavigator';
import Video from 'react-native-video';
import { Asset } from 'expo-asset';

export interface Topic {
  title: string;
  content: string;
  image?: string;
  videoAsset?: string;
  keyPoints?: string[];
  visualElements?: VisualElement[];
}

export interface VisualElement {
  type: 'table' | 'graph' | 'icons';
  title: string;
  headers?: string[];
  rows?: string[][];
  description?: string;
  data?: {
    labels: string[];
    values: number[];
  };
  items?: {
    icon: string;
    label: string;
  }[];
}

interface LessonContent {
  content: string[];
  tips?: string;
}

interface LessonContentMap {
  [key: string]: {
    [key: string]: LessonContent;
  };
}

interface TopicContent {
  title: string;
  content: string;
  image?: string | null;
  keyPoints: string[];
  tips?: string;
}

interface LessonRouteParams {
  lessonId: string;
  topic: string;
  description: string;
  topics: Topic[];
}

// Extend the RootStackParamList for Lesson screen
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {
      Lesson: LessonRouteParams;
    }
  }
}

interface LessonScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
  route: RouteProp<RootStackParamList, 'Lesson'>;
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

interface ProfileUpdate {
  name?: string;
  age?: number;
  interests?: string[];
  socialLinks?: { facebook: string; linkedin: string; instagram: string; };
  avatar_url?: string | null;
  xp?: number;
  streak?: number;
  completed_lessons?: number;
  completed_quizzes?: number;
}

// Example topic with test data
const defaultTopics: Topic[] = [
  {
    title: 'Как работят кредитите',
    content: 'Кредитите са инструмент – полезен, но и опасен, ако не се използва правилно. Те позволяват да закупите нещо сега и да го изплатите постепенно, но внимавайте с лихвите и условията. Разбирането на различните видове кредити и техните характеристики е от съществено значение за вземането на информирано решение.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    videoAsset: 'lesson1',
    keyPoints: [
      'Потребителски кредит – За по-малки покупки (телефон, уред). Обикновено до 10 000 лв. Погасява се на месечни вноски с лихва.',
      'Ипотечен кредит – За закупуване на жилище. Елена сума (често над 100 000 лв.), дълъг срок (20–30 години). Изисква стабилен доход.',
      'Бързи кредити – Достъпни, но с висока лихва. Подходящи само при крайна необходимост.',
      'Лихва – Допълнителната сума, която плащате за използването на кредита. Колкото по-ниска е лихвата, толкова по-изгоден е кредитът.',
      'Гратисен период – Време, през което не се изисква плащане на лихва. Използвайте го разумно.'
    ],
    visualElements: [
      {
        type: 'table',
        title: 'Сравнение на кредитите',
        headers: ['Вид кредит', 'Размер', 'Срок', 'Лихва', 'Риск', 'Подходящ за'],
        rows: [
          ['Потребителски', 'До 10 000 лв.', '1-5 години', 'Средна', 'Нисък', 'Техника, мебели'],
          ['Ипотечен', 'Над 100 000 лв.', '20-30 години', 'Ниска', 'Среден', 'Жилище'],
          ['Бърз', 'До 5 000 лв.', 'До 1 година', 'Висока', 'Висок', 'Спешни случаи']
        ]
      },
      {
        type: 'graph',
        title: 'Влияние на лихвата върху крайната цена',
        description: 'Как лихвата увеличава крайната цена на кредита от 10 000 лв.',
        data: {
          labels: ['Първоначална сума', 'С 10% лихва', 'С 20% лихва', 'С 30% лихва'],
          values: [10000, 11000, 12000, 13000]
        }
      },
      {
        type: 'icons',
        title: 'Важни фактори при избор на кредит',
        items: [
          { icon: 'percent', label: 'Лихвен процент' },
          { icon: 'calendar-clock', label: 'Срок на погасяване' },
          { icon: 'cash-multiple', label: 'Месечна вноска' },
          { icon: 'shield-check', label: 'Допълнителни такси' }
        ]
      }
    ]
  }
];

const { width } = Dimensions.get('window');

interface PlaybackStatus {
  isLoaded: boolean;
  didJustFinish: boolean;
}

// Add back the getVideoAsset function
const getVideoAsset = async (videoName: string) => {
  try {
    // Remove any existing .mp4 extension and add it back to ensure consistency
    const cleanVideoName = videoName.replace('.mp4', '');
    const videoPath = `${cleanVideoName}/${cleanVideoName}.mp4`;
    console.log('Getting video URL from Supabase storage:', videoPath);
    
    // Get the public URL from Supabase storage using the correct bucket and folder structure
    const { data } = await supabase
      .storage
      .from('lesson-videos')
      .getPublicUrl(videoPath);

    if (!data?.publicUrl) {
      throw new Error(`Failed to get video URL for ${videoPath}`);
    }

    console.log('Successfully got video URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting video URL:', error);
    throw error;
  }
};

// Update the VideoPlayer component to use forwardRef
const VideoPlayer = forwardRef<any, { uri: string }>(({ uri }, ref) => {
  const { width: windowWidth } = useWindowDimensions();
  const videoWidth = Math.min(windowWidth - 32, 640); // Account for padding
  const videoHeight = (videoWidth * 9) / 16; // 16:9 aspect ratio

  return (
    <View style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
      <Video
        ref={ref}
        source={{ uri }}
        style={styles.video}
        resizeMode="contain"
        controls={true}
        paused={true}
        repeat={false}
      />
    </View>
  );
});

// Add display name for better debugging
VideoPlayer.displayName = 'VideoPlayer';

export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const { topic, description, topics } = route.params as LessonRouteParams;
  const { theme } = useTheme();
  const themeToUse = theme || THEME;
  
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [expandedKeyPoints, setExpandedKeyPoints] = useState<number[]>([]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  
  const topicContent = topics[currentSubtopicIndex];
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  // Simplified video dimensions
  const getVideoDimensions = () => {
    const screenWidth = windowWidth;
    const videoWidth = Math.min(screenWidth * 0.9, 640); // 90% of screen width, max 640px
    const videoHeight = (videoWidth * 9) / 16; // 16:9 aspect ratio

    return {
      width: videoWidth,
      height: videoHeight
    };
  };

  const videoDimensions = getVideoDimensions();
  
  // Simple video loading
  useEffect(() => {
    const loadVideoUrl = async () => {
      if (!topicContent.videoAsset) return;
      try {
        const url = await getVideoAsset(topicContent.videoAsset);
        setVideoUri(url);
      } catch (error) {
        console.error('Error getting video URL:', error);
      }
    };
    loadVideoUrl();
  }, [topicContent.videoAsset]);

  const toggleKeyPoint = (index: number) => {
    setExpandedKeyPoints(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleNext = () => {
    if (currentSubtopicIndex < topics.length - 1) {
      setCurrentSubtopicIndex(prev => prev + 1);
      setExpandedKeyPoints([]);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSubtopicIndex > 0) {
      setCurrentSubtopicIndex(prev => prev - 1);
      setExpandedKeyPoints([]);
    }
  };

  const handleComplete = async () => {
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

      // Record learning activity with local date
      await database.addLearningActivity({
        user_id: user.id,
        activity_type: 'lesson',
        lesson_id: route.params.lessonId,
        xp_earned: 50
      });

      // Update user's profile
      const { data: profile, error: profileError } = await database.getProfile(user.id);
      if (profileError) throw profileError;

      if (profile) {
        const typedProfile = profile as Profile;
        const currentXP = typedProfile.xp || 0;
        const completedLessons = typedProfile.completed_lessons || 0;

        await database.updateProfile(user.id, {
          xp: currentXP + 50,
          completed_lessons: completedLessons + 1
        } as ProfileUpdate);
      }

      navigation.navigate('Quiz', { lessonId: route.params.lessonId });
    } catch (err) {
      console.error('Error completing lesson:', err);
      Alert.alert(
        'Error',
        'Failed to record lesson completion. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollProgress = Math.min(
      (contentOffset.y) / (contentSize.height - layoutMeasurement.height),
      1
    );
    setScrollProgress(Math.max(0, scrollProgress));
  };

  // Update renderVideo function
  const renderVideo = () => {
    if (!videoUri) return null;
    return (
      <View style={styles.videoWrapper}>
        <VideoPlayer uri={videoUri} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeToUse.colors?.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.backButtonContainer}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          iconColor="#000000"
        />
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar
          progress={scrollProgress}
          color={themeToUse.colors?.primary}
          style={styles.progressBar}
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        onScroll={handleScroll}
      >
        <View style={styles.contentWrapper}>
          <Text style={[styles.topicTitle, { color: themeToUse.colors?.text }]}>
            {topicContent.title}
          </Text>

          {renderVideo()}

          {topicContent.image && !videoUri && (
            <Surface style={styles.imageContainer} elevation={0}>
              <Image
                source={{ uri: topicContent.image }}
                style={styles.topicImage}
                resizeMode="cover"
              />
            </Surface>
          )}

          <Surface style={[styles.contentContainer, { backgroundColor: themeToUse.colors?.surface }]} elevation={0}>
            <Text style={[styles.contentText, { color: themeToUse.colors?.text }]}>
              {topicContent.content}
            </Text>
          </Surface>

          {topicContent.keyPoints && topicContent.keyPoints.length > 0 && (
            <Surface style={[styles.keyPointsContainer, { backgroundColor: themeToUse.colors?.surface }]} elevation={0}>
              <View style={styles.keyPointsHeader}>
                <MaterialCommunityIcons name="lightbulb-outline" size={24} color={themeToUse.colors?.primary} />
                <Text style={[styles.keyPointsTitle, { color: themeToUse.colors?.text }]}>
                  Ключови точки
                </Text>
              </View>
              {topicContent.keyPoints.map((point, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.keyPointItem,
                    { backgroundColor: themeToUse.colors?.background }
                  ]}
                  onPress={() => toggleKeyPoint(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.keyPointHeader}>
                    <MaterialCommunityIcons
                      name={expandedKeyPoints.includes(index) ? "chevron-down" : "chevron-right"}
                      size={24}
                      color={themeToUse.colors?.primary}
                    />
                    <Text style={[styles.keyPointText, { color: themeToUse.colors?.text }]}>
                      {point}
                    </Text>
                  </View>
                  {expandedKeyPoints.includes(index) && (
                    <Text style={[styles.keyPointDescription, { color: themeToUse.colors?.text }]}>
                      {point}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </Surface>
          )}
        </View>
      </ScrollView>

      <Surface style={[styles.navigationContainer, { backgroundColor: themeToUse.colors?.surface }]} elevation={0}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentSubtopicIndex === 0}
          style={[styles.navButton, currentSubtopicIndex === 0 && styles.disabledButton]}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          color={themeToUse.colors?.primary}
        >
          Предишен
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          style={styles.navButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          color={themeToUse.colors?.primary}
        >
          {currentSubtopicIndex === topics.length - 1 ? 'Започни тест' : 'Следващ'}
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButtonContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    margin: 0,
  },
  progressContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: '#F5F5F5',
  },
  progressBar: {
    height: 3,
    borderRadius: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    padding: 16,
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 34,
    color: '#000000',
  },
  imageContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  topicImage: {
    width: width - 32,
    height: 220,
    borderRadius: 16,
  },
  contentContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#000000',
  },
  keyPointsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  keyPointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  keyPointsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#000000',
  },
  keyPointItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
  },
  keyPointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyPointText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
    lineHeight: 22,
    color: '#000000',
  },
  keyPointDescription: {
    fontSize: 14,
    marginTop: 12,
    marginLeft: 32,
    lineHeight: 20,
    color: '#000000',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  keyPointContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  keyPointIcon: {
    marginRight: 8,
  },
  videoWrapper: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorContainer: {
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  retryButton: {
    backgroundColor: '#fff',
  },
}); 
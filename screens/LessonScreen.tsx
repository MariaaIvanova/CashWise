import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Text, Surface, Button, ProgressBar, IconButton, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, THEME } from '../ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { auth, database } from '../supabase';
import { RootStackParamList } from '../AppNavigator';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface Topic {
  title: string;
  content: string;
  image?: string;
  videoUrl?: string;
  keyPoints?: string[];
  visualElements?: VisualElement[];
}

interface VisualElement {
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
  socialLinks?: { [key: string]: string };
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

interface VideoRef {
  loadAsync: (source: { uri: string }, initialStatus?: any) => Promise<any>;
  playAsync: () => Promise<any>;
  pauseAsync: () => Promise<any>;
  getStatusAsync: () => Promise<AVPlaybackStatus>;
}

// Create a custom video component that uses forwardRef
const CustomVideo = forwardRef<VideoRef, any>((props, ref) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  
  // Forward the ref to the actual Video component
  React.useImperativeHandle(ref, () => ({
    loadAsync: async (source: { uri: string }, initialStatus?: any) => {
      if (videoRef.current) {
        return await videoRef.current.loadAsync(source, initialStatus);
      }
      throw new Error('Video ref not available');
    },
    playAsync: async () => {
      if (videoRef.current) {
        return await videoRef.current.playAsync();
      }
      throw new Error('Video ref not available');
    },
    pauseAsync: async () => {
      if (videoRef.current) {
        return await videoRef.current.pauseAsync();
      }
      throw new Error('Video ref not available');
    },
    getStatusAsync: async () => {
      if (videoRef.current) {
        return await videoRef.current.getStatusAsync();
      }
      return { isLoaded: false } as AVPlaybackStatus;
    },
  }));

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const onPlaybackStatusUpdate = (status: any) => {
    setStatus(status);
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
    }
  };

  return (
    <View style={{ width: '100%', height: '100%' }}>
      <Video
        {...props}
        ref={videoRef}
        style={{ width: '100%', height: '100%' }}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls={true}
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />
      <View style={styles.videoControls}>
        <View style={styles.videoProgress}>
          <View 
            style={[
              styles.videoProgressBar, 
              { width: `${(position / duration) * 100}%` }
            ]} 
          />
        </View>
        <View style={styles.videoControlsRow}>
          <Text style={styles.videoTime}>
            {formatTime(position)} / {formatTime(duration)}
          </Text>
          <View style={styles.videoButtons}>
            <TouchableOpacity 
              style={styles.videoButton}
              onPress={props.onPlayPause}
            >
              <MaterialCommunityIcons
                name={status.isPlaying ? "pause" : "play"}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.videoButton}
              onPress={() => {
                if (videoRef.current) {
                  videoRef.current.presentFullscreenPlayer();
                }
              }}
            >
              <MaterialCommunityIcons
                name="fullscreen"
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const { topic, description, topics } = route.params as LessonRouteParams;

  const { theme } = useTheme();
  const themeToUse = theme || THEME;
  
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [expandedKeyPoints, setExpandedKeyPoints] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const videoRef = useRef<VideoRef>(null);
  const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
  
  const topicContent = topics[currentSubtopicIndex];
  
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  // Calculate responsive video dimensions
  const getVideoDimensions = () => {
    const isLandscape = windowWidth > windowHeight;
    const isTablet = windowWidth >= 768;
    const isDesktop = windowWidth >= 1024;

    let videoWidth;
    if (isDesktop) {
      // For desktop, max width of 640px (reduced from 800px)
      videoWidth = Math.min(640, windowWidth * 0.7);
    } else if (isTablet) {
      // For tablets, 60% of screen width (reduced from 70%)
      videoWidth = windowWidth * 0.6;
    } else if (isLandscape) {
      // For phones in landscape, 50% of screen width (reduced from 60%)
      videoWidth = windowWidth * 0.5;
    } else {
      // For phones in portrait, 85% of screen width (reduced from 90%)
      videoWidth = windowWidth * 0.85;
    }

    // Ensure minimum width of 240px (reduced from 280px)
    videoWidth = Math.max(videoWidth, 240);
    
    // Calculate height maintaining 16:9 aspect ratio
    const videoHeight = videoWidth * (9/16);

    return {
      width: videoWidth,
      height: videoHeight,
      containerWidth: videoWidth + 24, // Reduced padding from 32 to 24
    };
  };

  const videoDimensions = getVideoDimensions();
  
  // Add useEffect to set the signed URL when the component mounts
  useEffect(() => {
    if (topicContent.videoUrl) {
      setSignedVideoUrl(topicContent.videoUrl);
    }
  }, [topicContent.videoUrl]);

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

      // Record learning activity
      const today = new Date().toISOString().split('T')[0];
      await database.addLearningActivity({
        user_id: user.id,
        activity_date: today,
        activity_type: 'lesson',
        lesson_id: route.params.lessonId,
        xp_earned: 50 // You can adjust this value based on lesson difficulty or length
      });

      // Update user's profile with XP and streak
      const { data: profile, error: profileError } = await database.getProfile(user.id);
      if (profileError) throw profileError;

      if (profile) {
        const typedProfile = profile as Profile;
        const currentXP = typedProfile.xp || 0;
        const currentStreak = typedProfile.streak || 0;
        const completedLessons = typedProfile.completed_lessons || 0;

        await database.updateProfile(user.id, {
          xp: currentXP + 50,
          streak: currentStreak + 1,
          completed_lessons: completedLessons + 1
        } as ProfileUpdate);
      }

      // Navigate to quiz
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

  // Add a function to check if video exists
  const checkVideoExists = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Error checking video:', error);
      return false;
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current || !signedVideoUrl) {
      setVideoError('No video available to play.');
      return;
    }
    
    setIsVideoLoading(true);
    try {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        try {
          const status = await videoRef.current.getStatusAsync();
          if (!status.isLoaded) {
            console.log('Loading video with signed URL');
            await videoRef.current.loadAsync(
              { uri: signedVideoUrl },
              { shouldPlay: true }
            );
          } else {
            await videoRef.current.playAsync();
          }
          setIsPlaying(true);
        } catch (error) {
          console.error('Error loading video:', error);
          handleVideoError(error);
        }
      }
    } catch (error) {
      console.error('Error in handlePlayPause:', error);
      handleVideoError(error);
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleVideoError = (error: any) => {
    console.error('Video error details:', {
      error,
      errorType: error?.constructor?.name,
      errorMessage: error?.message,
      videoUrl: topicContent.videoUrl,
    });
    
    let errorMessage = 'Failed to load video. ';
    
    if (!topicContent.videoUrl) {
      errorMessage = 'No video URL provided.';
    } else if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        errorMessage = 'Video file not found. Please check if the video has been uploaded.';
      } else if (error.message.includes('403') || error.message.includes('access denied')) {
        errorMessage = 'Access denied. Please check video permissions.';
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('not supported') || error.message.includes('no supported sources')) {
        errorMessage = 'Video format not supported or file is missing. Please check the video file.';
      }
    }
    
    setVideoError(errorMessage);
    setIsPlaying(false);
    setIsVideoLoading(false);
  };

  const handleVideoLoad = async () => {
    try {
      const status = await videoRef.current?.getStatusAsync();
      console.log('Video loaded successfully:', {
        status,
        videoUrl: topicContent.videoUrl
      });
      setIsVideoLoading(false);
      setVideoError(null);
    } catch (error) {
      console.error('Error in handleVideoLoad:', error);
      setVideoError('Error loading video. Please try again.');
      setIsVideoLoading(false);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  const renderKeyPoints = (points: string[]) => {
    return points.map((point: string, index: number) => (
      <View key={index} style={styles.keyPointContainer}>
        <MaterialCommunityIcons name="check-circle" size={20} color={themeToUse.colors?.primary} style={styles.keyPointIcon} />
        <Text style={styles.keyPointText}>{point}</Text>
      </View>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: themeToUse.colors?.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Top Bar */}
      <Appbar.Header style={[styles.appBar, { backgroundColor: themeToUse.colors?.primary }]}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#fff" />
        <Appbar.Content 
          title={topic} 
          titleStyle={styles.appBarTitle}
          subtitle={`Урок ${currentSubtopicIndex + 1} от ${topics.length}`}
          subtitleStyle={styles.appBarSubtitle}
        />
      </Appbar.Header>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: themeToUse.colors?.primary }]}>
        <ProgressBar
          progress={(currentSubtopicIndex + 1) / topics.length}
          color="#fff"
          style={styles.progressBar}
        />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Topic Title */}
        <Text style={[styles.topicTitle, { color: themeToUse.colors?.text }]}>
          {topicContent.title}
        </Text>

        {/* Video Player */}
        {signedVideoUrl && (
          <Surface 
            style={[
              styles.videoContainer, 
              { 
                width: videoDimensions.width,
                height: videoDimensions.height,
              }
            ]} 
            elevation={0}
          >
            {videoError ? (
              <View style={[styles.videoErrorContainer, { backgroundColor: '#B00020' }]}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#fff" />
                <Text style={styles.videoErrorText}>{videoError}</Text>
                <Text style={[styles.videoErrorText, { fontSize: 12, opacity: 0.8, marginTop: 8 }]}>
                  URL: {signedVideoUrl}
                </Text>
                <Button 
                  mode="contained" 
                  onPress={async () => {
                    setVideoError(null);
                    setIsVideoLoading(true);
                    if (videoRef.current && signedVideoUrl) {
                      try {
                        await videoRef.current.loadAsync(
                          { uri: signedVideoUrl },
                          { shouldPlay: false }
                        );
                      } catch (error) {
                        console.error('Error reloading video:', error);
                        handleVideoError(error);
                      }
                    }
                  }}
                  style={styles.retryButton}
                >
                  Retry
                </Button>
              </View>
            ) : (
              <>
                <CustomVideo
                  ref={videoRef}
                  style={styles.video}
                  source={{ uri: signedVideoUrl }}
                  useNativeControls={false}
                  resizeMode={ResizeMode.COVER}
                  isLooping={false}
                  onError={handleVideoError}
                  onLoad={handleVideoLoad}
                  onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                    if (status.isLoaded && status.didJustFinish) {
                      handleVideoEnd();
                    }
                  }}
                />
                {isVideoLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.playButton, isVideoLoading && styles.disabledButton]}
                  onPress={handlePlayPause}
                  disabled={!!videoError || isVideoLoading}
                >
                  <MaterialCommunityIcons
                    name={isPlaying ? "pause-circle" : "play-circle"}
                    size={64}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                </TouchableOpacity>
              </>
            )}
          </Surface>
        )}

        {/* Topic Image */}
        {topicContent.image && !topicContent.videoUrl && (
          <Surface style={styles.imageContainer} elevation={0}>
            <Image
              source={{ uri: topicContent.image }}
              style={styles.topicImage}
              resizeMode="cover"
            />
          </Surface>
        )}

        {/* Topic Content */}
        <Surface style={[styles.contentContainer, { backgroundColor: themeToUse.colors?.surface }]} elevation={0}>
          <Text style={[styles.contentText, { color: themeToUse.colors?.text }]}>
            {topicContent.content}
          </Text>
        </Surface>

        {/* Key Points */}
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
      </ScrollView>

      {/* Navigation Buttons */}
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
  appBar: {
    elevation: 0,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  appBarSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  topicTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    lineHeight: 34,
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
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
  },
  keyPointsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
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
  },
  keyPointItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    color: '#FFFFFF',
  },
  keyPointDescription: {
    fontSize: 14,
    marginTop: 12,
    marginLeft: 32,
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
  videoContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -32 }, { translateY: -32 }],
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 32,
  },
  videoErrorContainer: {
    width: width - 32,
    height: (width - 32) * (9/16),
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  videoErrorText: {
    color: '#fff',
    textAlign: 'center',
    marginVertical: 8,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  videoControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  videoProgress: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8,
    borderRadius: 2,
  },
  videoProgressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  videoControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoTime: {
    color: '#fff',
    fontSize: 12,
  },
  videoButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoButton: {
    padding: 8,
    marginLeft: 8,
  },
}); 
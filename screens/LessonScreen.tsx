import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Alert, ActivityIndicator, useWindowDimensions, Platform, ViewStyle, TextStyle, Animated } from 'react-native';
import { Text, Surface, Button, ProgressBar, IconButton, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme, THEME } from '../ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { auth, database, supabase } from '../supabase';
import { RootStackParamList } from '../AppNavigator';
import Video from 'react-native-video';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

export interface Topic {
  title: string;
  content: string;
  image?: string;
  videoAsset?: string;
  videoUrl?: string;
  keyPoints?: string[];
  visualElements?: VisualElement[];
  quiz?: {
    questions: {
      id: string;
      question: string;
      type: 'single' | 'multiple' | 'matching';
      options: string[];
      correctAnswers: number[];
      explanation: string;
    }[];
  };
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
  isSpecialLesson?: boolean;
}

interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  last_accessed: string;
  created_at: string;
  updated_at: string;
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
  position: number;
  duration: number;
  isPlaying: boolean;
}

// Define video assets statically
const videoAssets = {
  lesson1: require('../assets/videos/lesson1.mp4'),
  lesson2: require('../assets/videos/lesson2.mp4'),
  lesson3: require('../assets/videos/lesson3.mp4'),
} as const;

// Update the getVideoAsset function with more detailed logging
const getVideoAsset = async (videoName: string) => {
  try {
    console.log('Attempting to load video:', videoName);
    
    // Check if we have a local video asset
    const videoAsset = videoAssets[videoName as keyof typeof videoAssets];
    console.log('Local video asset found:', !!videoAsset);
    
    if (videoAsset) {
      try {
        // Get the asset module
        const asset = Asset.fromModule(videoAsset);
        console.log('Asset module loaded:', !!asset);
        
        // Download the asset if needed
        if (!asset.localUri) {
          console.log('Downloading asset...');
          await asset.downloadAsync();
          console.log('Asset downloaded, localUri:', asset.localUri);
        } else {
          console.log('Using existing local asset:', asset.localUri);
        }
        
        if (asset.localUri) {
          // Verify the file exists
          const fileInfo = await FileSystem.getInfoAsync(asset.localUri);
          if (!fileInfo.exists) {
            console.error('Local asset file not found:', asset.localUri);
            throw new Error('Local video file not found');
          }
          
          console.log('Successfully loaded local video asset:', {
            uri: asset.localUri,
            size: fileInfo.size,
            exists: fileInfo.exists
          });
          return asset.localUri;
        }
      } catch (assetError) {
        console.error('Error loading local asset:', assetError);
        // Continue to Supabase fallback
      }
    }

    // Fallback to Supabase storage
    console.log('Falling back to Supabase storage...');
    const cleanVideoName = videoName.replace('.mp4', '');
    const videoPath = `${cleanVideoName}/${cleanVideoName}.mp4`;
    console.log('Attempting to get video from Supabase path:', videoPath);
    
    const { data } = await supabase
      .storage
      .from('lesson-videos')
      .getPublicUrl(videoPath);

    if (!data?.publicUrl) {
      console.error('No public URL returned from Supabase');
      throw new Error(`Failed to get video URL for ${videoPath}`);
    }

    // Verify the URL is accessible
    try {
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Video URL not accessible: ${response.status} ${response.statusText}`);
      }
    } catch (urlError) {
      console.error('Error verifying video URL:', urlError);
      throw new Error('Video URL is not accessible');
    }

    console.log('Successfully got video URL from Supabase:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in getVideoAsset:', error);
    throw error;
  }
};

// Update the styles for both VideoPlayer and WebVideoPlayer components
const videoControlsStyles: {
  videoControlsContainer: ViewStyle;
  videoProgressContainer: ViewStyle;
  timeText: TextStyle;
  videoProgressBar: ViewStyle;
  videoButtonsContainer: ViewStyle;
  volumeContainer: ViewStyle;
  volumeSlider: ViewStyle;
  controlButton: ViewStyle;
} = {
  videoControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    flexDirection: 'column' as const,
    gap: 4,
  },
  videoProgressContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 12,
    marginHorizontal: 8,
    minWidth: 40,
    textAlign: 'center' as const,
  },
  videoProgressBar: {
    flex: 1,
    height: 20,
  },
  videoButtonsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-start' as const,
    gap: 8,
  },
  volumeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginLeft: 'auto',
  },
  volumeSlider: {
    width: 80,
    height: 20,
  },
  controlButton: {
    margin: 0,
    padding: 0,
  }
};

// Remove VideoPlayerControls component and simplify VideoPlayer
const VideoPlayer = forwardRef<any, { uri: string }>(({ uri }, ref) => {
  const { width: windowWidth } = useWindowDimensions();
  const videoWidth = Math.min(windowWidth - 32, 640);
  const videoHeight = (videoWidth * 9) / 16;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<any>(null);

  const handleLoad = (data: any) => {
    console.log('Video loaded successfully:', {
      duration: data.duration,
      naturalSize: data.naturalSize,
      uri: uri
    });
    setIsLoading(false);
    setError(null);
  };

  const handleError = (error: any) => {
    console.error('Video loading error:', error);
    setIsLoading(false);
    setError('Failed to load video. Please check your connection and try again.');
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={1}
      onPress={togglePlayPause}
      style={[
        styles.videoContainer, 
        { 
          width: videoWidth, 
          height: videoHeight 
        }
      ]}
    >
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => {
              setError(null);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.reload();
              }
            }}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      )}
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        resizeMode="contain"
        controls={false}
        paused={!isPlaying}
        repeat={false}
        onLoad={handleLoad}
        onError={handleError}
        onEnd={() => {
          setIsPlaying(false);
          if (videoRef.current) {
            videoRef.current.seek(0);
          }
        }}
        onBuffer={({ isBuffering }) => {
          if (isBuffering) {
            setIsLoading(true);
          }
        }}
        bufferConfig={{
          minBufferMs: 15000,
          maxBufferMs: 50000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000
        }}
        ignoreSilentSwitch="ignore"
        playInBackground={false}
        playWhenInactive={false}
      />
      {!isLoading && !error && !isPlaying && (
        <View style={styles.playButtonContainer}>
          <IconButton
            icon="play"
            size={48}
            iconColor="#ffffff"
            style={styles.playButton}
          />
        </View>
      )}
    </TouchableOpacity>
  );
});

// Simplify WebVideoPlayer similarly
const WebVideoPlayer = forwardRef<any, { uri: string }>(({ uri }, ref) => {
  const { width: windowWidth } = useWindowDimensions();
  const videoWidth = Math.min(windowWidth - 32, 640);
  const videoHeight = (videoWidth * 9) / 16;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = (e: any) => {
    console.error('Web video loading error:', e);
    setIsLoading(false);
    setError('Failed to load video. Please check your connection and try again.');
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={1}
      onPress={togglePlayPause}
      style={[
        styles.videoContainer, 
        { 
          width: videoWidth, 
          height: videoHeight 
        }
      ]}
    >
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button 
            mode="contained" 
            onPress={() => {
              setError(null);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      )}
      <video
        ref={videoRef}
        src={uri}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: isLoading || error ? 'none' : 'block'
        }}
        onLoadedData={handleLoad}
        onError={handleError}
        onEnded={() => {
          setIsPlaying(false);
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
          }
        }}
      />
      {!isLoading && !error && !isPlaying && (
        <View style={styles.playButtonContainer}>
          <IconButton
            icon="play"
            size={48}
            iconColor="#ffffff"
            style={styles.playButton}
          />
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const { topic, description, topics, isSpecialLesson } = route.params as LessonRouteParams;
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
  
  // Update the useEffect for video loading to handle errors better
  useEffect(() => {
    const loadVideoUrl = async () => {
      console.log('Current topic content:', {
        title: topicContent.title,
        videoUrl: topicContent.videoUrl,
        videoAsset: topicContent.videoAsset
      });
      
      if (!topicContent.videoUrl && !topicContent.videoAsset) {
        console.log('No video specified for this topic');
        return;
      }
      
      try {
        // If we have a videoUrl, use it directly
        if (topicContent.videoUrl) {
          console.log('Using videoUrl:', topicContent.videoUrl);
          // If it's a local asset (starts with 'lesson'), try to load it from assets
          if (topicContent.videoUrl.startsWith('lesson')) {
            const videoName = topicContent.videoUrl.replace('.mp4', '');
            const url = await getVideoAsset(videoName);
            console.log('Video URL loaded from assets:', url);
            setVideoUri(url);
          } else {
            // Otherwise use the URL directly
            console.log('Using direct video URL:', topicContent.videoUrl);
            setVideoUri(topicContent.videoUrl);
          }
        } else if (topicContent.videoAsset) {
          // Handle videoAsset property
          console.log('Using videoAsset:', topicContent.videoAsset);
          const videoName = topicContent.videoAsset.replace('.mp4', '');
          const url = await getVideoAsset(videoName);
          console.log('Video URL loaded from assets:', url);
          setVideoUri(url);
        }
      } catch (error) {
        console.error('Error in loadVideoUrl:', error);
        Alert.alert(
          'Video Loading Error',
          'Failed to load the video. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    };
    loadVideoUrl();
  }, [topicContent.videoUrl, topicContent.videoAsset]);

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

      if (isSpecialLesson) {
        // For special lessons, just mark as completed
        const { error: progressError } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            lesson_id: route.params.lessonId,
            completed: true,
            last_accessed: new Date().toISOString(),
          }, {
            onConflict: 'user_id,lesson_id'  // Specify the unique constraint
          });

        if (progressError) throw progressError;

        Alert.alert(
          'Успех!',
          'Урокът е маркиран като завършен.',
          [{ 
            text: 'OK',
            onPress: () => navigation.goBack()
          }]
        );
        return;
      }

      // For regular lessons, proceed with quiz
      const topicWithQuiz = topics.find(topic => topic.quiz?.questions && topic.quiz.questions.length > 0);
      console.log('Found topic with quiz:', topicWithQuiz);
      
      if (!topicWithQuiz?.quiz?.questions) {
        console.log('No quiz questions found in any topic');
        Alert.alert(
          'Error',
          'No quiz questions available for this lesson.',
          [{ text: 'OK' }]
        );
        return;
      }

      const quizQuestions = topicWithQuiz.quiz.questions;
      console.log('Quiz questions from topic:', quizQuestions);
      
      const mappedQuestions = quizQuestions.map((q, index) => ({
        id: `${route.params.lessonId}-q${index + 1}`,
        question: q.question,
        type: q.type as 'single' | 'multiple' | 'matching',
        options: q.options,
        correctAnswer: q.options[q.correctAnswers[0]],
        correctAnswers: q.correctAnswers.map(i => q.options[i]),
        explanation: q.explanation
      }));
      console.log('Mapped questions for navigation:', mappedQuestions);
      
      navigation.navigate('Quiz', { 
        lessonId: route.params.lessonId,
        questions: mappedQuestions
      });
    } catch (err) {
      console.error('Error in handleComplete:', err);
      Alert.alert(
        'Error',
        'Failed to complete lesson. Please try again.',
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

  // Modify the renderVideo function to use the appropriate player
  const renderVideo = () => {
    if (!videoUri) return null;

    return Platform.OS === 'web' ? (
      <WebVideoPlayer uri={videoUri} />
    ) : (
      <VideoPlayer uri={videoUri} />
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
          mode="contained"
          onPress={handleComplete}
          style={[styles.navButton, { marginHorizontal: 0 }]}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          color={themeToUse.colors?.primary}
        >
          {currentSubtopicIndex === topics.length - 1 
            ? (isSpecialLesson ? 'Маркирай като завършен' : 'Започни тест')
            : 'Следващ'}
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
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
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 8,
    fontSize: 16,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0000ff',
  },
  playButtonContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    margin: 0,
  },
}); 
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar } from 'react-native';
import { Text, Surface, Button, ProgressBar, IconButton, Appbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, THEME } from '../ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

interface Topic {
  title: string;
  content: string;
  image?: string;
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

interface RouteParams {
  topic?: string;
  description?: string;
  topics?: Topic[];
}

type RootStackParamList = {
  Lesson: RouteParams;
  Quiz: { topic: string };
};

type LessonScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Lesson'>;
  route: RouteProp<RootStackParamList, 'Lesson'>;
};

// Example topic with test data
const defaultTopics: Topic[] = [
  {
    title: 'Как работят кредитите',
    content: 'Кредитите са инструмент – полезен, но и опасен, ако не се използва правилно.',
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    keyPoints: [
      'Потребителски кредит – За по-малки покупки (телефон, уред). Обикновено до 10 000 лв. Погасява се на месечни вноски с лихва.',
      'Ипотечен кредит – За закупуване на жилище. Елена сума (често над 100 000 лв.), дълъг срок (20–30 години). Изисква стабилен доход.',
      'Бързи кредити – Достъпни, но с висока лихва. Подходящи само при крайна необходимост.'
    ],
    visualElements: [
      {
        type: 'table',
        title: 'Сравнение на кредитите',
        headers: ['Вид кредит', 'Размер', 'Срок', 'Лихва', 'Риск'],
        rows: [
          ['Потребителски', 'До 10 000 лв.', '1-5 години', 'Средна', 'Нисък'],
          ['Ипотечен', 'Над 100 000 лв.', '20-30 години', 'Ниска', 'Среден'],
          ['Бърз', 'До 5 000 лв.', 'До 1 година', 'Висока', 'Висок']
        ]
      },
      {
        type: 'graph',
        title: 'Влияние на лихвата',
        description: 'Как лихвата увеличава крайната цена на кредита',
        data: {
          labels: ['Първоначална сума', 'С лихва'],
          values: [100, 130]
        }
      },
      {
        type: 'icons',
        title: 'Видове кредити',
        items: [
          { icon: 'banknote', label: 'Потребителски кредит' },
          { icon: 'home', label: 'Ипотечен кредит' },
          { icon: 'alarm', label: 'Бърз кредит' }
        ]
      }
    ]
  }
];

const { width } = Dimensions.get('window');

export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const params = route?.params || {};
  const topic = params.topic || 'CashWise';
  const description = params.description || 'Основни принципи на финансовото управление';
  const topics = params.topics || defaultTopics;

  const { theme } = useTheme();
  const themeToUse = theme || THEME;
  
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [expandedKeyPoints, setExpandedKeyPoints] = useState<number[]>([]);
  
  const topicContent = topics[currentSubtopicIndex];
  
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
      navigation.navigate('Quiz', { topic });
    }
  };

  const handlePrevious = () => {
    if (currentSubtopicIndex > 0) {
      setCurrentSubtopicIndex(prev => prev - 1);
      setExpandedKeyPoints([]);
    }
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

        {/* Topic Image */}
        {topicContent.image && (
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
}); 
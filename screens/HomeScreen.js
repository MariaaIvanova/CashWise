// screens/HomeScreen.js
/*import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text>Добре дошли в началния екран!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HomeScreen; */


import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Title, Paragraph, IconButton, Text, ProgressBar, FAB, Chip } from 'react-native-paper';
import { useTheme } from '../ThemeContext';
// Remove Firebase imports since we're bypassing authentication
// import { auth } from '../firebase';
// import { signOut } from 'firebase/auth';

export default function HomeScreen({ navigation }) {
  // Get theme from context with defensive fallback
  const themeContext = useTheme();
  const theme = themeContext?.theme || {
    colors: {
      primary: '#6200ee',
      background: '#f5f5f5',
      surface: '#ffffff',
      text: '#000000',
    }
  };
  const isDarkTheme = themeContext?.isDarkTheme || false;
  
  const handleSignOut = () => {
    // Bypass authentication and directly navigate to SignIn
    navigation.replace('SignIn');
  };

  // Mock user data - would come from backend
  const userData = {
    name: "Потребител",
    xpPoints: 450,
    streak: 5,
    level: 3,
    rank: "Начинаещ финансист",
    nextLevelPoints: 550,
  };

  // Daily challenges and lessons
  const dailyLesson = {
    title: 'Бюджетиране за начинаещи',
    description: 'Научете най-важните принципи на личния бюджет в 5 лесни стъпки',
    xpReward: 50,
    completed: false,
  };

  const financialTips = [
    {
      title: 'Бюджетиране',
      content: 'Следете вашите приходи и разходи за да създадете устойчив бюджет',
      icon: 'cash',
      progress: 0.4,
    },
    {
      title: 'Спестявания',
      content: 'Стремете се да заделяте 3-6 месечни разхода за непредвидени ситуации',
      icon: 'bank',
      progress: 0.2,
    },
    {
      title: 'Управление на дълга',
      content: 'Погасявайте първо високолихвените задължения',
      icon: 'credit-card',
      progress: 0.7,
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors?.background || '#f5f5f5' }]}>
      <ScrollView style={styles.content}>
        {/* User Progress Section */}
        <Card style={styles.userCard}>
          <Card.Content>
            <View style={styles.userHeader}>
              <View>
                <Title>Здравей, {userData.name}!</Title>
                <Text style={[styles.rankText, { color: theme.colors?.text || '#000000' }]}>{userData.rank}</Text>
              </View>
              <Chip icon="trophy">Ниво {userData.level}</Chip>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressTextContainer}>
                <Text>XP: {userData.xpPoints}/{userData.nextLevelPoints}</Text>
                <Text>{userData.xpPoints/userData.nextLevelPoints*100}%</Text>
              </View>
              <ProgressBar progress={userData.xpPoints/userData.nextLevelPoints} color={theme.colors?.primary || '#6200ee'} style={styles.progressBar} />
            </View>
            
            <View style={styles.statsContainer}>
              <Chip icon="fire" mode="outlined" style={styles.streakChip}>
                {userData.streak} дни поред
              </Chip>
              <Chip icon="star" mode="outlined">
                {userData.xpPoints} XP общо
              </Chip>
            </View>
          </Card.Content>
        </Card>
        
        {/* Daily Challenge */}
        <Title style={styles.sectionTitle}>Дневно предизвикателство</Title>
        <Card style={[styles.dailyCard, { backgroundColor: isDarkTheme ? '#1E3229' : '#e8f5e9' }]}>
          <Card.Content>
            <Title style={styles.lessonTitle}>{dailyLesson.title}</Title>
            <Paragraph>{dailyLesson.description}</Paragraph>
            <View style={styles.rewardContainer}>
              <Chip icon="star" style={styles.rewardChip}>+{dailyLesson.xpReward} XP</Chip>
            </View>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={() => navigation.navigate('Lesson', { topic: dailyLesson.title })}>
              Започни урока
            </Button>
          </Card.Actions>
        </Card>
        
        {/* Categories Section */}
        <Title style={styles.sectionTitle}>Финансово образование</Title>
        
        {financialTips.map((tip, index) => (
          <Card key={index} style={styles.card}>
            <Card.Title 
              title={tip.title} 
              left={(props) => <IconButton {...props} icon={tip.icon} />} 
              right={() => (
                <Text style={[styles.progressText, { color: theme.colors?.primary || '#6200ee' }]}>
                  {Math.round(tip.progress * 100)}%
                </Text>
              )}
            />
            <Card.Content>
              <Paragraph>{tip.content}</Paragraph>
              <ProgressBar progress={tip.progress} color={theme.colors?.primary || '#6200ee'} style={styles.topicProgress} />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => navigation.navigate('Lesson', { topic: tip.title })}>
                Продължи
              </Button>
              <Button onPress={() => navigation.navigate('Quiz', { topic: tip.title })}>
                Тест
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </ScrollView>
      
      {/* Bottom navigation buttons */}
      <View style={[
        styles.bottomButtons,
        { 
          backgroundColor: theme.colors?.surface || '#ffffff',
          borderTopColor: isDarkTheme ? '#333333' : '#e0e0e0'
        }
      ]}>
        <Button 
          mode="text" 
          icon="trophy"
          onPress={() => navigation.navigate('Leaderboard')}
        >
          Класация
        </Button>
        
        <Button 
          mode="text" 
          icon="account"
          onPress={() => navigation.navigate('Profile')}
        >
          Профил
        </Button>
        
        <Button 
          mode="text" 
          icon="logout"
          onPress={handleSignOut}
        >
          Изход
        </Button>
      </View>
      
      {/* Floating action button for quick navigation */}
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors?.primary || '#6200ee' }]}
        icon="plus"
        onPress={() => console.log('Show menu of actions')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    marginBottom: 60, // Space for bottom buttons
  },
  userCard: {
    marginBottom: 20,
    elevation: 4,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankText: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    marginVertical: 10,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  streakChip: {
    marginRight: 10,
  },
  sectionTitle: {
    marginVertical: 16,
    fontSize: 20,
    fontWeight: 'bold',
  },
  dailyCard: {
    marginBottom: 20,
    backgroundColor: '#e8f5e9',
  },
  lessonTitle: {
    fontSize: 18,
  },
  rewardContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  rewardChip: {
    backgroundColor: '#ffd700',
  },
  card: {
    marginBottom: 16,
  },
  topicProgress: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    marginRight: 10,
    color: '#6200ee',
    fontWeight: 'bold',
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 70,
    backgroundColor: '#6200ee',
  },
});
 

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Title, Subheading, Button, Card, Avatar, Switch, Divider, List, ProgressBar, Chip } from 'react-native-paper';
import { useTheme } from '../ThemeContext';

export default function ProfileScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Get theme from context with defensive fallback
  const themeContext = useTheme();
  const isDarkTheme = themeContext?.isDarkTheme || false;
  const toggleTheme = themeContext?.toggleTheme || (() => {});
  
  // Mock user data - would come from backend
  const userData = {
    name: "Мария Иванова",
    email: "maria@example.com",
    avatar: "https://randomuser.me/api/portraits/women/17.jpg",
    xpPoints: 2450,
    level: 12,
    nextLevelPoints: 3000,
    streak: 22,
    badges: [
      { id: '1', name: 'Редовен ученик', icon: 'school', description: 'Учи 7 дни подред', earned: true },
      { id: '2', name: 'Финансов експерт', icon: 'cash-multiple', description: 'Вземи максимален резултат на 5 теста', earned: true },
      { id: '3', name: 'Майстор на бюджета', icon: 'chart-line', description: 'Завърши всички уроци за бюджетиране', earned: false },
      { id: '4', name: 'Инвеститор', icon: 'trending-up', description: 'Завърши всички уроци за инвестиции', earned: false },
    ],
    stats: {
      lessonsCompleted: 32,
      quizzesCompleted: 18,
      totalXP: 2450,
      correctAnswers: 85,
    }
  };
  
  const handleSignOut = () => {
    // Bypass authentication and directly navigate to SignIn
    navigation.replace('SignIn');
  };
  
  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };
  
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };
  
  const toggleDarkMode = () => {
    toggleTheme();
  };
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkTheme ? '#121212' : '#f5f5f5' }]}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar.Image 
          source={{ uri: userData.avatar }}
          size={100}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Title style={styles.userName}>{userData.name}</Title>
          <Subheading style={styles.userEmail}>{userData.email}</Subheading>
          <View style={styles.userStats}>
            <Chip icon="trophy" style={styles.levelChip}>Ниво {userData.level}</Chip>
            <Chip icon="fire" style={styles.streakChip}>{userData.streak} дни поред</Chip>
          </View>
        </View>
      </View>
      
      {/* Progress */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Прогрес</Title>
          <View style={styles.progressContainer}>
            <View style={styles.progressTextContainer}>
              <Text>XP към следващо ниво: {userData.xpPoints}/{userData.nextLevelPoints}</Text>
              <Text>{Math.round((userData.xpPoints/userData.nextLevelPoints) * 100)}%</Text>
            </View>
            <ProgressBar 
              progress={userData.xpPoints/userData.nextLevelPoints} 
              color="#6200ee" 
              style={styles.progressBar} 
            />
          </View>
        </Card.Content>
      </Card>
      
      {/* Statistics */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Статистика</Title>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.stats.lessonsCompleted}</Text>
              <Text style={styles.statLabel}>Урока</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.stats.quizzesCompleted}</Text>
              <Text style={styles.statLabel}>Теста</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.stats.totalXP}</Text>
              <Text style={styles.statLabel}>Общо XP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userData.stats.correctAnswers}%</Text>
              <Text style={styles.statLabel}>Успеваемост</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      {/* Badges */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Значки</Title>
          <View style={styles.badgesContainer}>
            {userData.badges.map((badge) => (
              <View key={badge.id} style={[styles.badgeItem, !badge.earned && styles.unearnedBadge]}>
                <Avatar.Icon 
                  icon={badge.icon} 
                  size={50} 
                  color={badge.earned ? "white" : "#A0A0A0"}
                  style={{ 
                    backgroundColor: badge.earned ? "#6200ee" : "#E0E0E0",
                  }}
                />
                <Text style={[styles.badgeName, !badge.earned && styles.unearnedText]}>
                  {badge.name}
                </Text>
                <Text style={[styles.badgeDescription, !badge.earned && styles.unearnedText]}>
                  {badge.description}
                </Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
      
      {/* Settings */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Настройки</Title>
          
          <List.Item
            title="Известия"
            description="Получавай дневни напомняния"
            left={props => <List.Icon {...props} icon="bell" />}
            right={props => 
              <Switch 
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
              />
            }
          />
          
          <Divider />
          
          <List.Item
            title="Звукови ефекти"
            description="Включи/изключи звуци в приложението"
            left={props => <List.Icon {...props} icon="volume-high" />}
            right={props => 
              <Switch 
                value={soundEnabled}
                onValueChange={toggleSound}
              />
            }
          />
          
          <Divider />
          
          <List.Item
            title="Тъмен режим"
            description="Превключи към тъмна тема"
            left={props => <List.Icon {...props} icon="brightness-6" />}
            right={props => 
              <Switch 
                value={isDarkTheme}
                onValueChange={toggleTheme}
              />
            }
          />
        </Card.Content>
      </Card>
      
      {/* Account Actions */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Акаунт</Title>
          
          <Button 
            mode="outlined" 
            icon="account-edit" 
            style={styles.accountButton}
            onPress={() => {}}
          >
            Редактирай профила
          </Button>
          
          <Button 
            mode="outlined" 
            icon="delete" 
            style={styles.accountButton}
            onPress={() => {}}
            color="#F44336"
          >
            Изтрий акаунта
          </Button>
          
          <Button 
            mode="contained" 
            icon="logout" 
            style={styles.accountButton}
            onPress={handleSignOut}
          >
            Изход
          </Button>
        </Card.Content>
      </Card>
      
      {/* Feedback */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Обратна връзка</Title>
          <Text style={styles.feedbackText}>
            Помогнете ни да подобрим приложението! Изпратете ни вашите идеи и предложения.
          </Text>
          <Button 
            mode="contained" 
            icon="email" 
            style={styles.feedbackButton}
            onPress={() => {}}
          >
            Изпрати обратна връзка
          </Button>
        </Card.Content>
      </Card>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Финансова Грамотност v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#666',
    marginBottom: 8,
  },
  userStats: {
    flexDirection: 'row',
  },
  levelChip: {
    marginRight: 8,
  },
  streakChip: {
    backgroundColor: '#FF9800',
  },
  sectionCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    color: '#666',
    marginTop: 4,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '48%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unearnedBadge: {
    opacity: 0.7,
  },
  badgeName: {
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  badgeDescription: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  unearnedText: {
    color: '#A0A0A0',
  },
  accountButton: {
    marginVertical: 8,
  },
  feedbackText: {
    marginBottom: 16,
    color: '#666',
  },
  feedbackButton: {
    backgroundColor: '#4CAF50',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 12,
  },
}); 
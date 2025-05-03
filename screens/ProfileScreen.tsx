import React, { useState, ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Image, Platform } from 'react-native';
import { Surface, Text, IconButton, useTheme, Button, Switch, Divider, Chip, Portal, Modal, TextInput, Dialog, Avatar, FAB } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from '../components/CustomButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import BottomNavBar from '../components/BottomNavBar';

const SCREEN_WIDTH = Dimensions.get('window').width;

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

interface SocialLinks {
  facebook: string;
  linkedin: string;
  [key: string]: string;
}

interface UserData {
  name: string;
  email: string;
  age: number;
  interests: string[];
  socialLinks: SocialLinks;
  level: number;
  xp: number;
  streak: number;
  completedLessons: number;
  completedQuizzes: number;
  achievements: Achievement[];
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { colors } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Мария Иванова',
    email: 'maria.ivanova@example.com',
    age: 28,
    interests: ['Инвестиции', 'Криптовалути', 'Фондов пазар'],
    socialLinks: {
      facebook: 'maria.ivanova',
      linkedin: 'maria-ivanova'
    },
    level: 12,
    xp: 2450,
    streak: 22,
    completedLessons: 45,
    completedQuizzes: 12,
    achievements: [
      { id: 1, title: 'Първи стъпки', description: 'Завършете първия урок', completed: true },
      { id: 2, title: 'Ученик', description: 'Достигнете ниво 5', completed: true },
      { id: 3, title: 'Напреднал', description: 'Достигнете ниво 10', completed: true },
      { id: 4, title: 'Експерт', description: 'Достигнете ниво 20', completed: false },
      { id: 5, title: 'Магистър', description: 'Завършете всички уроци', completed: false },
    ]
  });
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleEdit = (field: keyof UserData, value: string | number | string[] | SocialLinks): void => {
    if (!isEditing) return;
    
    setEditField(field);
    if (Array.isArray(value)) {
      setEditValue(value.join(', '));
    } else if (typeof value === 'object') {
      setEditValue(Object.entries(value)
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n'));
    } else {
      setEditValue(value.toString());
    }
    setShowEditDialog(true);
  };

  const handleSave = (): void => {
    if (!isEditing || !editField) return;

    let newValue: string | string[] | SocialLinks | number = editValue;
    if (editField === 'interests') {
      newValue = editValue.split(',').map((item: string) => item.trim());
    } else if (editField === 'socialLinks') {
      const lines = editValue.split('\n');
      const socialLinks: SocialLinks = {
        facebook: '',
        linkedin: ''
      };
      lines.forEach((line: string) => {
        const [key, value] = line.split(':').map((item: string) => item.trim());
        if (key && value) {
          socialLinks[key] = value;
        }
      });
      newValue = socialLinks;
    } else if (editField === 'age') {
      newValue = parseInt(editValue, 10);
    }

    setUserData((prev: UserData) => ({
      ...prev,
      [editField]: newValue
    }));
    setShowEditDialog(false);
  };

  const cardStyle = StyleSheet.create({
    card: {
      margin: 16,
      padding: 20,
      borderRadius: 16,
      elevation: 2,
      backgroundColor: '#FFFFFF',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    }
  }).card;

  const dialogStyle = StyleSheet.create({
    dialog: {
      borderRadius: 16,
      elevation: 3,
      backgroundColor: '#FFFFFF',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    }
  }).dialog;

  const renderProfileHeader = () => (
    <Surface style={[styles.profileHeader, { backgroundColor: '#FFFFFF' }]}>
      <View style={styles.profileAvatarContainer}>
        <Avatar.Icon
          size={90}
          icon="account"
          style={{ backgroundColor: '#8A97FF' }}
        />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: '#000000' }]}>
            {userData.name}
          </Text>
          <Text style={[styles.profileEmail, { color: 'rgba(0, 0, 0, 0.6)' }]}>
            {userData.email}
          </Text>
        </View>
        <IconButton
          icon={isEditing ? 'check' : 'pencil'}
          iconColor="#8A97FF"
          size={24}
          onPress={() => setIsEditing(!isEditing)}
        />
      </View>
    </Surface>
  );

  const renderUserStats = () => (
    <Surface style={cardStyle}>
      <Text variant="titleMedium" style={{ color: '#000000', marginBottom: 20, fontSize: 18, fontWeight: '600' }}>
        Статистика
      </Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="star" size={28} color="#8A97FF" />
          <Text variant="bodyLarge" style={{ color: '#000000', fontSize: 20, fontWeight: '600', marginTop: 8 }}>{userData.level}</Text>
          <Text variant="bodySmall" style={{ color: 'rgba(0, 0, 0, 0.6)', marginTop: 4 }}>Ниво</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="fire" size={28} color="#FFE266" />
          <Text variant="bodyLarge" style={{ color: '#000000', fontSize: 20, fontWeight: '600', marginTop: 8 }}>{userData.streak}</Text>
          <Text variant="bodySmall" style={{ color: 'rgba(0, 0, 0, 0.6)', marginTop: 4 }}>Поредни дни</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="book" size={28} color="#8A97FF" />
          <Text variant="bodyLarge" style={{ color: '#000000', fontSize: 20, fontWeight: '600', marginTop: 8 }}>{userData.completedLessons}</Text>
          <Text variant="bodySmall" style={{ color: 'rgba(0, 0, 0, 0.6)', marginTop: 4 }}>Урока</Text>
        </View>
        <View style={styles.statItem}>
          <MaterialCommunityIcons name="pencil" size={28} color="#FFE266" />
          <Text variant="bodyLarge" style={{ color: '#000000', fontSize: 20, fontWeight: '600', marginTop: 8 }}>{userData.completedQuizzes}</Text>
          <Text variant="bodySmall" style={{ color: 'rgba(0, 0, 0, 0.6)', marginTop: 4 }}>Теста</Text>
        </View>
      </View>
    </Surface>
  );

  const renderProgress = () => (
    <Surface style={cardStyle}>
      <Text variant="titleMedium" style={{ color: '#000000', marginBottom: 20, fontSize: 18, fontWeight: '600' }}>
        Прогрес
      </Text>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={['#8A97FF', '#FFE266']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${(userData.xp % 1000) / 10}%` }]}
        />
      </View>
      <Text variant="bodySmall" style={{ color: 'rgba(0, 0, 0, 0.6)', marginTop: 12, fontSize: 14 }}>
        {userData.xp} / 1000 XP до следващото ниво
      </Text>
    </Surface>
  );

  const renderAchievements = () => {
    const achievementsContent = (
      <>
        <Text variant="titleMedium" style={{ color: '#000000', marginBottom: 20, fontSize: 18, fontWeight: '600' }}>
          Постижения
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {userData.achievements.map((achievement: Achievement) => (
            <View key={achievement.id}>
              <Chip
                mode="outlined"
                selected={achievement.completed}
                style={{
                  backgroundColor: achievement.completed ? '#4CAF50' : '#F5F5F5',
                  borderColor: achievement.completed ? '#4CAF50' : '#E0E0E0',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
                onPress={() => {}}
                children={<Text style={{ color: achievement.completed ? '#FFFFFF' : '#000000', fontSize: 14 }}>{achievement.title}</Text>}
              />
            </View>
          ))}
        </View>
      </>
    );

    return (
      <Surface style={cardStyle}>
        {achievementsContent}
      </Surface>
    );
  };

  const renderInterests = () => (
    <Surface style={cardStyle}>
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={{ color: '#000000', fontSize: 18, fontWeight: '600' }}>
          Интереси
        </Text>
        {isEditing && (
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => handleEdit('interests', userData.interests)}
          />
        )}
      </View>
      <View style={styles.interestsContainer}>
        {userData.interests.map((interest: string, index: number) => (
          <View key={index}>
            <Chip
              mode="outlined"
              selected={false}
              style={{ 
                backgroundColor: '#F5F5F5', 
                borderColor: '#8A97FF',
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              onPress={() => {}}
              children={<Text style={{ color: '#000000', fontSize: 14 }}>{interest}</Text>}
            />
          </View>
        ))}
      </View>
    </Surface>
  );

  const renderSocialLinks = () => (
    <Surface style={cardStyle}>
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={{ color: '#000000', fontSize: 18, fontWeight: '600' }}>
          Социални мрежи
        </Text>
        {isEditing && (
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => handleEdit('socialLinks', userData.socialLinks)}
          />
        )}
      </View>
      <View style={styles.socialLinksContainer}>
        {Object.entries(userData.socialLinks).map(([platform, username]) => (
          <View key={platform} style={styles.socialLink}>
            <MaterialCommunityIcons
              name={platform.toLowerCase()}
              size={24}
              color="#8A97FF"
            />
            <Text variant="bodyMedium" style={{ color: '#000000', marginLeft: 12, fontSize: 16 }}>
              {username}
            </Text>
          </View>
        ))}
      </View>
    </Surface>
  );

  const renderActions = () => (
    <Surface style={cardStyle}>
      <Text variant="titleMedium" style={{ color: '#000000', marginBottom: 20, fontSize: 18, fontWeight: '600' }}>
        Настройки
      </Text>
      <View style={styles.settingsContainer}>
        <View style={styles.settingItem}>
          <MaterialCommunityIcons name="bell" size={24} color="#8A97FF" />
          <Text variant="bodyMedium" style={{ color: '#000000', flex: 1, marginLeft: 12, fontSize: 16 }}>
            Известия
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            color="#8A97FF"
          />
        </View>
        <Divider style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', marginVertical: 12 }} />
        <View style={styles.settingItem}>
          <MaterialCommunityIcons name="volume-high" size={24} color="#8A97FF" />
          <Text variant="bodyMedium" style={{ color: '#000000', flex: 1, marginLeft: 12, fontSize: 16 }}>
            Звуци
          </Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            color="#8A97FF"
          />
        </View>
        <Divider style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', marginVertical: 12 }} />
        <View style={styles.settingItem}>
          <MaterialCommunityIcons name="theme-light-dark" size={24} color="#8A97FF" />
          <Text variant="bodyMedium" style={{ color: '#000000', flex: 1, marginLeft: 12, fontSize: 16 }}>
            Тъмен режим
          </Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            color="#8A97FF"
          />
        </View>
      </View>
    </Surface>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#F5F5F5' }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileHeader()}
        {renderUserStats()}
        {renderProgress()}
        {renderAchievements()}
        {renderInterests()}
        {renderSocialLinks()}
        {renderActions()}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showEditDialog}
          onDismiss={() => setShowEditDialog(false)}
          style={dialogStyle}
        >
          <Dialog.Title>
            <Text>Редактиране</Text>
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              mode="outlined"
              multiline={editField === 'socialLinks'}
              style={{ backgroundColor: '#FFFFFF' }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>
              <Text>Отказ</Text>
            </Button>
            <Button onPress={handleSave}>
              <Text>Запази</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon={isEditing ? 'check' : 'pencil'}
        style={[styles.fab, { backgroundColor: '#8A97FF' }]}
        onPress={() => setIsEditing(!isEditing)}
      />

      <BottomNavBar navigation={navigation} activeTab="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    marginBottom: 80,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 16,
    marginTop: 4,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 20,
  },
  statItem: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialLinksContainer: {
    gap: 16,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingsContainer: {
    gap: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#8A97FF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
}); 
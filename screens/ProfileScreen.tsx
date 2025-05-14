import React, { useState, useEffect, ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Image, Platform, Alert, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, useTheme, Button, Switch, Divider, Chip, Portal, Modal, TextInput, Dialog, Avatar, FAB, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from '../components/CustomButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import BottomNavBar from '../components/BottomNavBar';
import { auth, database, supabase } from '../supabase';

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
  instagram: string;
  [key: string]: string;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  age?: number;
  interests?: string[];
  social_links: { [key: string]: string };
  xp: number;
  streak: number;
  completed_lessons: number;
  completed_quizzes: number;
  created_at: string;
  updated_at: string;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    name: '',
    email: '',
    age: 0,
    interests: [],
    socialLinks: {
      facebook: '',
      linkedin: '',
      instagram: ''
    },
    level: 0,
    xp: 0,
    streak: 0,
    completedLessons: 0,
    completedQuizzes: 0,
    achievements: []
  });
  const [editField, setEditField] = useState('');
  const [editValue, setEditValue] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Checking auth session...');
      
      // Check for active session using supabase client directly
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session check result:', {
        hasSession: !!session,
        sessionError: sessionError ? sessionError.message : null,
        sessionData: session ? {
          user: session.user?.id,
          expires_at: session.expires_at,
          access_token: !!session.access_token
        } : null
      });
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.log('No session found, redirecting to SignIn');
        navigation.replace('SignIn');
        return;
      }

      console.log('Session found, loading user data...');
      // Session exists, load user data
      await loadUserData();
    } catch (err) {
      console.error('Auth check error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      if (err instanceof Error && err.message.includes('auth session is missing')) {
        console.log('Auth session missing error, redirecting to SignIn');
        navigation.replace('SignIn');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
        Alert.alert('Error', 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      console.log('Getting current user...');
      const { user, error: userError } = await auth.getCurrentUser();
      
      console.log('Current user check result:', {
        hasUser: !!user,
        userId: user?.id,
        userError: userError instanceof Error ? userError.message : null
      });

      if (userError) {
        console.error('User error:', userError);
        throw userError;
      }
      
      if (!user) {
        console.log('No user found, redirecting to SignIn');
        navigation.replace('SignIn');
        return;
      }

      console.log('Fetching profile data...');
      const { data: profile, error: profileError } = await database.getProfile(user.id);
      console.log('Profile fetch result:', {
        hasProfile: !!profile,
        profileError: profileError instanceof Error ? profileError.message : null
      });
      if (profileError) throw profileError;

      // Cast profile to Profile type
      const typedProfile = profile as Profile;

      // Ensure social_links has the required properties
      const socialLinks: SocialLinks = {
        facebook: typedProfile?.social_links?.facebook || '',
        linkedin: typedProfile?.social_links?.linkedin || '',
        instagram: typedProfile?.social_links?.instagram || ''
      };

      // Update state with fetched data
      setUserData({
        name: typedProfile?.name || '',
        email: user.email || '',
        age: typedProfile?.age || 0,
        interests: typedProfile?.interests || [],
        socialLinks,
        level: Math.floor((typedProfile?.xp || 0) / 1000),
        xp: typedProfile?.xp || 0,
        streak: typedProfile?.streak || 0,
        completedLessons: typedProfile?.completed_lessons || 0,
        completedQuizzes: typedProfile?.completed_quizzes || 0,
        achievements: [] // This will be populated from achievements data
      });

      // Fetch user settings
      const { data: settings, error: settingsError } = await database.getUserSettings(user.id);
      if (settingsError) throw settingsError;

      // Fetch user achievements
      const { data: achievements, error: achievementsError } = await database.getUserAchievements(user.id);
      if (achievementsError) throw achievementsError;

      // Fetch user progress
      const { data: progress, error: progressError } = await database.getUserProgress(user.id);
      if (progressError) throw progressError;

      // Update settings
      if (settings) {
        setNotificationsEnabled(settings.notifications_enabled);
        setSoundEnabled(settings.sound_enabled);
        setDarkMode(settings.dark_mode);
      }

    } catch (err) {
      console.error('Load data error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      
      if (err instanceof Error && err.message.includes('auth session is missing')) {
        console.log('Auth session missing in loadUserData, redirecting to SignIn');
        navigation.replace('SignIn');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
        Alert.alert('Error', 'Failed to load profile data');
      }
    }
  };

  const handleEdit = async (field: keyof UserData, value: string | number | string[] | SocialLinks): Promise<void> => {
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

  const handleSave = async (): Promise<void> => {
    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // If we're editing the name directly in the header
      if (isEditing && editField === '') {
        const { error: updateError } = await database.updateProfile(user.id, {
          name: userData.name
        });
        if (updateError) throw updateError;
        setIsEditing(false);
        return;
      }

      // Handle other field edits
      if (!isEditing || !editField) return;

      let newValue: string | string[] | SocialLinks | number = editValue;
      if (editField === 'interests') {
        newValue = editValue.split(',').map((item: string) => item.trim());
      } else if (editField === 'socialLinks') {
        const lines = editValue.split('\n');
        const socialLinks: SocialLinks = {
          facebook: '',
          linkedin: '',
          instagram: ''
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

      // Update profile in database
      const { error: updateError } = await database.updateProfile(user.id, {
        [editField]: newValue
      });
      if (updateError) throw updateError;

      // Update local state
      setUserData((prev: UserData) => ({
        ...prev,
        [editField]: newValue
      }));
      setShowEditDialog(false);
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSettingsChange = async (setting: string, value: boolean) => {
    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // Update settings in database
      const { error: updateError } = await database.updateUserSettings(user.id, {
        [setting]: value
      });
      if (updateError) throw updateError;

      // Update local state
      switch (setting) {
        case 'notifications_enabled':
          setNotificationsEnabled(value);
          break;
        case 'sound_enabled':
          setSoundEnabled(value);
          break;
        case 'dark_mode':
          setDarkMode(value);
          break;
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleAvatarUpload = async () => {
    try {
      setUploadingAvatar(true);
      // TODO: Implement image picker and upload
      // For now, we'll just show an alert
      Alert.alert(
        'Upload Avatar',
        'Avatar upload functionality will be implemented soon.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      setShowAvatarPicker(false);
    }
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
        <TouchableOpacity 
          onPress={() => isEditing && setShowAvatarPicker(true)}
          disabled={!isEditing || uploadingAvatar}
        >
          <Avatar.Icon
            size={90}
            icon="account"
            style={{ backgroundColor: '#8A97FF' }}
          />
          {isEditing && !uploadingAvatar && (
            <View style={styles.avatarEditOverlay}>
              <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
            </View>
          )}
          {uploadingAvatar && (
            <View style={styles.avatarUploadingOverlay}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          {isEditing ? (
            <TextInput
              value={userData.name}
              onChangeText={(text) => setUserData(prev => ({ ...prev, name: text }))}
              style={[styles.profileNameInput, { color: '#000000' }]}
              placeholder="Enter your name"
              placeholderTextColor="rgba(0, 0, 0, 0.4)"
              onBlur={() => handleSave()}
              onSubmitEditing={() => handleSave()}
            />
          ) : (
            <Text style={[styles.profileName, { color: '#000000' }]}>
              {userData.name || 'Add your name'}
            </Text>
          )}
          <Text style={[styles.profileEmail, { color: 'rgba(0, 0, 0, 0.6)' }]}>
            {userData.email}
          </Text>
        </View>
        <IconButton
          icon={isEditing ? 'check' : 'pencil'}
          iconColor="#8A97FF"
          size={24}
          onPress={() => {
            if (isEditing) {
              handleSave();
            }
            setIsEditing(!isEditing);
          }}
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
            onPress={() => {
              // Format social links for editing
              const formattedLinks = Object.entries(userData.socialLinks)
                .map(([platform, username]) => `${platform}: ${username}`)
                .join('\n');
              setEditValue(formattedLinks);
              handleEdit('socialLinks', userData.socialLinks);
            }}
          />
        )}
      </View>
      <View style={styles.socialLinksContainer}>
        {Object.entries(userData.socialLinks).map(([platform, username]) => (
          <View key={platform} style={styles.socialLink}>
            <MaterialCommunityIcons
              name={platform === 'instagram' ? 'instagram' : platform.toLowerCase()}
              size={24}
              color="#8A97FF"
            />
            <Text variant="bodyMedium" style={{ color: '#000000', marginLeft: 12, fontSize: 16 }}>
              {username || `Добави ${platform} профил`}
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
            onValueChange={(value) => handleSettingsChange('notifications_enabled', value)}
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
            onValueChange={(value) => handleSettingsChange('sound_enabled', value)}
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
            onValueChange={(value) => handleSettingsChange('dark_mode', value)}
            color="#8A97FF"
          />
        </View>
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#8A97FF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={checkAuthAndLoadData} style={{ marginTop: 16 }}>
          Retry
        </Button>
        <Button 
          mode="outlined" 
          onPress={() => navigation.replace('SignIn')} 
          style={{ marginTop: 8 }}
        >
          Go to Sign In
        </Button>
      </View>
    );
  }

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
          <Dialog.Title>Редактиране</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={editValue}
              onChangeText={setEditValue}
              multiline={editField === 'interests' || editField === 'socialLinks'}
              numberOfLines={editField === 'interests' || editField === 'socialLinks' ? 4 : 1}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Отказ</Button>
            <Button onPress={handleSave}>Запази</Button>
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 45,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileNameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 0,
    margin: 0,
    height: 32,
  },
}); 
import React, { useState, useEffect, ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Image, Platform, Alert, TouchableOpacity, Animated } from 'react-native';
import { Surface, Text, IconButton, useTheme, Button, Switch, Divider, Chip, Portal, Modal, TextInput, Dialog, Avatar, FAB, ActivityIndicator } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import CustomButton from '../components/CustomButton';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import BottomNavigationBar from '../components/BottomNavigationBar';
import { auth, database, supabase, avatarStorage } from '../supabase';
import NotificationService from '../services/NotificationService';

const SCREEN_WIDTH = Dimensions.get('window').width;

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon?: string;
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

type TabKey = 'home' | 'leaderboard' | 'calendar' | 'profile';

// Update validation messages
const validateSocialLink = (platform: string, value: string): string | null => {
  if (!value) return null; // Empty values are allowed
  
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  switch (platform) {
    case 'facebook':
      return /^[a-zA-Z0-9.]{5,50}$/.test(trimmedValue) 
        ? null 
        : 'Facebook потребителското име трябва да е между 5 и 50 символа (букви, цифри, точки)';
    case 'linkedin':
      return /^[a-zA-Z0-9-]{3,100}$/.test(trimmedValue)
        ? null
        : 'LinkedIn потребителското име трябва да е между 3 и 100 символа (букви, цифри, тирета)';
    case 'instagram':
      return /^[a-zA-Z0-9._]{1,30}$/.test(trimmedValue)
        ? null
        : 'Instagram потребителското име трябва да е между 1 и 30 символа (букви, цифри, точки, долни черти)';
    default:
      return 'Невалидна платформа';
  }
};

// Update social media platform info
const SOCIAL_PLATFORMS = {
  facebook: {
    icon: 'facebook',
    label: 'Facebook',
    placeholder: 'Въведете вашето Facebook потребителско име',
    prefix: 'facebook.com/'
  },
  linkedin: {
    icon: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'Въведете вашето LinkedIn потребителско име',
    prefix: 'linkedin.com/in/'
  },
  instagram: {
    icon: 'instagram',
    label: 'Instagram',
    placeholder: 'Въведете вашето Instagram потребителско име',
    prefix: 'instagram.com/'
  }
} as const;

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [socialLinkEditValue, setSocialLinkEditValue] = useState('');
  const [socialLinkValidationError, setSocialLinkValidationError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const initializeProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get session and user data in parallel
      const [sessionResult, userResult] = await Promise.all([
        supabase.auth.getSession(),
        auth.getCurrentUser()
      ]);

      const { data: { session }, error: sessionError } = sessionResult;
      if (sessionError) throw sessionError;
      if (!session) {
        navigation.replace('SignIn');
        return;
      }

      const { user, error: userError } = userResult;
      if (userError) throw userError;
      if (!user) {
        navigation.replace('SignIn');
        return;
      }

      // Load all profile data in parallel
      const [
        profileResult,
        achievementsResult,
        userAchievementsResult,
        settingsResult,
        avatarResult
      ] = await Promise.all([
        database.getProfile(user.id),
        database.getAchievements(),
        database.getUserAchievements(user.id),
        database.getUserSettings(user.id),
        avatarStorage.getAvatarUrl(user.id)
      ]);

      const { data: profile, error: profileError } = profileResult;
      if (profileError) throw profileError;

      const typedProfile = profile as Profile;
      const socialLinks: SocialLinks = {
        facebook: typedProfile?.social_links?.facebook || '',
        linkedin: typedProfile?.social_links?.linkedin || '',
        instagram: typedProfile?.social_links?.instagram || ''
      };

      // Map achievements with completion status
      const achievements = achievementsResult.data?.map(achievement => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        completed: userAchievementsResult.data?.some(ua => ua.id === achievement.id) || false
      })) || [];

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
        achievements
      });

      // Update settings
      if (settingsResult.data) {
        setNotificationsEnabled(settingsResult.data.notifications_enabled);
        setSoundEnabled(settingsResult.data.sound_enabled);
      }

      // Set avatar URL
      setAvatarUrl(avatarResult);

      // Mark profile as ready
      setIsProfileReady(true);

    } catch (err) {
      console.error('Profile initialization error:', err);
      if (err instanceof Error && err.message.includes('auth session is missing')) {
        navigation.replace('SignIn');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
        Alert.alert('Error', 'Failed to load profile data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeProfile();
  }, []);

  useEffect(() => {
    if (!loading && !error) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, error]);

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

      // Update local state and handle notifications
      switch (setting) {
        case 'notifications_enabled':
          setNotificationsEnabled(value);
          await NotificationService.updateStreakNotificationStatus(value);
          break;
        case 'sound_enabled':
          setSoundEnabled(value);
          break;
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleAvatarUpload = async () => {
    try {
      setUploadingAvatar(true);

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photos to upload an avatar.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const { user } = await auth.getCurrentUser();
      if (!user) {
        throw new Error('No user found');
      }

      // Get the image file
      const response = await fetch(result.assets[0].uri);
      const blob = await response.blob();

      // Upload the avatar
      const { url, error } = await avatarStorage.uploadAvatar(user.id, blob);
      if (error) throw error;

      // Update the profile with the new avatar URL
      const { error: updateError } = await database.updateProfile(user.id, {
        avatar_url: url
      });
      if (updateError) throw updateError;

      // Update local state
      setAvatarUrl(url);
      Alert.alert('Success', 'Avatar updated successfully');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      Alert.alert('Error', 'Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
      setShowAvatarPicker(false);
    }
  };

  const handleSocialLinkEdit = (platform: string) => {
    setEditingPlatform(platform);
    setSocialLinkEditValue(userData.socialLinks[platform]);
    setSocialLinkValidationError(null);
  };

  const handleSocialLinkSave = async (platform: string) => {
    const error = validateSocialLink(platform, socialLinkEditValue);
    if (error) {
      setSocialLinkValidationError(error);
      return;
    }

    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      const updatedLinks = {
        ...userData.socialLinks,
        [platform]: socialLinkEditValue.trim()
      };

      const { error: updateError } = await database.updateProfile(user.id, {
        social_links: updatedLinks
      });

      if (updateError) throw updateError;

      setUserData(prev => ({
        ...prev,
        socialLinks: updatedLinks
      }));

      setEditingPlatform(null);
      setSocialLinkEditValue('');
      setSocialLinkValidationError(null);
    } catch (err) {
      console.error('Error saving social link:', err);
      Alert.alert('Грешка', 'Неуспешно обновяване на социалната мрежа');
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
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Avatar.Icon
              size={90}
              icon="account"
              style={{ backgroundColor: '#8A97FF' }}
            />
          )}
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
          <View style={styles.nameContainer}>
            {isEditing ? (
              <TextInput
                value={userData.name}
                onChangeText={(text) => setUserData(prev => ({ ...prev, name: text }))}
                style={[styles.profileNameInput, { color: '#000000' }]}
                placeholder="Въведете вашето име"
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                onBlur={() => handleSave()}
                onSubmitEditing={() => handleSave()}
              />
            ) : (
              <Text style={[styles.profileName, { color: '#000000' }]}>
                {userData.name || 'Добавете вашето име'}
              </Text>
            )}
          </View>
          <Text style={[styles.profileEmail, { color: 'rgba(0, 0, 0, 0.6)' }]}>
            {userData.email}
          </Text>
        </View>
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

  const renderAchievements = () => (
    <Surface style={cardStyle}>
      <Text variant="titleMedium" style={{ color: '#000000', marginBottom: 20, fontSize: 18, fontWeight: '600' }}>
        Постижения
      </Text>
      <View style={styles.emptyAchievementsContainer}>
        <MaterialCommunityIcons name="trophy-outline" size={48} color="#BDBDBD" />
        <Text style={styles.emptyAchievementsText}>
          Скоро
        </Text>
        <Text style={styles.emptyAchievementsSubtext}>
          Системата за постижения ще бъде достъпна скоро. Следете за актуализации!
        </Text>
      </View>
    </Surface>
  );

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
        {userData.interests.length > 0 ? (
          userData.interests.map((interest: string, index: number) => (
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
          ))
        ) : (
          <Text style={{ color: 'rgba(0, 0, 0, 0.6)', fontStyle: 'italic' }}>
            Няма добавени интереси
          </Text>
        )}
      </View>
    </Surface>
  );

  const renderSocialLinks = () => (
    <Surface style={cardStyle}>
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={{ color: '#000000', fontSize: 18, fontWeight: '600' }}>
          Социални мрежи
        </Text>
      </View>
      <View style={styles.socialLinksContainer}>
        {Object.entries(SOCIAL_PLATFORMS).map(([platform, info]) => (
          <View key={platform} style={styles.socialLink}>
            <MaterialCommunityIcons
              name={info.icon}
              size={24}
              color="#8A97FF"
            />
            {editingPlatform === platform ? (
              <View style={styles.socialLinkEdit}>
                <TextInput
                  value={socialLinkEditValue}
                  onChangeText={(text) => {
                    setSocialLinkEditValue(text);
                    setSocialLinkValidationError(null);
                  }}
                  placeholder={info.placeholder}
                  style={styles.socialLinkInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {socialLinkValidationError && (
                  <Text style={styles.validationError}>{socialLinkValidationError}</Text>
                )}
                <View style={styles.socialLinkActions}>
                  <IconButton
                    icon="check"
                    size={20}
                    onPress={() => handleSocialLinkSave(platform)}
                    style={styles.socialLinkButton}
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    onPress={() => {
                      setEditingPlatform(null);
                      setSocialLinkEditValue('');
                      setSocialLinkValidationError(null);
                    }}
                    style={styles.socialLinkButton}
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.socialLinkText}
                onPress={() => isEditing && handleSocialLinkEdit(platform)}
              >
                <Text variant="bodyMedium" style={{ color: '#000000', fontSize: 16 }}>
                  {userData.socialLinks[platform] 
                    ? `${info.prefix}${userData.socialLinks[platform]}`
                    : `Добави ${info.label} профил`}
                </Text>
                {isEditing && (
                  <IconButton
                    icon="pencil"
                    size={16}
                    onPress={() => handleSocialLinkEdit(platform)}
                    style={styles.editIcon}
                  />
                )}
              </TouchableOpacity>
            )}
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
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={async () => {
            try {
              const { error } = await auth.signOut();
              if (error) throw error;
              navigation.replace('SignIn');
            } catch (err) {
              console.error('Error signing out:', err);
              Alert.alert('Грешка', 'Възникна проблем при излизане от профила');
            }
          }}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#FF5252" />
          <Text variant="bodyMedium" style={{ color: '#FF5252', flex: 1, marginLeft: 12, fontSize: 16 }}>
            Изход от профила
          </Text>
        </TouchableOpacity>
      </View>
    </Surface>
  );

  const renderSkeletonLoader = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Profile Header Skeleton */}
      <Surface style={[styles.profileHeader, styles.skeletonContainer]}>
        <View style={styles.profileAvatarContainer}>
          <View style={[styles.skeletonCircle, { width: 90, height: 90, borderRadius: 45 }]} />
          <View style={styles.profileInfo}>
            <View style={[styles.skeletonText, { width: 150, height: 32 }]} />
            <View style={[styles.skeletonText, { width: 200, height: 20, marginTop: 8 }]} />
          </View>
        </View>
      </Surface>

      {/* Stats Skeleton */}
      <Surface style={[cardStyle, styles.skeletonContainer]}>
        <View style={[styles.skeletonText, { width: 100, height: 24, marginBottom: 20 }]} />
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4].map((_, index) => (
            <View key={index} style={styles.statItem}>
              <View style={[styles.skeletonCircle, { width: 28, height: 28 }]} />
              <View style={[styles.skeletonText, { width: 40, height: 24, marginTop: 8 }]} />
              <View style={[styles.skeletonText, { width: 60, height: 16, marginTop: 4 }]} />
            </View>
          ))}
        </View>
      </Surface>

      {/* Progress Skeleton */}
      <Surface style={[cardStyle, styles.skeletonContainer]}>
        <View style={[styles.skeletonText, { width: 100, height: 24, marginBottom: 20 }]} />
        <View style={[styles.skeletonText, { width: '100%', height: 8, borderRadius: 4 }]} />
        <View style={[styles.skeletonText, { width: 150, height: 16, marginTop: 12 }]} />
      </Surface>

      {/* Achievements Skeleton */}
      <Surface style={[cardStyle, styles.skeletonContainer]}>
        <View style={[styles.skeletonText, { width: 120, height: 24, marginBottom: 20 }]} />
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.skeletonAchievementContainer}>
            <View style={[styles.skeletonCircle, { width: 28, height: 28 }]} />
            <View style={styles.skeletonAchievementInfo}>
              <View style={[styles.skeletonText, { width: 120, height: 20 }]} />
              <View style={[styles.skeletonText, { width: 200, height: 16, marginTop: 4 }]} />
            </View>
          </View>
        ))}
      </Surface>

      {/* Settings Skeleton */}
      <Surface style={[cardStyle, styles.skeletonContainer]}>
        <View style={[styles.skeletonText, { width: 100, height: 24, marginBottom: 20 }]} />
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.settingItem}>
            <View style={[styles.skeletonCircle, { width: 24, height: 24 }]} />
            <View style={[styles.skeletonText, { width: 100, height: 20, marginLeft: 12 }]} />
            <View style={[styles.skeletonCircle, { width: 40, height: 24, marginLeft: 'auto' }]} />
          </View>
        ))}
      </Surface>
    </Animated.View>
  );

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Button mode="contained" onPress={initializeProfile} style={{ marginTop: 16 }}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          renderSkeletonLoader()
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {isProfileReady && (
              <>
                {renderProfileHeader()}
                {renderUserStats()}
                {renderProgress()}
                {renderAchievements()}
                {renderInterests()}
                {renderSocialLinks()}
                {renderActions()}
              </>
            )}
          </Animated.View>
        )}
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
              placeholder={editField === 'interests' ? 'Въведете интереси, разделени със запетаи' : ''}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Отказ</Button>
            <Button onPress={handleSave}>Запази</Button>
          </Dialog.Actions>
        </Dialog>
        
        <Dialog
          visible={showAvatarPicker}
          onDismiss={() => setShowAvatarPicker(false)}
          style={dialogStyle}
        >
          <Dialog.Title>Update Avatar</Dialog.Title>
          <Dialog.Content>
            <Text>Choose an option to update your avatar:</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAvatarPicker(false)}>Cancel</Button>
            <Button onPress={handleAvatarUpload}>Upload Photo</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon={isEditing ? 'check' : 'pencil'}
        style={[styles.fab, { backgroundColor: '#8A97FF' }]}
        onPress={() => setIsEditing(!isEditing)}
      />

      <BottomNavigationBar 
        navigation={navigation}
        activeTab={activeTab}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80, // Increased padding for bottom nav
  },
  profileHeader: {
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
  },
  profileAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    bottom: Platform.OS === 'ios' ? 100 : 80, // Adjusted for bottom nav
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
    flex: 1,
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    width: '100%',
  },
  achievementIconContainer: {
    position: 'relative',
    width: 28,
    height: 28,
    marginRight: 12,
  },
  achievementCheckmark: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#8A97FF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
  },
  achievementProgressContainer: {
    marginTop: 4,
  },
  achievementProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgressText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  socialLinkEdit: {
    flex: 1,
    marginLeft: 12,
  },
  socialLinkInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: 36,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  socialLinkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  socialLinkButton: {
    margin: 0,
    marginLeft: 8,
  },
  socialLinkText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  editIcon: {
    margin: 0,
    marginLeft: 8,
  },
  validationError: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  skeletonContainer: {
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  skeletonCircle: {
    backgroundColor: '#e0e0e0',
    borderRadius: 14,
  },
  skeletonText: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonAchievementContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    width: '100%',
  },
  skeletonAchievementInfo: {
    flex: 1,
    marginLeft: 12,
  },
  emptyAchievementsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  emptyAchievementsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyAchievementsSubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
});

export default ProfileScreen; 
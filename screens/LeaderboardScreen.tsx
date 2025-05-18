import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, RefreshControl, TextInput, Platform, Animated } from 'react-native';
import { Surface, Text, IconButton, useTheme, Button, Avatar, ActivityIndicator, Menu, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomNavigationBar from '../components/BottomNavigationBar';
import { RootStackParamList } from '../AppNavigator';
import { database, auth, supabase } from '../supabase';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PAGE_SIZE = 20; // Number of users to load per page

type LeaderboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  xp: number;
  streak: number;
  completed_lessons: number;
  completed_quizzes: number;
  social_links: { [key: string]: string };
  created_at: string;
  updated_at: string;
}

interface LeaderboardItem {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  streak: number;
  completedLessons: number;
  isCurrentUser: boolean;
  level: number;
  rank: string;
}

type SortOption = 'xp' | 'streak' | 'completed_lessons' | 'name';
type TimeFilter = 'all' | 'weekly' | 'monthly';
type TabKey = 'home' | 'leaderboard' | 'calendar' | 'profile';

const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('xp');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('leaderboard');
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadLeaderboardData();
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

  const calculateRank = (xp: number): string => {
    if (xp >= 10000) return 'Финансов Експерт';
    if (xp >= 7500) return 'Инвестиционен Консултант';
    if (xp >= 5000) return 'Финансов Анализатор';
    if (xp >= 2500) return 'Напреднал';
    return 'Начинаещ';
  };

  const loadLeaderboardData = async () => {
    try {
      console.log('Starting to fetch leaderboard data...');
      const { user } = await auth.getCurrentUser();
      if (!user) {
        console.error('No user found');
        return;
      }
      console.log('Current user:', user.id);

      // Build the initial query
      let query = supabase
        .from('profiles')
        .select('*');
      console.log('Initial query built');

      // Get total count first
      const { data: countData, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (countError) throw countError;
      const totalCount = countData?.length || 0;
      console.log('Total users count:', totalCount);

      // Fetch profiles with pagination
      const { data: profiles, error: profilesError } = await query
        .range(0, 19) // Fetch first 20 profiles
        .order(sortBy, { ascending: sortBy === 'name' });
      
      if (profilesError) throw profilesError;
      console.log('Fetched profiles:', profiles?.length);
      console.log('Sample profile:', profiles?.[0]);

      if (!profiles) return;

      // Transform profiles into leaderboard items with actual streaks
      const leaderboardItems: LeaderboardItem[] = await Promise.all(profiles.map(async (profile) => {
        console.log('\n=== Processing profile', profile.id, `(${profile.name}) ===`);
        console.log('Profile data:', {
          id: profile.id,
          name: profile.name,
          stored_streak: profile.streak,
          xp: profile.xp,
          completed_lessons: profile.completed_lessons
        });
        
        // Get streak info using the same function as the rest of the app
        console.log('Fetching streak info for profile', profile.id);
        const { data: streakInfo, error: streakError } = await database.getStreakInfo(profile.id);
        if (streakError) {
          console.error('Error getting streak info for profile', profile.id, ':', streakError);
        }
        
        console.log('Streak info response:', {
          currentStreak: streakInfo?.currentStreak,
          longestStreak: streakInfo?.longestStreak,
          totalDays: streakInfo?.totalDays,
          hasError: !!streakError
        });
        
        const currentStreak = streakInfo?.currentStreak || 0;
        console.log('Streak comparison:', {
          calculated: currentStreak,
          stored: profile.streak,
          needsUpdate: currentStreak !== profile.streak
        });

        // Only update if the calculated streak is different from stored
        if (currentStreak !== profile.streak) {
          console.log('Updating profile streak from', profile.streak, 'to', currentStreak);
          const { error: updateError } = await database.updateProfile(profile.id, { streak: currentStreak });
          if (updateError) {
            console.error('Error updating profile streak:', updateError);
          } else {
            console.log('Successfully updated profile streak');
          }
        }

        const xp = profile.xp || 0;
        const leaderboardItem = {
          id: profile.id,
          name: profile.name || 'Anonymous User',
          avatar: profile.avatar_url || 'https://raw.githubusercontent.com/maria-ivanova/images/main/default_avatar.jpg',
          xp,
          streak: currentStreak,
          completedLessons: profile.completed_lessons || 0,
          isCurrentUser: profile.id === user.id,
          level: Math.floor(xp / 1000),
          rank: calculateRank(xp)
        };
        
        console.log('Created leaderboard item:', {
          id: leaderboardItem.id,
          name: leaderboardItem.name,
          streak: leaderboardItem.streak,
          isCurrentUser: leaderboardItem.isCurrentUser
        });
        
        return leaderboardItem;
      }));

      console.log('Transformed and sorted leaderboard items:', leaderboardItems.length);

      // Sort based on selected option
      const sortedItems = [...leaderboardItems].sort((a, b) => {
        switch (sortBy) {
          case 'xp':
            return b.xp - a.xp;
          case 'streak':
            return b.streak - a.streak;
          case 'completed_lessons':
            return b.completedLessons - a.completedLessons;
          case 'name':
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });

      setLeaderboardData(sortedItems);
      setTotalUsers(totalCount);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      setError('Failed to load leaderboard data');
      setLoading(false);
    }
  };

  const onRefresh = () => {
    loadLeaderboardData();
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadLeaderboardData();
    }
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: '#efefef' }]}>
      <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Класация</Text>
      <Text style={[styles.subTitle, { color: colors.onSurfaceVariant }]}>
        Общо участници: {totalUsers}
      </Text>
      
      <View style={styles.filterContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.surface }]}
          placeholder="Търси потребител..."
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setPage(0);
            loadLeaderboardData();
          }}
        />
        
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setMenuVisible(true)}
              style={styles.filterButton}
            >
              Филтри
            </Button>
          }
        >
          <Menu.Item
            title="Сортирай по XP"
            onPress={() => {
              setSortBy('xp');
              setMenuVisible(false);
              setPage(0);
              loadLeaderboardData();
            }}
            leadingIcon={sortBy === 'xp' ? 'check' : undefined}
          />
          <Menu.Item
            title="Сортирай по серия"
            onPress={() => {
              setSortBy('streak');
              setMenuVisible(false);
              setPage(0);
              loadLeaderboardData();
            }}
            leadingIcon={sortBy === 'streak' ? 'check' : undefined}
          />
          <Menu.Item
            title="Сортирай по уроци"
            onPress={() => {
              setSortBy('completed_lessons');
              setMenuVisible(false);
              setPage(0);
              loadLeaderboardData();
            }}
            leadingIcon={sortBy === 'completed_lessons' ? 'check' : undefined}
          />
          <Divider />
          <Menu.Item
            title="Всички време"
            onPress={() => {
              setTimeFilter('all');
              setMenuVisible(false);
              setPage(0);
              loadLeaderboardData();
            }}
            leadingIcon={timeFilter === 'all' ? 'check' : undefined}
          />
          <Menu.Item
            title="За седмицата"
            onPress={() => {
              setTimeFilter('weekly');
              setMenuVisible(false);
              setPage(0);
              loadLeaderboardData();
            }}
            leadingIcon={timeFilter === 'weekly' ? 'check' : undefined}
          />
          <Menu.Item
            title="За месеца"
            onPress={() => {
              setTimeFilter('monthly');
              setMenuVisible(false);
              setPage(0);
              loadLeaderboardData();
            }}
            leadingIcon={timeFilter === 'monthly' ? 'check' : undefined}
          />
          <Divider />
          <Menu.Item
            title={showOnlyActive ? "Покажи всички" : "Само активни"}
            onPress={() => {
              setShowOnlyActive(!showOnlyActive);
              setMenuVisible(false);
              setPage(0);
              loadLeaderboardData();
            }}
            leadingIcon={showOnlyActive ? 'check' : undefined}
          />
        </Menu>
      </View>
    </View>
  );

  const renderSkeletonLoader = () => (
    <Animated.View style={{ opacity: loading ? 1 : fadeAnim }}>
      {[...Array(6)].map((_, idx) => (
        <View key={idx} style={[styles.leaderboardItem, styles.skeletonRow]}>
          <View style={[styles.skeletonCircle, { width: 40, height: 40, borderRadius: 20 }]} />
          <View style={styles.skeletonUserInfo}>
            <View style={[styles.skeletonText, { width: 120, height: 18, marginBottom: 8 }]} />
            <View style={[styles.skeletonText, { width: 60, height: 14, marginBottom: 4 }]} />
            <View style={[styles.skeletonText, { width: 50, height: 12 }]} />
          </View>
          <View style={styles.skeletonStats}>
            <View style={[styles.skeletonText, { width: 32, height: 16, marginBottom: 6 }]} />
            <View style={[styles.skeletonText, { width: 32, height: 16 }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const rank = index + 1;
    let medalColor: string | null = null;
    
    if (rank === 1) medalColor = '#FFD700'; // Gold
    else if (rank === 2) medalColor = '#C0C0C0'; // Silver
    else if (rank === 3) medalColor = '#CD7F32'; // Bronze
    
    return (
      <Surface 
        key={item.id} 
        style={[
          styles.leaderboardItem, 
          { 
            backgroundColor: item.isCurrentUser ? 'rgba(90, 102, 196, 0.1)' : '#fafafa',
            borderColor: item.isCurrentUser ? colors.primary : 'transparent',
            borderWidth: item.isCurrentUser ? 1 : 0,
            marginTop: index === 0 ? 0 : 12,
          }
        ]}
      >
        <View style={styles.rankContainer}>
          {index < 3 ? (
            <MaterialCommunityIcons
              name="medal"
              size={24}
              color={medalColor || '#FFD700'}
            />
          ) : (
            <Text style={[styles.rankText, { color: colors.primary }]}>
              {rank}
            </Text>
          )}
        </View>
        
        <Avatar.Image 
          source={{ uri: item.avatar }} 
          size={40} 
          style={styles.avatar}
        />
        
        <View style={styles.userInfo}>
          <Text style={[
            styles.userName,
            { 
              color: colors.onSurface,
              fontWeight: item.isCurrentUser ? 'bold' : 'normal'
            }
          ]}>
            {item.name}
          </Text>
          <Text style={[styles.userRank, { color: colors.primary }]}>
            {item.rank}
          </Text>
          <Text style={[styles.userXP, { color: colors.onSurfaceVariant }]}>
            {item.xp} XP
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              Ниво
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {item.level}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]}>
              Серия
            </Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {item.streak}
            </Text>
          </View>
        </View>
        
        {item.isCurrentUser && (
          <MaterialCommunityIcons
            name="account-check"
            size={24}
            color={colors.primary}
            style={styles.currentUserIcon}
          />
        )}
      </Surface>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        
        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.leaderboardContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
              />
            }
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
              const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
              if (isCloseToBottom) {
                loadMore();
              }
            }}
            scrollEventThrottle={400}
          >
            <View style={styles.leaderboardContainer}>
              {loading && page === 0 ? (
                renderSkeletonLoader()
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Button 
                    mode="contained" 
                    onPress={() => loadLeaderboardData()}
                    style={styles.retryButton}
                  >
                    Опитай отново
                  </Button>
                </View>
              ) : leaderboardData.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Няма намерени потребители</Text>
                  <Text style={styles.emptySubText}>
                    {showOnlyActive 
                      ? "Няма активни потребители в момента" 
                      : "Няма потребители в базата данни"}
                  </Text>
                </View>
              ) : (
                <Animated.View style={{ opacity: fadeAnim }}>
                  {leaderboardData.map((item, index) => renderLeaderboardItem({ item, index }))}
                  {loading && hasMore && (
                    <ActivityIndicator 
                      style={styles.loadingMore} 
                      animating={true} 
                      color={colors.primary} 
                    />
                  )}
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

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
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  leaderboardContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#efefef',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  leaderboardContainer: {
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userRank: {
    fontSize: 14,
    marginTop: 2,
  },
  userXP: {
    fontSize: 12,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentUserIcon: {
    marginLeft: 16,
  },
  bottomContainer: {
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 4,
  },
  challengesButton: {
    borderRadius: 12,
  },
  challengesButtonContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 16,
  },
  subTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  loadingMore: {
    marginVertical: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  filterButton: {
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
  skeletonCircle: {
    backgroundColor: '#e0e0e0',
    marginRight: 16,
  },
  skeletonUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonText: {
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonStats: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 16,
  },
});

export default LeaderboardScreen; 

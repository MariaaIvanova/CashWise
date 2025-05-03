import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Surface, Text, IconButton, useTheme, Button, Avatar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomNavBar from '../components/BottomNavBar';

const SCREEN_WIDTH = Dimensions.get('window').width;

type RootStackParamList = {
  Leaderboard: undefined;
};

type LeaderboardScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Leaderboard'>;
};

interface LeaderboardItem {
  id: number;
  name: string;
  xp: number;
  level: number;
  streak: number;
  rank: string;
  avatar: string;
  isCurrentUser?: boolean;
}

export default function LeaderboardScreen({ navigation }: LeaderboardScreenProps) {
  const { colors } = useTheme();
  const [currentUserPosition, setCurrentUserPosition] = useState<number>(15);

  // Mock data for the leaderboard
  const leaderboardData: LeaderboardItem[] = [
    { id: 1, name: 'Иван Петров', xp: 3500, level: 15, streak: 30, rank: 'Магистър', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { id: 2, name: 'Петър Иванов', xp: 3200, level: 14, streak: 25, rank: 'Експерт', avatar: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { id: 3, name: 'Мария Димитрова', xp: 3000, level: 13, streak: 20, rank: 'Напреднал', avatar: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { id: 4, name: 'Анна Николова', xp: 2800, level: 12, streak: 18, rank: 'Напреднал', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { id: 5, name: 'Георги Стефанов', xp: 2600, level: 11, streak: 15, rank: 'Напреднал', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
    { id: 6, name: 'Елена Попова', xp: 2400, level: 10, streak: 12, rank: 'Ученик', avatar: 'https://randomuser.me/api/portraits/women/3.jpg' },
    { id: 7, name: 'Димитър Георгиев', xp: 2200, level: 9, streak: 10, rank: 'Ученик', avatar: 'https://randomuser.me/api/portraits/men/4.jpg' },
    { id: 8, name: 'Светлана Петрова', xp: 2000, level: 8, streak: 8, rank: 'Ученик', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
    { id: 9, name: 'Александър Димитров', xp: 1800, level: 7, streak: 6, rank: 'Ученик', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' },
    { id: 10, name: 'Ивана Стефанова', xp: 1600, level: 6, streak: 5, rank: 'Ученик', avatar: 'https://randomuser.me/api/portraits/women/5.jpg' },
    { id: 11, name: 'Мария Иванова', xp: 1400, level: 5, streak: 4, rank: 'Ученик', avatar: 'https://randomuser.me/api/portraits/women/17.jpg', isCurrentUser: true },
  ];

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: '#efefef' }]}>
      <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Класация</Text>
    </View>
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
    <View style={[styles.container, { backgroundColor: '#efefef' }]}>
      {renderHeader()}
      
      <View style={styles.contentContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.leaderboardContainer}>
            {leaderboardData.map((item, index) => renderLeaderboardItem({ item, index }))}
          </View>
        </ScrollView>

        <Surface style={[styles.bottomContainer, { backgroundColor: '#fafafa' }]}>
          <Button
            mode="contained"
            icon="trophy"
            onPress={() => {}}
            style={[styles.challengesButton, { backgroundColor: colors.primary }]}
            contentStyle={styles.challengesButtonContent}
            labelStyle={{ color: 'white' }}
          >
            Предизвикателства
          </Button>
        </Surface>
      </View>

      <BottomNavBar navigation={navigation} activeTab="leaderboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    marginBottom: 60, // Space for the navigation bar
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#efefef',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
}); 
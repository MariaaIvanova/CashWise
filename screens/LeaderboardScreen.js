import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image } from 'react-native';
import { Text, Title, Chip, Surface, Button, Searchbar, Divider, Avatar, IconButton, SegmentedButtons } from 'react-native-paper';

export default function LeaderboardScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFrame, setTimeFrame] = useState('week');
  
  // Mock leaderboard data - would come from backend
  const leaderboardData = [
    {
      id: '1',
      name: 'Мария Иванова',
      avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
      xp: 2450,
      level: 12,
      streak: 22,
      rank: 1,
      isCurrentUser: true,
    },
    {
      id: '2',
      name: 'Георги Петров',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      xp: 3200,
      level: 15,
      streak: 30,
      rank: 0,
    },
    {
      id: '3',
      name: 'Димитър Колев',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      xp: 3050,
      level: 14,
      streak: 18,
      rank: 0,
    },
    {
      id: '4',
      name: 'Елена Тодорова',
      avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
      xp: 2900,
      level: 13,
      streak: 14,
      rank: 0,
    },
    {
      id: '5',
      name: 'Николай Иванов',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      xp: 2700,
      level: 12,
      streak: 9,
      rank: 0,
    },
    {
      id: '6',
      name: 'Виктория Стоянова',
      avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
      xp: 2600,
      level: 11,
      streak: 12,
      rank: 0,
    },
    {
      id: '7',
      name: 'Александър Димитров',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      xp: 2550,
      level: 11,
      streak: 11,
      rank: 0,
    },
    {
      id: '8',
      name: 'Ивана Георгиева',
      avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
      xp: 2480,
      level: 10,
      streak: 8,
      rank: 0,
    },
    {
      id: '9',
      name: 'Калоян Петров',
      avatar: 'https://randomuser.me/api/portraits/men/55.jpg',
      xp: 2350,
      level: 10,
      streak: 7,
      rank: 0,
    },
    {
      id: '10',
      name: 'Силвия Николова',
      avatar: 'https://randomuser.me/api/portraits/women/58.jpg',
      xp: 2300,
      level: 9,
      streak: 5,
      rank: 0,
    },
  ];
  
  // Sort user data by XP (descending)
  const sortedData = [...leaderboardData].sort((a, b) => b.xp - a.xp);
  
  // Filter based on search query
  const filteredData = sortedData.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Find current user's position
  const currentUserIndex = sortedData.findIndex(user => user.isCurrentUser);
  const currentUserPosition = currentUserIndex !== -1 ? currentUserIndex + 1 : null;
  
  const renderLeaderboardItem = ({ item, index }) => {
    const rank = index + 1;
    let medalColor = null;
    
    if (rank === 1) medalColor = '#FFD700'; // Gold
    else if (rank === 2) medalColor = '#C0C0C0'; // Silver
    else if (rank === 3) medalColor = '#CD7F32'; // Bronze
    
    return (
      <Surface style={[
        styles.userItem, 
        item.isCurrentUser && styles.currentUserItem
      ]}>
        <View style={styles.rankContainer}>
          {medalColor ? (
            <IconButton
              icon="medal"
              size={24}
              iconColor={medalColor}
              style={styles.medalIcon}
            />
          ) : (
            <Text style={styles.rankText}>{rank}</Text>
          )}
        </View>
        
        <Avatar.Image 
          source={{ uri: item.avatar }} 
          size={46} 
          style={styles.avatar}
        />
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={styles.userStats}>
            <Chip icon="star" style={styles.statChip} textStyle={styles.statText}>
              {item.xp} XP
            </Chip>
            <Chip icon="fire" style={styles.statChip} textStyle={styles.statText}>
              {item.streak}
            </Chip>
          </View>
        </View>
        
        <View style={styles.levelContainer}>
          <Text style={styles.levelLabel}>Ниво</Text>
          <Text style={styles.levelValue}>{item.level}</Text>
        </View>
      </Surface>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Класация</Title>
        <SegmentedButtons
          value={timeFrame}
          onValueChange={setTimeFrame}
          buttons={[
            { value: 'week', label: 'Седмица' },
            { value: 'month', label: 'Месец' },
            { value: 'alltime', label: 'Общо' }
          ]}
          style={styles.segmentedButtons}
        />
        <Searchbar
          placeholder="Търси потребител"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      
      <Divider />
      
      <FlatList
        data={filteredData}
        renderItem={renderLeaderboardItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.headerText}>Ранг</Text>
            <Text style={[styles.headerText, styles.nameHeader]}>Потребител</Text>
            <Text style={[styles.headerText, styles.levelHeader]}>Ниво</Text>
          </View>
        }
      />
      
      {currentUserPosition && currentUserPosition > 10 && (
        <View style={styles.currentUserPosition}>
          <Divider />
          <Text style={styles.userPositionText}>Вашата позиция: #{currentUserPosition}</Text>
          <Button 
            mode="contained" 
            onPress={() => {}} 
            icon="arrow-up"
            style={styles.improveButton}
          >
            Подобри позицията си
          </Button>
        </View>
      )}
      
      {/* Challenge a friend */}
      <Surface style={styles.challengeContainer}>
        <Text style={styles.challengeText}>Предизвикай приятел!</Text>
        <Button 
          mode="contained" 
          icon="account-group" 
          onPress={() => {}}
          style={styles.challengeButton}
        >
          Предизвикателство
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 0,
    backgroundColor: '#f0f0f0',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  listHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#666',
  },
  nameHeader: {
    flex: 1,
    marginLeft: 80,
  },
  levelHeader: {
    width: 50,
    textAlign: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    elevation: 1,
  },
  currentUserItem: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  medalIcon: {
    margin: 0,
  },
  avatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
  },
  statChip: {
    height: 24,
    marginRight: 8,
  },
  statText: {
    fontSize: 12,
  },
  levelContainer: {
    alignItems: 'center',
    width: 50,
  },
  levelLabel: {
    fontSize: 12,
    color: '#666',
  },
  levelValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentUserPosition: {
    padding: 16,
    backgroundColor: 'white',
  },
  userPositionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
  },
  improveButton: {
    marginTop: 8,
  },
  challengeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E3F2FD',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
    elevation: 2,
  },
  challengeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  challengeButton: {
    backgroundColor: '#2196F3',
  },
}); 
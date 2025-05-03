import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';

type BottomNavBarProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>;
  activeTab: string;
};

export default function BottomNavBar({ navigation, activeTab }: BottomNavBarProps) {
  const { colors } = useTheme();
  
  const tabs = [
    { key: 'home', icon: 'home', label: 'Home' },
    { key: 'leaderboard', icon: 'trophy', label: 'Leaderboard' },
    { key: 'calendar', icon: 'calendar', label: 'Calendar' },
    { key: 'profile', icon: 'account', label: 'Profile' },
  ];

  const handleTabPress = (tabKey: string) => {
    switch (tabKey) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'leaderboard':
        navigation.navigate('Leaderboard');
        break;
      case 'calendar':
        navigation.navigate('Calendar');
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
    }
  };

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            activeTab === tab.key && styles.activeTabItem
          ]}
          onPress={() => handleTabPress(tab.key)}
        >
          <Icon
            name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline`}
            size={24}
            color={activeTab === tab.key ? colors.primary : '#FFFFFF'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    backgroundColor: '#1B2541',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  activeTabItem: {
    backgroundColor: 'rgba(90, 102, 196, 0.1)',
  },
}); 
import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';

export type TabKey = 'home' | 'leaderboard' | 'calendar' | 'profile';

interface BottomNavigationBarProps {
  navigation: NativeStackNavigationProp<RootStackParamList>;
  activeTab: TabKey;
}

const tabs = [
  { key: 'home' as const, icon: 'home' as const, label: 'Начало' },
  { key: 'leaderboard' as const, icon: 'trophy' as const, label: 'Класация' },
  { key: 'calendar' as const, icon: 'calendar' as const, label: 'Календар' },
  { key: 'profile' as const, icon: 'account' as const, label: 'Профил' },
] as const;

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({ navigation, activeTab }) => {
  const { colors } = useTheme();
  const isNavigating = useRef(false);

  const handleTabPress = React.useCallback((tabKey: TabKey) => {
    // Prevent multiple rapid clicks
    if (isNavigating.current || tabKey === activeTab) return;
    
    isNavigating.current = true;
    
    try {
      switch (tabKey) {
        case 'home':
          navigation.navigate('Home', undefined);
          break;
        case 'leaderboard':
          navigation.navigate('Leaderboard', undefined);
          break;
        case 'calendar':
          navigation.navigate('Calendar', undefined);
          break;
        case 'profile':
          navigation.navigate('Profile', { onComplete: undefined });
          break;
      }
    } finally {
      // Reset the navigation lock after a short delay
      setTimeout(() => {
        isNavigating.current = false;
      }, 300);
    }
  }, [activeTab, navigation]);

  return (
    <View style={[styles.bottomNav, { backgroundColor: colors.elevation.level3 }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            activeTab === tab.key && styles.activeTabItem
          ]}
          onPress={() => handleTabPress(tab.key)}
          activeOpacity={1}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          disabled={isNavigating.current}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline` as const} 
              size={24} 
              color={activeTab === tab.key ? colors.primary : colors.onSurface} 
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    zIndex: 1000, // Ensure navbar is always on top
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    zIndex: 1,
  },
  activeTabItem: {
    backgroundColor: 'rgba(90, 102, 196, 0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BottomNavigationBar; 
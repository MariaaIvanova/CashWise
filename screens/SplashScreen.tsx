import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Animated, Text } from 'react-native';
import { useTheme, THEME } from '../ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../AppNavigator';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: SplashScreenProps) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  
  // Get theme from context with fallback
  const themeContext = useTheme();
  const theme = themeContext?.theme || THEME;
  
  // Use our blue and gold colors with fallbacks
  const primaryColor = theme?.colors?.primary || '#5A66C4';
  const goldColor = theme?.colors?.secondary || '#CBB028';
  
  useEffect(() => {
    // Animation for logo
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      })
    ]).start();
    
    // Wait for animations and navigate to SignIn
    const timer = setTimeout(() => {
      navigation.replace('SignIn');
    }, 2000); // 2 seconds to show splash screen
    
    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);
  
  return (
    <View style={[styles.container, { backgroundColor: '#1B2541' }]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/cashwise-logo2.png')} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      
      <Text style={[styles.versionText, { color: goldColor }]}>
        версия 1.0.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B2541', // Dark blue background
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 200,
    height: 200,
  },
  versionText: {
    position: 'absolute',
    bottom: 24,
    fontSize: 14,
    color: '#CBB028', // Fallback, overridden by inline style
    opacity: 0.8,
  },
}); 
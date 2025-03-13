import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { useTheme } from '../ThemeContext';
// Remove Firebase imports since we're bypassing authentication
// import { auth } from '../firebase';

export default function SplashScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  
  // Get theme from context with defensive fallback
  const themeContext = useTheme();
  const isDarkTheme = themeContext?.isDarkTheme || false;
  const primaryColor = themeContext?.theme?.colors?.primary || '#6200ee';
  
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
    setTimeout(() => {
      navigation.replace('SignIn');
    }, 2000); // 2 seconds to show splash screen
    
  }, []);
  
  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {/* Replace with your actual app logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2942/2942245.png' }} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
        
        <Text style={styles.title}>Финансова Грамотност</Text>
        <Text style={styles.subtitle}>Научете се да управлявате парите си.</Text>
      </Animated.View>
      
      <Text style={styles.versionText}>версия 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6200ee', // This will be overridden by the inline style
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: 'white',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    opacity: 0.8,
    textAlign: 'center',
  },
  versionText: {
    position: 'absolute',
    bottom: 24,
    color: 'white',
    opacity: 0.6,
  },
}); 
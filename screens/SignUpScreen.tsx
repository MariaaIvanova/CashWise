import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, TextInput, ViewStyle, TextStyle, ImageStyle, StyleProp, Text } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme, THEME } from '../ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation param list type
type RootStackParamList = {
  Home: undefined;
  SignUp: undefined;
  SignIn: undefined;
};

// Define props type for the SignUpScreen component
type SignUpScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'SignUp'>;
};

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  
  // Get theme with fallback
  const themeContext = useTheme();
  const theme = themeContext?.theme || THEME;

  const handleSignUp = () => {
    // Bypass authentication and directly navigate to Home
    navigation.replace('Home');
  };

  const handleSignIn = () => {
    navigation.navigate('SignIn');
  };

  const handleGoogleSignIn = () => {
    // Bypass Google authentication and directly navigate to Home
    navigation.replace('Home');
  };

  const handleAppleSignIn = () => {
    // Bypass Apple authentication and directly navigate to Home
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/cashwise-logo2.png')} 
          style={styles.logo as ImageStyle}
          resizeMode="contain"
        />
      </View>
      
      <TextInput
        placeholder="Име"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#D4AF37"
        selectionColor="#D4AF37"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Имейл"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#D4AF37"
        selectionColor="#D4AF37"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        placeholder="Парола"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#D4AF37"
        selectionColor="#D4AF37"
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      {/* Sign Up Button */}
      <TouchableOpacity
        onPress={handleSignUp}
        style={styles.signInButton}
      >
        <Text style={styles.signInButtonText}>Регистрация</Text>
      </TouchableOpacity>
      
      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleSignIn}
        style={styles.signUpButton}
      >
        <Text style={styles.signUpButtonText}>Вход</Text>
      </TouchableOpacity>
      
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.orText}>Или се регистрирайте с</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <View style={styles.socialButtonsContainer}>
        {/* Google Button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          style={styles.socialButton}
        >
          <FontAwesome name="google" size={20} color="#FFFFFF" />
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>
        
        {/* Apple Button */}
        <TouchableOpacity
          onPress={handleAppleSignIn}
          style={styles.socialButton}
        >
          <FontAwesome name="apple" size={20} color="#FFFFFF" />
          <Text style={styles.socialButtonText}>Apple</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Define styles with TypeScript types
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1A2547',
  } as ViewStyle,
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  } as ViewStyle,
  logo: {
    width: 180,
    height: 180,
  } as ImageStyle,
  input: {
    height: 50,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#D4AF37',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(39, 50, 82, 0.7)',
    fontSize: 16,
  } as TextStyle,
  signInButton: {
    height: 40,
    width: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#D4AF37',
    alignSelf: 'center',
  } as ViewStyle,
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  } as TextStyle,
  signUpButton: {
    height: 40,
    width: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
    alignSelf: 'center',
  } as ViewStyle,
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  } as TextStyle,
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  } as ViewStyle,
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  } as ViewStyle,
  orText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginHorizontal: 12,
    fontSize: 14,
  } as TextStyle,
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    width: '100%',
    paddingHorizontal: 0,
  } as ViewStyle,
  socialButton: {
    flex: 1,
    height: 40,
    maxWidth: '100%',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4AF37',
    backgroundColor: 'transparent',
  } as ViewStyle,
  socialButtonText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '400',
  } as TextStyle,
  error: {
    color: '#FF6B6B',
    marginBottom: 16,
    fontWeight: '500',
  } as TextStyle,
}); 
import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, TextInput, ViewStyle, TextStyle, ImageStyle, StyleProp, Text, Alert, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme, THEME } from '../ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth, supabase } from '../supabase';

// Define the navigation param list type
type RootStackParamList = {
  Home: undefined;
  SignUp: undefined;
  SignIn: undefined;
};

// Define props type for the SignInScreen component
type SignInScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'SignIn'>;
};

export default function SignInScreen({ navigation }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get theme with fallback
  const themeContext = useTheme();
  const theme = themeContext?.theme || THEME;

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Моля, въведете имейл и парола');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Attempting to sign in...');
      const { data, error: signInError } = await auth.signIn(email, password);
      
      console.log('Sign in result:', {
        success: !!data?.user,
        error: signInError ? signInError.message : null
      });

      if (signInError) {
        throw signInError;
      }

      if (!data?.user) {
        throw new Error('No user data received');
      }

      console.log('Sign in successful, navigating to Home');
      navigation.replace('Home');
    } catch (err) {
      console.error('Sign in error:', err);
      let errorMessage = 'Грешка при влизане';
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          errorMessage = 'Невалиден имейл или парола';
        } else if (err.message.includes('Email not confirmed')) {
          errorMessage = 'Моля, потвърдете имейла си';
        }
      }
      
      setError(errorMessage);
      Alert.alert('Грешка', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Attempting Google sign in...');
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });

      console.log('Google sign in result:', {
        success: !!data,
        error: signInError ? signInError.message : null
      });

      if (signInError) {
        throw signInError;
      }

      // Note: OAuth sign in will open a browser window
      // The navigation will happen after the user completes the OAuth flow
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Грешка при влизане с Google');
      Alert.alert('Грешка', 'Грешка при влизане с Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Attempting Apple sign in...');
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'apple'
      });

      console.log('Apple sign in result:', {
        success: !!data,
        error: signInError ? signInError.message : null
      });

      if (signInError) {
        throw signInError;
      }

      // Note: OAuth sign in will open a browser window
      // The navigation will happen after the user completes the OAuth flow
    } catch (err) {
      console.error('Apple sign in error:', err);
      setError('Грешка при влизане с Apple');
      Alert.alert('Грешка', 'Грешка при влизане с Apple');
    } finally {
      setLoading(false);
    }
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
        placeholder="Имейл"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor="#D4AF37"
        selectionColor="#D4AF37"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />
      
      <TextInput
        placeholder="Парола"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#D4AF37"
        selectionColor="#D4AF37"
        editable={!loading}
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleSignIn}
        style={[styles.signInButton, loading && styles.disabledButton]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.signInButtonText}>Вход</Text>
        )}
      </TouchableOpacity>
      
      {/* Sign Up Button */}
      <TouchableOpacity
        onPress={handleSignUp}
        style={[styles.signUpButton, loading && styles.disabledButton]}
        disabled={loading}
      >
        <Text style={styles.signUpButtonText}>Регистрация</Text>
      </TouchableOpacity>
      
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.orText}>Или влезте с</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <View style={styles.socialButtonsContainer}>
        {/* Google Button */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          style={[styles.socialButton, loading && styles.disabledButton]}
          disabled={loading}
        >
          <FontAwesome name="google" size={20} color="#FFFFFF" />
          <Text style={styles.socialButtonText}>Google</Text>
        </TouchableOpacity>
        
        {/* Apple Button */}
        <TouchableOpacity
          onPress={handleAppleSignIn}
          style={[styles.socialButton, loading && styles.disabledButton]}
          disabled={loading}
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
    textAlign: 'center',
  } as TextStyle,
  disabledButton: {
    opacity: 0.7,
  } as ViewStyle,
}); 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, TextInput, ViewStyle, TextStyle, ImageStyle, StyleProp, Text, Alert, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme, THEME } from '../ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth, supabase, database } from '../supabase';

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
  const [loading, setLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false
  });
  
  // Get theme with fallback
  const themeContext = useTheme();
  const theme = themeContext?.theme || THEME;

  // Update password requirements as user types
  useEffect(() => {
    setPasswordRequirements({
      length: password.length >= 6,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password)
    });
  }, [password]);

  const validatePassword = (pass: string) => {
    const requirements = {
      length: pass.length >= 6,
      lowercase: /[a-z]/.test(pass),
      uppercase: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass)
    };

    const missingRequirements = [];
    if (!requirements.length) missingRequirements.push('Паролата трябва да е поне 6 символа');
    if (!requirements.lowercase) missingRequirements.push('Паролата трябва да съдържа поне една малка буква');
    if (!requirements.uppercase) missingRequirements.push('Паролата трябва да съдържа поне една главна буква');
    if (!requirements.number) missingRequirements.push('Паролата трябва да съдържа поне една цифра');

    return missingRequirements.length > 0 ? missingRequirements.join('\n') : null;
  };

  // Email validation regex
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      setError('Моля, попълнете всички полета');
      return;
    }

    if (!validateEmail(email)) {
      setError('Моля, въведете валиден имейл адрес');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('Attempting to sign up...');
      const { data, error: signUpError } = await auth.signUp(email, password);

      console.log('Sign up result:', {
        success: !!data?.user,
        error: signUpError ? signUpError.message : null
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data?.user) {
        throw new Error('No user data received');
      }

      // Create initial profile record
      console.log('Creating profile record...');
      const { error: profileError } = await database.createProfile({
        id: data.user.id,
        name: name,
        avatar_url: null,
        xp: 0,
        streak: 0,
        completed_lessons: 0,
        completed_quizzes: 0,
        social_links: { facebook: '', linkedin: '' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      // After successful sign-up and data creation, try to sign in automatically
      const { data: signInData, error: signInError } = await auth.signIn(email, password);
      
      if (signInError) {
        // If auto sign-in fails, show the confirmation message
        Alert.alert(
          'Успешна регистрация',
          'Моля, проверете имейла си за потвърждение.',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('SignIn')
            }
          ]
        );
      } else {
        // If auto sign-in succeeds, go to Home
        navigation.replace('Home');
      }
    } catch (err) {
      console.error('Sign up error:', err);
      let errorMessage = 'Грешка при регистрация';
      
      if (err instanceof Error) {
        if (err.message.includes('User already registered')) {
          errorMessage = 'Този имейл вече е регистриран';
        } else if (err.message.includes('Password should be at least 6 characters')) {
          errorMessage = 'Паролата трябва да е поне 6 символа';
        } else if (err.message.includes('Password should contain')) {
          errorMessage = 'Паролата трябва да съдържа малки и главни букви, и цифри';
        } else if (err.message.includes('Unable to validate email address')) {
          errorMessage = 'Моля, въведете валиден имейл адрес';
        }
      }
      
      setError(errorMessage);
      Alert.alert('Грешка', errorMessage);
    } finally {
      setLoading(false);
    }
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

      {/* Password Requirements */}
      <View style={styles.requirementsContainer}>
        <Text style={[
          styles.requirementText,
          passwordRequirements.length && styles.requirementMet
        ]}>
          • Паролата трябва да е поне 6 символа
        </Text>
        <Text style={[
          styles.requirementText,
          passwordRequirements.lowercase && styles.requirementMet
        ]}>
          • Паролата трябва да съдържа поне една малка буква
        </Text>
        <Text style={[
          styles.requirementText,
          passwordRequirements.uppercase && styles.requirementMet
        ]}>
          • Паролата трябва да съдържа поне една главна буква
        </Text>
        <Text style={[
          styles.requirementText,
          passwordRequirements.number && styles.requirementMet
        ]}>
          • Паролата трябва да съдържа поне една цифра
        </Text>
      </View>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      {/* Sign Up Button */}
      <TouchableOpacity
        onPress={handleSignUp}
        style={[styles.signInButton, loading && styles.disabledButton]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.signInButtonText}>Регистрация</Text>
        )}
      </TouchableOpacity>
      
      {/* Sign In Button */}
      <TouchableOpacity
        onPress={handleSignIn}
        style={[styles.signUpButton, loading && styles.disabledButton]}
        disabled={loading}
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
  disabledButton: {
    opacity: 0.7,
  } as ViewStyle,
  requirementsContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  } as ViewStyle,
  requirementText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginBottom: 4,
  } as TextStyle,
  requirementMet: {
    color: '#4CAF50',
  } as TextStyle,
}); 
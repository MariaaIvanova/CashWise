import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, TextInput, ViewStyle, TextStyle, ImageStyle, StyleProp, Text, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme, THEME } from '../ThemeContext';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth, supabase, database } from '../supabase';
import Constants from 'expo-constants';

// Define the navigation param list type
type RootStackParamList = {
  Home: undefined;
  SignUp: undefined;
  SignIn: undefined;
  Invitation: { userId: string };
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
    lowercase: false,
    uppercase: false,
    number: false,
    minLength: false
  });
  
  // Get theme with fallback
  const themeContext = useTheme();
  const theme = themeContext?.theme || THEME;

  // Update password requirements as user types
  useEffect(() => {
    setPasswordRequirements({
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      minLength: password.length >= 8
    });
  }, [password]);

  const validatePassword = (pass: string) => {
    const requirements = {
      lowercase: /[a-z]/.test(pass),
      uppercase: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass),
      minLength: pass.length >= 8
    };

    const missingRequirements = [];
    if (!requirements.lowercase) missingRequirements.push('Паролата трябва да съдържа поне една малка буква');
    if (!requirements.uppercase) missingRequirements.push('Паролата трябва да съдържа поне една главна буква');
    if (!requirements.number) missingRequirements.push('Паролата трябва да съдържа поне една цифра');
    if (!requirements.minLength) missingRequirements.push('Паролата трябва да е поне 8 символа');

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

      console.log('Starting signup process...');
      console.log('Attempting to sign up with email:', email);
      
      // First, try to sign up without any additional data
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password
      });

      console.log('Sign up result:', {
        success: !!user,
        userId: user?.id,
        error: signUpError ? {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name
        } : null
      });

      if (signUpError) {
        console.error('Signup error details:', {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name
        });
        throw signUpError;
      }

      if (!user) {
        console.error('No user data received after signup');
        throw new Error('No user data received');
      }

      // Create initial profile record
      console.log('Creating profile record for user:', user.id);
      try {
        // Create profile directly without checking or selecting
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: name,
            xp: 0,
            streak: 0,
            completed_lessons: 0,
            completed_quizzes: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          // If the error is about duplicate key, the profile already exists
          if (insertError.code === '23505') {
            console.log('Profile already exists, updating...');
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ name })
              .eq('id', user.id);

            if (updateError) {
              console.error('Error updating profile:', updateError);
              throw updateError;
            }
          } else {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
        }

        // Update user metadata after profile is created
        const { error: updateError } = await supabase.auth.updateUser({
          data: { name: name }
        });

        if (updateError) {
          console.error('Error updating user metadata:', updateError);
          // Don't throw here, as the profile is already created
        }

        console.log('Profile operation completed successfully');
        
        // Set loading to false before navigation
        setLoading(false);

        // After successful registration and profile creation, navigate to Home
        navigation.replace('Home');
        return;
      } catch (err) {
        console.error('Profile operation error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          name: err instanceof Error ? err.name : 'Unknown',
          error: err
        });
        throw err;
      }
    } catch (err) {
      console.error('Sign up error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        name: err instanceof Error ? err.name : 'Unknown',
        error: err
      });
      
      let errorMessage = 'Грешка при регистрация';
      
      if (err instanceof Error) {
        if (err.message.includes('User already registered')) {
          errorMessage = 'Този имейл вече е регистриран';
        } else if (err.message.includes('Password should contain')) {
          errorMessage = 'Паролата трябва да съдържа малки и главни букви, и цифри';
        } else if (err.message.includes('Unable to validate email address')) {
          errorMessage = 'Моля, въведете валиден имейл адрес';
        } else if (err.message.includes('Database error')) {
          errorMessage = 'Грешка в базата данни. Моля, опитайте отново по-късно.';
          console.error('Database error during signup:', err);
        } else if (err.message.includes('duplicate key')) {
          errorMessage = 'Профилът вече съществува. Моля, опитайте да влезете.';
        } else if (err.message.includes('permission denied')) {
          errorMessage = 'Нямате необходимите права. Моля, опитайте отново по-късно.';
        }
      }
      
      setError(errorMessage);
      Alert.alert('Грешка', errorMessage);
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigation.navigate('SignIn');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

      // Get the Supabase project URL from Constants
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured');
      }

      const redirectUrl = Platform.OS === 'web' 
        ? window.location.origin  // For web testing
        : `${supabaseUrl}/auth/v1/callback`;  // For native app - using Supabase callback URL

      console.log('Starting Google sign in process:', {
        platform: Platform.OS,
        redirectUrl,
        supabaseUrl,
        currentUrl: Platform.OS === 'web' ? window.location.href : 'native app'
      });

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Platform.OS !== 'web'  // Only skip for native
        }
      });

      console.log('Google sign in response:', {
        success: !!data,
        hasUrl: !!data?.url,
        error: signInError ? {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name
        } : null,
        platform: Platform.OS
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.url && Platform.OS !== 'web') {
        console.log('Attempting to open auth URL in browser:', data.url);
        const supported = await Linking.canOpenURL(data.url);
        if (supported) {
          await Linking.openURL(data.url);
          console.log('Successfully opened auth URL in browser');
        } else {
          console.error('Cannot open URL:', data.url);
          Alert.alert('Error', 'Cannot open authentication URL');
        }
      } else if (Platform.OS === 'web') {
        console.log('Web platform - browser will handle redirect automatically');
      }
    } catch (err) {
      console.error('Google sign in error:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        name: err instanceof Error ? err.name : 'Unknown',
        platform: Platform.OS
      });
      setError('Грешка при влизане с Google');
      Alert.alert('Грешка', 'Грешка при влизане с Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = () => {
    // Bypass Apple authentication and directly navigate to Home
    navigation.replace('Home');
  };

  const areAllRequirementsMet = () => {
    return passwordRequirements.lowercase && 
           passwordRequirements.uppercase && 
           passwordRequirements.number &&
           passwordRequirements.minLength;
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

      {/* Password Requirements with Icons - Only shown when not all requirements are met */}
      {!areAllRequirementsMet() && password.length > 0 && (
        <View style={styles.requirementsContainer}>
          <View style={styles.requirementRow}>
            <FontAwesome 
              name={passwordRequirements.minLength ? "check-circle" : "circle-o"} 
              size={16} 
              color={passwordRequirements.minLength ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={[
              styles.requirementText,
              passwordRequirements.minLength && styles.requirementMet
            ]}>
              Минимум 8 символа
            </Text>
          </View>

          <View style={styles.requirementRow}>
            <FontAwesome 
              name={passwordRequirements.lowercase ? "check-circle" : "circle-o"} 
              size={16} 
              color={passwordRequirements.lowercase ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={[
              styles.requirementText,
              passwordRequirements.lowercase && styles.requirementMet
            ]}>
              Малка буква
            </Text>
          </View>
          
          <View style={styles.requirementRow}>
            <FontAwesome 
              name={passwordRequirements.uppercase ? "check-circle" : "circle-o"} 
              size={16} 
              color={passwordRequirements.uppercase ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={[
              styles.requirementText,
              passwordRequirements.uppercase && styles.requirementMet
            ]}>
              Главна буква
            </Text>
          </View>
          
          <View style={styles.requirementRow}>
            <FontAwesome 
              name={passwordRequirements.number ? "check-circle" : "circle-o"} 
              size={16} 
              color={passwordRequirements.number ? "#4CAF50" : "#FF6B6B"} 
            />
            <Text style={[
              styles.requirementText,
              passwordRequirements.number && styles.requirementMet
            ]}>
              Цифра
            </Text>
          </View>
        </View>
      )}
      
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
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  requirementText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 8,
  } as TextStyle,
  requirementMet: {
    color: '#4CAF50',
  } as TextStyle,
}); 
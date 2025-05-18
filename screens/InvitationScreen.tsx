import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../AppNavigator';
import { database } from '../supabase';
import { THEME } from '../ThemeContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface InvitationScreenProps {
  navigation: NavigationProp;
  route: {
    params: {
      userId: string;
    };
  };
}

export default function InvitationScreen({ navigation, route }: InvitationScreenProps) {
  const { colors } = useTheme();
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSkip = () => {
    navigation.replace('Home');
  };

  const handleSubmit = async () => {
    if (!invitationCode.trim()) {
      Alert.alert('Error', 'Please enter a referral code');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await database.acceptInvitation(
        invitationCode.trim(),
        route.params.userId
      );

      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (errorMessage.includes('Invalid')) {
          Alert.alert('Error', 'Invalid referral code');
        } else {
          Alert.alert('Error', 'Failed to accept referral code. Please try again.');
        }
        return;
      }

      Alert.alert(
        'Success!',
        'Welcome! You and your friend have been awarded XP.',
        [{ text: 'OK', onPress: () => navigation.replace('Home') }]
      );
    } catch (error) {
      console.error('Error accepting referral:', error);
      Alert.alert('Error', 'Failed to accept referral code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Have a Referral Code?</Text>
          <Text style={styles.subtitle}>
            Enter your friend's referral code to get started and earn bonus XP together!
          </Text>

          <TextInput
            mode="outlined"
            label="Referral Code"
            value={invitationCode}
            onChangeText={setInvitationCode}
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            loading={loading}
            disabled={loading || !invitationCode.trim()}
          >
            Accept Referral
          </Button>

          <Button
            mode="text"
            onPress={handleSkip}
            style={styles.skipButton}
            disabled={loading}
          >
            Skip for now
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: THEME.colors.primary,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 24,
  },
  button: {
    marginBottom: 16,
  },
  skipButton: {
    opacity: 0.7,
  },
}); 
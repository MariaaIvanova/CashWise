import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { useTheme } from '../ThemeContext';

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Get theme from context with defensive fallback
  const themeContext = useTheme();
  const theme = themeContext?.theme || {
    colors: {
      primary: '#6200ee',
      background: '#f5f5f5',
      text: '#000000',
    }
  };

  const handleSignIn = () => {
    // Bypass authentication and directly navigate to Home
    navigation.replace('Home');
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp');
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
    <View style={[styles.container, { backgroundColor: theme.colors?.background || '#f5f5f5' }]}>
      <Text style={[styles.title, { color: theme.colors?.primary || '#6200ee' }]}>Финансова Грамотност</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        theme={theme}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        theme={theme}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button mode="contained" onPress={handleSignIn} style={styles.button} theme={theme}>
        Вход
      </Button>
      <Button mode="outlined" onPress={handleSignUp} style={styles.button} theme={theme}>
        Регистрация
      </Button>
      
      <Divider style={styles.divider} />
      <Text style={[styles.orText, { color: theme.colors?.text || '#000000' }]}>или влезте с</Text>
      
      <View style={styles.socialButtonsContainer}>
        <Button 
          mode="outlined" 
          onPress={handleGoogleSignIn} 
          style={[styles.socialButton, styles.googleButton]}
          icon="google"
          theme={theme}
        >
          Google
        </Button>
        <Button 
          mode="outlined" 
          onPress={handleAppleSignIn} 
          style={[styles.socialButton, styles.appleButton]}
          icon="apple"
          theme={theme}
        >
          Apple
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 8,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  googleButton: {
    borderColor: '#4285F4',
  },
  appleButton: {
    borderColor: '#000',
  },
});

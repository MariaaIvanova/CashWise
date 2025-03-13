import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useTheme } from '../ThemeContext';

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    navigation.replace('Home');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors?.background || '#f5f5f5' }]}>
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
      <TextInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
        theme={theme}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button mode="contained" onPress={handleSignUp} style={styles.button} theme={theme}>
        Sign Up
      </Button>
      <Button 
        mode="text" 
        onPress={() => navigation.navigate('SignIn')} 
        style={styles.button}
        theme={theme}
      >
        Already have an account? Sign In
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
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
});

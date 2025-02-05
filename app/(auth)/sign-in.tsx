import { View, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput } from '@/components/themed';
import { useState } from 'react';
import { Link } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/configs/firebase';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Ionicons name="paw" size={48} color={Colors[theme].primary} />
        <Text style={styles.title}>Welcome to Adoptr</Text>
        <Text style={styles.subtitle}>Find your perfect companion</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={Colors[theme].primary} 
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>
        </View>
        
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            <Ionicons 
              name="lock-closed-outline" 
              size={20} 
              color={Colors[theme].primary} 
              style={styles.inputIcon}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.buttonContainer}>
          <Button 
            onPress={handleSignIn} 
            style={styles.button}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </Button>
        </View>

        <View style={styles.linkContainer}>
          <Link href="/sign-up" asChild>
            <Pressable 
              style={({ pressed }) => [
                styles.link,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Text style={[styles.linkText, { color: Colors[theme].primary }]}>
                Don't have an account? Sign up
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    flex: 2,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputWrapper: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  error: {
    color: '#FF3B30',
    marginLeft: 8,
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 8,
    height: 48,
  },
  button: {
    height: '100%',
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 
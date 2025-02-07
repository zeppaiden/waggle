import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { Text } from '@/components/themed';
import { Button } from 'react-native-paper';
import { useState } from 'react';
import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/configs/firebase';
import { Colors } from '@/constants/colors-theme';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later');
          break;
        default:
          setError('Failed to sign in. Please try again');
          console.error('Sign in error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Ionicons name="paw" size={48} color={Colors.light.primary} />
        <Text style={styles.title}>Welcome to Waggle</Text>
        <Text style={styles.subtitle}>Find your perfect companion</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={[styles.inputContainer, error ? styles.inputError : undefined]}>
          <Ionicons 
            name="mail-outline" 
            size={20} 
            color={error ? '#ff3b30' : Colors.light.primary} 
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={error ? '#ff3b30' : '#999'}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={[styles.inputContainer, error ? styles.inputError : undefined]}>
          <Ionicons 
            name="lock-closed-outline" 
            size={20} 
            color={error ? '#ff3b30' : Colors.light.primary} 
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={error ? '#ff3b30' : '#999'}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#ff3b30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSignIn}
          loading={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonText}
          disabled={loading || !email.trim() || !password.trim()}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/sign-up" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <View style={styles.pawPrints}>
        <Ionicons name="paw" size={24} color={Colors.light.primary + '40'} style={styles.paw1} />
        <Ionicons name="paw" size={20} color={Colors.light.primary + '30'} style={styles.paw2} />
        <Ionicons name="paw" size={28} color={Colors.light.primary + '20'} style={styles.paw3} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    textAlign: 'center',
    color: Colors.light.text,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    height: '100%',
  },
  button: {
    marginTop: 24,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    height: 56,
  },
  buttonContent: {
    height: 56,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.card,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    color: Colors.light.text,
    fontSize: 16,
  },
  footerLink: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  pawPrints: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    opacity: 0.7,
  },
  paw1: {
    transform: [{ rotate: '-15deg' }],
  },
  paw2: {
    transform: [{ rotate: '10deg' }],
    marginLeft: 20,
  },
  paw3: {
    transform: [{ rotate: '-5deg' }],
    marginLeft: -10,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  inputTextError: {
    color: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
}); 
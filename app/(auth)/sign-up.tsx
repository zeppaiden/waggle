import { useState } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/configs/firebase';
import { Colors } from '@/constants/colors-theme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      // Navigation will be handled by AuthLayout based on onboarding status
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.title}>Join Waggle!</Text>
        <Text style={styles.subtitle}>Where pets become social media stars</Text>
      </View>
      
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <IconSymbol 
            name="envelope.fill" 
            size={20} 
            color={Colors.light.secondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.light.secondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <IconSymbol 
            name="lock.fill" 
            size={20} 
            color={Colors.light.secondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.light.secondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      
        <Button
          mode="contained"
          onPress={handleSignUp}
          loading={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonText}
        >
          {loading ? 'Creating Pawfile...' : 'Create Account'}
        </Button>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Link href="/(auth)/sign-in" style={styles.footerLink}>Sign In</Link>
      </View>

      <View style={styles.pawPrints}>
        <IconSymbol name="pawprint.fill" size={24} color={Colors.light.secondary + '40'} style={styles.paw1} />
        <IconSymbol name="pawprint.fill" size={20} color={Colors.light.secondary + '30'} style={styles.paw2} />
        <IconSymbol name="pawprint.fill" size={28} color={Colors.light.secondary + '20'} style={styles.paw3} />
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
}); 
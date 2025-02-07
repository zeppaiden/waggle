import { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Link, router } from 'expo-router';
import { Colors } from '@/constants/colors-theme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useAuth } from '@/contexts/auth';

interface ValidationErrors {
  email?: string;
  password?: string;
}

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const { setTempRegistration } = useAuth();

  const validateEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    if (email.length > 255) {
      return 'Email is too long';
    }
    return '';
  }, []);

  const validatePassword = useCallback((password: string) => {
    if (!password.trim()) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return '';
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    const error = validateEmail(text);
    setErrors(prev => ({
      ...prev,
      email: error,
    }));
  }, [validateEmail]);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    const error = validatePassword(text);
    setErrors(prev => ({
      ...prev,
      password: error,
    }));
  }, [validatePassword]);

  const handleSignUp = async () => {
    try {
      setLoading(true);
      
      // Validate both fields
      const emailError = validateEmail(email);
      const passwordError = validatePassword(password);
      
      const newErrors = {
        email: emailError,
        password: passwordError,
      };
      
      setErrors(newErrors);

      // If there are any errors, don't proceed
      if (emailError || passwordError) {
        return;
      }

      // Store temporary registration data
      setTempRegistration({
        email: email.trim(),
        password: password.trim(),
      });

      // Navigate to onboarding
      router.push('/onboarding');
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
        <Text style={styles.subtitle}>Where animals meet their forever homes</Text>
      </View>
      
      <View style={styles.formContainer}>
        <View style={[styles.inputContainer, errors.email ? styles.inputError : undefined]}>
          <IconSymbol 
            name="envelope.fill" 
            size={20} 
            color={errors.email ? '#ff3b30' : Colors.light.secondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, errors.email && styles.inputTextError]}
            placeholder="Email"
            placeholderTextColor={errors.email ? '#ff3b30' : Colors.light.secondary}
            value={email}
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
        </View>
        {errors.email ? (
          <Text style={styles.errorText}>{errors.email}</Text>
        ) : null}
        
        <View style={[styles.inputContainer, errors.password ? styles.inputError : undefined]}>
          <IconSymbol 
            name="lock.fill" 
            size={20} 
            color={errors.password ? '#ff3b30' : Colors.light.secondary}
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, errors.password && styles.inputTextError]}
            placeholder="Password"
            placeholderTextColor={errors.password ? '#ff3b30' : Colors.light.secondary}
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoComplete="new-password"
          />
        </View>
        {errors.password ? (
          <Text style={styles.errorText}>{errors.password}</Text>
        ) : null}
      
        <Button
          mode="contained"
          onPress={handleSignUp}
          loading={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonText}
          disabled={loading || !!errors.email || !!errors.password}
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
}); 
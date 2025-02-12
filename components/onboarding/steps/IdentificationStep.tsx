import React, { useState } from 'react';
import { View, StyleSheet, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '@/components/themed';
import { UserProfile } from '@/types/user';
import { Colors } from '@/constants/colors-theme';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/configs/firebase';
import debounce from 'lodash/debounce';

interface IdentificationStepProps {
  data: Partial<UserProfile>;
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
}

export default function IdentificationStep({ data, onNext, onBack }: IdentificationStepProps) {
  const [formData, setFormData] = useState({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    username: data.username || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const validateUsername = async (username: string) => {
    // Basic format validation
    if (!username.trim()) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return false;
    }

    console.log('🔍 Validating username:', username);

    // Length check (3-20 characters)
    if (username.length < 3 || username.length > 20) {
      console.log('⚠️ Username length invalid');
      setErrors(prev => ({ ...prev, username: 'Username must be between 3 and 20 characters' }));
      return false;
    }

    // Only allow letters, numbers, underscores, and dots
    const validUsernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!validUsernameRegex.test(username)) {
      console.log('⚠️ Username contains invalid characters');
      setErrors(prev => ({ 
        ...prev, 
        username: 'Username can only contain letters, numbers, dots, and underscores' 
      }));
      return false;
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      console.log('⚠️ Username must start with a letter');
      setErrors(prev => ({ 
        ...prev, 
        username: 'Username must start with a letter' 
      }));
      return false;
    }

    // No consecutive dots or underscores
    if (/[._]{2,}/.test(username)) {
      console.log('⚠️ Username has consecutive dots or underscores');
      setErrors(prev => ({ 
        ...prev, 
        username: 'Username cannot contain consecutive dots or underscores' 
      }));
      return false;
    }

    // Cannot end with a dot or underscore
    if (/[._]$/.test(username)) {
      console.log('⚠️ Username ends with dot or underscore');
      setErrors(prev => ({ 
        ...prev, 
        username: 'Username cannot end with a dot or underscore' 
      }));
      return false;
    }

    setIsCheckingUsername(true);
    try {
      console.log('🔍 Checking username availability in Firestore');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      console.log('📝 Found matches:', querySnapshot.size);
      if (!querySnapshot.empty) {
        console.log('⚠️ Username is taken');
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        return false;
      }
      
      console.log('✅ Username is available');
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.username;
        return newErrors;
      });
      return true;
    } catch (error) {
      console.error('❌ Error checking username:', error);
      setErrors(prev => ({ ...prev, username: 'Error checking username availability' }));
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    // Remove spaces and special characters in real-time
    const sanitizedUsername = text.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
    setFormData(prev => ({ ...prev, username: sanitizedUsername }));
    debouncedUsernameCheck(sanitizedUsername);
  };

  const debouncedUsernameCheck = debounce(validateUsername, 500);

  const validate = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    const isUsernameValid = await validateUsername(formData.username);
    if (!isUsernameValid) {
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (await validate()) {
      onNext({
        ...data,
        ...formData,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={onBack}
          >
            <ArrowLeft size={24} color="#666" strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>We need some basic information to get started</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                placeholder="Enter your first name"
                autoCapitalize="words"
                returnKeyType="next"
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                placeholder="Enter your last name"
                autoCapitalize="words"
                returnKeyType="next"
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View style={styles.usernameInputContainer}>
                <TextInput
                  style={[styles.usernameInput, errors.username && styles.inputError]}
                  value={formData.username}
                  onChangeText={handleUsernameChange}
                  placeholder="Choose a username"
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                {isCheckingUsername && (
                  <ActivityIndicator size="small" color={Colors.light.primary} style={styles.usernameLoader} />
                )}
              </View>
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>
          </View>

          <Pressable
            onPress={handleNext}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    flex: 1,
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  usernameInput: {
    flex: 1,
    fontSize: 16,
  },
  usernameLoader: {
    marginLeft: 8,
  },
}); 
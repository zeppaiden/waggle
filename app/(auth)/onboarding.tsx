import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/configs/firebase';

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();

  console.log('[Onboarding] Screen mounted:', {
    hasUser: !!user,
    userEmail: user?.email,
    userId: user?.uid
  });

  const handleComplete = async (profile: UserProfile) => {
    console.log('[Onboarding] Handling completion with profile:', profile);

    if (!user) {
      console.error('[Onboarding] No user found when trying to complete onboarding');
      return;
    }

    try {
      console.log('[Onboarding] Saving profile to Firestore');
      const userData = {
        ...profile,
        email: user.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      console.log('[Onboarding] Successfully saved user data:', userData);
      
      // Navigate to the main app
      console.log('[Onboarding] Redirecting to main app');
      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error('[Onboarding] Error saving profile:', error);
      // TODO: Show error message to user
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <OnboardingFlow 
        onComplete={handleComplete}
        initialData={{ email: user?.email || '' }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 
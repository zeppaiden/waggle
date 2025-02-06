import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PulsingPaw } from '@/components/ui/PulsingPaw';

export default function AuthLayout() {
  const { user, isLoading, isOnboarded } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    // Immediately redirect if user is authenticated and onboarded
    if (user && isOnboarded) {
      router.replace('/(app)/(tabs)');
      return;
    }

    // Only redirect to onboarding if user exists and isn't onboarded
    if (user && !isOnboarded && segments[1] !== 'onboarding') {
      router.replace('/(auth)/onboarding');
    }
  }, [user, isLoading, isOnboarded, segments]);

  // Show loading screen while checking auth state
  if (isLoading || (user && isOnboarded)) {
    return (
      <View style={styles.loadingContainer}>
        <PulsingPaw size={60} backgroundColor="transparent" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
}); 
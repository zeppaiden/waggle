import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PulsingPaw } from '@/components/ui/PulsingPaw';

type AuthSegment = 'sign-in' | 'sign-up' | 'onboarding' | 'tutorial';

export default function AuthLayout() {
  const { user, isLoading, isOnboarded, hasCompletedTutorial, tempRegistration } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentSegment = segments[1] as AuthSegment;
    const inOnboarding = currentSegment === 'onboarding';
    const inTutorial = currentSegment === 'tutorial';
    const inSignIn = currentSegment === 'sign-in';

    // No user - handle unauthenticated state
    if (!user) {
      if (!inAuthGroup || (inOnboarding && !tempRegistration)) {
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    // User exists - handle authenticated state
    if (isOnboarded && hasCompletedTutorial) {
      if (inAuthGroup) {
        router.replace('/(app)/(tabs)');
      }
      return;
    }

    // Handle tutorial state
    if (isOnboarded && !hasCompletedTutorial) {
      if (!inTutorial) {
        router.replace('/(auth)/tutorial');
      }
      return;
    }

    // Handle onboarding state
    if (!isOnboarded) {
      // Just signed in - go directly to onboarding
      if (inSignIn) {
        router.replace('/(auth)/onboarding');
        return;
      }

      // Handle other onboarding cases
      if (!inOnboarding || (inOnboarding && !tempRegistration)) {
        if (!tempRegistration) {
          router.replace('/(auth)/sign-up');
        } else {
          router.replace('/(auth)/onboarding');
        }
      }
    }
  }, [user, isLoading, isOnboarded, hasCompletedTutorial, segments, tempRegistration]);

  // Only show loading screen when checking initial auth state
  if (isLoading) {
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
        animation: 'slide_from_right',
        animationDuration: 200,
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          title: 'Sign Up',
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          title: 'Onboarding',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="tutorial"
        options={{
          title: 'Tutorial',
          gestureEnabled: false,
        }}
      />
    </Stack>
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
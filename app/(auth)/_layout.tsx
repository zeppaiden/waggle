import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PulsingPaw } from '@/components/ui/PulsingPaw';

type AuthSegment = 'sign-in' | 'sign-up' | 'onboarding' | 'tutorial';

export default function AuthLayout() {
  console.log('[AuthLayout] Rendering layout');
  const { user, isLoading, isOnboarded, hasCompletedTutorial, tempRegistration } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthLayout] Auth state changed:', {
      isLoading,
      hasUser: !!user,
      isOnboarded,
      hasCompletedTutorial,
      hasTempRegistration: !!tempRegistration,
      currentSegments: segments,
    });

    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentSegment = segments[1] as AuthSegment;
    const inOnboarding = currentSegment === 'onboarding';
    const inTutorial = currentSegment === 'tutorial';

    console.log('[AuthLayout] Current navigation state:', {
      inAuthGroup,
      currentSegment,
      inOnboarding,
      inTutorial,
    });

    if (!user) {
      if (!inAuthGroup || (inOnboarding && !tempRegistration)) {
        console.log('[AuthLayout] Redirecting to sign in (no user)');
        router.replace('/(auth)/sign-in');
      }
    } else {
      if (!isOnboarded) {
        if (!inOnboarding) {
          console.log('[AuthLayout] Redirecting to onboarding');
          router.replace('/(auth)/onboarding');
        }
      } else if (!hasCompletedTutorial) {
        if (!inTutorial) {
          console.log('[AuthLayout] Redirecting to tutorial');
          router.replace('/(auth)/tutorial');
        }
      } else {
        if (inAuthGroup) {
          console.log('[AuthLayout] Redirecting to main app');
          router.replace('/(app)/(tabs)');
        }
      }
    }
  }, [user, isLoading, isOnboarded, hasCompletedTutorial, segments, tempRegistration]);

  // Only show loading screen when checking initial auth state
  if (isLoading) {
    console.log('[AuthLayout] Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <PulsingPaw size={60} backgroundColor="transparent" />
      </View>
    );
  }

  console.log('[AuthLayout] Rendering stack navigator');
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
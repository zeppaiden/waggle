import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View } from 'react-native';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // If user is not authenticated, redirect to sign in
      router.replace('/(auth)/sign-in');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return <View style={{ flex: 1 }} />; // Loading state
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="chat/[chatId]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="pet/[petId]"
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />
    </Stack>
  );
} 
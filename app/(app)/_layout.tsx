import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { View, ActivityIndicator } from 'react-native';

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  // Show loading screen while checking auth state.
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If not authenticated, redirect to sign-in.
  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // This layout is protected and will only render when authenticated.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="+not-found" options={{ title: 'Oops!', headerShown: true }} />
    </Stack>
  );
} 
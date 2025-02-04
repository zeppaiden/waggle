import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { useEffect } from 'react';
import { TamaguiProvider, Theme } from 'tamagui';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/auth';
import config from '../tamagui.config';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  return (
    <Theme name={colorScheme === 'dark' ? 'dark' : 'light'}>
      <Stack screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        ) : (
          <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
        )}
      </Stack>
    </Theme>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <TamaguiProvider config={config}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </TamaguiProvider>
  );
}

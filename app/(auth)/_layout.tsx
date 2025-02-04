import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors-theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: Colors.light.background,
        },
        animation: 'slide_from_right',
      }}
    />
  );
} 
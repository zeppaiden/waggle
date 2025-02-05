import { View, StyleSheet, Pressable, Text as RNText } from 'react-native';
import { Text } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { signOut } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <Pressable 
          onPress={signOut} 
          style={({ pressed }) => [
            styles.signOutButton,
            { opacity: pressed ? 0.8 : 1 },
            { backgroundColor: Colors[theme].primary }
          ]}
        >
          <View style={styles.buttonContent}>
            <Ionicons 
              name="log-out-outline" 
              size={20} 
              color="#fff"
              style={styles.buttonIcon} 
            />
            <RNText style={styles.buttonText}>Sign Out</RNText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  signOutButton: {
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 'auto',
    marginBottom: 32,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 
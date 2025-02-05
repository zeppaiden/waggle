import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Discover pets near you</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

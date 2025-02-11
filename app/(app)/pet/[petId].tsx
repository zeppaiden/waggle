import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, Button } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMemo } from 'react';
import { PetProfile } from '@/components/pet-profile/PetProfile';
import { useMatchedPets } from '@/hooks/useMatchedPets';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  withDelay
} from 'react-native-reanimated';

export default function PetProfileScreen() {
  const { petId } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { pets, loading, error } = useMatchedPets();

  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  // Loading animation values
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  // Create animated styles for the dots
  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }]
  }));
  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }]
  }));
  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }]
  }));

  // Start the loading animation
  useMemo(() => {
    const animateDot = (value: Animated.SharedValue<number>, delay: number) => {
      value.value = withRepeat(
        withSequence(
          withDelay(
            delay,
            withTiming(1.5, { duration: 500 })
          ),
          withTiming(1, { duration: 500 })
        ),
        -1
      );
    };

    if (loading) {
      animateDot(scale1, 0);
      animateDot(scale2, 200);
      animateDot(scale3, 400);
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={[containerStyle, styles.loadingContainer]}>
        <View style={styles.loadingContent}>
          <Ionicons 
            name="paw" 
            size={48} 
            color={Colors[theme].primary} 
            style={styles.loadingIcon}
          />
          <Text style={styles.loadingText}>Finding your perfect match...</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, dot1Style]} />
            <Animated.View style={[styles.dot, dot2Style]} />
            <Animated.View style={[styles.dot, dot3Style]} />
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[containerStyle, styles.errorContainer]}>
        <Ionicons 
          name="alert-circle-outline" 
          size={48} 
          color={Colors[theme].text} 
        />
        <Text style={styles.errorText}>Failed to load pet profile</Text>
        <Button 
          onPress={() => router.back()}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Button>
      </View>
    );
  }

  const pet = pets.find(p => p.id === petId);

  if (!pet) {
    return (
      <View style={[containerStyle, styles.errorContainer]}>
        <Ionicons 
          name="search-outline" 
          size={48} 
          color={Colors[theme].text} 
        />
        <Text style={styles.errorText}>Pet not found</Text>
        <Button 
          onPress={() => router.back()}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </Button>
      </View>
    );
  }

  return (
    <PetProfile 
      pet={pet}
      onClose={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingIcon: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    color: Colors.light.primary,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
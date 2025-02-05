import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { Video, ResizeMode } from 'expo-av';
import { Text } from '@/components/themed';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRouter } from 'expo-router';
import { MOCK_PETS, type Pet } from '@/constants/mock-data';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.5;
const SWIPE_UP_THRESHOLD = SCREEN_HEIGHT * 0.2;

interface PetCardProps {
  pet: Pet;
  style: any;
  isNext?: boolean;
}

function PetCard({ pet, style, isNext = false }: PetCardProps) {
  const viewStyle = useMemo(() => [
    styles.card,
    style
  ], [style]);

  return (
    <Animated.View style={viewStyle}>
      <Video
        source={{ uri: pet.videoUrl }}
        style={styles.video}
        shouldPlay={!isNext}
        isLooping
        resizeMode={ResizeMode.COVER}
      />
      <View style={styles.overlay}>
        <Text style={styles.name}>{pet.name}, {pet.age}</Text>
        <Text style={styles.location}>{pet.location}</Text>
        <Text style={styles.matchScore}>Match Score: {pet.matchScore}</Text>
      </View>
    </Animated.View>
  );
}

function prefetchImages(photos: string[]) {
  photos.forEach(photo => {
    Image.prefetch(photo).catch((error) => {
      console.error('Failed to prefetch image:', error);
    });
  });
}

export default function DiscoverScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const router = useRouter();

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const handleSwipeLeft = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % MOCK_PETS.length);
    // Reset values with smooth spring animation
    x.value = withSpring(0, { damping: 20, stiffness: 200 });
    y.value = withSpring(0, { damping: 20, stiffness: 200 });
    rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, []);

  const handleSwipeRight = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % MOCK_PETS.length);
    // Reset values with smooth spring animation
    x.value = withSpring(0, { damping: 20, stiffness: 200 });
    y.value = withSpring(0, { damping: 20, stiffness: 200 });
    rotation.value = withSpring(0, { damping: 20, stiffness: 200 });
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, []);

  const handleSwipeUp = useCallback((petId: string) => {
    // Navigate immediately
    router.push(`/pet/${petId}`);
    
    // Reset card position after navigation starts
    x.value = withSpring(0, { damping: 15 });
    y.value = withSpring(0, { damping: 15 });
    rotation.value = withSpring(0);
  }, []);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      scale.value = withTiming(1, { duration: 200 });
    })
    .onUpdate((event) => {
      x.value = event.translationX;
      y.value = event.translationY;
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-10, 0, 10]
      );
    })
    .onEnd((event) => {
      if (Math.abs(event.translationY) > SWIPE_UP_THRESHOLD && event.velocityY < -500) {
        // Swipe up - navigate to pet profile
        runOnJS(handleSwipeUp)(MOCK_PETS[currentIndex].id);
      } else if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Horizontal swipe - next card
        x.value = withSpring(Math.sign(event.translationX) * SCREEN_WIDTH * 1.5);
        y.value = withSpring(0);
        scale.value = withTiming(1, { duration: 300 });
        runOnJS(event.translationX > 0 ? handleSwipeRight : handleSwipeLeft)();
    } else {
        // Reset position
        x.value = withSpring(0);
        y.value = withSpring(0);
        rotation.value = withSpring(0);
        scale.value = withTiming(0.9, { duration: 300 });
      }
    });

  const frontCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotation.value}deg` },
    ],
    zIndex: 1,
  }));

  const backCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(
          Math.abs(x.value),
          [0, SCREEN_WIDTH / 2],  // Adjust interpolation range
          [0.9, 1],
          'clamp'
        ) },
      { translateY: interpolate(
          Math.abs(x.value),
          [0, SCREEN_WIDTH / 2],
          [20, 0],  // Slight vertical movement
          'clamp'
        ) },
    ],
  }));

  const currentPet = MOCK_PETS[currentIndex];
  const nextPet = MOCK_PETS[(currentIndex + 1) % MOCK_PETS.length];

  useEffect(() => {
    if (currentIndex < MOCK_PETS.length - 1) {
      // Prefetch next pet's images
      if (nextPet) {
        prefetchImages(nextPet.photos);
      }
    }
  }, [currentIndex]);

  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  return (
    <GestureHandlerRootView style={containerStyle}>
      <View style={styles.cardsContainer}>
        <PetCard 
          pet={nextPet} 
          style={backCardStyle} 
          isNext
        />
        <GestureDetector gesture={gesture}>
          <PetCard 
            pet={currentPet} 
            style={frontCardStyle}
          />
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.3,
    alignItems: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  location: {
    fontSize: 18,
    color: '#fff',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  matchScore: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});

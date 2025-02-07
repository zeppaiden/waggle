import { View, StyleSheet, Dimensions, Image, SafeAreaView, Pressable, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
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
import { usePets } from '@/hooks/usePets';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/hooks/useFavorites';
import { useIsFocused } from '@react-navigation/native';
import { PulsingPaw } from '@/components/ui/PulsingPaw';
import { useAuth } from '@/contexts/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.5;
const SWIPE_UP_THRESHOLD = SCREEN_HEIGHT * 0.2;

interface PetCardProps {
  pet: any;
  style: any;
  isNext?: boolean;
}

type VideoCardProps = {
  videoUrl: string;
  shouldPlay?: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
};

function VideoCard({ videoUrl, shouldPlay = true, isMuted, onToggleMute }: VideoCardProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<Video | null>(null);
  const isFocused = useIsFocused();

  // Reset states when URL changes
  useEffect(() => {
    setIsVideoLoaded(false);
    setHasError(false);
    setIsPaused(false);
    
    // Only load video, don't play it yet
    if (videoRef.current) {
      videoRef.current.loadAsync(
        { 
          uri: videoUrl,
          overrideFileExtensionAndroid: 'm3u8'
        },
        { 
          shouldPlay: false,
          isLooping: true,
          isMuted: isMuted
        },
        false
      );
    }
  }, [videoUrl]);

  // Handle playback state changes
  useEffect(() => {
    if (videoRef.current && isVideoLoaded) {
      if (isFocused && shouldPlay && !isPaused) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isFocused, isVideoLoaded, shouldPlay, isPaused]);

  // Handle mute state changes
  useEffect(() => {
    if (videoRef.current && isVideoLoaded) {
      videoRef.current.setIsMutedAsync(isMuted);
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if ('error' in status) {
      console.error('[VideoCard] Playback error:', status.error);
      setHasError(true);
      setIsVideoLoaded(false);
      return;
    }

    if (status.isLoaded) {
      if (!isVideoLoaded) {
        console.log('[VideoCard] Video loaded successfully');
        setIsVideoLoaded(true);
        setHasError(false);
      }
    }
  }, [isVideoLoaded]);

  const handleError = useCallback((error: string | undefined) => {
    console.error('[VideoCard] Error loading video:', error);
    setHasError(true);
    setIsVideoLoaded(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);
  
  return (
    <View style={[StyleSheet.absoluteFill, styles.videoContainer]}>
      <Pressable 
        onPress={togglePlayPause}
        style={StyleSheet.absoluteFill}
      >
        <Video
          ref={videoRef}
          source={{ 
            uri: videoUrl,
            overrideFileExtensionAndroid: 'm3u8'
          }}
          style={[
            StyleSheet.absoluteFill,
            { opacity: isVideoLoaded ? 1 : 0 }
          ]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isFocused && !isPaused}
          isLooping={true}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={handleError}
          isMuted={isMuted}
          useNativeControls={false}
          progressUpdateIntervalMillis={500}
        />
        {isVideoLoaded && isPaused && (
          <View style={styles.pauseOverlay}>
            <Ionicons name="play" size={50} color="white" />
          </View>
        )}
      </Pressable>
      {(!isVideoLoaded && !hasError) && (
        <PulsingPaw />
      )}
      {hasError && (
        <View style={styles.errorOverlay}>
          <Ionicons name="alert-circle-outline" size={32} color="#fff" />
          <Text style={styles.errorText}>Failed to load video</Text>
        </View>
      )}
    </View>
  );
}

function PetCard({ pet, style, isNext = false }: PetCardProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const viewStyle = useMemo(() => [
    styles.card,
    style
  ], [style]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return (
    <Animated.View style={viewStyle}>
      <VideoCard 
        videoUrl={pet.videoUrl} 
        shouldPlay={!isNext}
        isMuted={isMuted}
        onToggleMute={toggleMute}
      />
      <View style={styles.controlButtons}>
        <Pressable 
          style={styles.infoButton}
          onPress={() => router.push(`/pet/${pet.id}`)}
        >
          <Ionicons name="information-circle" size={32} color="#123524" />
        </Pressable>
        <Pressable 
          style={styles.muteButton}
          onPress={toggleMute}
        >
          <Ionicons 
            name={isMuted ? "volume-mute" : "volume-medium"} 
            size={24} 
            color="#123524" 
          />
        </Pressable>
      </View>
      <View style={styles.overlay}>
        <Text style={styles.name}>{pet.name}, {pet.age}</Text>
        <Text style={styles.location}>{pet.location}</Text>
        <Text style={styles.matchScore}>Match Score: {pet.matchScore}</Text>
      </View>
    </Animated.View>
  );
}

export default function DiscoverScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const router = useRouter();
  const { pets, loading, error } = usePets();
  const { user } = useAuth();
  const { addFavorite, isFavorite } = useFavorites(user?.uid || '');

  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const handleSwipeLeft = useCallback(() => {
    // Reduce stiffness from 200 to 100 for smoother animation
    x.value = withSpring(-SCREEN_WIDTH * 1.5, { damping: 20, stiffness: 100 });
    y.value = withSpring(0, { damping: 20, stiffness: 100 });
    rotation.value = withSpring(-10, { damping: 20, stiffness: 100 });
    
    // After animation, reset and update index
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % pets.length);
      x.value = 0;
      y.value = 0;
      rotation.value = 0;
      scale.value = 0.9;
    }, 200);
  }, [pets.length]);

  const handleSwipeRight = useCallback(() => {
    // Add current pet to favorites
    const currentPet = pets[currentIndex];
    if (currentPet && !isFavorite(currentPet.id)) {
      addFavorite(currentPet.id);
    }

    // Reduce stiffness from 200 to 100 for smoother animation
    x.value = withSpring(SCREEN_WIDTH * 1.5, { damping: 20, stiffness: 100 });
    y.value = withSpring(0, { damping: 20, stiffness: 100 });
    rotation.value = withSpring(10, { damping: 20, stiffness: 100 });
    
    // After animation, reset and update index
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % pets.length);
      x.value = 0;
      y.value = 0;
      rotation.value = 0;
      scale.value = 0.9;
    }, 200);
  }, [pets.length, currentIndex, addFavorite, isFavorite]);

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
        runOnJS(handleSwipeUp)(pets[currentIndex].id);
      } else if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Horizontal swipe - next card
        x.value = withSpring(Math.sign(event.translationX) * SCREEN_WIDTH * 1.5, { 
          damping: 20, 
          stiffness: 100  // Reduce stiffness here too
        });
        y.value = withSpring(0, { damping: 20, stiffness: 100 });
        scale.value = withTiming(1, { duration: 300 });
        runOnJS(event.translationX > 0 ? handleSwipeRight : handleSwipeLeft)();
    } else {
        // Reset position with reduced stiffness
        x.value = withSpring(0, { damping: 20, stiffness: 100 });
        y.value = withSpring(0, { damping: 20, stiffness: 100 });
        rotation.value = withSpring(0, { damping: 20, stiffness: 100 });
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

  const currentPet = pets[currentIndex];
  const nextPet = pets[(currentIndex + 1) % pets.length];

  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  if (loading) {
    return (
      <View style={[containerStyle, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors[theme].text} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[containerStyle, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load pets</Text>
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={[containerStyle, styles.centerContent]}>
        <Text style={styles.errorText}>No pets available</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={containerStyle}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Find your perfect match</Text>
        </View>
        <View style={styles.cardsContainer}>
          {nextPet && (
            <PetCard 
              pet={nextPet} 
              style={backCardStyle} 
              isNext
            />
          )}
          <GestureDetector gesture={gesture}>
            <PetCard 
              pet={currentPet} 
              style={frontCardStyle}
            />
          </GestureDetector>
        </View>
        <View style={styles.actionButtons}>
          <Pressable 
            style={[styles.actionButton, styles.dismissButton]}
            onPress={handleSwipeLeft}
          >
            <Ionicons name="close" size={32} color="#123524" />
          </Pressable>
          <Pressable 
            style={[styles.actionButton, styles.favoriteButton]}
            onPress={handleSwipeRight}
          >
            <Ionicons name="heart" size={32} color="#FF2D55" />
          </Pressable>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
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
  videoContainer: {
    backgroundColor: '#123524', // Dark green background while loading
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(18, 53, 36, 0.5)',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dismissButton: {
    borderWidth: 2,
    borderColor: '#123524',
  },
  favoriteButton: {
    borderWidth: 2,
    borderColor: '#123524',
  },
  controlButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 2,
    gap: 8,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.8,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

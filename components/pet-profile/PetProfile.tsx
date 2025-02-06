import { View, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import { Text, Button } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Pet } from '@/constants/mock-data';
import { useIsFocused } from '@react-navigation/native';
import { PulsingPaw } from '@/components/ui/PulsingPaw';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';

interface PetProfileProps {
  pet: Pet;
  onClose: () => void;
}

export function PetProfile({ pet, onClose }: PetProfileProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();
  const router = useRouter();
  const { user } = useAuth();

  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  // Reset states when URL changes
  useEffect(() => {
    setIsVideoLoaded(false);
    setHasError(false);
    setIsPaused(false);
    
    // Attempt to load and play video immediately
    if (videoRef.current) {
      videoRef.current.loadAsync(
        { 
          uri: pet.videoUrl,
          overrideFileExtensionAndroid: 'm3u8'
        },
        { 
          shouldPlay: isFocused && !isPaused,
          isLooping: true  // Ensure looping is set during load
        },
        false
      );
    }
  }, [pet.videoUrl]);

  // Handle screen focus/unfocus
  useEffect(() => {
    if (videoRef.current && isVideoLoaded) {
      if (isFocused && !isPaused) {
        videoRef.current.playAsync();
        videoRef.current.setIsLoopingAsync(true);  // Ensure looping is set when playing
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isFocused, isVideoLoaded, isPaused]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if ('error' in status) {
      console.error('[PetProfile] Video playback error:', status.error);
      setHasError(true);
      setIsVideoLoaded(false);
      return;
    }

    if (status.isLoaded) {
      if (!isVideoLoaded) {
        console.log('[PetProfile] Video loaded successfully');
        setIsVideoLoaded(true);
        setHasError(false);
      }
    }
  }, [isVideoLoaded]);

  const handleError = useCallback(() => {
    console.error('[PetProfile] Video loading error');
    setHasError(true);
    setIsVideoLoaded(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleStartChat = () => {
    if (!user || !pet) return;

    // Close the pet profile modal first
    onClose();

    // Then navigate to the chat
    router.push({
      pathname: "/(app)/chat/[chatId]",
      params: {
        chatId: pet.id,
        petName: pet.name,
        petImage: pet.photos[0] || pet.videoUrl,
        ownerName: pet.owner.name
      }
    });
  };

  return (
    <ScrollView style={containerStyle}>
      <View style={styles.videoContainer}>
        <Pressable 
          style={styles.backButton}
          onPress={onClose}
        >
          <View style={styles.backButtonContent}>
            <Ionicons 
              name="arrow-back"
              size={24}
              color="#fff"
            />
          </View>
        </Pressable>

        <Pressable 
          onPress={togglePlayPause}
          style={StyleSheet.absoluteFill}
        >
          <Video
            ref={videoRef}
            source={{ 
              uri: pet.videoUrl,
              overrideFileExtensionAndroid: 'm3u8'
            }}
            style={[
              styles.video,
              { opacity: isVideoLoaded ? 1 : 0 }
            ]}
            shouldPlay={isFocused && !isPaused}
            isLooping
            isMuted={false}
            resizeMode={ResizeMode.COVER}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={handleError}
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

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.name}>{pet.name}, {pet.age}</Text>
            <Text style={styles.location}>{pet.location}</Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Match</Text>
            <Text style={styles.score}>{pet.matchScore}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{pet.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Breed</Text>
          <Text style={styles.detailText}>{pet.breed}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
            {pet.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {pet.photos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.photo}
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Owner</Text>
          <View style={styles.ownerContainer}>
            <Text style={styles.detailText}>{pet.owner.name}</Text>
            {pet.owner.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable 
          style={styles.chatButton}
          onPress={handleStartChat}
        >
          <Ionicons name="chatbubble" size={20} color="#fff" style={styles.chatIcon} />
          <Text style={styles.chatButtonText}>Chat with Owner</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    width: '100%',
    height: 400,
    backgroundColor: '#123524',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: 400,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 18,
    color: '#666',
    marginTop: 4,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  detailText: {
    fontSize: 16,
    color: '#444',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  interestText: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  photosContainer: {
    marginTop: 10,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginRight: 12,
  },
  ownerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifiedBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatButton: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  chatIcon: {
    marginRight: 4,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 
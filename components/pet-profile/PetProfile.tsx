import { View, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Animated as RNAnimated } from 'react-native';
import { Text, Button } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Pet } from '@/types/pet';
import { useIsFocused } from '@react-navigation/native';
import { PulsingPaw } from '@/components/ui/PulsingPaw';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { storage } from '@/configs/firebase';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import { generateMatchScore } from '@/services/matching';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

interface PetProfileProps {
  pet: Pet;
  onClose: () => void;
}

function MatchScoreIndicator({ score }: { score: number }) {
  const segments = [
    { label: 'Poor', threshold: 30, color: '#FF3B30' },
    { label: 'Moderate', threshold: 60, color: '#FF9500' },
    { label: 'Good', threshold: 85, color: '#5856D6' },
    { label: 'Excellent', threshold: 100, color: '#34C759' },
  ];

  const currentSegment = segments.find(s => score <= s.threshold) || segments[segments.length - 1];
  const percentage = Math.round(score);

  return (
    <View style={styles.matchScoreContainer}>
      <View style={styles.matchScoreHeader}>
        <Text style={styles.matchScoreTitle}>Match Score</Text>
        <View style={[styles.matchScoreBadge, { backgroundColor: currentSegment.color }]}>
          <Text style={styles.matchScoreValue}>{percentage}%</Text>
        </View>
      </View>
      <Text style={[styles.matchScoreLabel, { color: currentSegment.color }]}>
        {currentSegment.label} Match
      </Text>
      <View style={styles.matchScoreBar}>
        {segments.map((segment, index) => (
          <View
            key={segment.label}
            style={[
              styles.matchScoreSegment,
              { backgroundColor: segment.color },
              index === 0 && styles.matchScoreSegmentFirst,
              index === segments.length - 1 && styles.matchScoreSegmentLast,
              { opacity: score <= segment.threshold ? 1 : 0.3 }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function MatchScoreLoadingIndicator() {
  const pulseAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const animatedStyle = {
    opacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
  };

  return (
    <View style={styles.matchScoreContainer}>
      <View style={styles.matchScoreHeader}>
        <Text style={styles.matchScoreTitle}>Match Score</Text>
        <View style={[styles.matchScoreBadge, styles.loadingBadge]}>
          <RNAnimated.View style={[styles.loadingPulse, animatedStyle]} />
        </View>
      </View>
      <View style={[styles.loadingLabel, styles.shimmer]}>
        <RNAnimated.View style={[styles.loadingPulse, animatedStyle]} />
      </View>
      <View style={styles.matchScoreBar}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.matchScoreSegment,
              styles.loadingSegment,
              index === 0 && styles.matchScoreSegmentFirst,
              index === 3 && styles.matchScoreSegmentLast,
            ]}
          >
            <RNAnimated.View style={[styles.loadingPulse, animatedStyle]} />
          </View>
        ))}
      </View>
    </View>
  );
}

function VideoPlayer({ videoUrl, thumbnailUrl }: { videoUrl: string, thumbnailUrl?: string }) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<Video>(null);
  const isFocused = useIsFocused();

  // Load and auto-play video
  useEffect(() => {
    let isMounted = true;

    const loadVideo = async () => {
      if (!videoRef.current) return;

      try {
        await videoRef.current.loadAsync(
          { 
            uri: videoUrl,
            overrideFileExtensionAndroid: 'm3u8'
          },
          { 
            shouldPlay: true, // Auto-play when loaded
            isLooping: true,
            isMuted: isMuted,
            progressUpdateIntervalMillis: 500,
          },
          false
        );

        if (isMounted) {
          setIsVideoLoaded(true);
        }
      } catch (error) {
        console.error('[VideoPlayer] Error loading video:', error);
        if (isMounted) {
          setHasError(true);
        }
      }
    };

    loadVideo();
    return () => {
      isMounted = false;
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
    };
  }, [videoUrl]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(async () => {
    if (!videoRef.current || !isVideoLoaded) return;
    
    try {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('[VideoPlayer] Error toggling mute:', error);
    }
  }, [isMuted, isVideoLoaded]);

  // Pause video when screen loses focus
  useEffect(() => {
    if (!isFocused && videoRef.current) {
      videoRef.current.pauseAsync();
    } else if (isFocused && videoRef.current && isVideoLoaded) {
      videoRef.current.playAsync();
    }
  }, [isFocused, isVideoLoaded]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.videoContainer]}>
      {/* Show thumbnail while video loads */}
      {!isVideoLoaded && thumbnailUrl && (
        <Image
          source={{ uri: thumbnailUrl }}
          style={[StyleSheet.absoluteFill, styles.thumbnail]}
          resizeMode="cover"
        />
      )}

      <Video
        ref={videoRef}
        style={[
          StyleSheet.absoluteFill,
          { opacity: isVideoLoaded ? 1 : 0 }
        ]}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isFocused}
        isLooping={true}
        isMuted={isMuted}
        useNativeControls={false}
      />

      {/* Mute toggle button */}
      <Pressable 
        style={styles.muteButton}
        onPress={handleMuteToggle}
      >
        <Ionicons 
          name={isMuted ? "volume-mute" : "volume-medium"} 
          size={24} 
          color="#fff"
        />
      </Pressable>

      {/* Show loading indicator while video loads */}
      {!isVideoLoaded && !hasError && (
        <View style={styles.loadingOverlay}>
          <PulsingPaw size={50} color="#fff" backgroundColor="rgba(18, 53, 36, 0.8)" />
        </View>
      )}

      {/* Show error state */}
      {hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#fff" />
          <Text style={styles.errorText}>Failed to load video</Text>
        </View>
      )}
    </View>
  );
}

export function PetProfile({ pet, onClose }: PetProfileProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(true);
  const photoUrlCache = useRef<Map<number, string>>(new Map());
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const router = useRouter();
  const { user } = useAuth();
  const [calculatingScore, setCalculatingScore] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | undefined>(pet.matchScore);
  const [photoLoadTrigger, setPhotoLoadTrigger] = useState(0); // Force rerenders when photos load

  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  // Optimized photo loading with lazy loading and caching
  const loadPhoto = useCallback(async (index: number) => {
    if (!pet.photos?.length || index >= pet.photos.length) return;
    if (photoUrlCache.current.has(index)) return;

    console.log(`🔍 Loading photo ${index} for pet ${pet.id}`);
    
    try {
      // Try to get photo from Firebase Storage first
      const photosRef = ref(storage, `pets/${pet.id}/photos/${index}.jpg`);
      let url;
      
      try {
        url = await getDownloadURL(photosRef);
        console.log(`✅ Loaded photo ${index} from Firebase Storage`);
      } catch (storageError) {
        console.log(`⚠️ Firebase Storage failed for photo ${index}, trying original URL`);
        // If Firebase Storage fails, try using the original URL
        url = pet.photos[index];
      }

      if (!url) {
        console.log(`⚠️ No valid URL found for photo ${index}`);
        return;
      }

      photoUrlCache.current.set(index, url);
      // Force a rerender when new photo is loaded
      setPhotoLoadTrigger(prev => prev + 1);
      console.log(`✨ Photo ${index} cached successfully`);
    } catch (error) {
      console.error(`❌ Error loading photo ${index}:`, error);
    }
  }, [pet.id, pet.photos]);

  // Load initial photos
  useEffect(() => {
    const loadInitialPhotos = async () => {
      console.log('🔄 Starting initial photo load');
      setIsLoadingPhotos(true);
      
      if (!pet.photos?.length) {
        console.log('⚠️ No photos available for pet');
        setIsLoadingPhotos(false);
        return;
      }

      try {
        console.log(`📸 Loading first ${Math.min(2, pet.photos.length)} photos`);
        // Load first two photos (or all if less than 2)
        const initialIndexes = Array.from(
          { length: Math.min(2, pet.photos.length) }, 
          (_, i) => i
        );
        await Promise.all(initialIndexes.map(index => loadPhoto(index)));
      } catch (error) {
        console.error('❌ Error loading initial photos:', error);
      } finally {
        console.log('✅ Initial photo loading complete');
        setIsLoadingPhotos(false);
      }
    };

    loadInitialPhotos();
  }, [loadPhoto, pet.photos]);

  // Handle photo scroll and lazy loading
  const handlePhotoScroll = useCallback((event: any) => {
    if (!pet.photos?.length || isScrolling.current) return;

    isScrolling.current = true;
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      isScrolling.current = false;
    }, 150);

    const offset = event.nativeEvent.contentOffset.x;
    const width = event.nativeEvent.layoutMeasurement.width;
    const currentIndex = Math.floor(offset / width);
    
    // Load next two photos ahead
    const nextIndexes = [currentIndex + 2, currentIndex + 3].filter(
      i => i < pet.photos.length && !photoUrlCache.current.has(i)
    );
    
    if (nextIndexes.length > 0) {
      console.log(`🔄 Loading next photos: ${nextIndexes.join(', ')}`);
      nextIndexes.forEach(loadPhoto);
    }
  }, [pet.photos, loadPhoto]);

  // Render photos using cached URLs
  const renderPhotos = useMemo(() => {
    if (!pet.photos?.length) {
      console.log('⚠️ No photos to render');
      return null;
    }

    const photos = pet.photos.map((_, index) => {
      const url = photoUrlCache.current.get(index);
      if (!url) return null;

      return (
        <Image
          key={`${index}-${url}`}
          source={{ uri: url }}
          style={styles.photo}
        />
      );
    }).filter(Boolean);

    console.log(`📸 Rendering ${photos.length} photos`);
    return photos;
  }, [pet.photos, photoLoadTrigger]); // Rerender when photos load

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

  // Calculate match score based on current preferences
  useEffect(() => {
    const calculateScore = async () => {
      if (!user) return;
      
      try {
        setCalculatingScore(true);
        
        // Get current user preferences
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          console.log('⚠️ User preferences not found');
          return;
        }

        const preferences = userDoc.data().buyerPreferences;
        if (!preferences) {
          console.log('⚠️ No buyer preferences set');
          return;
        }

        // Generate new match score with current preferences
        const newScore = await generateMatchScore(pet, preferences, user.uid);
        setCurrentScore(newScore);
      } catch (error) {
        console.error('❌ Error calculating match score:', error);
      } finally {
        setCalculatingScore(false);
      }
    };

    calculateScore();
  }, [user, pet]);

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

        <VideoPlayer 
          videoUrl={pet.videoUrl} 
          thumbnailUrl={pet.photos?.[0]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.name}>{pet.name}, {pet.age}</Text>
            <Text style={styles.location}>{pet.location}</Text>
          </View>
        </View>

        {/* Dynamic match score section */}
        {calculatingScore ? (
          <MatchScoreLoadingIndicator />
        ) : currentScore ? (
          <MatchScoreIndicator score={currentScore} />
        ) : null}

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
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.photosContainer}
            onScroll={handlePhotoScroll}
            scrollEventThrottle={16}
          >
            {isLoadingPhotos ? (
              <View style={styles.loadingPhotoContainer}>
                <PulsingPaw size={32} color={Colors.light.primary} backgroundColor="transparent" />
              </View>
            ) : renderPhotos && renderPhotos.length > 0 ? (
              renderPhotos
            ) : (
              <View style={styles.noPhotosContainer}>
                <Ionicons name="images-outline" size={32} color="#666" />
                <Text style={styles.noPhotosText}>No photos available</Text>
              </View>
            )}
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
    backgroundColor: 'rgba(18, 53, 36, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPhotoContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    position: 'relative',
    marginRight: 12,
  },
  noPhotosContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  loadingBadge: {
    width: 70,
    height: 32,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  loadingLabel: {
    width: 120,
    height: 24,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  loadingSegment: {
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  loadingPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f5f5f5',
  },
  shimmer: {
    overflow: 'hidden',
  },
  thumbnail: {
    backgroundColor: '#123524',
  },
  playButton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
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
  matchScoreContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  matchScoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  matchScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  matchScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchScoreValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  matchScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  matchScoreBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  matchScoreSegment: {
    flex: 1,
    marginHorizontal: 1,
  },
  matchScoreSegmentFirst: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  matchScoreSegmentLast: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  muteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  } as const,
}); 
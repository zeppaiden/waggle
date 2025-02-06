import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, ScrollView, useWindowDimensions, Animated, ActivityIndicator } from 'react-native';
import { Text } from '@/components/themed';
import { Pet, FavoriteFilters } from '@/constants/mock-data';
import { useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFavorites } from '@/hooks/useFavorites';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { PulsingPaw } from '@/components/ui/PulsingPaw';

type PetSpecies = 'dog' | 'cat' | 'bunny' | 'other';
type PetSize = 'small' | 'medium' | 'large';

// TODO: Replace with actual user ID from authentication
const TEMP_USER_ID = 'user123';

// Add a constant for the phthalo green color
const PHTHALO_GREEN = '#123524';

type VideoCardProps = {
  videoUrl: string;
};

function VideoCard({ videoUrl }: VideoCardProps) {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<Video | null>(null);

  // Reset states when URL changes
  useEffect(() => {
    setIsVideoLoaded(false);
    setHasError(false);
  }, [videoUrl]);

  // Stop video playback when component unmounts
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync();
      }
    };
  }, []);

  const handleLoad = useCallback(() => {
    setIsVideoLoaded(true);
    setHasError(false);
  }, [videoUrl]);

  const handleError = useCallback((error: string | undefined) => {
    console.error('Error loading video:', videoUrl, error);
    setHasError(true);
    setIsVideoLoaded(false);
  }, [videoUrl]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded && !isVideoLoaded) {
      handleLoad();
    }
  }, [handleLoad, isVideoLoaded]);
  
  return (
    <View style={[StyleSheet.absoluteFill, styles.videoContainer]}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={[
          StyleSheet.absoluteFill,
          !isVideoLoaded && { opacity: 0 }
        ]}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={handleError}
        isMuted={true}
      />
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

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { favorites, loading, error, removeFavorite, refresh } = useFavorites(TEMP_USER_ID);
  const [filteredFavorites, setFilteredFavorites] = useState<Pet[]>([]);
  const [filters, setFilters] = useState<FavoriteFilters>({});
  const [heartStates, setHeartStates] = useState<{ [key: string]: boolean }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  // Calculate grid dimensions
  const numColumns = 2;
  const spacing = 10;
  const cardWidth = (width - spacing * (numColumns + 1)) / numColumns;
  const cardHeight = cardWidth * 1.5;

  const animatedHearts = useRef<{ [key: string]: Animated.Value }>({}).current;
  const animatedCards = useRef<{ [key: string]: Animated.Value }>({}).current;

  // Update filtered favorites when favorites change
  useEffect(() => {
    applyFilters(filters, favorites);
  }, [favorites]);

  // Initialize animations for new pets
  useEffect(() => {
    filteredFavorites.forEach(pet => {
      if (!animatedHearts[pet.id]) {
        animatedHearts[pet.id] = new Animated.Value(0);
      }
      if (!animatedCards[pet.id]) {
        animatedCards[pet.id] = new Animated.Value(1);
      }
    });
  }, [filteredFavorites]);

  const handleRemoveFavorite = useCallback((petId: string) => {
    // Update heart state first
    setHeartStates(prev => ({ ...prev, [petId]: true }));
    
    // Then animate with poof effect
    Animated.sequence([
      // Poof effect for the heart
      Animated.parallel([
        Animated.timing(animatedHearts[petId], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      // Card removal animation
      Animated.timing(animatedCards[petId], {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      // After animations complete, remove from Firebase and state
      removeFavorite(petId);
      // Clean up animation values and heart state
      delete animatedHearts[petId];
      delete animatedCards[petId];
      setHeartStates(prev => {
        const newState = { ...prev };
        delete newState[petId];
        return newState;
      });
    });
  }, [removeFavorite]);

  const applyFilters = useCallback((newFilters: FavoriteFilters, petsToFilter = favorites) => {
    setFilters(newFilters);
    let filtered = [...petsToFilter];
    
    if (newFilters.species?.length) {
      filtered = filtered.filter(pet => newFilters.species?.includes(pet.species));
    }
    if (newFilters.size?.length) {
      filtered = filtered.filter(pet => newFilters.size?.includes(pet.size));
    }
    if (typeof newFilters.minMatchScore === 'number') {
      filtered = filtered.filter(pet => pet.matchScore >= newFilters.minMatchScore!);
    }
    if (newFilters.maxDistance) {
      filtered = filtered.filter(pet => {
        const distance = parseFloat(pet.location.split(' ')[0]);
        return distance <= newFilters.maxDistance!;
      });
    }
    
    setFilteredFavorites(filtered);
  }, [favorites]);

  const navigateToPetProfile = useCallback((petId: string) => {
    router.push(`/pet/${petId}`);
  }, [router]);

  const toggleSpeciesFilter = (species: PetSpecies) => {
    const currentSpecies = filters.species || [];
    const newSpecies = currentSpecies.includes(species)
      ? currentSpecies.filter(s => s !== species)
      : [...currentSpecies, species];
    applyFilters({ ...filters, species: newSpecies.length ? newSpecies : undefined });
  };

  const toggleSizeFilter = (size: PetSize) => {
    const currentSizes = filters.size || [];
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter(s => s !== size)
      : [...currentSizes, size];
    applyFilters({ ...filters, size: newSizes.length ? newSizes : undefined });
  };

  const FilterButton = ({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) => (
    <Pressable
      style={[styles.filterButton, active && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const renderContent = () => {
    if (!favorites.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={48} color="#666" />
          <Text style={styles.emptyStateTitle}>No favorites yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Your liked pets will appear here
          </Text>
        </View>
      );
    }

    if (!filteredFavorites.length) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="filter-outline" size={48} color="#666" />
          <Text style={styles.emptyStateTitle}>No matches found</Text>
          <Text style={styles.emptyStateSubtitle}>
            Try adjusting your filters to see more pets
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.grid}
      >
        {filteredFavorites.map((pet) => {
          const heartScale = animatedHearts[pet.id]?.interpolate({
            inputRange: [0, 0.5, 0.8, 1],
            outputRange: [1, 1.4, 0.6, 0.3]
          }) || 1;

          const heartOpacity = animatedHearts[pet.id]?.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0.8, 0]
          }) || 1;

          const cardScale = animatedCards[pet.id]?.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1]
          }) || 1;

          const cardOpacity = animatedCards[pet.id] || 1;

          return (
            <Animated.View
              key={pet.id}
              style={[
                { width: cardWidth, height: cardHeight },
                styles.card,
                {
                  transform: [{ scale: cardScale }],
                  opacity: cardOpacity,
                }
              ]}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => navigateToPetProfile(pet.id)}
              >
                <VideoCard videoUrl={pet.videoUrl} />
                <BlurView intensity={50} style={styles.petInfo} tint="dark">
                  <Text style={styles.petName}>{pet.name}</Text>
                  <Text style={styles.petDetails}>
                    {pet.breed} • {pet.age}y
                  </Text>
                </BlurView>
                <Pressable
                  style={styles.removeButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(pet.id);
                  }}
                >
                  <Animated.View
                    style={{
                      transform: [{ scale: heartScale }],
                      opacity: heartOpacity
                    }}
                  >
                    <Ionicons 
                      name="heart"
                      size={20} 
                      color="#FF2D55" 
                    />
                  </Animated.View>
                </Pressable>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <PulsingPaw size={60} backgroundColor="transparent" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load pets</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>Favorites</Text>
            <Text style={styles.subtitle}>{favorites.length} favorites</Text>
          </View>
          <Pressable 
            style={[
              styles.refreshButton,
              (loading || isRefreshing) && styles.refreshButtonDisabled
            ]}
            onPress={handleRefresh}
            disabled={loading || isRefreshing}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={(loading || isRefreshing) ? '#999' : Colors[theme].text} 
              style={(loading || isRefreshing) && styles.rotating}
            />
          </Pressable>
        </View>
      </View>

      {favorites.length > 0 && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            <FilterButton
              label="Dogs"
              active={filters.species?.includes('dog') ?? false}
              onPress={() => toggleSpeciesFilter('dog')}
            />
            <FilterButton
              label="Cats"
              active={filters.species?.includes('cat') ?? false}
              onPress={() => toggleSpeciesFilter('cat')}
            />
            <FilterButton
              label="Bunnies"
              active={filters.species?.includes('bunny') ?? false}
              onPress={() => toggleSpeciesFilter('bunny')}
            />
            <FilterButton
              label="Small"
              active={filters.size?.includes('small') ?? false}
              onPress={() => toggleSizeFilter('small')}
            />
            <FilterButton
              label="Large"
              active={filters.size?.includes('large') ?? false}
              onPress={() => toggleSizeFilter('large')}
            />
          </ScrollView>
        </View>
      )}

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filtersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: PHTHALO_GREEN,
  },
  filterButtonText: {
    fontSize: 15,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  petInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(18, 53, 36, 0.5)', // Phthalo green with opacity
  },
  petName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  petDetails: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  rotating: {
    transform: [{ rotate: '45deg' }],
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
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 
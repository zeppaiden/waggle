import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Text } from '@/components/themed';
import { MOCK_FAVORITE_PETS, Pet, FavoriteFilters } from '@/constants/mock-data';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type PetSpecies = 'dog' | 'cat' | 'other';
type PetSize = 'small' | 'medium' | 'large';

export default function FavoritesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [favorites, setFavorites] = useState<Pet[]>(MOCK_FAVORITE_PETS);
  const [filteredFavorites, setFilteredFavorites] = useState<Pet[]>(MOCK_FAVORITE_PETS);
  const [filters, setFilters] = useState<FavoriteFilters>({});

  // Calculate grid dimensions
  const numColumns = 2;
  const spacing = 10;
  const cardWidth = (width - spacing * (numColumns + 1)) / numColumns;
  const cardHeight = cardWidth * 1.5;

  const removeFavorite = useCallback((petId: string) => {
    const newFavorites = favorites.filter(pet => pet.id !== petId);
    setFavorites(newFavorites);
    applyFilters(filters, newFavorites);
  }, [favorites, filters]);

  const navigateToPetProfile = useCallback((petId: string) => {
    router.push(`/pet/${petId}`);
  }, [router]);

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
        {filteredFavorites.map((pet) => (
          <Pressable
            key={pet.id}
            style={[styles.card, { width: cardWidth, height: cardHeight }]}
            onPress={() => navigateToPetProfile(pet.id)}
          >
            <Video
              source={{ uri: pet.videoUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isLooping={false}
              posterSource={{ uri: pet.photos[0] }}
              usePoster={true}
            />
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
                removeFavorite(pet.id);
              }}
            >
              <Ionicons name="heart-dislike" size={20} color="white" />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>{favorites.length} favorites</Text>
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
    backgroundColor: '#000',
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
}); 
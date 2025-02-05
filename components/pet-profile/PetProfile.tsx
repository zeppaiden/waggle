import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text, Button } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useMemo } from 'react';
import { Pet } from '@/constants/mock-data';

interface PetProfileProps {
  pet: Pet;
  onClose: () => void;
}

export function PetProfile({ pet, onClose }: PetProfileProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: Colors[theme].background }
  ], [theme]);

  return (
    <ScrollView style={containerStyle}>
      <View style={styles.header}>
        <Button
          onPress={onClose}
          style={styles.backButton}
        >
          <View style={styles.backButtonContent}>
            <Ionicons 
              name="arrow-back"
              size={24}
              color={Colors[theme].text}
            />
          </View>
        </Button>
      </View>

      <Video
        source={{ uri: pet.videoUrl }}
        style={styles.video}
        shouldPlay
        isLooping
        resizeMode={ResizeMode.COVER}
      />

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
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
  }
}); 
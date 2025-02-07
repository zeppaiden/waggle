import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from '@/components/themed';
import Slider from '@react-native-community/slider';
import { UserProfile, PetType, SizePreference, ActivityLevel, ExperienceLevel, LivingSpace } from '@/types/user';
import { Colors } from '@/constants/colors-theme';

interface PreferencesStepProps {
  data: Partial<UserProfile>;
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
}

const PET_TYPES: PetType[] = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'FISH', 'OTHER'];
const SIZE_PREFERENCES: SizePreference[] = ['small', 'medium', 'large', 'any'];
const ACTIVITY_LEVELS: ActivityLevel[] = ['low', 'moderate', 'high', 'any'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'expert'];
const LIVING_SPACES: LivingSpace[] = ['apartment', 'house', 'farm', 'other'];

export default function PreferencesStep({ data, onNext, onBack }: PreferencesStepProps) {
  const [preferences, setPreferences] = useState({
    petTypes: data.buyerPreferences?.petTypes || [],
    sizePreferences: data.buyerPreferences?.sizePreferences || [],
    activityLevel: data.buyerPreferences?.activityLevel || 'any',
    maxDistance: data.buyerPreferences?.maxDistance || 50,
    experienceLevel: data.buyerPreferences?.experienceLevel || 'beginner',
    livingSpace: data.buyerPreferences?.livingSpace || 'apartment',
    hasChildren: data.buyerPreferences?.hasChildren || false,
    hasOtherPets: data.buyerPreferences?.hasOtherPets || false,
    ageRange: data.buyerPreferences?.ageRange || { min: 0, max: 20 },
  });

  const togglePetType = (type: PetType) => {
    setPreferences(prev => ({
      ...prev,
      petTypes: prev.petTypes.includes(type)
        ? prev.petTypes.filter(t => t !== type)
        : [...prev.petTypes, type],
    }));
  };

  const toggleSizePreference = (size: SizePreference) => {
    setPreferences(prev => ({
      ...prev,
      sizePreferences: prev.sizePreferences.includes(size)
        ? prev.sizePreferences.filter(s => s !== size)
        : [...prev.sizePreferences, size],
    }));
  };

  const handleNext = () => {
    onNext({
      ...data,
      buyerPreferences: preferences,
    });
  };

  const renderChip = (
    label: string,
    selected: boolean,
    onPress: () => void,
    key?: string
  ) => (
    <Button
      key={key || label}
      style={[styles.chip, selected && styles.selectedChip]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>
        {label.charAt(0) + label.slice(1).toLowerCase()}
      </Text>
    </Button>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What types of pets are you interested in?</Text>
        <View style={styles.chipGroup}>
          {PET_TYPES.map(type => (
            renderChip(
              type,
              preferences.petTypes.includes(type),
              () => togglePetType(type),
              type
            )
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What size pets are you comfortable with?</Text>
        <View style={styles.chipGroup}>
          {SIZE_PREFERENCES.map(size => (
            renderChip(
              size,
              preferences.sizePreferences.includes(size),
              () => toggleSizePreference(size),
              size
            )
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred pet activity level?</Text>
        <View style={styles.chipGroup}>
          {ACTIVITY_LEVELS.map(level => (
            renderChip(
              level,
              preferences.activityLevel === level,
              () => setPreferences(prev => ({ ...prev, activityLevel: level })),
              level
            )
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your pet care experience level?</Text>
        <View style={styles.chipGroup}>
          {EXPERIENCE_LEVELS.map(level => (
            renderChip(
              level,
              preferences.experienceLevel === level,
              () => setPreferences(prev => ({ ...prev, experienceLevel: level })),
              level
            )
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your living space?</Text>
        <View style={styles.chipGroup}>
          {LIVING_SPACES.map(space => (
            renderChip(
              space,
              preferences.livingSpace === space,
              () => setPreferences(prev => ({ ...prev, livingSpace: space })),
              space
            )
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Information</Text>
        <View style={styles.chipGroup}>
          {renderChip(
            'Have Children',
            preferences.hasChildren,
            () => setPreferences(prev => ({ ...prev, hasChildren: !prev.hasChildren }))
          )}
          {renderChip(
            'Have Other Pets',
            preferences.hasOtherPets,
            () => setPreferences(prev => ({ ...prev, hasOtherPets: !prev.hasOtherPets }))
          )}
        </View>
      </View>

      {renderSection('Age Range (years)', (
        <View style={styles.sliderContainer}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sliderValue}>Min: {preferences.ageRange.min}</Text>
            <Text style={styles.sliderValue}>Max: {preferences.ageRange.max >= 20 ? '20+' : preferences.ageRange.max}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20}
            step={1}
            value={preferences.ageRange.min}
            onValueChange={(value: number) => setPreferences(prev => ({
              ...prev,
              ageRange: { ...prev.ageRange, min: value }
            }))}
            minimumTrackTintColor={Colors.light.primary}
            maximumTrackTintColor="#e0e0e0"
            thumbTintColor={Colors.light.primary}
          />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20}
            step={1}
            value={preferences.ageRange.max}
            onValueChange={(value: number) => setPreferences(prev => ({
              ...prev,
              ageRange: { ...prev.ageRange, max: value }
            }))}
            minimumTrackTintColor={Colors.light.primary}
            maximumTrackTintColor="#e0e0e0"
            thumbTintColor={Colors.light.primary}
          />
        </View>
      ))}

      <View style={styles.buttonContainer}>
        <Button
          onPress={onBack}
          style={[styles.button, styles.backButton]}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </Button>
        <Button
          onPress={handleNext}
          style={[styles.button, styles.nextButton]}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  chip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    margin: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 14,
    color: '#666',
  },
  selectedChipText: {
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    marginLeft: 8,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 14,
    color: '#666',
  },
  slider: {
    height: 40,
    marginHorizontal: 16,
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, Pressable, Dimensions } from 'react-native';
import { Text } from '@/components/themed';
import { UserProfile, PetType, SizePreference, ActivityLevel, ExperienceLevel, LivingSpace } from '@/types/user';
import { Colors } from '@/constants/colors-theme';
import Slider from '@react-native-community/slider';
import { 
  Dog, 
  Cat, 
  Bird, 
  Rabbit, 
  Fish, 
  PawPrint, 
  Building2, 
  Home, 
  Trees, 
  MoreHorizontal,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHIP_SPACING = 8;
const CHIPS_PER_ROW = 3;
const CHIP_WIDTH = (SCREEN_WIDTH - 48 - (CHIPS_PER_ROW - 1) * CHIP_SPACING) / CHIPS_PER_ROW;

interface BuyerPreferencesStepProps {
  data: Partial<UserProfile>;
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
}

type IconComponent = typeof Dog;

const PET_TYPES: { value: PetType; Icon: IconComponent; label: string }[] = [
  { 
    value: 'ANY',
    Icon: PawPrint,
    label: 'Any'
  },
  { 
    value: 'DOG',
    Icon: Dog,
    label: 'Dogs'
  },
  { 
    value: 'CAT',
    Icon: Cat,
    label: 'Cats'
  },
  { 
    value: 'BIRD',
    Icon: Bird,
    label: 'Birds'
  },
  { 
    value: 'RABBIT',
    Icon: Rabbit,
    label: 'Rabbits'
  },
  { 
    value: 'FISH',
    Icon: Fish,
    label: 'Fish'
  }
];

const SIZE_PREFERENCES: SizePreference[] = ['small', 'medium', 'large', 'any'];
const ACTIVITY_LEVELS: ActivityLevel[] = ['low', 'moderate', 'high', 'any'];
const EXPERIENCE_LEVELS: ExperienceLevel[] = ['beginner', 'intermediate', 'expert'];
const LIVING_SPACES: { value: LivingSpace; Icon: IconComponent }[] = [
  { value: 'apartment', Icon: Building2 },
  { value: 'house', Icon: Home },
  { value: 'farm', Icon: Trees },
  { value: 'other', Icon: MoreHorizontal },
];

// Add type for slider value
type SliderValue = number;

export default function BuyerPreferencesStep({ data, onNext, onBack }: BuyerPreferencesStepProps) {
  useEffect(() => {
    return () => {
      // Cleanup if needed
    };
  }, []);

  const [preferences, setPreferences] = useState({
    petTypes: data.buyerPreferences?.petTypes || ['ANY'],
    sizePreferences: data.buyerPreferences?.sizePreferences || ['any'],
    activityLevel: data.buyerPreferences?.activityLevel || 'any',
    maxDistance: data.buyerPreferences?.maxDistance || 50,
    experienceLevel: data.buyerPreferences?.experienceLevel || 'beginner',
    livingSpace: data.buyerPreferences?.livingSpace || 'apartment',
    hasChildren: data.buyerPreferences?.hasChildren || false,
    hasOtherPets: data.buyerPreferences?.hasOtherPets || false,
    ageRange: data.buyerPreferences?.ageRange || { min: 0, max: 20 },
  });

  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const handleNext = () => {
    setIsCreatingProfile(true);
    onNext({
      ...data,
      buyerPreferences: preferences,
    });
  };

  const renderPetTypeChip = (type: PetType, Icon: IconComponent, label: string) => {
    const isSelected = preferences.petTypes.includes('ANY')
      ? type === 'ANY' || preferences.petTypes.includes(type)
      : preferences.petTypes.includes(type);

    return (
      <Pressable
        key={type}
        style={[
          styles.iconChip,
          isSelected && styles.iconChipSelected
        ]}
        onPress={() => {
          if (type === 'ANY') {
            setPreferences(prev => ({
              ...prev,
              petTypes: ['ANY']
            }));
            return;
          }

          setPreferences(prev => ({
            ...prev,
            petTypes: prev.petTypes.includes('ANY')
              ? [type]
              : prev.petTypes.includes(type)
                ? prev.petTypes.filter(t => t !== type)
                : [...prev.petTypes, type]
          }));
        }}
      >
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <Icon 
            size={32} 
            color={isSelected ? '#fff' : Colors.light.primary}
            strokeWidth={1.5}
          />
        </View>
        <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const renderLivingSpaceChip = (space: LivingSpace, Icon: IconComponent) => {
    const isSelected = preferences.livingSpace === space;
    return (
      <Pressable
        key={space}
        style={[
          styles.iconChip,
          isSelected && styles.iconChipSelected
        ]}
        onPress={() => setPreferences(prev => ({ ...prev, livingSpace: space }))}
      >
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <Icon 
            size={28} 
            color={isSelected ? '#fff' : Colors.light.primary}
            strokeWidth={1.5}
          />
        </View>
        <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
          {space.charAt(0).toUpperCase() + space.slice(1)}
        </Text>
      </Pressable>
    );
  };

  const renderChip = (
    label: string,
    selected: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={label}
      style={[
        styles.chip,
        selected && styles.chipSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.chipText,
        selected && styles.chipTextSelected
      ]}>
        {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
      </Text>
    </Pressable>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={styles.content}
        entering={FadeIn}
        exiting={FadeOut}
      >
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={onBack}
          >
            <ArrowLeft size={24} color="#666" strokeWidth={1.5} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderSection('What types of pets are you interested in?', (
            <View style={styles.iconChipGrid}>
              {PET_TYPES.map(({ value, Icon, label }) => renderPetTypeChip(value, Icon, label))}
            </View>
          ))}

          {renderSection('Your living space?', (
            <View style={styles.iconChipGrid}>
              {LIVING_SPACES.map(({ value, Icon }) => renderLivingSpaceChip(value, Icon))}
            </View>
          ))}

          {renderSection('What size pets are you comfortable with?', (
            <View style={styles.chipGroup}>
              {SIZE_PREFERENCES.map(size => renderChip(
                size,
                preferences.sizePreferences.includes(size),
                () => setPreferences(prev => ({
                  ...prev,
                  sizePreferences: prev.sizePreferences.includes(size)
                    ? prev.sizePreferences.filter(s => s !== size)
                    : [...prev.sizePreferences, size]
                }))
              ))}
            </View>
          ))}

          {renderSection('Preferred pet activity level?', (
            <View style={styles.chipGroup}>
              {ACTIVITY_LEVELS.map(level => renderChip(
                level,
                preferences.activityLevel === level,
                () => setPreferences(prev => ({ ...prev, activityLevel: level }))
              ))}
            </View>
          ))}

          {renderSection('Your pet care experience level?', (
            <View style={styles.chipGroup}>
              {EXPERIENCE_LEVELS.map(level => renderChip(
                level,
                preferences.experienceLevel === level,
                () => setPreferences(prev => ({ ...prev, experienceLevel: level }))
              ))}
            </View>
          ))}

          {renderSection('Age Range (years)', (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderValue}>Min: {preferences.ageRange.min}</Text>
                <Text style={styles.sliderValue}>Max: {preferences.ageRange.max}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={20}
                step={1}
                value={preferences.ageRange.min}
                onValueChange={(value) => setPreferences(prev => ({
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
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  ageRange: { ...prev.ageRange, max: value }
                }))}
                minimumTrackTintColor={Colors.light.primary}
                maximumTrackTintColor="#e0e0e0"
                thumbTintColor={Colors.light.primary}
              />
            </View>
          ))}

          {renderSection('Maximum Distance', (
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{preferences.maxDistance} km</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={100}
                step={5}
                value={preferences.maxDistance}
                onValueChange={(value) => setPreferences(prev => ({
                  ...prev,
                  maxDistance: value
                }))}
                minimumTrackTintColor={Colors.light.primary}
                maximumTrackTintColor="#e0e0e0"
                thumbTintColor={Colors.light.primary}
              />
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={[
              styles.button, 
              styles.nextButton,
              isCreatingProfile && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={isCreatingProfile}
          >
            <Text style={styles.nextButtonText}>
              {isCreatingProfile ? 'Creating profile...' : 'Next'}
            </Text>
            {!isCreatingProfile && (
              <ArrowRight size={24} color="#fff" strokeWidth={1.5} style={styles.nextButtonIcon} />
            )}
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 20,
  },
  iconChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CHIP_SPACING,
  },
  iconChip: {
    width: CHIP_WIDTH,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconChipSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '08',
    shadowColor: Colors.light.primary,
    shadowOpacity: 0.12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.light.primary + '08',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainerSelected: {
    backgroundColor: Colors.light.primary,
  },
  chipLabel: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chipSelected: {
    backgroundColor: Colors.light.primary + '08',
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  sliderContainer: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderValue: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  nextButtonIcon: {
    marginLeft: 4,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
}); 
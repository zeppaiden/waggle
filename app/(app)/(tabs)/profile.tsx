import { View, StyleSheet, Pressable, ScrollView, Platform, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { Text } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/auth';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/configs/firebase';
import { UserProfile, PetType, LivingSpace, SizePreference, ActivityLevel, ExperienceLevel, BuyerPreferences } from '@/types/user';
import { PulsingPaw } from '@/components/ui/PulsingPaw';
import debounce from 'lodash/debounce';
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
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 16;
const CONTENT_PADDING = 16;
const CHIP_WIDTH = (SCREEN_WIDTH - (HORIZONTAL_PADDING * 2) - (CONTENT_PADDING * 2)) / 2;

type IconComponent = typeof Dog;

interface PetTypeOption {
  value: PetType;
  Icon: IconComponent;
  label: string;
}

interface LivingSpaceOption {
  value: LivingSpace;
  Icon: IconComponent;
}

const PET_TYPES: PetTypeOption[] = [
  { value: 'DOG', Icon: Dog, label: 'Dogs' },
  { value: 'CAT', Icon: Cat, label: 'Cats' },
  { value: 'BIRD', Icon: Bird, label: 'Birds' },
  { value: 'RABBIT', Icon: Rabbit, label: 'Rabbits' },
  { value: 'FISH', Icon: Fish, label: 'Fish' },
  { value: 'OTHER', Icon: PawPrint, label: 'Other' },
];

const LIVING_SPACES: LivingSpaceOption[] = [
  { value: 'apartment', Icon: Building2 },
  { value: 'house', Icon: Home },
  { value: 'farm', Icon: Trees },
  { value: 'other', Icon: MoreHorizontal },
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const defaultBuyerPreferences: BuyerPreferences = {
    petTypes: [],
    sizePreferences: ['any'],
    activityLevel: 'any',
    maxDistance: 50,
    experienceLevel: 'beginner',
    livingSpace: 'apartment',
    hasChildren: false,
    hasOtherPets: false,
    ageRange: { min: 0, max: 20 }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setProfile(profileData);
          setEditedProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const validateUsername = async (username: string) => {
    // Basic format validation
    if (!username.trim()) {
      setErrors(prev => ({ ...prev, username: 'Username is required' }));
      return false;
    }

    // Length check (3-20 characters)
    if (username.length < 3 || username.length > 20) {
      setErrors(prev => ({ ...prev, username: 'Username must be between 3 and 20 characters' }));
      return false;
    }

    // Only allow letters, numbers, underscores, and dots
    const validUsernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!validUsernameRegex.test(username)) {
      setErrors(prev => ({ 
        ...prev, 
        username: 'Username can only contain letters, numbers, dots, and underscores' 
      }));
      return false;
    }

    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
      setErrors(prev => ({ 
        ...prev, 
        username: 'Username must start with a letter' 
      }));
      return false;
    }

    // No consecutive dots or underscores
    if (/[._]{2,}/.test(username)) {
      setErrors(prev => ({ 
        ...prev, 
        username: 'Username cannot contain consecutive dots or underscores' 
      }));
      return false;
    }

    // Cannot end with a dot or underscore
    if (/[._]$/.test(username)) {
      setErrors(prev => ({ 
        ...prev, 
        username: 'Username cannot end with a dot or underscore' 
      }));
      return false;
    }

    // Skip availability check if username hasn't changed
    if (username === profile?.username) {
      setErrors(prev => ({ ...prev, username: undefined }));
      return true;
    }

    setIsCheckingUsername(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username.toLowerCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setErrors(prev => ({ ...prev, username: 'Username is already taken' }));
        return false;
      }
      
      setErrors(prev => ({ ...prev, username: undefined }));
      return true;
    } catch (error) {
      console.error('Error checking username:', error);
      setErrors(prev => ({ ...prev, username: 'Error checking username availability' }));
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    // Remove spaces and special characters in real-time
    const sanitizedUsername = text.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
    setEditedProfile(prev => ({ ...prev, username: sanitizedUsername }));
    debouncedUsernameCheck(sanitizedUsername);
  };

  const debouncedUsernameCheck = debounce(validateUsername, 500);

  const validatePhoneNumber = (phone: string) => {
    if (!phone) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
      return true;
    }

    const phoneRegex = /^\+?\d{9,10}$/;
    const isValid = phoneRegex.test(phone.replace(/\s/g, ''));
    
    setErrors(prev => ({
      ...prev,
      phoneNumber: isValid ? undefined : 'Phone number must be 9-10 digits, optionally starting with +'
    }));
    return isValid;
  };

  const handlePhoneChange = (text: string) => {
    // Only allow digits and + at the start
    const sanitizedText = text.replace(/[^\d+]/g, '');
    if (text.includes('+') && !text.startsWith('+')) {
      return;
    }
    setEditedProfile(prev => ({ ...prev, phoneNumber: sanitizedText }));
    validatePhoneNumber(sanitizedText);
  };

  const handleSave = async () => {
    if (!user || !editedProfile) return;
    
    // Validate all fields before saving
    const isUsernameValid = await validateUsername(editedProfile.username || '');
    const isPhoneValid = validatePhoneNumber(editedProfile.phoneNumber || '');

    if (!isUsernameValid || !isPhoneValid) {
      Alert.alert('Validation Error', 'Please fix the errors before saving.');
      return;
    }
    
    setIsSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, editedProfile);
      setProfile(editedProfile as UserProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderInfoItem = (icon: keyof typeof Ionicons.glyphMap, value: string | undefined, placeholder: string) => (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color={Colors.light.primary} style={styles.infoIcon} />
      <Text style={styles.infoText}>
        {value || placeholder}
      </Text>
    </View>
  );

  const renderEditableInfoItem = (
    icon: keyof typeof Ionicons.glyphMap,
    field: keyof UserProfile,
    placeholder: string,
    value?: string
  ) => (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color="#999" style={styles.infoIcon} />
      {isEditing ? (
        <TextInput
          style={styles.input}
          value={editedProfile[field] as string}
          onChangeText={(text) => setEditedProfile(prev => ({ ...prev, [field]: text }))}
          placeholder={placeholder}
          placeholderTextColor="#999"
        />
      ) : (
        <Text style={styles.infoText}>
          {value || placeholder}
        </Text>
      )}
    </View>
  );

  const renderPreferenceItem = (label: string, value: string) => (
    <View style={styles.preferenceItem}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Text style={styles.preferenceValue}>{value}</Text>
    </View>
  );

  const renderUsernameInput = () => (
    <View style={styles.usernameInputContainer}>
      <Ionicons name="at" size={20} color={errors.username ? '#FF3B30' : '#999'} style={styles.usernameIcon} />
      <TextInput
        style={[styles.usernameInput, errors.username && styles.inputError]}
        value={editedProfile.username}
        onChangeText={handleUsernameChange}
        placeholder="Username"
        placeholderTextColor="#999"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {isCheckingUsername && (
        <ActivityIndicator size="small" color={Colors.light.primary} style={styles.usernameLoader} />
      )}
    </View>
  );

  const renderPhoneInput = () => (
    <View style={styles.infoItem}>
      <Ionicons 
        name="call-outline" 
        size={20} 
        color={errors.phoneNumber ? '#FF3B30' : '#999'} 
        style={styles.infoIcon} 
      />
      <TextInput
        style={[styles.input, errors.phoneNumber && styles.inputError]}
        value={editedProfile.phoneNumber}
        onChangeText={handlePhoneChange}
        placeholder="Phone number"
        placeholderTextColor="#999"
        keyboardType="phone-pad"
      />
    </View>
  );

  const handlePetTypeChange = (value: PetType) => {
    if (!profile?.buyerPreferences) return;
    
    const currentPreferences = editedProfile.buyerPreferences || defaultBuyerPreferences;
    const currentTypes = currentPreferences.petTypes;
    const newTypes = currentTypes.includes(value)
      ? currentTypes.filter(t => t !== value)
      : [...currentTypes, value];
    
    setEditedProfile(prev => ({
      ...prev,
      buyerPreferences: {
        ...currentPreferences,
        petTypes: newTypes
      }
    }));
  };

  const handleLivingSpaceChange = (value: LivingSpace) => {
    if (!profile?.buyerPreferences) return;
    
    const currentPreferences = editedProfile.buyerPreferences || defaultBuyerPreferences;
    
    setEditedProfile(prev => ({
      ...prev,
      buyerPreferences: {
        ...currentPreferences,
        livingSpace: value
      }
    }));
  };

  const handleSizePreferenceChange = (value: SizePreference) => {
    if (!profile?.buyerPreferences) return;
    
    const currentPreferences = editedProfile.buyerPreferences || defaultBuyerPreferences;
    const currentSizes = currentPreferences.sizePreferences;
    const newSizes = currentSizes.includes(value)
      ? currentSizes.filter(s => s !== value)
      : [...currentSizes, value];
    
    setEditedProfile(prev => ({
      ...prev,
      buyerPreferences: {
        ...currentPreferences,
        sizePreferences: newSizes
      }
    }));
  };

  const handleActivityLevelChange = (value: ActivityLevel) => {
    if (!profile?.buyerPreferences) return;
    
    const currentPreferences = editedProfile.buyerPreferences || defaultBuyerPreferences;
    
    setEditedProfile(prev => ({
      ...prev,
      buyerPreferences: {
        ...currentPreferences,
        activityLevel: value
      }
    }));
  };

  const handleExperienceLevelChange = (value: ExperienceLevel) => {
    if (!profile?.buyerPreferences) return;
    
    const currentPreferences = editedProfile.buyerPreferences || defaultBuyerPreferences;
    
    setEditedProfile(prev => ({
      ...prev,
      buyerPreferences: {
        ...currentPreferences,
        experienceLevel: value
      }
    }));
  };

  const handleBooleanPreferenceChange = (field: 'hasChildren' | 'hasOtherPets', value: boolean) => {
    if (!profile?.buyerPreferences) return;
    
    const currentPreferences = editedProfile.buyerPreferences || defaultBuyerPreferences;
    
    setEditedProfile(prev => ({
      ...prev,
      buyerPreferences: {
        ...currentPreferences,
        [field]: value
      }
    }));
  };

  const handleAgeRangeChange = (field: 'min' | 'max', value: number) => {
    if (!profile?.buyerPreferences) return;
    
    const currentPreferences = editedProfile.buyerPreferences || defaultBuyerPreferences;
    const currentRange = currentPreferences.ageRange || { min: 0, max: 20 };
    
    setEditedProfile(prev => ({
      ...prev,
      buyerPreferences: {
        ...currentPreferences,
        ageRange: {
          ...currentRange,
          [field]: value
        }
      }
    }));
  };

  const handleDistanceChange = (value: number) => {
    if (!profile?.buyerPreferences) return;
    
    const currentPreferences = editedProfile.buyerPreferences || defaultBuyerPreferences;
    
    setEditedProfile(prev => ({
      ...prev,
      buyerPreferences: {
        ...currentPreferences,
        maxDistance: value
      }
    }));
  };

  const renderIconChip = (
    value: PetType | LivingSpace,
    Icon: IconComponent,
    label: string,
    isPetType: boolean
  ) => {
    if (!profile?.buyerPreferences) return null;
    
    const isSelected = isPetType
      ? editedProfile.buyerPreferences?.petTypes?.includes(value as PetType)
      : editedProfile.buyerPreferences?.livingSpace === value;
    
    return (
      <Pressable
        key={value}
        style={[
          styles.iconChip,
          isSelected && styles.iconChipSelected
        ]}
        onPress={() => {
          if (isPetType) {
            handlePetTypeChange(value as PetType);
          } else {
            handleLivingSpaceChange(value as LivingSpace);
          }
        }}
      >
        <View style={[styles.iconContainer, isSelected && styles.iconContainerSelected]}>
          <Icon 
            size={28} 
            color={isSelected ? '#fff' : Colors.light.primary}
            strokeWidth={1.5}
          />
        </View>
        <Text style={[styles.chipLabel, isSelected && styles.chipLabelSelected]}>
          {label || value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()}
        </Text>
      </Pressable>
    );
  };

  const renderChip = (
    label: string,
    field: keyof BuyerPreferences,
    options: string[],
    currentValue: string | string[] | boolean
  ) => {
    if (!profile?.buyerPreferences) return null;
    
    const editedValue = editedProfile.buyerPreferences?.[field] ?? currentValue;
    
    return (
      <View style={styles.chipGroup}>
        {options.map((option) => {
          const isSelected = Array.isArray(editedValue)
            ? editedValue.includes(option)
            : editedValue === option;
            
          return (
            <Pressable
              key={option}
              style={[
                styles.chip,
                isSelected && styles.chipSelected
              ]}
              onPress={() => {
                if (field === 'sizePreferences') {
                  handleSizePreferenceChange(option as SizePreference);
                } else if (field === 'activityLevel') {
                  handleActivityLevelChange(option as ActivityLevel);
                } else if (field === 'experienceLevel') {
                  handleExperienceLevelChange(option as ExperienceLevel);
                } else if (field === 'hasChildren' || field === 'hasOtherPets') {
                  handleBooleanPreferenceChange(field, option === 'Yes');
                }
              }}
            >
              <Text style={[
                styles.chipText,
                isSelected && styles.chipTextSelected
              ]}>
                {option.charAt(0).toUpperCase() + option.slice(1).toLowerCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  // Add new preference options
  const AGE_RANGE_OPTIONS = {
    min: 0,
    max: 20,
    step: 1
  };

  // Add helper function for boolean display
  const getBooleanDisplayValue = (value: boolean | undefined) => value ? 'Yes' : 'No';
  const getBooleanFromDisplay = (display: string) => display === 'Yes';

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <PulsingPaw size={60} backgroundColor="transparent" color={Colors.light.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error loading profile</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {isEditing ? (
          <Pressable
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="pencil" size={16} color="#fff" />
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {editedProfile.firstName?.[0]}{editedProfile.lastName?.[0]}
            </Text>
          </View>
          {isEditing ? (
            <View style={styles.nameInputContainer}>
              <View style={styles.nameInputRow}>
                <View style={styles.nameInputWrapper}>
                  <TextInput
                    style={styles.nameInput}
                    value={editedProfile.firstName}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, firstName: text }))}
                    placeholder="First Name"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={styles.nameInputWrapper}>
                  <TextInput
                    style={styles.nameInput}
                    value={editedProfile.lastName}
                    onChangeText={(text) => setEditedProfile(prev => ({ ...prev, lastName: text }))}
                    placeholder="Last Name"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>
              {renderUsernameInput()}
            </View>
          ) : (
            <View style={styles.nameContainer}>
              <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
              <View style={styles.usernameContainer}>
                <Ionicons name="at" size={16} color="#666" />
                <Text style={styles.username}>{profile.username}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          {renderEditableInfoItem('mail-outline', 'email', 'Email not provided', profile.email)}
          {renderPhoneInput()}
        </View>

        <View style={styles.roleSection}>
          <Ionicons 
            name={profile.role === 'buyer' ? 'heart' : 
                  profile.role === 'owner' ? 'paw' : 'sync'} 
            size={20} 
            color={profile.role === 'buyer' ? '#FF2D55' : Colors.light.primary} 
            style={styles.roleIcon}
          />
          <Text style={[
            styles.roleText,
            profile.role === 'buyer' && styles.roleTextRed
          ]}>
            {profile.role === 'buyer' ? 'Pet Adopter' :
             profile.role === 'owner' ? 'Pet Owner' : 'Both'}
          </Text>
        </View>

        {profile.buyerPreferences && (
          <View style={styles.preferencesSection}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.preferencesGrid}>
              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Pet Types</Text>
                <View style={styles.iconChipGrid}>
                  {PET_TYPES.map(({ value, Icon, label }) => 
                    isEditing && renderIconChip(value, Icon, label, true)
                  )}
                  {!isEditing && (
                    <Text style={styles.preferenceValue}>
                      {profile.buyerPreferences?.petTypes.join(', ')}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Living Space</Text>
                <View style={styles.iconChipGrid}>
                  {LIVING_SPACES.map(({ value, Icon }) => 
                    isEditing && renderIconChip(value, Icon, '', false)
                  )}
                  {!isEditing && (
                    <Text style={styles.preferenceValue}>
                      {profile.buyerPreferences?.livingSpace}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Size</Text>
                {isEditing ? (
                  renderChip('Size', 'sizePreferences', ['small', 'medium', 'large', 'any'], profile.buyerPreferences?.sizePreferences || [])
                ) : (
                  <Text style={styles.preferenceValue}>
                    {profile.buyerPreferences?.sizePreferences.join(', ')}
                  </Text>
                )}
              </View>

              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Activity</Text>
                {isEditing ? (
                  renderChip('Activity', 'activityLevel', ['low', 'moderate', 'high', 'any'], profile.buyerPreferences?.activityLevel || 'any')
                ) : (
                  <Text style={styles.preferenceValue}>
                    {profile.buyerPreferences?.activityLevel}
                  </Text>
                )}
              </View>

              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Experience</Text>
                {isEditing ? (
                  renderChip('Experience', 'experienceLevel', ['beginner', 'intermediate', 'expert'], profile.buyerPreferences?.experienceLevel || 'beginner')
                ) : (
                  <Text style={styles.preferenceValue}>
                    {profile.buyerPreferences?.experienceLevel}
                  </Text>
                )}
              </View>

              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Distance</Text>
                {isEditing ? (
                  <View style={styles.preferenceItem}>
                    <Text style={styles.preferenceLabel}>Distance (miles)</Text>
                    <TextInput
                      style={styles.preferenceInput}
                      value={String(editedProfile.buyerPreferences?.maxDistance ?? profile.buyerPreferences?.maxDistance ?? 50)}
                      onChangeText={(text) => {
                        const value = parseInt(text) || 0;
                        handleDistanceChange(value);
                      }}
                      keyboardType="number-pad"
                      placeholder="Enter max distance"
                      placeholderTextColor="#999"
                    />
                  </View>
                ) : (
                  <Text style={styles.preferenceValue}>
                    {profile.buyerPreferences?.maxDistance || 50} miles
                  </Text>
                )}
              </View>

              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Age Range</Text>
                {isEditing ? (
                  <View style={styles.preferenceItem}>
                    <Text style={styles.preferenceLabel}>Age Range (years)</Text>
                    <View style={styles.sliderContainer}>
                      <View style={styles.sliderHeader}>
                        <Text style={styles.sliderValue}>Min: {editedProfile.buyerPreferences?.ageRange?.min ?? profile.buyerPreferences?.ageRange?.min ?? 0}</Text>
                        <Text style={styles.sliderValue}>Max: {editedProfile.buyerPreferences?.ageRange?.max ?? profile.buyerPreferences?.ageRange?.max ?? AGE_RANGE_OPTIONS.max}</Text>
                      </View>
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={20}
                        step={1}
                        value={editedProfile.buyerPreferences?.ageRange?.min ?? profile.buyerPreferences?.ageRange?.min ?? 0}
                        onValueChange={(value) => handleAgeRangeChange('min', value)}
                        minimumTrackTintColor={Colors.light.primary}
                        maximumTrackTintColor="#e0e0e0"
                        thumbTintColor={Colors.light.primary}
                      />
                      <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={20}
                        step={1}
                        value={editedProfile.buyerPreferences?.ageRange?.max ?? profile.buyerPreferences?.ageRange?.max ?? AGE_RANGE_OPTIONS.max}
                        onValueChange={(value) => handleAgeRangeChange('max', value)}
                        minimumTrackTintColor={Colors.light.primary}
                        maximumTrackTintColor="#e0e0e0"
                        thumbTintColor={Colors.light.primary}
                      />
                    </View>
                  </View>
                ) : (
                  <Text style={styles.preferenceValue}>
                    {profile.buyerPreferences?.ageRange?.min ?? 0} - {profile.buyerPreferences?.ageRange?.max ?? AGE_RANGE_OPTIONS.max} years
                  </Text>
                )}
              </View>

              <View style={styles.preferenceItem}>
                <Text style={styles.preferenceLabel}>Additional Information</Text>
                {isEditing ? (
                  <View style={styles.chipGroup}>
                    {renderChip('Children', 'hasChildren', ['Yes', 'No'], getBooleanDisplayValue(profile.buyerPreferences?.hasChildren))}
                    {renderChip('Other Pets', 'hasOtherPets', ['Yes', 'No'], getBooleanDisplayValue(profile.buyerPreferences?.hasOtherPets))}
                  </View>
                ) : (
                  <View>
                    <Text style={styles.preferenceValue}>
                      Children: {getBooleanDisplayValue(profile.buyerPreferences?.hasChildren)}
                    </Text>
                    <Text style={styles.preferenceValue}>
                      Other Pets: {getBooleanDisplayValue(profile.buyerPreferences?.hasOtherPets)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <Pressable 
          onPress={signOut}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  nameContainer: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
  },
  nameInputContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  nameInputRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  nameInputWrapper: {
    flex: 1,
  },
  nameInput: {
    fontSize: 20,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  usernameInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  usernameIcon: {
    marginRight: 8,
  },
  usernameInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  roleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  roleIcon: {
    width: 24,
    textAlign: 'center',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  roleTextRed: {
    color: '#FF2D55',
  },
  preferencesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  preferencesGrid: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  preferenceItem: {
    gap: 4,
  },
  preferenceLabel: {
    fontSize: 13,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preferenceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  inputError: {
    color: '#FF3B30',
  },
  usernameLoader: {
    marginLeft: 8,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 8,
    gap: 12,
    paddingHorizontal: 2,
  },
  iconChip: {
    width: 140,
    padding: 12,
    borderRadius: 16,
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
  preferenceInput: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    color: '#333',
  },
}); 
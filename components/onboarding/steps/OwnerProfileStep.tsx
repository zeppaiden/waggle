import React, { useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { Text, Button } from '@/components/themed';
import { UserProfile, PetType } from '@/types/user';
import { Colors } from '@/constants/colors-theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '@/configs/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface OwnerProfileStepProps {
  data: Partial<UserProfile>;
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
}

const PET_TYPES: PetType[] = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'FISH', 'OTHER'];

export default function OwnerProfileStep({ data, onNext, onBack }: OwnerProfileStepProps) {
  const [petData, setPetData] = useState({
    name: '',
    type: '' as PetType,
    breed: '',
    age: '',
    photos: [] as { uri: string; fileName: string }[],
    description: '',
  });

  const [contactData, setContactData] = useState({
    contactPhone: data.phoneNumber || '',
    contactEmail: data.email || '',
    preferredContact: 'both' as 'phone' | 'email' | 'both',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const fileName = uri.split('/').pop() || Date.now().toString();
      setPetData(prev => ({
        ...prev,
        photos: [...prev.photos, { uri, fileName }],
      }));
    }
  };

  const uploadPhotos = async (petId: string) => {
    const uploadPromises = petData.photos.map(async (photo) => {
      try {
        // Convert URI to blob
        const response = await fetch(photo.uri);
        const blob = await response.blob();

        // Upload to Firebase Storage
        const photoRef = ref(storage, `pets/${petId}/photos/${photo.fileName}.jpg`);
        await uploadBytes(photoRef, blob);

        // Get download URL
        return await getDownloadURL(photoRef);
      } catch (error) {
        console.error('Error uploading photo:', error);
        throw error;
      }
    });

    return Promise.all(uploadPromises);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!petData.name.trim()) {
      newErrors.name = 'Pet name is required';
    }
    if (!petData.type) {
      newErrors.type = 'Pet type is required';
    }
    if (!petData.age.trim()) {
      newErrors.age = 'Age is required';
    }
    if (!petData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (petData.photos.length === 0) {
      newErrors.photos = 'At least one photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (validate()) {
      try {
        setIsUploading(true);
        const petId = Date.now().toString(); // Temporary ID
        const photoUrls = await uploadPhotos(petId);

        onNext({
          ...data,
          ownerProfile: {
            ...contactData,
            availablePets: [{
              id: petId,
              name: petData.name,
              type: petData.type,
              breed: petData.breed,
              age: parseInt(petData.age, 10),
              photos: photoUrls,
              description: petData.description,
              status: 'available',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }],
          },
        });
      } catch (error) {
        console.error('Error uploading photos:', error);
        setErrors({ photos: 'Failed to upload photos. Please try again.' });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pet Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pet Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={petData.name}
            onChangeText={(text) => setPetData(prev => ({ ...prev, name: text }))}
            placeholder="Enter pet name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pet Type</Text>
          <View style={styles.chipGroup}>
            {PET_TYPES.map(type => (
              <Pressable
                key={type}
                style={[
                  styles.chip,
                  petData.type === type && styles.selectedChip,
                ]}
                onPress={() => setPetData(prev => ({ ...prev, type }))}
              >
                <Text style={[
                  styles.chipText,
                  petData.type === type && styles.selectedChipText,
                ]}>
                  {type.charAt(0) + type.slice(1).toLowerCase()}
                </Text>
              </Pressable>
            ))}
          </View>
          {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Breed (Optional)</Text>
          <TextInput
            style={styles.input}
            value={petData.breed}
            onChangeText={(text) => setPetData(prev => ({ ...prev, breed: text }))}
            placeholder="Enter breed"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Age (in years)</Text>
          <TextInput
            style={[styles.input, errors.age && styles.inputError]}
            value={petData.age}
            onChangeText={(text) => setPetData(prev => ({ ...prev, age: text }))}
            placeholder="Enter age"
            keyboardType="number-pad"
          />
          {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Photos</Text>
          <View style={styles.photoGrid}>
            {petData.photos.map((photo, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri: photo.uri }} style={styles.photo} />
                <Pressable
                  style={styles.removePhoto}
                  onPress={() => setPetData(prev => ({
                    ...prev,
                    photos: prev.photos.filter((_, i) => i !== index),
                  }))}
                >
                  <Ionicons name="close-circle" size={24} color="#ff3b30" />
                </Pressable>
              </View>
            ))}
            <Pressable 
              style={[
                styles.addPhoto,
                isUploading && styles.addPhotoDisabled
              ]} 
              onPress={pickImage}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#666" />
              ) : (
                <Ionicons name="add" size={32} color="#666" />
              )}
            </Pressable>
          </View>
          {errors.photos && <Text style={styles.errorText}>{errors.photos}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, errors.description && styles.inputError]}
            value={petData.description}
            onChangeText={(text) => setPetData(prev => ({ ...prev, description: text }))}
            placeholder="Tell us about your pet"
            multiline
            numberOfLines={4}
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Preferences</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preferred Contact Method</Text>
          <View style={styles.chipGroup}>
            {[
              { value: 'phone', label: 'Phone' },
              { value: 'email', label: 'Email' },
              { value: 'both', label: 'Both' },
            ].map(({ value, label }) => (
              <Pressable
                key={value}
                style={[
                  styles.chip,
                  contactData.preferredContact === value && styles.selectedChip,
                ]}
                onPress={() => setContactData(prev => ({
                  ...prev,
                  preferredContact: value as 'phone' | 'email' | 'both',
                }))}
              >
                <Text style={[
                  styles.chipText,
                  contactData.preferredContact === value && styles.selectedChipText,
                ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

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
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
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
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
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
  addPhotoDisabled: {
    opacity: 0.5,
  },
}); 
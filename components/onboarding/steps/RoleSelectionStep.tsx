import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from '@/components/themed';
import { UserProfile, UserRole } from '@/types/user';
import { Colors } from '@/constants/colors-theme';
import { Ionicons } from '@expo/vector-icons';

interface RoleSelectionStepProps {
  data: Partial<UserProfile>;
  onNext: (data: Partial<UserProfile>) => void;
}

export default function RoleSelectionStep({ data, onNext }: RoleSelectionStepProps) {
  const handleRoleSelect = (role: UserRole) => {
    onNext({
      ...data,
      role,
    });
  };

  const RoleCard = ({ role, title, description, icon }: {
    role: UserRole;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) => (
    <Pressable
      style={styles.card}
      onPress={() => handleRoleSelect(role)}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={40} color={Colors.light.primary} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How would you like to use Waggle?</Text>
      <Text style={styles.subtitle}>Choose your primary role</Text>

      <View style={styles.cardsContainer}>
        <RoleCard
          role="buyer"
          title="I want to adopt"
          description="Browse available pets and find your perfect match"
          icon="heart-outline"
        />

        <RoleCard
          role="owner"
          title="I have pets to rehome"
          description="List your pets and find them loving homes"
          icon="paw-outline"
        />

        <RoleCard
          role="both"
          title="Both"
          description="I want to both adopt and list pets"
          icon="sync-outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
}); 
import React from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { Text } from '@/components/themed';
import { UserProfile, UserRole } from '@/types/user';
import { Colors } from '@/constants/colors-theme';
import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';

interface RoleSelectionStepProps {
  data: Partial<UserProfile>;
  onNext: (data: Partial<UserProfile>) => void;
  onBack: () => void;
}

export default function RoleSelectionStep({ data, onNext, onBack }: RoleSelectionStepProps) {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={onBack}
        >
          <ArrowLeft size={24} color="#666" strokeWidth={1.5} />
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>How would you like to use Waggle?</Text>
        <Text style={styles.subtitle}>Choose your primary role</Text>

        <View style={styles.cardsContainer}>
          <RoleCard
            role="buyer"
            title="I want to adopt"
            description="Browse available pets and find your perfect match"
            icon="heart-outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.light.primary,
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
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.light.primary,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
}); 
import { View, StyleSheet, Pressable, Text as RNText, ScrollView } from 'react-native';
import { Text } from '@/components/themed';
import { Colors } from '@/constants/colors-theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/contexts/auth';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/configs/firebase';
import { UserProfile } from '@/types/user';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const renderSection = (title: string, content: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {content}
    </View>
  );

  const renderPreferences = () => {
    if (!profile?.buyerPreferences) return null;
    const prefs = profile.buyerPreferences;

    return (
      <>
        {prefs.petTypes.length > 0 && (
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Interested in:</Text>
            <View style={styles.tagContainer}>
              {prefs.petTypes.map((type, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{type.toLowerCase()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {prefs.sizePreferences.length > 0 && (
          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceLabel}>Size preferences:</Text>
            <View style={styles.tagContainer}>
              {prefs.sizePreferences.map((size, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{size}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Activity level:</Text>
          <Text style={styles.preferenceValue}>{prefs.activityLevel}</Text>
        </View>
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Experience:</Text>
          <Text style={styles.preferenceValue}>{prefs.experienceLevel}</Text>
        </View>
        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Maximum distance:</Text>
          <Text style={styles.preferenceValue}>{prefs.maxDistance} miles</Text>
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text>Error loading profile</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        {renderSection('Personal Information', (
          <>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color={Colors[theme].text} />
              <Text style={styles.infoText}>
                {profile.firstName} {profile.lastName}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="at-outline" size={20} color={Colors[theme].text} />
              <Text style={styles.infoText}>{profile.username}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={Colors[theme].text} />
              <Text style={styles.infoText}>{profile.email}</Text>
            </View>
            {profile.phoneNumber && (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={Colors[theme].text} />
                <Text style={styles.infoText}>{profile.phoneNumber}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={Colors[theme].text} />
              <Text style={styles.infoText}>
                {profile.address?.city}, {profile.address?.state} {profile.address?.zipCode}
              </Text>
            </View>
          </>
        ))}

        {renderSection('Role', (
          <View style={styles.roleContainer}>
            <Ionicons 
              name={profile.role === 'buyer' ? 'heart-outline' : 
                    profile.role === 'owner' ? 'paw-outline' : 'sync-outline'} 
              size={24} 
              color={Colors[theme].primary} 
            />
            <Text style={styles.roleText}>
              {profile.role === 'buyer' ? 'Pet Adopter' :
               profile.role === 'owner' ? 'Pet Owner' : 'Both'}
            </Text>
          </View>
        ))}

        {profile.buyerPreferences && renderSection('Preferences', renderPreferences())}

        <Pressable 
          onPress={signOut} 
          style={({ pressed }) => [
            styles.signOutButton,
            { opacity: pressed ? 0.8 : 1 },
            { backgroundColor: Colors[theme].primary }
          ]}
        >
          <View style={styles.buttonContent}>
            <Ionicons 
              name="log-out-outline" 
              size={20} 
              color="#fff"
              style={styles.buttonIcon} 
            />
            <RNText style={styles.buttonText}>Sign Out</RNText>
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.light.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    marginLeft: 12,
  },
  preferenceRow: {
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 16,
    textTransform: 'capitalize',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: Colors.light.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: Colors.light.primary,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  signOutButton: {
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 
import { useState, useEffect, useCallback } from 'react';
import { usePets } from './usePets';
import { useAuth } from '@/contexts/auth';
import { Pet } from '@/types/pet';
import { generateMatchScore, updatePetMatchScores } from '@/services/matching';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

export function useMatchedPets() {
  const { pets: allPets, loading: petsLoading, error: petsError } = usePets();
  const { user } = useAuth();
  const [matchedPets, setMatchedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateMatches = useCallback(async () => {
    if (!user) {
      setError('User must be logged in to get matches');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Get user preferences from Firestore
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        setError('User preferences not found');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      const preferences = userData.buyerPreferences;

      if (!preferences) {
        // If no preferences, show all pets with default score
        setMatchedPets(allPets.map(pet => ({ ...pet, matchScore: 50 })));
        setLoading(false);
        return;
      }

      // Only calculate scores for pets that don't have one
      const petsNeedingScores = allPets.filter(pet => typeof pet.matchScore === 'undefined');
      
      if (petsNeedingScores.length > 0) {
        console.log(`🔍 Calculating match scores for ${petsNeedingScores.length} new pets`);
        const updatedPets = await updatePetMatchScores(petsNeedingScores, preferences, user.uid);
        
        // Merge new scores with existing pets
        const mergedPets = allPets.map(pet => {
          const updatedPet = updatedPets.find(p => p.id === pet.id);
          return updatedPet || pet;
        });

        // Sort all pets by match score
        const sortedPets = mergedPets.sort((a, b) => {
          const scoreA = a.matchScore ?? 0;
          const scoreB = b.matchScore ?? 0;
          return scoreB - scoreA;
        });

        setMatchedPets(sortedPets);
      } else {
        // If all pets have scores, just sort them
        const sortedPets = [...allPets].sort((a, b) => {
          const scoreA = a.matchScore ?? 0;
          const scoreB = b.matchScore ?? 0;
          return scoreB - scoreA;
        });
        setMatchedPets(sortedPets);
      }

      setError(null);
    } catch (err) {
      console.error('Error updating matches:', err);
      setError('Failed to update matches');
    } finally {
      setLoading(false);
    }
  }, [user, allPets]);

  // Update matches when pets change or user changes
  useEffect(() => {
    if (!petsLoading && allPets.length > 0) {
      updateMatches();
    }
  }, [allPets, user, petsLoading, updateMatches]);

  return {
    pets: matchedPets,
    loading: loading || petsLoading,
    error: error || petsError,
    refresh: updateMatches
  };
} 
import { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Pet } from '@/types/pet';

export type InteractionType = 'favorite' | 'dislike';

export function useInteractions(userId: string) {
  const [interactions, setInteractions] = useState<{
    favorites: string[];
    dislikes: string[];
  }>({
    favorites: [],
    dislikes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInteractions = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setInteractions({ favorites: [], dislikes: [] });
      return;
    }
    
    try {
      setLoading(true);
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        setInteractions({
          favorites: data.favorites || [],
          dislikes: data.dislikes || []
        });
      } else {
        // Initialize user document with empty arrays
        await setDoc(doc(db, 'users', userId), {
          favorites: [],
          dislikes: []
        }, { merge: true });
        setInteractions({ favorites: [], dislikes: [] });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching interactions:', err);
      setError('Failed to fetch interactions');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch interactions on mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchInteractions();
    } else {
      setInteractions({ favorites: [], dislikes: [] });
      setLoading(false);
    }
  }, [userId, fetchInteractions]);

  // Add interaction (favorite or dislike)
  const addInteraction = useCallback(async (petId: string, type: InteractionType) => {
    if (!userId) {
      setError('Please sign in to interact with pets');
      return;
    }

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      
      // Add to the appropriate array and remove from the opposite array if present
      if (type === 'favorite') {
        await setDoc(userRef, {
          favorites: arrayUnion(petId),
          dislikes: arrayRemove(petId)
        }, { merge: true });
        
        setInteractions(prev => ({
          favorites: [...prev.favorites, petId],
          dislikes: prev.dislikes.filter(id => id !== petId)
        }));
      } else {
        await setDoc(userRef, {
          dislikes: arrayUnion(petId),
          favorites: arrayRemove(petId)
        }, { merge: true });
        
        setInteractions(prev => ({
          dislikes: [...prev.dislikes, petId],
          favorites: prev.favorites.filter(id => id !== petId)
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error adding interaction:', err);
      setError(`Failed to ${type} pet`);
    }
  }, [userId]);

  // Remove interaction
  const removeInteraction = useCallback(async (petId: string, type: InteractionType) => {
    if (!userId) {
      setError('Please sign in to manage interactions');
      return;
    }

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      
      if (type === 'favorite') {
        await setDoc(userRef, {
          favorites: arrayRemove(petId)
        }, { merge: true });
        
        setInteractions(prev => ({
          ...prev,
          favorites: prev.favorites.filter(id => id !== petId)
        }));
      } else {
        await setDoc(userRef, {
          dislikes: arrayRemove(petId)
        }, { merge: true });
        
        setInteractions(prev => ({
          ...prev,
          dislikes: prev.dislikes.filter(id => id !== petId)
        }));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error removing interaction:', err);
      setError(`Failed to remove ${type}`);
    }
  }, [userId]);

  // Check interaction status
  const hasInteraction = useCallback((petId: string, type: InteractionType) => {
    if (!userId) return false;
    return type === 'favorite' 
      ? interactions.favorites.includes(petId)
      : interactions.dislikes.includes(petId);
  }, [userId, interactions]);

  return {
    interactions,
    loading,
    error,
    addInteraction,
    removeInteraction,
    hasInteraction,
    refresh: fetchInteractions
  };
} 
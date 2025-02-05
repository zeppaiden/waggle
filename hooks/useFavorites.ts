import { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Pet } from '@/constants/mock-data';
import { usePets } from './usePets';

export function useFavorites(userId: string) {
  const [favorites, setFavorites] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pets } = usePets();

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const favoriteIds = userDoc.data().favorites || [];
        const favoritePets = pets.filter(pet => favoriteIds.includes(pet.id));
        setFavorites(favoritePets);
      } else {
        // Initialize user document with empty favorites array
        await setDoc(doc(db, 'users', userId), { favorites: [] });
        setFavorites([]);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  }, [userId, pets]);

  // Fetch favorites on mount and when pets change
  useEffect(() => {
    if (pets.length > 0) {
      fetchFavorites();
    }
  }, [pets, fetchFavorites]);

  // Add to favorites
  const addFavorite = useCallback(async (petId: string) => {
    if (!userId) return;

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        favorites: arrayUnion(petId)
      }, { merge: true });

      const newFavoritePet = pets.find(p => p.id === petId);
      if (newFavoritePet) {
        setFavorites(prev => [...prev, newFavoritePet]);
      }
    } catch (err) {
      console.error('Error adding favorite:', err);
      setError('Failed to add favorite');
    }
  }, [userId, pets]);

  // Remove from favorites
  const removeFavorite = useCallback(async (petId: string) => {
    if (!userId) return;

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        favorites: arrayRemove(petId)
      }, { merge: true });

      setFavorites(prev => prev.filter(pet => pet.id !== petId));
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError('Failed to remove favorite');
    }
  }, [userId]);

  // Check if a pet is favorited
  const isFavorite = useCallback((petId: string) => {
    return favorites.some(pet => pet.id === petId);
  }, [favorites]);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    refresh: fetchFavorites
  };
} 
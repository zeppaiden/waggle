import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { Pet } from '@/constants/mock-data';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPets() {
      try {
        const db = getFirestore();
        const petsCollection = collection(db, 'pets');
        const petsSnapshot = await getDocs(petsCollection);
        
        const petsData = petsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pet[];

        setPets(petsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching pets:', err);
        setError('Failed to fetch pets');
      } finally {
        setLoading(false);
      }
    }

    fetchPets();
  }, []);

  return { pets, loading, error };
} 
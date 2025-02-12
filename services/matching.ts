import OpenAI from 'openai';
import Constants from 'expo-constants';
import { Pet } from '@/types/pet';
import { BuyerPreferences } from '@/types/user';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const openai = new OpenAI({
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for React Native
});

const SYSTEM_PROMPT = `You are an expert pet adoption matchmaker. Your task is to evaluate the compatibility between a potential adopter and a pet by analyzing the provided pet details, adopter preferences, and interaction history.

Core Matching Philosophy:
1. Focus on potential for success rather than perfect matches
2. Consider adaptability of both pet and adopter
3. Value enthusiasm and willingness to learn
4. Recognize that preferences can be flexible
5. Acknowledge that great bonds can form despite initial preference mismatches

Factor Weights (Base Scoring):
- Species/Type Match: 15 points
- Size Compatibility: 15 points
- Activity & Space Match: 20 points
- Experience Level: 15 points
- Age & Health Match: 15 points
- Lifestyle Compatibility: 20 points

Bonus Points (Up to +15):
- Previous success with similar pets (+5)
- Strong interest in breed/species (+3)
- Willingness to learn/adapt (+3)
- Support system available (+2)
- Close to pet's location (+2)

Penalty Points (Up to -15):
- Hard restrictions that can't be overcome (-5)
- Previous negative experiences (-5)
- Incompatible living situation (-5)

Score Distribution:
90-100: Perfect Match (10%)
80-89: Excellent Match (20%)
70-79: Very Good Match (25%)
60-69: Good Match (25%)
50-59: Fair Match (15%)
30-49: Challenging Match (5%)

Output only a number between 30 and 100, with no additional text.`;

// Helper function to analyze interaction patterns
async function analyzeInteractionPatterns(
  userId: string,
  pet: Pet
): Promise<{ favoritePatterns: string, dislikePatterns: string }> {
  try {
    const db = getFirestore();
    const petsRef = collection(db, 'pets');
    
    // Get user's interactions
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    const favorites = userData?.favorites || [];
    const dislikes = userData?.dislikes || [];

    // Get details of favorited pets
    const favoritedPets = await Promise.all(
      favorites.map(async (id: string) => {
        const petDoc = await getDoc(doc(petsRef, id));
        return petDoc.data() as Pet;
      })
    );

    // Get details of disliked pets
    const dislikedPets = await Promise.all(
      dislikes.map(async (id: string) => {
        const petDoc = await getDoc(doc(petsRef, id));
        return petDoc.data() as Pet;
      })
    );

    // Analyze patterns in favorited pets
    const favoriteTraits = favoritedPets.reduce((acc, favPet) => {
      if (favPet.species === pet.species) acc.species = (acc.species || 0) + 1;
      if (favPet.size === pet.size) acc.size = (acc.size || 0) + 1;
      if (favPet.age === pet.age) acc.age = (acc.age || 0) + 1;
      favPet.interests.forEach((interest: string) => {
        if (pet.interests.includes(interest)) {
          acc.interests = (acc.interests || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Analyze patterns in disliked pets
    const dislikeTraits = dislikedPets.reduce((acc, disPet) => {
      if (disPet.species === pet.species) acc.species = (acc.species || 0) + 1;
      if (disPet.size === pet.size) acc.size = (acc.size || 0) + 1;
      if (disPet.age === pet.age) acc.age = (acc.age || 0) + 1;
      disPet.interests.forEach((interest: string) => {
        if (pet.interests.includes(interest)) {
          acc.interests = (acc.interests || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    // Format patterns for AI prompt
    const favoritePatterns = Object.entries(favoriteTraits)
      .map(([trait, count]) => {
        const percentage = Math.round(((count as number) / favoritedPets.length) * 100);
        return `${trait}: ${count}/${favoritedPets.length} (${percentage}% match)`;
      })
      .join(', ');

    const dislikePatterns = Object.entries(dislikeTraits)
      .map(([trait, count]) => {
        const percentage = Math.round(((count as number) / dislikedPets.length) * 100);
        return `${trait}: ${count}/${dislikedPets.length} (${percentage}% match)`;
      })
      .join(', ');

    // Add summary statistics
    const totalMatches = Object.values(favoriteTraits)
      .reduce((sum: number, count) => sum + (count as number), 0);
    const totalDislikes = Object.values(dislikeTraits)
      .reduce((sum: number, count) => sum + (count as number), 0);
    
    return {
      favoritePatterns: favoritePatterns 
        ? `${favoritePatterns} (Total matches: ${totalMatches})`
        : 'No favorite patterns yet',
      dislikePatterns: dislikePatterns
        ? `${dislikePatterns} (Total matches: ${totalDislikes})`
        : 'No dislike patterns yet'
    };
  } catch (error) {
    console.error('❌ Error analyzing interaction patterns:', error);
    return {
      favoritePatterns: 'Error analyzing favorites',
      dislikePatterns: 'Error analyzing dislikes'
    };
  }
}

export async function generateMatchScore(
  pet: Pet,
  preferences: BuyerPreferences,
  userId?: string
): Promise<number> {
  try {
    // Get fresh interaction patterns if userId is provided
    const patterns = userId 
      ? await analyzeInteractionPatterns(userId, pet)
      : { favoritePatterns: 'No user ID provided', dislikePatterns: 'No user ID provided' };

    // Format pet information with interaction patterns
    const petInfo = `
Pet Details:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed}
- Age: ${pet.age} years
- Size: ${pet.size}
- Location: ${pet.location}
- Activity Indicators: ${pet.interests.join(', ')}
- Description: ${pet.description}

Adopter Preferences (Current):
- Preferred Pet Types: ${preferences.petTypes.join(', ')}
- Size Preferences: ${preferences.sizePreferences.join(', ')}
- Activity Level: ${preferences.activityLevel}
- Maximum Distance: ${preferences.maxDistance}km
- Experience Level: ${preferences.experienceLevel}
- Living Space: ${preferences.livingSpace}
- Has Children: ${preferences.hasChildren}
- Has Other Pets: ${preferences.hasOtherPets}
- Age Range: ${preferences.ageRange ? `${preferences.ageRange.min}-${preferences.ageRange.max} years` : 'Any'}

Interaction History Analysis:
- Similar to Favorited Pets: ${patterns.favoritePatterns}
- Similar to Disliked Pets: ${patterns.dislikePatterns}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: petInfo }
      ],
      temperature: 0.7,
      max_tokens: 3,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const scoreText = response.choices[0].message.content?.trim() || '50';
    const score = parseFloat(scoreText);
    
    // Validate the score
    if (isNaN(score)) {
      console.warn('⚠️ Invalid score returned from AI, defaulting to 50');
      return 50;
    }
    
    // Return the raw score, constrained to 1-100 range
    return Math.min(Math.max(score, 1), 100);

  } catch (error) {
    console.error('❌ Error generating match score:', error);
    // Default to a neutral score if there's an error
    return 50;
  }
}

export async function updatePetMatchScores(
  pets: Pet[],
  preferences: BuyerPreferences,
  userId?: string
): Promise<Pet[]> {
  try {
    // Process pets in parallel with a concurrency limit
    const batchSize = 5;
    const updatedPets: Pet[] = [];
    
    for (let i = 0; i < pets.length; i += batchSize) {
      const batch = pets.slice(i, i + batchSize);
      const scores = await Promise.all(
        batch.map(pet => generateMatchScore(pet, preferences, userId))
      );
      
      updatedPets.push(
        ...batch.map((pet, index) => ({
          ...pet,
          matchScore: scores[index]
        }))
      );
    }

    // Sort by match score (highest first)
    return updatedPets.sort((a, b) => {
      const scoreA = a.matchScore ?? 0;
      const scoreB = b.matchScore ?? 0;
      return scoreB - scoreA;
    });
  } catch (error) {
    console.error('Error updating pet match scores:', error);
    return pets;
  }
} 
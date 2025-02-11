import OpenAI from 'openai';
import Constants from 'expo-constants';
import { Pet } from '@/types/pet';
import { BuyerPreferences } from '@/types/user';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const openai = new OpenAI({
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for React Native
});

const SYSTEM_PROMPT = `You are an expert pet adoption matchmaker. Your task is to evaluate the compatibility between a potential adopter and a pet.
Please analyze the provided pet details, adopter preferences, and interaction history to generate a compatibility percentage from 1 to 100, where:
1-30: Poor match (significant misalignment in key preferences)
31-60: Moderate match (some alignment with room for flexibility)
61-85: Good match (strong alignment with minor differences)
86-100: Excellent match (exceptional compatibility)

Consider these factors with their respective weights:
1. Species and size alignment (25%)
   - Species match is important but not disqualifying
   - Size within or close to preferred range
   - Partial credit for similar sizes (e.g., medium vs large)

2. Activity level and living space compatibility (20%)
   - Activity level alignment with some flexibility
   - Living space suitability with partial credit for similar spaces
   - Consider adaptability of the pet

3. Experience and care requirements (15%)
   - Experience level relative to pet's needs
   - Partial credit for close experience levels
   - Consider pet's trainability and adaptability

4. Age and location preferences (15%)
   - Age within or near preferred range
   - Location within reasonable distance
   - More forgiving for exceptional matches in other areas

5. Lifestyle compatibility (15%)
   - Children and other pets compatibility
   - Partial credit for adaptable pets
   - Consider pet's socialization history

6. Historical preference alignment (10%)
   - Similarity to favorited pets
   - Learning from past interactions
   - Pattern recognition in preferences

Scoring Guidelines:
- Output a specific percentage between 1 and 100
- Allow for high scores (90%+) when core preferences align well
- Consider the pet's adaptability and training potential
- Give partial credit for near-matches in preferences
- Factor in the strength of the match in key areas
- Consider the overall potential for a successful adoption

A score above 90% indicates an exceptionally strong match where:
- Core preferences align very well
- Any minor differences are easily manageable
- The pet's characteristics suggest high adaptability
- The match shows strong potential for a successful adoption

Output only a number between 1 and 100, with no additional text.`;

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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: petInfo }
      ],
      temperature: 0.1,
      max_tokens: 2,
      presence_penalty: -0.5,
      frequency_penalty: 0,
    });

    const scoreText = response.choices[0].message.content?.trim() || '50';
    const score = parseFloat(scoreText);

    // Log the response and normalize to 1-10 scale
    console.log('🔍 Raw OpenAI Match Score:', score);
    
    // Validate and normalize the score to 1-10 range
    if (isNaN(score)) {
      console.warn('⚠️ Invalid score returned from AI, defaulting to 5');
      return 5;
    }
    
    // Convert 1-100 scale to 1-10 scale
    const normalizedScore = (score / 10);
    console.log('🔍 Normalized Match Score (1-10):', normalizedScore);
    
    return Math.min(Math.max(normalizedScore, 1), 10);

  } catch (error) {
    console.error('❌ Error generating match score:', error);
    // Default to a neutral score if there's an error
    return 5;
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
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
Please analyze the provided pet details, adopter preferences, and interaction history to generate a precise compatibility percentage from 1 to 100.

Scoring Guidelines:
1. Use the full range of scores (1-100) with a balanced distribution
2. Avoid extreme low scores (<20) unless there are severe incompatibilities
3. Consider each factor independently before combining
4. Most matches should fall in the 40-80 range
5. Factor weights:
   - Species alignment (15%)
   - Breed compatibility (15%)
   - Size alignment (10%)
   - Activity level and living space (15%)
   - Experience and care requirements (15%)
   - Age and location preferences (15%)
   - Lifestyle compatibility (10%)
   - Historical preference alignment (5%)

Breed Compatibility Analysis:
- Consider breed-specific needs (exercise, grooming, training)
- Factor in breed temperament with living situation
- Evaluate breed-specific health considerations
- Match breed energy levels to activity preferences
- Account for breed size variations within size categories

Scoring Bands and Examples:
1-20: Severe Incompatibility (Rare)
- Wrong species AND completely incompatible size
- Breed requires expertise far beyond experience level
- Multiple major lifestyle conflicts

21-40: Basic Compatibility
- Correct species but breed needs don't align
- Some experience concerns with high-maintenance breed
- Several compromises needed

41-60: Moderate Match (Common)
- Most basic requirements met
- Breed maintenance level matches experience
- Average compatibility in key areas
- Typical first-time pet owner match

61-80: Good Match (Common)
- Strong compatibility in most areas
- Breed temperament suits lifestyle
- Good experience level for breed needs
- Positive interaction patterns
- Similar to previous successful adoptions

81-90: Excellent Match (Regular)
- Very strong compatibility
- Breed-specific needs well matched
- Great experience level
- Location and lifestyle align well
- Strong historical preference patterns

91-100: Perfect Match (Occasional)
- Exceptional compatibility across all factors
- Ideal breed match for preferences
- Perfect lifestyle fit
- Proven success with similar breeds
- Outstanding experience level

Granularity Rules:
1. Two pets should NEVER get the same score unless EXACTLY identical in ALL aspects
2. Even minor breed differences should affect the score
3. Each difference in traits must impact the score by at least 1 point
4. Consider decimal points for extremely close matches
5. Factor in subtle breed variations within same species

Remember:
- Most matches should fall between 40-80
- Scores below 20 should be rare
- Don't be overly harsh - focus on potential for success
- Consider positive factors as much as negative ones
- Every breed has unique characteristics that affect matching

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

    // Log the complete prompt being sent to the API
    console.log('🤖 Sending prompt to AI:');
    console.log('=== SYSTEM PROMPT ===');
    console.log(SYSTEM_PROMPT);
    console.log('=== PET INFO ===');
    console.log(petInfo);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: petInfo }
      ],
      temperature: 0.1,
      max_tokens: 3,
      presence_penalty: -0.5,
      frequency_penalty: 0,
    });

    const scoreText = response.choices[0].message.content?.trim() || '50';
    const score = parseFloat(scoreText);

    // Log the score
    console.log('🔍 Match Score:', score);
    
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
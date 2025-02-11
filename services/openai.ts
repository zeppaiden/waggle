import OpenAI from 'openai';
import Constants from 'expo-constants';
import { Pet } from '@/types/pet';

const openai = new OpenAI({
  apiKey: Constants.expoConfig?.extra?.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for React Native
});

const SYSTEM_PROMPT = `You are a friendly pet owner responding to messages from potential adopters. 
Your responses should be:
1. Warm and welcoming
2. Informative about the pet
3. Focused on the pet's well-being
4. Professional but conversational
5. Concise (keep responses under 100 words)
6. Strictly accurate about the pet's details (age, breed, etc.)`;

export async function generateAIResponse(
  pet: Pet,
  messageHistory: { role: 'user' | 'assistant', content: string }[],
  userMessage: string
) {
  try {
    const petInfo = `
Name: ${pet.name}
Age: ${pet.age} ${pet.age === 1 ? 'year' : 'years'} old
Breed: ${pet.breed}
Species: ${pet.species}
Size: ${pet.size}
Location: ${pet.location}
Interests: ${pet.interests.join(', ')}
Description: ${pet.description}
Owner: ${pet.owner.name}`;

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `You are ${pet.owner.name}, the owner of ${pet.name}. Here is the complete information about the pet:\n${petInfo}` },
      ...messageHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 150,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
} 
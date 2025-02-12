export type PetType = 'DOG' | 'CAT' | 'BIRD' | 'RABBIT' | 'FISH' | 'ANY';
export type SizePreference = 'small' | 'medium' | 'large' | 'any';
export type ActivityLevel = 'low' | 'moderate' | 'high' | 'any';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert';
export type LivingSpace = 'apartment' | 'house' | 'farm' | 'other';
export type UserRole = 'buyer' | 'owner' | 'both';

export interface BuyerPreferences {
  petTypes: PetType[];
  sizePreferences: SizePreference[];
  activityLevel: ActivityLevel;
  maxDistance: number;
  experienceLevel: ExperienceLevel;
  livingSpace: LivingSpace;
  hasChildren: boolean;
  hasOtherPets: boolean;
  ageRange?: {
    min: number;
    max: number;
  };
}

export interface OwnerProfile {
  contactPhone?: string;
  contactEmail?: string;
  preferredContact: 'phone' | 'email' | 'both';
  availablePets: {
    id: string;
    name: string;
    type: PetType;
    breed?: string;
    age: number;
    photos: string[];
    description: string;
    status: 'available' | 'pending' | 'adopted';
    createdAt: string;
    updatedAt: string;
  }[];
}

export interface UserProfile {
  id?: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth: string;
  address?: {
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  role: UserRole;
  buyerPreferences?: BuyerPreferences;
  ownerProfile?: OwnerProfile;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  adoptionHistory?: {
    petId: string;
    adoptedAt: string;
  }[];
} 
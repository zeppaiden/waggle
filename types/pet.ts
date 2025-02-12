export type Pet = {
  id: string;
  videoUrl: string;
  name: string;
  age: number;
  location: string;
  matchScore?: number;
  breed: string;
  description: string;
  interests: string[];
  owner: {
    id: string;
    name: string;
    verified: boolean;
  };
  photos: string[];
  species: 'dog' | 'cat' | 'bunny' | 'other';
  size: 'small' | 'medium' | 'large';
}; 
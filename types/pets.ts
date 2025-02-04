export interface VideoItem {
  id: string;
  url: string;
  petName: string;
  age: number;
  distance: string;
  score: number;
  breed: string;
  location: string;
  description: string;
  interests: string[];
  owner: {
    name: string;
    verified: boolean;
  };
  photos: string[];
} 
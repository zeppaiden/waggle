export type Pet = {
  id: string;
  videoUrl: string;
  name: string;
  age: number;
  location: string;
  matchScore: number;
  breed: string;
  description: string;
  interests: string[];
  owner: {
    name: string;
    verified: boolean;
  };
  photos: string[];
  species: 'dog' | 'cat' | 'bunny' | 'other';
  size: 'small' | 'medium' | 'large';
};

export type FavoriteFilters = {
  species?: ('dog' | 'cat' | 'bunny' | 'other')[];
  size?: ('small' | 'medium' | 'large')[];
  minMatchScore?: number;
  maxDistance?: number;
};

export const MOCK_PETS: Pet[] = [
  {
    id: '1',
    // videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    videoUrl: 'https://stream.mux.com/oZtoho3dz2lW017OMTr20002lWLkvy9dnAS6WlDmRW46Z8.m3u8',
    name: 'Max',
    age: 3,
    location: '2.5 km away',
    matchScore: 9.2,
    breed: 'Golden Retriever',
    description: 'Friendly and energetic pup who loves to play fetch and go on long walks. Great with kids and other dogs!',
    interests: ['Fetch', 'Swimming', 'Park Visits', 'Treats'],
    owner: {
      name: 'Sarah',
      verified: true,
    },
    photos: [
      'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=500',
      'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=500',
      'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=500',
    ],
    species: 'dog',
    size: 'large',
  },
  {
    id: '2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    name: 'Luna',
    age: 2,
    location: '3.1 km away',
    matchScore: 8.9,
    breed: 'Persian Cat',
    description: 'A gentle and affectionate cat who loves cuddles. Perfectly house-trained and great with other cats.',
    interests: ['Napping', 'Bird Watching', 'Laser Games', 'Treats'],
    owner: {
      name: 'Emma',
      verified: true,
    },
    photos: [
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=500',
      'https://images.unsplash.com/photo-1492370284958-c20b15c692d2?q=80&w=500',
    ],
    species: 'cat',
    size: 'small',
  },
  {
    id: '3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    name: 'Charlie',
    age: 4,
    location: '1.8 km away',
    matchScore: 9.5,
    breed: 'French Bulldog',
    description: 'Playful and social Frenchie looking for friends. Loves belly rubs and short walks in the park.',
    interests: ['Belly Rubs', 'Short Walks', 'Toys', 'Naps'],
    owner: {
      name: 'Mike',
      verified: false,
    },
    photos: [
      'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500',
      'https://images.unsplash.com/photo-1575859431774-2e57ed632664?q=80&w=500',
      'https://images.unsplash.com/photo-1620189507187-4ba2422b5979?q=80&w=500',
    ],
    species: 'dog',
    size: 'small',
  },
];

// Add species and size to existing pets
MOCK_PETS[0] = { ...MOCK_PETS[0], species: 'dog', size: 'large' };
MOCK_PETS[1] = { ...MOCK_PETS[1], species: 'cat', size: 'small' };
MOCK_PETS[2] = { ...MOCK_PETS[2], species: 'dog', size: 'small' };

// Mock favorite pets (subset of MOCK_PETS plus a few more)
export const MOCK_FAVORITE_PETS: Pet[] = [
  MOCK_PETS[0],
  MOCK_PETS[1],
  {
    id: '4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    name: 'Bella',
    age: 1,
    location: '4.2 km away',
    matchScore: 9.7,
    breed: 'Siamese Cat',
    species: 'cat',
    size: 'small',
    description: 'Sweet and playful kitten who loves attention and playing with string toys.',
    interests: ['String Toys', 'Cuddles', 'Window Watching', 'Treats'],
    owner: {
      name: 'Lisa',
      verified: true,
    },
    photos: [
      'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=500',
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=500',
      'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?q=80&w=500',
    ],
  },
  {
    id: '5',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    name: 'Rocky',
    age: 2,
    location: '1.5 km away',
    matchScore: 8.8,
    breed: 'German Shepherd',
    species: 'dog',
    size: 'large',
    description: 'Intelligent and loyal companion, great with training and outdoor activities.',
    interests: ['Training', 'Running', 'Ball Games', 'Car Rides'],
    owner: {
      name: 'John',
      verified: true,
    },
    photos: [
      'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?q=80&w=500',
      'https://images.unsplash.com/photo-1553882809-a4f57e59501d?q=80&w=500',
      'https://images.unsplash.com/photo-1578133709181-89c46154f772?q=80&w=500',
    ],
  },
]; 
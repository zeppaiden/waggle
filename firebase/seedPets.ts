import 'dotenv/config'; // This loads variables from .env into process.env
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

// Use your environment variables from .env (ensure they are named correctly)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase and get Firestore instance
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export type Pet = {
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
  species: 'dog' | 'cat' | 'other';
  size: 'small' | 'medium' | 'large';
  id?: string;
};

const pets: Pet[] = [
  {
    videoUrl: "https://stream.mux.com/oZtoho3dz2lWLkvy9dnAS6WlDmRW46Z8.m3u8",  // (dog)
    name: "Dog",
    age: 3,
    location: "2.5 km away",
    matchScore: 9.2,
    breed: "Mixed",
    description: "Friendly dog that loves to play.",
    interests: ["Fetching", "Playing"],
    owner: { name: "Alice", verified: true },
    photos: ["https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=500"],
    species: "dog",
    size: "medium",
  },
  {
    videoUrl: "https://stream.mux.com/pf5E02M3onE5EcD01SgUVSHSByQSfX01vhuiRnhgRNbMUo.m3u8",  // (golden retriever puppy)
    name: "Golden Retriever Puppy",
    age: 1,
    location: "3 km away",
    matchScore: 9.7,
    breed: "Golden Retriever",
    description: "Adorable golden retriever puppy full of energy.",
    interests: ["Cuddling", "Running"],
    owner: { name: "Bob", verified: true },
    photos: ["https://images.unsplash.com/photo-1525253086316-d0c936c814f8?q=80&w=500"],
    species: "dog",
    size: "small",
  },
  {
    videoUrl: "https://stream.mux.com/Tez02fnrHJRk7Ed5bCXZU7LAt80202MV008qTJ4bUTGwgK4.m3u8",  // (cat)
    name: "Cat",
    age: 2,
    location: "1.8 km away",
    matchScore: 8.9,
    breed: "Domestic Shorthair",
    description: "A calm and affectionate cat.",
    interests: ["Napping", "Bird Watching"],
    owner: { name: "Carol", verified: true },
    photos: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500"],
    species: "cat",
    size: "small",
  },
  {
    videoUrl: "https://stream.mux.com/Xfulos2N003eGG5O00BCZlEeHNzkt9R31IqzHHnKTuojs.m3u8",  // (puppy)
    name: "Puppy",
    age: 1,
    location: "2 km away",
    matchScore: 9.0,
    breed: "Beagle",
    description: "A playful and curious puppy.",
    interests: ["Chasing", "Barking"],
    owner: { name: "Dave", verified: true },
    photos: ["https://images.unsplash.com/photo-1575859431774-2e57ed632664?q=80&w=500"],
    species: "dog",
    size: "small",
  },
  {
    videoUrl: "https://stream.mux.com/K6kk00bK8vo9jRbiuhI01AJV01wSRlNMUvh01MsBOexRpBk.m3u8",  // (australian shepherd puppy)
    name: "Australian Shepherd Puppy",
    age: 1,
    location: "3.5 km away",
    matchScore: 9.5,
    breed: "Australian Shepherd",
    description: "Smart and active Australian shepherd puppy.",
    interests: ["Running", "Herding"],
    owner: { name: "Eve", verified: true },
    photos: ["https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=500"],
    species: "dog",
    size: "small",
  },
  {
    videoUrl: "https://stream.mux.com/GhEDe01TZ7rCtHRxXEFnsoebIItzI00N01uJAFgxdzze1U.m3u8",  // (shiba inu)
    name: "Shiba Inu",
    age: 2,
    location: "4 km away",
    matchScore: 9.3,
    breed: "Shiba Inu",
    description: "Charming and independent shiba inu.",
    interests: ["Climbing", "Exploring"],
    owner: { name: "Frank", verified: true },
    photos: ["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500"],
    species: "dog",
    size: "small",
  },
  {
    videoUrl: "https://stream.mux.com/PD7OnnFJHrjau3OGyE014jTW600qJiWAVEksdBUMuFkbo.m3u8",  // (pair of kittens)
    name: "Pair of Kittens",
    age: 1,
    location: "2.2 km away",
    matchScore: 9.1,
    breed: "Domestic Shorthair",
    description: "A delightful pair of kittens.",
    interests: ["Playing", "Sleeping"],
    owner: { name: "Grace", verified: true },
    photos: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500"],
    species: "cat",
    size: "small",
  },
  {
    videoUrl: "https://stream.mux.com/MllJ51HbiYRarltXLM8jzyqO00r5EJyLtzHjQZ7oTBug.m3u8",  // (Buck)
    name: "Buck",
    age: 4,
    location: "1 km away",
    matchScore: 9.6,
    breed: "Labrador",
    description: "Loyal and strong companion named Buck.",
    interests: ["Swimming", "Fetching"],
    owner: { name: "Henry", verified: true },
    photos: ["https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?q=80&w=500"],
    species: "dog",
    size: "large",
  },
];

async function seedPets(): Promise<void> {
  // Firestore automatically creates the collection "pets" if it doesn't exist
  const petsCollection = collection(db, "pets");
  for (const pet of pets) {
    try {
      await addDoc(petsCollection, pet);
      console.log(`Added pet: ${pet.name}`);
    } catch (error) {
      console.error("Error adding pet:", error);
    }
  }
  console.log("Seeding complete.");
}

// New function to update each pet document with a Firestore-generated id field 
// and assign a unique name based on its species.
async function updatePetsWithUniqueNames(): Promise<void> {
  const petsCollection = collection(db, "pets");
  const snapshot = await getDocs(petsCollection);

  // Track the number of pets updated per species so far, to assign unique names.
  const speciesCounters: { [key in Pet['species']]: number } = {
    cat: 0,
    dog: 0,
    other: 0,
  };

  // Define a pool of names for each species.
  const speciesNamePools: { [key in Pet['species']]: string[] } = {
    cat: ["Felix", "Garfield", "Simba", "Luna", "Whiskers", "Misty"],
    dog: ["Buddy", "Max", "Charlie", "Oscar", "Rocky", "Cooper"],
    other: ["Bailey", "Sam", "Morgan", "Alex", "Riley", "Casey"],
  };

  for (const petDoc of snapshot.docs) {
    const petData = petDoc.data() as Pet;
    // Generate a new id field using the document's ID.
    const newId = petDoc.id;
    const species = petData.species;
    let newName: string;

    // Determine which unique name to use for this document.
    const index = speciesCounters[species];
    if (index < speciesNamePools[species].length) {
      // Pick the next available name from the pool.
      newName = speciesNamePools[species][index];
    } else {
      // Fallback: if we run out of names in the pool, append the index to the first name.
      newName = `${speciesNamePools[species][0]} ${index + 1}`;
    }
    // Increase the counter for the species.
    speciesCounters[species]++;

    try {
      // Update the document with the new id field and unique name.
      await updateDoc(doc(db, "pets", petDoc.id), {
        id: newId,
        name: newName,
      });
      console.log(`Updated pet (doc id: ${petDoc.id}) to new name '${newName}' and added id '${newId}'.`);
    } catch (error) {
      console.error(`Error updating pet (doc id: ${petDoc.id}):`, error);
    }
  }
  console.log("All pets updated with unique names successfully.");
}

// Uncomment one of the following lines to seed or update your pets:

// To seed new pet documents, run:
// seedPets();

// To update existing pet documents with a new id field and assign unique names based on species, run:
updatePetsWithUniqueNames(); 
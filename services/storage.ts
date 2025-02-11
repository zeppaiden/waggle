import { storage } from '@/configs/firebase';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to verify path exists
async function verifyPathExists(path: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, path);
    await listAll(storageRef);
    return true;
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      console.log(`⚠️ Path ${path} does not exist`);
      return false;
    }
    throw error;
  }
}

async function getPhotoURLWithRetry(storageRef: any, retries = MAX_RETRIES): Promise<string> {
  try {
    // First verify the bucket is accessible
    if (!storage.app.options.storageBucket) {
      throw new Error('Storage bucket not configured');
    }

    return await getDownloadURL(storageRef);
  } catch (error: any) {
    if (retries > 0 && error.code === 'storage/object-not-found') {
      console.log(`⚠️ Photo not found, retrying... (${retries} attempts left)`);
      await delay(RETRY_DELAY);
      return getPhotoURLWithRetry(storageRef, retries - 1);
    }
    throw error;
  }
}

/**
 * Uploads a photo to Firebase Storage
 * @param file The file to upload (Blob or File)
 * @param path The path in storage where the file should be saved
 * @returns The download URL of the uploaded file
 */
export async function uploadPhoto(file: Blob, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

/**
 * Gets the download URL for a photo in Firebase Storage
 * @param path The path to the file in storage
 * @returns The download URL of the file
 */
export async function getPhotoURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await getPhotoURLWithRetry(storageRef);
  } catch (error: any) {
    console.error('❌ Error getting photo URL:', error.code, error.message);
    if (error.code === 'storage/object-not-found') {
      throw new Error('Photo not found in storage');
    } else if (error.code === 'storage/unauthorized') {
      throw new Error('Not authorized to access photo');
    } else {
      throw new Error('Failed to load photo');
    }
  }
}

/**
 * Lists all photos in a directory in Firebase Storage
 * @param directory The directory path in storage
 * @returns Array of download URLs for all photos in the directory
 */
export async function listPhotos(directory: string): Promise<string[]> {
  try {
    // First verify the bucket is accessible
    if (!storage.app.options.storageBucket) {
      console.error('❌ Storage bucket not configured');
      return [];
    }

    // Then verify the directory exists
    const pathExists = await verifyPathExists(directory);
    if (!pathExists) {
      console.log(`⚠️ Directory ${directory} does not exist, returning empty array`);
      return [];
    }

    const storageRef = ref(storage, directory);
    const res = await listAll(storageRef);
    
    if (res.items.length === 0) {
      console.log(`⚠️ No photos found in directory ${directory}`);
      return [];
    }

    const urls = await Promise.all(
      res.items.map(async (itemRef) => {
        try {
          return await getPhotoURLWithRetry(itemRef);
        } catch (error) {
          console.error(`❌ Error getting URL for item ${itemRef.fullPath}:`, error);
          return '';
        }
      })
    );

    // Filter out any failed URLs
    return urls.filter(url => url !== '');
  } catch (error: any) {
    console.error('❌ Error listing photos:', error.code, error.message);
    return []; // Return empty array for any error
  }
}

/**
 * Deletes a photo from Firebase Storage
 * @param path The path to the file in storage
 */
export async function deletePhoto(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting photo:', error);
    throw error;
  }
}

/**
 * Gets all photos for a specific pet
 * @param petId The ID of the pet
 * @returns Array of download URLs for all photos of the pet
 */
export async function getPetPhotos(petId: string): Promise<string[]> {
  const directory = `pets/${petId}/photos`;
  
  try {
    // First verify the bucket is accessible
    if (!storage.app.options.storageBucket) {
      console.error('❌ Storage bucket not configured');
      return [];
    }

    // Then verify the pet's photo directory exists
    const pathExists = await verifyPathExists(directory);
    if (!pathExists) {
      console.log(`⚠️ No photos directory found for pet ${petId}`);
      return [];
    }

    return await listPhotos(directory);
  } catch (error) {
    console.error(`❌ Error getting photos for pet ${petId}:`, error);
    return [];
  }
}

/**
 * Uploads a photo for a specific pet
 * @param petId The ID of the pet
 * @param file The photo file to upload
 * @param fileName Optional custom file name
 * @returns The download URL of the uploaded photo
 */
export async function uploadPetPhoto(
  petId: string,
  file: Blob,
  fileName?: string
): Promise<string> {
  const path = `pets/${petId}/photos/${fileName || Date.now()}.jpg`;
  return uploadPhoto(file, path);
}

/**
 * Deletes a photo for a specific pet
 * @param petId The ID of the pet
 * @param fileName The name of the file to delete
 */
export async function deletePetPhoto(
  petId: string,
  fileName: string
): Promise<void> {
  await deletePhoto(`pets/${petId}/photos/${fileName}`);
} 
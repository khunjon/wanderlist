import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { db, storage, auth } from './config';
import { User } from '@/types';

// Get user profile from Firestore
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid: docSnap.id,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        isAdmin: data.isAdmin || false,
        bio: data.bio || '',
        instagram: data.instagram || '',
        tiktok: data.tiktok || '',
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile in Firestore
export const updateUserProfile = async (
  userId: string,
  data: Partial<User>
): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, data);
    
    // Also update the Firebase Auth profile if user is currently authenticated
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, {
        displayName: data.displayName,
        photoURL: data.photoURL,
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile photo with retry logic and better error handling
export const uploadProfilePhoto = async (
  userId: string,
  file: File
): Promise<string> => {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries} for file:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });

      // Create a reference to the storage location
      const fileRef = ref(storage, `profile-photos/${userId}`);
      
      // Upload the file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
        }
      };

      // Upload with a reasonable timeout
      const uploadPromise = uploadBytes(fileRef, file, metadata);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Upload timed out after 60 seconds (attempt ${attempt})`)), 60000)
      );
      
      await Promise.race([uploadPromise, timeoutPromise]);
      console.log(`Upload successful on attempt ${attempt}`);
      
      // Get the download URL
      const downloadURLPromise = getDownloadURL(fileRef);
      const urlTimeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Getting download URL timed out after 30 seconds (attempt ${attempt})`)), 30000)
      );
      
      const photoURL = await Promise.race<string>([downloadURLPromise, urlTimeoutPromise]);
      console.log('Download URL obtained successfully');
      
      // Update user profile with new photo URL
      await updateUserProfile(userId, { photoURL });
      console.log('Profile updated with new photo URL');
      
      return photoURL;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      console.error(`Upload attempt ${attempt} failed:`, lastError.message);
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all attempts failed
  console.error('All upload attempts failed. Last error:', lastError);
  
  // Provide more specific error messages based on the error type
  if (lastError?.message.includes('timeout')) {
    throw new Error('Upload timed out. Please check your internet connection and try again with a smaller image.');
  } else if (lastError?.message.includes('storage/unauthorized')) {
    throw new Error('You do not have permission to upload files. Please try signing out and back in.');
  } else if (lastError?.message.includes('storage/canceled')) {
    throw new Error('Upload was canceled. Please try again.');
  } else if (lastError?.message.includes('storage/quota-exceeded')) {
    throw new Error('Storage quota exceeded. Please contact support.');
  } else if (lastError?.message.includes('storage/invalid-format')) {
    throw new Error('Invalid file format. Please use JPG, PNG, GIF, or WebP.');
  } else {
    throw new Error(`Failed to upload photo after ${maxRetries} attempts. Please try again later or use a different image.`);
  }
}; 
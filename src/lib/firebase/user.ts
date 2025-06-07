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

// Upload profile photo with enhanced error handling and debugging
export const uploadProfilePhoto = async (
  userId: string,
  file: File
): Promise<string> => {
  console.log('Starting photo upload process...', {
    userId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    storageApp: storage.app.name,
    authUser: auth.currentUser?.uid
  });

  // Validate inputs
  if (!userId) {
    throw new Error('User ID is required for photo upload');
  }
  
  if (!file) {
    throw new Error('File is required for photo upload');
  }

  if (!auth.currentUser) {
    throw new Error('User must be authenticated to upload photos');
  }

  if (auth.currentUser.uid !== userId) {
    throw new Error('User can only upload photos to their own profile');
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (10MB)`);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error(`File type "${file.type}" is not supported. Please use JPG, PNG, GIF, or WebP.`);
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);

      // Create a reference to the storage location
      const fileRef = ref(storage, `profile-photos/${userId}`);
      console.log('Storage reference created:', fileRef.fullPath);
      
      // Upload the file with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          uploadedBy: userId,
        }
      };

      console.log('Starting file upload...');
      
      // Upload with a reasonable timeout
      const uploadPromise = uploadBytes(fileRef, file, metadata);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Upload timed out after 60 seconds (attempt ${attempt})`)), 60000)
      );
      
      const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
      console.log(`Upload successful on attempt ${attempt}:`, {
        bytesTransferred: uploadResult.metadata.size,
        contentType: uploadResult.metadata.contentType
      });
      
      // Get the download URL
      console.log('Getting download URL...');
      const downloadURLPromise = getDownloadURL(fileRef);
      const urlTimeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Getting download URL timed out after 30 seconds (attempt ${attempt})`)), 30000)
      );
      
      const photoURL = await Promise.race<string>([downloadURLPromise, urlTimeoutPromise]);
      console.log('Download URL obtained successfully:', photoURL);
      
      // Update user profile with new photo URL
      console.log('Updating user profile with new photo URL...');
      await updateUserProfile(userId, { photoURL });
      console.log('Profile updated successfully');
      
      return photoURL;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error occurred');
      console.error(`Upload attempt ${attempt} failed:`, {
        error: lastError.message,
        stack: lastError.stack,
        code: (error as any)?.code,
        serverResponse: (error as any)?.serverResponse
      });
      
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
  
  // Provide more specific error messages based on the error type and code
  const errorMessage = lastError?.message || '';
  const errorCode = (lastError as any)?.code || '';
  
  console.log('Error analysis:', { errorMessage, errorCode });
  
  if (errorMessage.includes('timeout') || errorCode.includes('timeout')) {
    throw new Error('Upload timed out. Please check your internet connection and try again.');
  } else if (errorCode === 'storage/unauthorized' || errorMessage.includes('unauthorized')) {
    throw new Error('Permission denied. Please make sure you are signed in and try again.');
  } else if (errorCode === 'storage/canceled' || errorMessage.includes('canceled')) {
    throw new Error('Upload was canceled. Please try again.');
  } else if (errorCode === 'storage/quota-exceeded' || errorMessage.includes('quota')) {
    throw new Error('Storage quota exceeded. Please contact support.');
  } else if (errorCode === 'storage/invalid-format' || errorMessage.includes('format')) {
    throw new Error('Invalid file format. Please use JPG, PNG, GIF, or WebP.');
  } else if (errorCode === 'storage/object-not-found') {
    throw new Error('Storage location not found. Please try again.');
  } else if (errorCode === 'storage/bucket-not-found') {
    throw new Error('Storage bucket not configured. Please contact support.');
  } else if (errorCode === 'storage/project-not-found') {
    throw new Error('Firebase project not found. Please contact support.');
  } else if (errorCode === 'storage/retry-limit-exceeded') {
    throw new Error('Too many retry attempts. Please try again later.');
  } else if (errorMessage.includes('network') || errorCode.includes('network')) {
    throw new Error('Network error. Please check your internet connection and try again.');
  } else {
    // Include more details in the error for debugging
    throw new Error(`Upload failed: ${errorMessage}${errorCode ? ` (${errorCode})` : ''}. Please try again or contact support if the problem persists.`);
  }
}; 
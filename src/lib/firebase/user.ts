import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

// Upload profile photo and get the URL
export const uploadProfilePhoto = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    const fileRef = ref(storage, `profile-photos/${userId}`);
    await uploadBytes(fileRef, file);
    const photoURL = await getDownloadURL(fileRef);
    
    // Update user profile with new photo URL
    await updateUserProfile(userId, { photoURL });
    
    return photoURL;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
}; 
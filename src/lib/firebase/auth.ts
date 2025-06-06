import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  UserCredential,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '@/types';

// Register a new user with email and password
export const registerWithEmailAndPassword = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name
    if (user) {
      await updateProfile(user, { displayName });
      
      // Create a user document in Firestore
      await createUserDocument(user.uid, {
        uid: user.uid,
        email: user.email || '',
        displayName: displayName,
        createdAt: new Date(),
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Add additional scopes if needed
    provider.addScope('email');
    provider.addScope('profile');
    
    // For mobile devices or if popup is blocked, you might want to use redirect
    // But popup is generally more reliable for web apps
    let userCredential: UserCredential;
    
    try {
      // Try popup first
      userCredential = await signInWithPopup(auth, provider);
    } catch (popupError: any) {
      // If popup fails (blocked, etc.), fall back to redirect
      if (popupError.code === 'auth/popup-blocked' || 
          popupError.code === 'auth/popup-closed-by-user') {
        console.log('Popup blocked, using redirect method');
        await signInWithRedirect(auth, provider);
        
        // Note: After redirect, you need to handle the result in your app initialization
        // The redirect will take the user away from the current page
        return Promise.reject(new Error('Redirect initiated'));
      }
      throw popupError;
    }
    
    const user = userCredential.user;

    // Create a user document in Firestore if it doesn't exist
    if (user) {
      await createUserDocument(user.uid, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date(),
        bio: '',
        instagram: '',
        tiktok: '',
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const handleRedirectResult = async (): Promise<UserCredential | null> => {
  try {
    const result = await getRedirectResult(auth);
    
    if (result) {
      const user = result.user;
      
      // Create a user document in Firestore if it doesn't exist
      if (user) {
        await createUserDocument(user.uid, {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          createdAt: new Date(),
          bio: '',
          instagram: '',
          tiktok: '',
        });
      }
      
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    
    // Force a full page refresh to ensure all auth state is properly cleared
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Create a user document in Firestore
export const createUserDocument = async (
  uid: string,
  userData: User
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const existingDoc = await getDoc(userDocRef);
    
    if (existingDoc.exists()) {
      // User document already exists, only update specific fields without overwriting
      const existingData = existingDoc.data();
      await setDoc(userDocRef, {
        ...existingData, // Preserve existing data (including isAdmin)
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        // Don't overwrite createdAt or isAdmin if they already exist
        ...(existingData.createdAt ? {} : { createdAt: serverTimestamp() }),
      });
    } else {
      // New user, create the document
      await setDoc(userDocRef, {
        ...userData,
        createdAt: serverTimestamp(),
        isAdmin: false, // Default for new users
      });
    }
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

// Convert Firebase user to app user
export const convertFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || '',
    createdAt: new Date(),
    isAdmin: false, // Default to false, will be updated by getUserWithAdminStatus
    bio: '',
    instagram: '',
    tiktok: '',
  };
};

// Get user with admin status from Firestore
export const getUserWithAdminStatus = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || '',
      createdAt: userData.createdAt?.toDate() || new Date(),
      isAdmin: userData.isAdmin || false,
      bio: userData.bio || '',
      instagram: userData.instagram || '',
      tiktok: userData.tiktok || '',
    };
  } catch (error) {
    console.error('Error getting user admin status:', error);
    // Return user without admin status if there's an error
    return convertFirebaseUserToUser(firebaseUser);
  }
}; 
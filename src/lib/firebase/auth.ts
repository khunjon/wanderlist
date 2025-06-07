import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
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
  } catch (error: any) {
    console.error('Error registering user:', error);
    
    // Provide more specific error messages based on Firebase error codes
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('An account with this email already exists. Please sign in instead.');
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.');
      case 'auth/operation-not-allowed':
        throw new Error('Email/password accounts are not enabled. Please contact support.');
      case 'auth/weak-password':
        throw new Error('Password is too weak. Please choose a stronger password.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your connection and try again.');
      default:
        throw new Error('Account creation failed. Please try again.');
    }
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error: any) {
    console.error('Error signing in:', error);
    
    // Provide more specific error messages based on Firebase error codes
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('No account found with this email address.');
      case 'auth/wrong-password':
        throw new Error('Incorrect password. Please try again.');
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled. Please contact support.');
      case 'auth/too-many-requests':
        throw new Error('Too many failed login attempts. Please try again later.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your connection and try again.');
      case 'auth/invalid-credential':
        throw new Error('Invalid email or password. Please check your credentials.');
      default:
        throw new Error('Login failed. Please try again.');
    }
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider();
    
    // Add additional scopes if needed
    provider.addScope('email');
    provider.addScope('profile');
    
    // Force account selection to bypass cached credentials
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    // Use popup method instead of redirect to avoid auth handler issues
    console.log('Using popup method for Google sign-in with fresh auth');
    const result = await signInWithPopup(auth, provider);
    
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
    }
    
    return result;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Provide more specific error messages based on Firebase error codes
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        throw new Error('Sign-in was cancelled. Please try again.');
      case 'auth/popup-blocked':
        throw new Error('Pop-up was blocked by your browser. Please allow pop-ups and try again.');
      case 'auth/cancelled-popup-request':
        throw new Error('Sign-in was cancelled. Please try again.');
      case 'auth/account-exists-with-different-credential':
        throw new Error('An account already exists with this email using a different sign-in method.');
      case 'auth/auth-domain-config-required':
        throw new Error('Authentication configuration error. Please contact support.');
      case 'auth/operation-not-allowed':
        throw new Error('Google sign-in is not enabled. Please contact support.');
      case 'auth/network-request-failed':
        throw new Error('Network error. Please check your connection and try again.');
      case 'auth/unauthorized-domain':
        throw new Error('This domain is not authorized for Google sign-in. Please contact support.');
      default:
        throw new Error('Google sign-in failed. Please try again.');
    }
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    // Let the auth state change handle navigation naturally
    // The useAuth hook and components will react to the auth state change
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

// Clear Firebase auth cache and force fresh state
export const clearAuthCache = async (): Promise<void> => {
  try {
    // Sign out to clear any cached auth state
    await firebaseSignOut(auth);
    
    // Clear localStorage items related to Firebase
    if (typeof window !== 'undefined') {
      const firebaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('firebase:') || 
        key.includes('firebaseLocalStorageDb') ||
        key.includes('firebase-auth-user') ||
        key.includes('firebase-heartbeat')
      );
      
      firebaseKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Clear sessionStorage as well
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('firebase:') || 
        key.includes('firebaseLocalStorageDb')
      );
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log('Firebase auth cache cleared');
    }
  } catch (error) {
    console.error('Error clearing auth cache:', error);
  }
}; 
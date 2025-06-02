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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Create a user document in Firestore if it doesn't exist
    if (user) {
      await createUserDocument(user.uid, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        createdAt: new Date(),
      });
    }

    return userCredential;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
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
    await setDoc(doc(db, 'users', uid), {
      ...userData,
      createdAt: serverTimestamp(),
    });
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
    createdAt: new Date(),
  };
}; 
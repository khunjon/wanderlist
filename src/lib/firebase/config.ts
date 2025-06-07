// src/lib/firebase/config.ts - Simplified version without validation
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Disable Firebase debug features in production
  if (process.env.NODE_ENV === 'production') {
    // Ensure no debug or emulator features are enabled in production
    if (typeof window !== 'undefined') {
      // Remove any Firebase debug UI elements that might be injected
      const removeFirebaseDebugElements = () => {
        const debugElements = document.querySelectorAll('[data-firebase-debug], .firebase-debug, #firebase-debug');
        debugElements.forEach(element => element.remove());
      };
      
      // Remove on load and periodically check
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeFirebaseDebugElements);
      } else {
        removeFirebaseDebugElements();
      }
      
      // Check periodically for any debug elements that might be added dynamically
      setInterval(removeFirebaseDebugElements, 1000);
    }
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
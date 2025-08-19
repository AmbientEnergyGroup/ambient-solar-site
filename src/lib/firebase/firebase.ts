import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only once with lazy loading
let app: any;
let auth: any;
let db: any;
let storage: any;

// Lazy initialization function
const initializeFirebase = () => {
  if (!app) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { app, auth, db, storage };
};

// Initialize immediately but don't block
if (typeof window !== 'undefined') {
  // Use requestIdleCallback for non-blocking initialization
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => initializeFirebase());
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(initializeFirebase, 0);
  }
} else {
  // Server-side initialization
  initializeFirebase();
}

// Export getter functions for lazy loading
export const getFirebaseApp = () => {
  if (!app) initializeFirebase();
  return app;
};

export const getFirebaseAuth = () => {
  if (!auth) initializeFirebase();
  return auth;
};

export const getFirebaseDB = () => {
  if (!db) initializeFirebase();
  return db;
};

export const getFirebaseStorage = () => {
  if (!storage) initializeFirebase();
  return storage;
};

// Legacy exports for backward compatibility
export { app, auth, db, storage };

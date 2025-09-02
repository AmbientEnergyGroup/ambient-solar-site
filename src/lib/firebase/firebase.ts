import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

// Initialize Firebase only once with lazy loading
let app: any;
let auth: any;
let database: any;
let storage: any;

// Lazy initialization function
const initializeFirebase = () => {
  if (!app) {
    // Check if we have real Firebase config or just demo values
    const hasRealConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                         process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_firebase_api_key_here";
    
    if (!hasRealConfig) {
      console.warn('⚠️ Firebase not configured. Using demo values. Please set up Firebase environment variables.');
      console.warn('📖 See FIREBASE_SETUP_GUIDE.md for setup instructions.');
    }
    
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    database = getDatabase(app);
    storage = getStorage(app);
  }
  return { app, auth, database, storage };
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
  if (!database) initializeFirebase();
  return database;
};

export const getFirebaseStorage = () => {
  if (!storage) initializeFirebase();
  return storage;
};

// Legacy exports for backward compatibility
export { app, auth, database as db, storage };

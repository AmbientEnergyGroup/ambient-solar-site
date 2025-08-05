"use client";

import React, { createContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithCredential,
  updateProfile,
  User
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { 
  createUserData, 
  getUserData, 
  updateUserData, 
  subscribeToUserData,
  UserData,
  getAllUsers,
  updateUserRole as updateUserRoleInDB,
  updateUserActive as updateUserActiveInDB
} from "../firebase/firebaseUtils";

// Extended user interface with roles and profile
interface ExtendedUser extends User {
  role?: 'admin' | 'setter' | 'closer' | 'manager';
  displayName: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  userData: UserData | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, role?: 'admin' | 'setter' | 'closer' | 'manager') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendSignInLink: (email: string) => Promise<void>;
  signInWithLink: (email: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'setter' | 'closer' | 'manager') => Promise<void>;
  updateUserActive: (userId: string, active: boolean) => Promise<void>;
  getAllUsersData: () => Promise<UserData[]>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const extendedUser = firebaseUser as ExtendedUser;
        setUser(extendedUser);
        
        // Get user data from Firestore
        try {
          const data = await getUserData(firebaseUser.uid);
          setUserData(data);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in our database
      const existingUser = await getUserData(result.user.uid);
      if (!existingUser) {
        // Create new user data
        await createUserData(result.user, 'setter');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, role: 'admin' | 'setter' | 'closer' | 'manager' = 'setter') => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user data in Firestore
      await createUserData(result.user, role);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const sendSignInLink = async (email: string) => {
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/signup',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    } catch (error) {
      console.error('Error sending sign-in link:', error);
      throw error;
    }
  };

  const signInWithLink = async (email: string) => {
    try {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        await signInWithEmailLink(auth, email);
      }
    } catch (error) {
      console.error('Error signing in with link:', error);
      throw error;
    }
  };

  const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    try {
      const provider = new PhoneAuthProvider(auth);
      await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    } catch (error) {
      console.error('Error signing in with phone:', error);
      throw error;
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    try {
      if (user) {
        await updateProfile(user, { displayName, photoURL });
        // Update user data in Firestore
        if (userData) {
          await updateUserData(user.uid, {
            ...userData,
            displayName
          });
        }
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'setter' | 'closer' | 'manager') => {
    try {
      await updateUserRoleInDB(userId, role);
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  const updateUserActive = async (userId: string, active: boolean) => {
    try {
      await updateUserActiveInDB(userId, active);
    } catch (error) {
      console.error('Error updating user active status:', error);
      throw error;
    }
  };

  const getAllUsersData = async (): Promise<UserData[]> => {
    try {
      return await getAllUsers();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  };

  const value = {
    user,
    userData,
    loading,
    signInWithGoogle,
    signOut,
    signUpWithEmail,
    signInWithEmail,
    sendSignInLink,
    signInWithLink,
    signInWithPhone,
    updateUserProfile,
    updateUserRole,
    updateUserActive,
    getAllUsersData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

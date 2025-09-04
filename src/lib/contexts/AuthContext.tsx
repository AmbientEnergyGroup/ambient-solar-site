"use client";

import React, { createContext, useEffect, useState, useCallback, useMemo } from "react";
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
import { getFirebaseAuth } from "../firebase/firebase";
import { 
  createUserData, 
  getUserData, 
  updateUserData, 
  updateUserDataWithBackup,
  subscribeToUserData,
  UserData,
  getAllUsers,
  updateUserRole as updateUserRoleInDB,
  updateUserActive as updateUserActiveInDB,
  backupUserData,
  backupAllData,
  migrateUserData,
  migrateAllUsers,
  getDataIntegrityCheck
} from "../firebase/firebaseUtils";

// Extended user interface with roles and profile
interface ExtendedUser extends User {
  role?: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin';
  displayName: string | null;
}

interface AuthContextType {
  user: ExtendedUser | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, role?: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin') => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  sendSignInLink: (email: string) => Promise<void>;
  signInWithLink: (email: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  updateUserRole: (userId: string, role: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin') => Promise<void>;
  updateUserActive: (userId: string, active: boolean) => Promise<void>;
  getAllUsersData: () => Promise<UserData[]>;
  backupUserData: (userId: string) => Promise<void>;
  backupAllData: () => Promise<void>;
  migrateUserData: (userId: string) => Promise<void>;
  migrateAllUsers: () => Promise<void>;
  getDataIntegrityCheck: () => Promise<{
    users: number;
    projects: number;
    customerSets: number;
    lastBackup: string | null;
    integrityScore: number;
  }>;
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

  // Check if we're in development mode (memoized to avoid recalculation)
  const isDevelopment = useMemo(() => {
    return process.env.NODE_ENV === 'development' || 
           (typeof window !== 'undefined' && window.location.hostname === 'localhost');
  }, []);

  // Only log development mode check once per session
  useEffect(() => {
    if (isDevelopment && typeof window !== 'undefined') {
      console.log('🔍 Development mode check:', {
        NODE_ENV: process.env.NODE_ENV,
        hostname: window.location.hostname,
        isDevelopment
      });
    }
  }, [isDevelopment]);

  // Optimized auth state change handler
  const handleAuthStateChange = useCallback(async (firebaseUser: any) => {
    console.log('🔄 Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
    
    if (firebaseUser) {
      const extendedUser = firebaseUser as ExtendedUser;
      setUser(extendedUser);
      console.log('✅ User set:', extendedUser.email);
      
      // Get user data from Firestore with timeout
      try {
        console.log('🔄 Fetching user data from Firestore...');
        const data = await Promise.race([
          getUserData(firebaseUser.uid),
          new Promise<UserData | null>((_, reject) => 
            setTimeout(() => reject(new Error('Firestore timeout after 10 seconds')), 10000)
          )
        ]);
        
        if (data) {
          // Ensure support user always has admin role
          if (firebaseUser.email === 'support@ambientenergygroup.com') {
            const supportUserData = {
              ...data,
              role: 'admin' as const,
              active: true
            };
            setUserData(supportUserData);
            
            // Update the user data in Firestore if it's not already admin
            if (data.role !== 'admin') {
              try {
                await updateUserData(firebaseUser.uid, { role: 'admin' });
              } catch (error) {
                console.error('Error updating support user role:', error);
              }
            }
          } else {
            setUserData(data);
          }
        } else {
          // If no user data exists, create default user data
          console.log('No user data found, creating default user data');
          const defaultRole = firebaseUser.email === 'support@ambientenergygroup.com' ? 'admin' : 'setter';
          const defaultUserData: UserData = {
            id: firebaseUser.uid,
            role: defaultRole,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            phoneNumber: firebaseUser.phoneNumber || undefined,
            team: 'Team A',
            region: 'Region A',
            createdAt: new Date().toISOString(),
            active: true,
            dealCount: 0,
            totalCommission: 0,
            recentProjects: [],
            commissionPayments: [],
            settings: {
              notifications: true,
              theme: 'auto',
              language: 'en'
            }
          };
          
          // Try to create user data in Firestore
          try {
            await createUserData(firebaseUser, { role: defaultRole });
            setUserData(defaultUserData);
          } catch (createError) {
            console.error('Error creating user data:', createError);
            // Still set the default data locally so the UI works
            setUserData(defaultUserData);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
        console.log('🔄 Creating fallback user data...');
        
        // Create fallback user data so the UI doesn't break
        const fallbackRole = firebaseUser.email === 'support@ambientenergygroup.com' ? 'admin' : 'setter';
        const fallbackUserData: UserData = {
          id: firebaseUser.uid,
          role: fallbackRole,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          phoneNumber: firebaseUser.phoneNumber || undefined,
          team: 'Team A',
          region: 'Region A',
          createdAt: new Date().toISOString(),
          active: true,
          dealCount: 0,
          totalCommission: 0,
          recentProjects: [],
          commissionPayments: [],
          settings: {
            notifications: true,
            theme: 'auto',
            language: 'en'
          }
        };
        setUserData(fallbackUserData);
        console.log('✅ Fallback user data set');
      }
    } else {
      console.log('🔄 User logged out, clearing data');
      setUser(null);
      setUserData(null);
    }
    
    console.log('✅ Setting loading to false');
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check if Firebase is properly configured
    const hasRealFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                                 process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key" &&
                                 process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_firebase_api_key_here";

    // In development mode or if Firebase is not configured, bypass Firebase auth
    if (isDevelopment || !hasRealFirebaseConfig) {
      console.log('🚀 Development mode or Firebase not configured - bypassing Firebase auth');
      console.log('🔍 Creating fallback user...');
      
      const fallbackUser: ExtendedUser = {
        uid: 'fallback_user_123',
        email: 'support@ambientenergygroup.com',
        displayName: 'Ambient Energy Group',
        role: 'admin',
        emailVerified: true,
        isAnonymous: false,
        metadata: {} as any,
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'password',
      };
      
      const fallbackUserData: UserData = {
        id: 'fallback_user_123',
        role: 'admin',
        displayName: 'Ambient Energy Group',
        email: 'support@ambientenergygroup.com',
        phoneNumber: '+1234567890',
        team: 'Team A',
        region: 'Region A',
        payType: 'Pro',
        createdAt: new Date().toISOString(),
        active: true,
        dealCount: 0,
        totalCommission: 0,
        recentProjects: [],
        commissionPayments: [],
        settings: {
          notifications: true,
          theme: 'auto',
          language: 'en'
        }
      };
      
      setUser(fallbackUser);
      setUserData(fallbackUserData);
      setLoading(false);
      console.log('✅ Fallback user created successfully');
      return;
    }

    // Production mode with proper Firebase config - use Firebase auth
    console.log('🔄 Setting up auth state listener...');
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = auth.onAuthStateChanged(handleAuthStateChange);
      
      // Add a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('⚠️ Auth timeout - forcing loading to false');
        setLoading(false);
      }, 15000); // 15 seconds timeout
      
      return () => {
        console.log('🔄 Cleaning up auth listener...');
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Error setting up Firebase auth:', error);
      // Fallback to demo user if Firebase fails
      const fallbackUser: ExtendedUser = {
        uid: 'fallback_user_123',
        email: 'support@ambientenergygroup.com',
        displayName: 'Ambient Energy Group',
        role: 'admin',
        emailVerified: true,
        isAnonymous: false,
        metadata: {} as any,
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'password',
      };
      
      const fallbackUserData: UserData = {
        id: 'fallback_user_123',
        role: 'admin',
        displayName: 'Ambient Energy Group',
        email: 'support@ambientenergygroup.com',
        phoneNumber: '+1234567890',
        team: 'Team A',
        region: 'Region A',
        payType: 'Pro',
        createdAt: new Date().toISOString(),
        active: true,
        dealCount: 0,
        totalCommission: 0,
        recentProjects: [],
        commissionPayments: [],
        settings: {
          notifications: true,
          theme: 'auto',
          language: 'en'
        }
      };
      
      setUser(fallbackUser);
      setUserData(fallbackUserData);
      setLoading(false);
    }
  }, [handleAuthStateChange, isDevelopment]);

  const signInWithGoogle = async () => {
    // Check if Firebase is properly configured
    const hasRealFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                                 process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key" &&
                                 process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_firebase_api_key_here";

    if (!hasRealFirebaseConfig) {
      console.log('⚠️ Firebase not configured - Google sign-in not available');
      throw new Error('Authentication not available. Please contact your administrator.');
    }

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in our database
      const existingUser = await getUserData(result.user.uid);
      if (!existingUser) {
        // Create new user data
        await createUserData(result.user, { role: 'setter' });
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Domain not authorized. Please add your domain to Firebase Console.');
      } else if (error.code === 'auth/invalid-api-key') {
        throw new Error('Firebase configuration error. Please check your environment variables.');
      } else {
        throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  const signOut = async () => {
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, role: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin' = 'setter') => {
    try {
      const auth = getFirebaseAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user data in Firestore
              await createUserData(result.user, role as any);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const sendSignInLink = async (email: string) => {
    // Check if Firebase is properly configured
    const hasRealFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                                 process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key" &&
                                 process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "your_firebase_api_key_here";

    if (!hasRealFirebaseConfig) {
      console.log('⚠️ Firebase not configured - email sign-in not available');
      throw new Error('Authentication not available. Please contact your administrator.');
    }

    try {
      const auth = getFirebaseAuth();
      const actionCodeSettings = {
        url: window.location.origin + '/signup',
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    } catch (error: any) {
      console.error('Error sending sign-in link:', error);
      
      // Provide more specific error messages
      if (error.code === 'auth/invalid-api-key') {
        throw new Error('Firebase configuration error. Please check your environment variables.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('Domain not authorized. Please add your domain to Firebase Console.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.');
      } else {
        throw new Error(error.message || 'Failed to send login link. Please try again.');
      }
    }
  };

  const signInWithLink = async (email: string) => {
    try {
      const auth = getFirebaseAuth();
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
      const auth = getFirebaseAuth();
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

  const updateUserRole = async (userId: string, role: 'admin' | 'setter' | 'closer' | 'manager' | 'region_admin' | 'office_admin' | 'owner_admin') => {
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
    isAdmin: userData?.role === 'admin' || userData?.role === 'owner_admin' || user?.email === 'support@ambientenergygroup.com',
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
    getAllUsersData,
    backupUserData,
    backupAllData,
    migrateUserData,
    migrateAllUsers,
    getDataIntegrityCheck
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

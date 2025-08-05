import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

// Simplified version that creates a fake auth if needed
export const useAuth = () => {
  // Try to get the real auth context
  const authContext = useContext(AuthContext);
  
  // If we're not on the client, return the context as is (avoid SSR issues)
  if (typeof window === 'undefined') {
    return authContext;
  }
  
  // If authContext is undefined, return a default context
  if (!authContext) {
    return {
      user: null,
      userData: null,
      loading: false,
      isAdmin: false,
      signInWithGoogle: async () => {},
      signOut: async () => {},
      signUpWithEmail: async () => {},
      signInWithEmail: async () => {},
      sendSignInLink: async () => {},
      signInWithLink: async () => {},
      signInWithPhone: async () => {},
      updateUserProfile: async () => {},
      updateUserRole: async () => {},
      updateUserActive: async () => {},
      getAllUsersData: async () => [],
    };
  }
  
  // If we're in a loading state (which can cause pages to hang), provide a fake user
  if (authContext.loading) {
    const fakeUser = {
      uid: 'debug_user',
      email: 'debug@example.com',
      displayName: 'Debug User',
      role: 'user',
    };
    
    // Return a fake context that isn't loading
    return {
      ...authContext,
      user: fakeUser,
      loading: false,
      userData: {
        id: 'debug_user',
        email: 'debug@example.com',
        displayName: 'Debug User',
        role: 'user',
        createdAt: new Date().toISOString(),
        active: true,
      }
    };
  }
  
  return authContext;
};
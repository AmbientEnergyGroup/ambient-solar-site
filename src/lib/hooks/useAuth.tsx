'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

// Define a base User type
interface User {
  uid: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'setter' | 'closer';
  // Add any other user properties as needed
}

// Define the auth context shape
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => void;
}

// Create auth context with defaults that are safe for SSR
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
});

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Function to sign out
  const signOut = () => {
    // Clear user data from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Initialize auth state on client-side only
  useEffect(() => {
    setMounted(true);
    
    // Initialize auth from localStorage
    const initAuth = () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          // For demo purposes, create a fake user if none exists
          const demoUser: User = {
            uid: 'demo-user-' + Math.random().toString(36).substr(2, 9),
            name: 'Demo User',
            email: 'demo@example.com',
            role: 'setter',
          };
          localStorage.setItem('user', JSON.stringify(demoUser));
          setUser(demoUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only run on client
    if (typeof window !== 'undefined') {
      initAuth();
    }
  }, []);

  // Create a safe value object that has the same shape on server and client
  const safeValue: AuthContextType = {
    user: mounted ? user : null,
    loading: mounted ? loading : true,
    signOut,
  };

  return <AuthContext.Provider value={safeValue}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  return useContext(AuthContext);
} 
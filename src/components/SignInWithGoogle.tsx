"use client";

import { useAuth } from '../lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInWithGoogle() {
  const { signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard when user is authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="flex items-center justify-center bg-white text-gray-700 font-semibold py-3 px-4 sm:py-2 sm:px-4 rounded-full border border-gray-300 hover:bg-gray-100 transition duration-300 ease-in-out text-sm sm:text-base w-full sm:w-auto"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
      Sign in with Google
    </button>
  );
}

"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/AuthContext';

// Lazy load heavy components
const AmbientPro = dynamic(() => import('@/components/AmbientPro'), {
  loading: () => <div className="animate-pulse bg-gray-600 h-8 w-32 rounded" />,
  ssr: false
});

const SignInWithGoogle = dynamic(() => import('@/components/SignInWithGoogle'), {
  loading: () => <div className="animate-pulse bg-gray-600 h-10 w-full rounded" />,
  ssr: false
});

const AmbientLogo = dynamic(() => import('@/components/AmbientLogo'), {
  loading: () => <div className="animate-pulse bg-gray-600 h-12 w-32 rounded" />,
  ssr: false
});

export default function Home() {
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const { user, loading, sendSignInLink, signOut } = useAuth();
  const router = useRouter();

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Note: Removed automatic redirect to dashboard
  // Users must explicitly navigate to dashboard or other pages
  // This ensures proper authentication flow

  // Optimized form submission
  const handleEmailSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('Attempting to send sign-in link to:', email);
      await sendSignInLink(email);
      console.log('Sign-in link sent successfully');
      setLinkSent(true);
      setError(null);
    } catch (err: any) {
      console.error('Error sending sign-in link:', err);
      setError(err.message || 'Failed to send login link');
    }
  }, [email, sendSignInLink]);

  const renderEmailForm = useCallback(() => (
    <>
      <form onSubmit={handleEmailSubmit}>
        {/* Email field */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <label className="text-gray-300 text-sm sm:text-base">Email</label>
          </div>
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="w-full p-3 sm:p-2 border border-gray-600 rounded focus:outline-none focus:border-cyan-500 bg-gray-800 text-white placeholder-gray-500 text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Submit button */}
        <button 
          type="submit"
          className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-4 rounded-full transition duration-200 text-base"
        >
          Send Login Link
        </button>
        
        <p className="text-center text-gray-400 mt-3 text-xs sm:text-sm">
          We'll send a magic link to log you in
        </p>
      </form>
    </>
  ), [handleEmailSubmit, email]);

  // Show loading state while checking authentication
  if (loading || !isClient) {
    return (
      <main className="flex min-h-screen flex-col items-center relative">
        <div className="absolute inset-0 z-0 bg-black"></div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center relative">
      {/* Simple chalk grey background */}
      <div className="absolute inset-0 z-0 bg-black"></div>
      
      {/* Header with logo */}
      <div className="w-full bg-black bg-opacity-80 py-4 sm:py-6 flex justify-center relative z-10">
        <div className="flex justify-center items-center w-full px-4">
          <AmbientLogo theme="dark" size="xl" />
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-sm sm:max-w-md bg-gray-600 bg-opacity-90 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg text-white">
          {user ? (
            <div className="text-center py-6 sm:py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome Back!</h2>
              <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">You're logged in as <span className="font-medium">{user.email}</span></p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-4 rounded-full transition duration-200 text-base mb-4"
              >
                Go to Dashboard
              </button>
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="text-gray-400 hover:text-gray-300 underline text-sm sm:text-base"
              >
                Sign Out
              </button>
            </div>
          ) : !linkSent ? (
            <>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
                Rep Login
              </h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-300 text-xs sm:text-sm">
                  {error}
                </div>
              )}
              
              {renderEmailForm()}

              {/* Or divider */}
              <div className="relative flex py-4 sm:py-5 items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
                <div className="flex-grow border-t border-gray-700"></div>
              </div>

              {/* Google Sign In */}
              <div className="mb-4 sm:mb-6 flex justify-center">
                <SignInWithGoogle />
              </div>

              {/* Contact admin note */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-gray-400 text-xs sm:text-sm">
                  Access is by invitation only. Contact your administrator for an invitation.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">We've sent a link to <span className="font-medium">{email}</span></p>
              <p className="text-gray-400 text-xs sm:text-sm mb-6">
                Click the link in the email to log in to your account. The link will expire in 15 minutes.
              </p>
              <button
                onClick={() => setLinkSent(false)}
                className="text-cyan-400 hover:text-cyan-300 underline text-sm sm:text-base"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

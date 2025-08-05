"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AmbientPro from '@/components/AmbientPro';
import SignInWithGoogle from '@/components/SignInWithGoogle';
import { useAuth } from '@/lib/contexts/AuthContext';
import AmbientLogo from '@/components/AmbientLogo';

export default function Home() {
  const [email, setEmail] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, loading, sendSignInLink } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Regular login flow
    await sendSignInLink(email);
    setLinkSent(true);
  };

  const renderEmailForm = () => (
    <>
      <form onSubmit={handleEmailSubmit}>
        {/* Email field */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <label className="text-gray-300">Email</label>
          </div>
          <input 
            type="email" 
            placeholder="Enter your email" 
            className="w-full p-2 border border-gray-600 rounded focus:outline-none focus:border-amber-500 bg-gray-800 text-white placeholder-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Submit button */}
        <button 
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-full transition duration-200"
        >
          Send Login Link
        </button>
        
        <p className="text-center text-gray-400 mt-3 text-xs">
          We'll send a magic link to log you in
        </p>
      </form>
    </>
  );

  return (
    <main className="flex min-h-screen flex-col items-center relative">
      {/* Simple chalk grey background */}
      <div className="absolute inset-0 z-0 bg-gray-700"></div>
      
      {/* Header with logo */}
      <div className="w-full bg-gray-700 bg-opacity-80 py-6 flex justify-center relative z-10">
        <div className="flex justify-center items-center w-full">
          <AmbientLogo theme="dark" size="xl" />
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 relative z-10">
        <div className="w-full bg-gray-600 bg-opacity-90 p-8 rounded-lg shadow-lg text-white">
          {!linkSent ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Rep Login
              </h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-300 text-sm">
                  {error}
                </div>
              )}
              
              {renderEmailForm()}

              {/* Or divider */}
              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink mx-4 text-gray-400">or</span>
                <div className="flex-grow border-t border-gray-700"></div>
              </div>

              {/* Google Sign In */}
              <div className="mb-6 flex justify-center">
                <SignInWithGoogle />
              </div>

              {/* Contact admin note */}
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Need an account? Contact your administrator.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-300 mb-6">We've sent a link to <span className="font-medium">{email}</span></p>
              <p className="text-gray-400 text-sm mb-6">
                Click the link in the email to log in to your account. The link will expire in 15 minutes.
              </p>
              <button
                onClick={() => setLinkSent(false)}
                className="text-amber-400 hover:text-amber-300 underline"
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

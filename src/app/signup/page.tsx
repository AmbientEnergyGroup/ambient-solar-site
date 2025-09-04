"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AmbientPro from '@/components/AmbientPro';
import { useAuth } from '@/lib/contexts/AuthContext';

function SignupContent() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  const searchParams = useSearchParams();
  const inviteId = searchParams.get('inviteId');
  const oobCode = searchParams.get('oobCode');
  const router = useRouter();
  const auth = useAuth();
  const { signUpWithEmail, user, signOut, signInWithLink } = auth || {};

  // Check if this is a Firebase email link or invitation
  useEffect(() => {
    // If we have an oobCode (Firebase email link), bypass invitation system
    if (oobCode) {
      setLoading(false);
      // Allow user to proceed without invitation
      return;
    }

    // If we have an inviteId, check invitation validity
    if (inviteId) {
      const inviteKey = `invite_${inviteId}`;
      const storedInvite = localStorage.getItem(inviteKey);
      
      if (!storedInvite) {
        setError("Invitation not found or has expired. Please contact your administrator.");
        setLoading(false);
        return;
      }

      try {
        const parsedInvite = JSON.parse(storedInvite);
        
        // Check if invitation has expired
        if (new Date(parsedInvite.expires) < new Date()) {
          setError("This invitation has expired. Please contact your administrator for a new one.");
          localStorage.removeItem(inviteKey); // Clean up expired invite
          setLoading(false);
          return;
        }
        
        // Valid invite, pre-fill data
        setInviteData(parsedInvite);
        setEmail(parsedInvite.email);
        setDisplayName(parsedInvite.displayName || '');
        
        setLoading(false);
      } catch (err) {
        setError("Invalid invitation format. Please contact your administrator.");
        setLoading(false);
      }
    } else {
      // No invitation or email link - allow direct signup
      setLoading(false);
    }
  }, [inviteId, oobCode]);

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      // Don't redirect - instead show a message that they need to log out first
      setAlreadyLoggedIn(true);
      setLoading(false);
    }
  }, [user]);

  // Handle user sign out
  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    // No need to navigate away - we'll stay on this page so they can sign up
    setAlreadyLoggedIn(false);
    setLoading(false);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only validate passwords if not using Firebase email link
    if (!oobCode) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }
    
    try {
      setLoading(true);
      
      // If we have an oobCode, try to sign in with the email link
      if (oobCode) {
        await signInWithLink(email);
        setRegistrationComplete(true);
        setLoading(false);
        return;
      }
      
      // Otherwise, create a new account
      if (!inviteData && !oobCode) {
        setError("Please use the email link sent to your email address");
        setLoading(false);
        return;
      }
      
      // Create the user account
      await signUpWithEmail(email, password, inviteData?.role || 'setter');
      
      // Store additional user data like payType, userRole, and manager
      // This ensures the user starts with default values after signup
      const userId = email.replace(/[^a-zA-Z0-9]/g, '_'); // Simple ID generation based on email
      const userData = {
        id: userId,
        email: email,
        displayName: displayName,
        role: inviteData?.role || 'setter',
        createdAt: new Date().toISOString(),
        active: true,
        payType: "Intern Rep", // Default pay type
        userRole: "Setter",   // Default role
        managerName: "Asher Crosby" // Default manager
      };
      
      // Save the complete user data
      localStorage.setItem(`userData_${userId}`, JSON.stringify(userData));
      
      // Once account is created, remove the invitation
      if (inviteId) {
        localStorage.removeItem(`invite_${inviteId}`);
      }
      
      setRegistrationComplete(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  if (alreadyLoggedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center relative bg-black">
        <div className="w-full bg-black bg-opacity-80 py-6 flex justify-center relative z-10">
          <AmbientPro darkMode={true} />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 relative z-10">
          <div className="w-full bg-gray-600 p-8 rounded-lg shadow-lg text-white">
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-cyan-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-6">Already Logged In</h2>
              <p className="text-gray-300 mb-6">
                You're currently logged in as <span className="font-semibold">{user?.email}</span>.
                To accept this invitation, you need to sign out first.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSignOut}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full border border-gray-600 hover:border-gray-500 text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (registrationComplete) {
    return (
      <main className="flex min-h-screen flex-col items-center relative bg-black">
        <div className="w-full bg-black bg-opacity-80 py-6 flex justify-center relative z-10">
          <AmbientPro darkMode={true} />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 relative z-10">
          <div className="w-full bg-gray-600 p-8 rounded-lg shadow-lg text-white">
            <div className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="h-20 w-20 rounded-full bg-green-900 bg-opacity-20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Registration Complete!</h2>
              <p className="text-gray-300 mb-8">Your account has been created successfully</p>
              
              <div className="mb-8 p-4 bg-gray-900 rounded-lg text-left">
                <div className="mb-2">
                  <p className="text-gray-400 text-sm">Account Email:</p>
                  <p className="text-white font-medium">{email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Account Type:</p>
                  <p className="text-white font-medium">{inviteData?.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  Go to Login
                </button>
                <p className="text-gray-400 text-sm">
                  You'll need to sign in with your email and password
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error && !inviteData && !oobCode) {
    return (
      <main className="flex min-h-screen flex-col items-center relative bg-black">
        <div className="w-full bg-black bg-opacity-80 py-6 flex justify-center relative z-10">
          <AmbientPro darkMode={true} />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 relative z-10">
          <div className="w-full bg-gray-600 p-8 rounded-lg shadow-lg text-white">
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-2">Invalid Invitation</h2>
              <p className="text-gray-300 mb-6">{error}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center relative bg-black">
      <div className="w-full bg-black bg-opacity-80 py-6 flex justify-center relative z-10">
        <AmbientPro darkMode={true} />
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 relative z-10">
        <div className="w-full bg-gray-600 p-8 rounded-lg shadow-lg text-white">
          <div className="flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
            <h2 className="text-2xl font-bold text-white text-center">
              {oobCode ? 'Complete Login' : 'Accept Invitation'}
            </h2>
          </div>
          
          <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
            {oobCode ? (
              <p className="text-gray-300 text-sm">
                Complete your login to <span className="font-semibold text-cyan-500">Ambient Pro</span>. Enter the email address you used to request the login link.
              </p>
            ) : (
              <p className="text-gray-300 text-sm">
                You've been invited to join <span className="font-semibold text-cyan-500">Ambient Pro</span>. Complete the form below to create your account.
              </p>
            )}
            {inviteData && inviteData.email && (
              <div className="mt-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-400 text-xs">Invitation for: <span className="text-white">{inviteData.email}</span></span>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded text-red-300 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-3 border border-gray-600 rounded focus:outline-none focus:border-cyan-500 bg-gray-900 text-white disabled:opacity-75"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!inviteData} // Email comes from invitation and can't be changed
                  required
                />
                {inviteData && (
                  <p className="text-xs text-gray-400 mt-1">Email from invitation cannot be changed</p>
                )}
                {oobCode && (
                  <p className="text-xs text-cyan-400 mt-1">Enter the email address you used to request the login link</p>
                )}
              </div>
              
              {!oobCode && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-600 rounded focus:outline-none focus:border-cyan-500 bg-gray-900 text-white"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                      type="password"
                      className="w-full p-3 border border-gray-600 rounded focus:outline-none focus:border-cyan-500 bg-gray-900 text-white"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      className="w-full p-3 border border-gray-600 rounded focus:outline-none focus:border-cyan-500 bg-gray-900 text-white"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>
                </>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-4 rounded-full transition duration-200 mt-6 disabled:opacity-70"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                oobCode ? 'Complete Login' : 'Complete Registration'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
} 
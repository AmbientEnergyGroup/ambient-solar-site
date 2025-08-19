"use client";

import { useState, useEffect } from 'react';

export default function ProductionAuthCheck() {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [firebaseConfig, setFirebaseConfig] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const status: string[] = [];
      const configErrors: string[] = [];

      try {
        // Check Firebase configuration
        const config = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        setFirebaseConfig(config);

        // Check each config value
        if (!config.apiKey || config.apiKey === 'your_firebase_api_key_here') {
          configErrors.push('Firebase API Key not configured');
        }
        if (!config.authDomain || config.authDomain === 'your_project_id.firebaseapp.com') {
          configErrors.push('Firebase Auth Domain not configured');
        }
        if (!config.projectId || config.projectId === 'your_project_id') {
          configErrors.push('Firebase Project ID not configured');
        }

        if (configErrors.length > 0) {
          setAuthStatus('Configuration Error');
          setErrors(configErrors);
          return;
        }

        // Try to initialize Firebase
        try {
          const { initializeApp } = await import('firebase/app');
          const { getAuth } = await import('firebase/auth');
          
          const app = initializeApp(config);
          const auth = getAuth(app);
          
          status.push('✅ Firebase initialized successfully');
          status.push('✅ Authentication service available');
          
          // Check if we can access auth methods
          if (auth) {
            status.push('✅ Auth methods accessible');
          }
          
        } catch (firebaseError: any) {
          status.push(`❌ Firebase initialization failed: ${firebaseError.message}`);
          configErrors.push(`Firebase Error: ${firebaseError.message}`);
        }

        // Check current domain
        const currentDomain = window.location.hostname;
        status.push(`📍 Current domain: ${currentDomain}`);
        
        if (currentDomain === 'localhost' || currentDomain.includes('vercel.app')) {
          status.push('ℹ️ Make sure this domain is added to Firebase authorized domains');
        }

      } catch (error: any) {
        status.push(`❌ Configuration check failed: ${error.message}`);
        configErrors.push(`General Error: ${error.message}`);
      }

      setAuthStatus(configErrors.length > 0 ? 'Error' : 'Ready');
      setErrors(configErrors);
    };

    checkAuth();
  }, []);

  return (
    <div className="p-3 sm:p-4 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Production Auth Status</h3>
      
      <div className="mb-4">
        <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${
          authStatus === 'Ready' ? 'bg-green-900 text-green-300' :
          authStatus === 'Error' ? 'bg-red-900 text-red-300' :
          'bg-yellow-900 text-yellow-300'
        }`}>
          {authStatus}
        </span>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-900 bg-opacity-20 border border-red-500 rounded">
          <h4 className="text-red-300 font-medium mb-2">Issues Found:</h4>
          <ul className="text-sm text-red-300 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs sm:text-sm text-gray-300 space-y-2">
        <div>
          <strong>Firebase Config:</strong>
          <div className="mt-1 text-xs bg-gray-900 p-2 rounded">
            {firebaseConfig ? (
              <pre className="text-gray-400 overflow-x-auto text-xs">
                {JSON.stringify(firebaseConfig, null, 2)}
              </pre>
            ) : (
              'Loading...'
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-700 rounded">
        <h4 className="text-white font-medium mb-2 text-sm sm:text-base">To Fix:</h4>
        <ol className="text-xs sm:text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Add Firebase environment variables to Vercel</li>
          <li>Add your domain to Firebase authorized domains</li>
          <li>Enable authentication methods in Firebase Console</li>
          <li>Redeploy your Vercel app after adding environment variables</li>
        </ol>
      </div>
    </div>
  );
} 
"use client";

import { useAuth } from '../lib/contexts/AuthContext';
import { useState } from 'react';

export default function AuthDiagnostic() {
  const { user, userData, loading } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (!showDetails) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setShowDetails(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Debug Auth
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Authentication Diagnostic</h2>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-100 p-3 rounded">
                <h3 className="font-semibold text-gray-800">Loading State</h3>
                <p className="text-sm">{loading ? 'Loading...' : 'Not Loading'}</p>
              </div>
              
              <div className="bg-gray-100 p-3 rounded">
                <h3 className="font-semibold text-gray-800">User Status</h3>
                <p className="text-sm">{user ? 'Logged In' : 'Not Logged In'}</p>
              </div>
            </div>

            {user && (
              <div className="bg-blue-50 p-4 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">User Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>UID:</strong> {user.uid}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Display Name:</strong> {user.displayName || 'Not set'}</p>
                  <p><strong>Phone:</strong> {user.phoneNumber || 'Not set'}</p>
                  <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}

            {userData && (
              <div className="bg-green-50 p-4 rounded">
                <h3 className="font-semibold text-green-800 mb-2">User Data (Firestore)</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Role:</strong> {userData.role}</p>
                  <p><strong>Display Name:</strong> {userData.displayName}</p>
                  <p><strong>Active:</strong> {userData.active ? 'Yes' : 'No'}</p>
                  <p><strong>Deal Count:</strong> {userData.dealCount}</p>
                  <p><strong>Total Commission:</strong> ${userData.totalCommission}</p>
                  <p><strong>Created:</strong> {new Date(userData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {!userData && user && (
              <div className="bg-yellow-50 p-4 rounded">
                <h3 className="font-semibold text-yellow-800 mb-2">User Data Missing</h3>
                <p className="text-sm">
                  User is logged in but no user data was found in Firestore. 
                  This might be because:
                </p>
                <ul className="text-sm mt-2 list-disc list-inside">
                  <li>User data hasn't been created yet</li>
                  <li>There was an error fetching user data</li>
                  <li>Firestore connection issues</li>
                </ul>
              </div>
            )}

            <div className="bg-gray-100 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-2">Environment Check</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Firebase API Key:</strong> {process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}</p>
                <p><strong>Firebase Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing'}</p>
                <p><strong>Firebase Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing'}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Clear Storage & Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
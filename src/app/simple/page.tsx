"use client";

import { useState } from 'react';

export default function SimplePage() {
  const [email, setEmail] = useState('');

  return (
    <main className="flex min-h-screen flex-col items-center relative">
      {/* Simple chalk grey background */}
      <div className="absolute inset-0 z-0 bg-black"></div>
      
      {/* Header */}
      <div className="w-full bg-black bg-opacity-80 py-4 sm:py-6 flex justify-center relative z-10">
        <div className="flex justify-center items-center w-full px-4">
          <h1 className="text-2xl font-bold text-white">Ambient Pro</h1>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex flex-col items-center justify-center w-full px-4 sm:px-6 relative z-10">
        <div className="w-full max-w-sm sm:max-w-md bg-gray-600 bg-opacity-90 p-4 sm:p-6 md:p-8 rounded-lg shadow-lg text-white">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
            Simple Test Page
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full p-3 sm:p-2 border border-gray-600 rounded focus:outline-none focus:border-cyan-500 bg-gray-900 text-white placeholder-gray-500 text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button 
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-4 rounded-full transition duration-200 text-base"
          >
            Test Button
          </button>
          
          <p className="text-center text-gray-400 mt-3 text-xs sm:text-sm">
            This page works without Firebase
          </p>
        </div>
      </div>
    </main>
  );
} 
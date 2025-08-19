"use client";

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    setStatus('App is working! Firebase might be the issue.');
  }, []);

  return (
    <div className="min-h-screen bg-gray-700 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Test Page</h1>
        <p className="text-gray-600">{status}</p>
        <div className="mt-4">
          <a href="/" className="text-blue-500 hover:underline">Back to Home</a>
        </div>
      </div>
    </div>
  );
} 
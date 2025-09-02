"use client";

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600">If you can see this, basic routing is working!</p>
        <div className="mt-8 p-4 bg-blue-100 rounded-lg">
          <p className="text-blue-800">Current time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
} 
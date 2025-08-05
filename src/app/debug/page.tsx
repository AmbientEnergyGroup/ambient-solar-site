"use client";

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <p className="mb-4">This page is working correctly!</p>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="font-bold mb-2">Environment Info:</h2>
        <ul className="list-disc pl-5">
          <li>Next.js is running</li>
          <li>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Server-side rendering'}</li>
        </ul>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <a 
          href="/" 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Home
        </a>
        <a 
          href="/projects" 
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
        >
          Projects
        </a>
        <button
          onClick={() => {
            try {
              // Create a test user
              const testUser = {
                uid: 'test_user_123',
                email: 'test@example.com',
                displayName: 'Test User',
                role: 'user'
              };
              localStorage.setItem('currentUser', JSON.stringify(testUser));
              
              // Create user data
              const userData = {
                id: 'test_user_123',
                email: 'test@example.com',
                displayName: 'Test User',
                role: 'user',
                createdAt: new Date().toISOString(),
                active: true,
                payType: "Intern Rep",
                userRole: "Setter",
                managerName: "Asher Crosby"
              };
              localStorage.setItem('userData_test_user_123', JSON.stringify(userData));
              
              alert('Test user created!');
            } catch (err) {
              alert('Failed to create test user: ' + (err as Error).message);
            }
          }}
          className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
        >
          Create Test User
        </button>
      </div>
    </div>
  );
} 
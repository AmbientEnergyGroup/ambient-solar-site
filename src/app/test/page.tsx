export default function TestPage() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Page</h1>
        <p className="text-gray-600">If you can see this styled content, Tailwind is working!</p>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="text-sm text-gray-700">This is a test card with styling</p>
        </div>
      </div>
    </div>
  );
} 
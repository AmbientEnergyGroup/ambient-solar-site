import Link from 'next/link'
 
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Not Found</h2>
        <p className="text-gray-300 mb-4">Could not find requested resource</p>
        <Link 
          href="/" 
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}

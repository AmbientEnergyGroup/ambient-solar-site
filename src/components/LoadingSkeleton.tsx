export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-200 rounded-lg h-64"></div>
        <div className="bg-gray-200 rounded-lg h-64"></div>
        <div className="bg-gray-200 rounded-lg h-32"></div>
        <div className="bg-gray-200 rounded-lg h-32"></div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-200 rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-gray-300 rounded w-3/4 mb-4"></div>
      <div className="h-8 bg-gray-300 rounded w-full"></div>
    </div>
  );
} 
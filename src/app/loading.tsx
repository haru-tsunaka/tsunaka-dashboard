export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-4 md:py-8">
      {/* Filter tabs skeleton */}
      <div className="flex items-center gap-0.5 mb-6 md:mb-8 pb-2 border-b border-brand-border -mx-4 px-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-5 w-14 bg-gray-100 rounded mx-1" />
        ))}
      </div>

      {/* Case cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-brand-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-14 bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 w-20 bg-gray-100 rounded" />
            <div className="h-3 w-40 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

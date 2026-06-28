export default function LogLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-12 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 w-20 bg-navy/10 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>

      {/* LogForm skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-brand-border space-y-4">
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="flex gap-3">
          <div className="h-10 bg-gray-100 rounded-lg flex-1" />
          <div className="h-10 bg-gray-100 rounded-lg flex-1" />
        </div>
        <div className="h-10 bg-gray-100 rounded-lg" />
        <div className="h-20 bg-gray-100 rounded-lg" />
        <div className="h-12 bg-navy/10 rounded-lg" />
      </div>

      {/* Timeline skeleton */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-px bg-gold" />
          <div className="h-3 w-24 bg-gray-200 rounded" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-brand-border p-4">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

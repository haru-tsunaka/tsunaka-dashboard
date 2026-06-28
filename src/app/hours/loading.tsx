export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-7 w-24 bg-navy/10 rounded mb-8 animate-pulse" />
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-brand-border p-6">
            <div className="h-3 w-16 bg-gray-100 rounded mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="text-center">
                  <div className="h-3 w-16 bg-gray-100 rounded mx-auto mb-2" />
                  <div className="h-8 w-20 bg-gray-100 rounded mx-auto animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

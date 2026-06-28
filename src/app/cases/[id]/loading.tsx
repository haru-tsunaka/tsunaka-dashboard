export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-4 md:py-8 pb-12">
      <div className="h-4 w-12 bg-gray-100 rounded mb-4 md:mb-6" />

      {/* Header */}
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
        <div className="min-w-0 flex-1">
          <div className="h-6 w-48 bg-navy/10 rounded mb-2 animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-6 w-16 bg-gray-100 rounded-full" />
          <div className="h-8 w-14 bg-gray-100 rounded-lg" />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6 md:space-y-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`rounded-lg p-4 md:p-6 ${i % 2 === 1 ? 'bg-brand-bg' : ''}`}>
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="w-6 h-px bg-gold" />
              <div className="h-3 w-20 bg-gold/30 rounded" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(i === 0 ? 1 : 2)].map((_, j) => (
                <div key={j}>
                  <div className="h-3 w-16 bg-gray-100 rounded mb-1" />
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

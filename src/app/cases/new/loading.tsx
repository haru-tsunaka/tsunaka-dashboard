export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-12">
      <div className="h-4 w-12 bg-gray-100 rounded mb-4 md:mb-6" />
      <div className="h-7 w-48 bg-navy/10 rounded mb-6 md:mb-8 animate-pulse" />

      <div className="space-y-8">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-px bg-gold" />
              <div className="h-3 w-20 bg-gold/30 rounded" />
            </div>
            <div className="space-y-4">
              {[...Array(2)].map((_, j) => (
                <div key={j}>
                  <div className="h-3 w-16 bg-gray-100 rounded mb-1.5" />
                  <div className="h-10 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

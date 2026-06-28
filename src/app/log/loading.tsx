export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-12">
      <div className="h-7 w-20 bg-navy/10 rounded mb-6 animate-pulse" />
      <div className="bg-white rounded-lg border border-brand-border p-5 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i}>
            <div className="h-3 w-12 bg-gray-100 rounded mb-1.5" />
            <div className="h-10 bg-gray-100 rounded" />
          </div>
        ))}
        <div className="h-12 bg-navy/10 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

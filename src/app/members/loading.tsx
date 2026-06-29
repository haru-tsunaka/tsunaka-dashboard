export default function MembersLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="h-7 w-20 bg-navy/10 rounded" />
        <div className="h-4 w-16 bg-gray-200 rounded" />
      </div>

      {/* Owner */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        <div>
          <div className="h-4 w-36 bg-gray-200 rounded mb-1" />
          <div className="h-3 w-16 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-lg border border-brand-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-px bg-gray-200" />
          <div className="h-3 w-16 bg-gray-200 rounded" />
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="pb-4 border-b border-brand-border/50 last:border-0">
              <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded mb-3" />
              <div className="h-10 bg-gray-100 rounded-lg mb-2" />
              <div className="h-9 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

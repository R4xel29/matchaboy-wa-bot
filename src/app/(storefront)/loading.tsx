export default function StorefrontLoading() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 relative overflow-hidden animate-pulse">
      {/* Mobile Header Skeleton */}
      <div className="md:hidden h-[124px] bg-[#FAF8F5]/80 border-b border-gray-150 px-6 py-7 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-20 bg-gray-200 rounded-md" />
          <div className="h-5 w-36 bg-gray-200 rounded-md" />
        </div>
        <div className="w-11 h-11 bg-gray-200 rounded-2xl" />
      </div>

      {/* Desktop Header Skeleton */}
      <div className="hidden md:block max-w-6xl mx-auto px-6 mt-8 mb-6">
        <div className="flex items-center justify-between border-b border-gray-150 pb-6">
          <div className="space-y-2">
            <div className="h-3 w-20 bg-gray-200 rounded-md" />
            <div className="h-8 w-48 bg-gray-200 rounded-md" />
          </div>
          <div className="w-12 h-12 bg-gray-200 rounded-2xl" />
        </div>
      </div>

      {/* Hero Banner Skeleton */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-2 md:mt-6">
        <div className="w-full aspect-[2.1/1] md:aspect-[3.6/1] bg-gray-200 rounded-[2rem] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-300/40 via-transparent to-transparent flex flex-col justify-end p-5 md:p-8 space-y-3">
            <div className="h-3 w-16 bg-gray-300/60 rounded-full" />
            <div className="h-5 w-1/2 bg-gray-300/60 rounded-lg" />
            <div className="h-3 w-3/4 bg-gray-300/60 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Content Sections Skeletons */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        {/* Section 1: Combo Section */}
        <section className="bg-white rounded-[2rem] border border-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-36 bg-gray-200 rounded-lg" />
            <div className="h-3.5 w-16 bg-gray-200 rounded-lg" />
          </div>
          <div className="flex gap-4 overflow-hidden pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[145px] md:w-[175px] shrink-0 bg-white/70 border border-gray-100 rounded-3xl p-3 space-y-3">
                <div className="w-full aspect-square bg-gray-100 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-gray-200/80 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200/80 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Spesial Section */}
        <section className="bg-white rounded-[2rem] border border-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-32 bg-gray-200 rounded-lg" />
            <div className="h-3.5 w-16 bg-gray-200 rounded-lg" />
          </div>
          <div className="flex gap-4 overflow-hidden pb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[145px] md:w-[175px] shrink-0 bg-white/70 border border-gray-100 rounded-3xl p-3 space-y-3">
                <div className="w-full aspect-square bg-gray-100 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 bg-gray-200/80 rounded" />
                  <div className="h-3 w-1/2 bg-gray-200/80 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

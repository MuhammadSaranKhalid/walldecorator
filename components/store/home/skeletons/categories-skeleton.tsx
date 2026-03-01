export function CategoriesSkeleton() {
  return (
    <section className="py-16 bg-white animate-pulse">
      <div className="container mx-auto px-4">
        {/* Section header skeleton */}
        <div className="mb-8">
          <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-48 bg-gray-200 rounded" />
        </div>

        {/* Categories grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function CategoriesSkeleton() {
  return (
    <section className="py-16 bg-background animate-pulse">
      <div className="container mx-auto px-4">
        {/* Section header skeleton */}
        <div className="mb-8">
          <div className="h-4 w-24 bg-accent/20 rounded mb-2" />
          <div className="h-8 w-48 bg-accent/20 rounded" />
        </div>

        {/* Categories grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-accent/20 rounded-2xl" />
          ))}
        </div>
      </div>
    </section>
  )
}

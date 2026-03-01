export default function HomeLoading() {
  return (
    <main className="animate-pulse">
      {/* Hero skeleton */}
      <div className="min-h-[75vh] bg-secondary" />

      {/* Trust bar skeleton */}
      <div className="py-6 border-y">
        <div className="container mx-auto px-4 grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="h-8 w-48 bg-muted rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-3/4 bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Products skeleton */}
      <div className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="h-8 w-48 bg-muted rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="aspect-square bg-muted rounded-xl" />
                <div className="mt-3 h-4 bg-muted rounded" />
                <div className="mt-2 h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

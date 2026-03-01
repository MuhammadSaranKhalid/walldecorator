export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-64 bg-accent/20 rounded mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image Gallery skeleton */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square bg-accent/20 rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 h-20 bg-accent/20 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Product Info skeleton */}
        <div className="flex flex-col gap-4">
          <div className="h-8 w-3/4 bg-accent/20 rounded" />
          <div className="h-6 w-24 bg-accent/20 rounded" />
          <div className="h-12 w-full bg-accent/20 rounded-xl mt-4" />
          <div className="h-12 w-full bg-accent/20 rounded-xl" />
          <div className="h-14 w-full bg-accent/20 rounded-xl mt-2" />
        </div>
      </div>

      {/* Description skeleton */}
      <div className="mt-16">
        <div className="h-8 w-48 bg-accent/20 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-accent/20 rounded" />
          <div className="h-4 w-full bg-accent/20 rounded" />
          <div className="h-4 w-3/4 bg-accent/20 rounded" />
        </div>
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full rounded" />
            </div>
          ))}
        </aside>

        {/* Grid skeleton */}
        <main className="flex-1">
          {/* Top bar skeleton */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export function CheckoutSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Skeleton className="h-8 w-48 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Form sections skeleton */}
        <div className="space-y-8">
          {/* Contact section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Shipping section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Payment section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="rounded-lg border p-6">
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          <Skeleton className="h-12 w-full" />
        </div>

        {/* Order summary skeleton */}
        <div className="rounded-lg border bg-secondary/30 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

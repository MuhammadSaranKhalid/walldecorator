import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <Skeleton className="w-full aspect-square rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="w-full aspect-square rounded-lg" />
            <Skeleton className="w-full aspect-square rounded-lg" />
            <Skeleton className="w-full aspect-square rounded-lg" />
            <Skeleton className="w-full aspect-square rounded-lg" />
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Price */}
          <Skeleton className="h-8 w-32" />

          {/* Material Selection */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-12" />
          </div>

          {/* Share */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-16" />
              <div className="flex gap-3">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="border-t mt-8 md:mt-12 pt-8">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </main>
  );
}

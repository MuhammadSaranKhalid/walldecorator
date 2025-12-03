import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductNotFound() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <PackageOpen className="h-24 w-24 text-muted-foreground mb-6" />

        <h1 className="text-4xl font-black mb-4">Product Not Found</h1>

        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          We couldn't find the product you're looking for. It may have been removed or is currently unavailable.
        </p>

        <div className="flex gap-4">
          <Button asChild size="lg">
            <Link href="/products">
              Browse Products
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

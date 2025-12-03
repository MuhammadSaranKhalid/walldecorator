"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function ProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Product page error:", error);
  }, [error]);

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong!</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message || "An error occurred while loading this product."}
          </AlertDescription>
        </Alert>

        <div className="flex gap-4 mt-8">
          <Button
            onClick={reset}
            variant="default"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = "/products"}
            variant="outline"
          >
            Back to Products
          </Button>
        </div>

        {error.digest && (
          <p className="mt-4 text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </main>
  );
}

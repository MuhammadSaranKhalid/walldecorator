"use client";

import { useState } from "react";
import { Blurhash } from "react-blurhash";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BlurhashImageProps {
  src: string;
  alt: string;
  blurhash?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  sizes?: string;
}

/**
 * BlurhashImage Component
 *
 * A progressive image loading component that displays a blurhash
 * placeholder while the actual image loads.
 *
 * Features:
 * - Shows blurhash placeholder during image load
 * - Smooth fade-in transition when image loads
 * - Responsive image loading with srcset support
 * - Fallback to solid color if no blurhash provided
 * - Supports all Next.js Image props
 */
export function BlurhashImage({
  src,
  alt,
  blurhash,
  width,
  height,
  className,
  fill = false,
  priority = false,
  objectFit = "cover",
  sizes,
}: BlurhashImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden w-full h-full", className)}>
      {/* Blurhash Placeholder */}
      {blurhash && !isLoaded && !imageError && (
        <Blurhash
          hash={blurhash}
          width="100%"
          height="100%"
          resolutionX={32}
          resolutionY={32}
          punch={1}
          className="absolute inset-0"
        />
      )}

      {/* Fallback background if no blurhash */}
      {!blurhash && !isLoaded && !imageError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Actual Image */}
      {!imageError && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          sizes={sizes}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            fill && "object-cover"
          )}
          style={!fill ? { objectFit } : undefined}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setImageError(true);
            console.error(`Failed to load image: ${src}`);
          }}
        />
      )}

      {/* Error State */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground text-sm">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Image failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
}

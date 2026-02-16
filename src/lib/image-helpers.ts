/**
 * Image variant selection helpers
 *
 * Based on the image processing system that generates these variants:
 * - thumbnail: 400px width (WebP) - for small cards, thumbnails
 * - medium: 800px width (WebP) - for medium displays, tablets
 * - large: 1200px width (WebP) - for large displays, detail views
 * - original: uploaded size - fallback only
 */

export interface ImageWithVariants {
  original_url: string;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  blurhash?: string | null;
  alt_text?: string | null;
}

export type ImageSize = 'thumbnail' | 'medium' | 'large' | 'original';

/**
 * Get the best available image URL for a specific size
 * Falls back to the next available size if the requested size doesn't exist
 */
export function getImageUrl(
  image: ImageWithVariants | undefined | null,
  preferredSize: ImageSize = 'medium'
): string {
  if (!image) return '';

  switch (preferredSize) {
    case 'thumbnail':
      // For thumbnails, prefer thumbnail, fall back to medium, large, then original
      return (
        image.thumbnail_url ||
        image.medium_url ||
        image.large_url ||
        image.original_url
      );

    case 'medium':
      // For medium, prefer medium, fall back to large, thumbnail, then original
      return (
        image.medium_url ||
        image.large_url ||
        image.thumbnail_url ||
        image.original_url
      );

    case 'large':
      // For large, prefer large, fall back to medium, then original (skip thumbnail)
      return (
        image.large_url ||
        image.medium_url ||
        image.original_url
      );

    case 'original':
      // For original, use original or fall back to largest available
      return (
        image.original_url ||
        image.large_url ||
        image.medium_url ||
        image.thumbnail_url ||
        ''
      );

    default:
      return image.medium_url || image.original_url;
  }
}

/**
 * Get responsive sizes attribute for Next.js Image component
 * Based on common use cases in the application
 */
export function getImageSizes(context: 'card' | 'hero' | 'detail-main' | 'detail-thumb' | 'cart'): string {
  switch (context) {
    case 'card':
      // Product cards in grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
      return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

    case 'hero':
      // Hero images take full width
      return '100vw';

    case 'detail-main':
      // Product detail main image: full width mobile, half width desktop
      return '(max-width: 1024px) 100vw, 50vw';

    case 'detail-thumb':
      // Fixed size thumbnails in gallery
      return '96px';

    case 'cart':
      // Small cart preview images
      return '80px';

    default:
      return '100vw';
  }
}

/**
 * Get the optimal image size based on context and viewport
 * Returns the ImageSize that should be requested
 */
export function getOptimalImageSize(context: 'card' | 'hero' | 'detail-main' | 'detail-thumb' | 'cart'): ImageSize {
  switch (context) {
    case 'card':
      // Product cards are small, use thumbnail (400px)
      return 'thumbnail';

    case 'hero':
      // Hero images are large, use large variant (1200px)
      return 'large';

    case 'detail-main':
      // Product detail main image should be high quality
      return 'large';

    case 'detail-thumb':
      // Thumbnail selector should use thumbnail
      return 'thumbnail';

    case 'cart':
      // Cart preview is small
      return 'thumbnail';

    default:
      return 'medium';
  }
}

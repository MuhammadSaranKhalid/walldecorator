/**
 * Get public URL for a file in Supabase Storage using the official SDK method
 * @param path - The storage path (e.g., "products/image.jpg")
 * @param bucket - The storage bucket name (default: "product-images")
 * @returns Public URL for the asset
 */
export function getStorageUrl(path: string, bucket: string = 'product-images'): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl || !path) {
    return '/placeholder.jpg' // Fallback placeholder image
  }

  // Use the official Supabase URL pattern for public buckets
  // This ensures CDN caching and proper handling
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Get optimized image URL with transformations
 * @param path - The storage path
 * @param bucket - The storage bucket name (default: "product-images")
 * @param options - Transformation options (width, height, quality)
 */
export function getOptimizedImageUrl(
  path: string,
  bucket: string = 'product-images',
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpg'
  } = {}
): string {
  const baseUrl = getStorageUrl(path, bucket)
  const params = new URLSearchParams()

  if (options.width) params.set('width', options.width.toString())
  if (options.height) params.set('height', options.height.toString())
  if (options.quality) params.set('quality', options.quality.toString())
  if (options.format) params.set('format', options.format)

  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Get public URL for custom order images
 * @param path - The storage path
 */
export function getCustomOrderImageUrl(path: string): string {
  return getStorageUrl(path, 'custom-orders')
}

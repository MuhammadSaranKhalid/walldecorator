const DEFAULT_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='

/**
 * Converts a BlurHash string to a base64 data URL for use as image placeholder
 * Works in both server and client components
 * @returns Base64 data URL placeholder
 */
export function blurhashToDataURL(): string {
  // Always return the default blur for now to prevent hydration mismatches
  // TODO: Implement server-side blurhash rendering using sharp or similar
  return DEFAULT_BLUR_DATA_URL
}

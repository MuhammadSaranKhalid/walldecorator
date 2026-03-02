import { decode } from 'blurhash'

/**
 * Decodes a BlurHash string into a base64 PNG data URL for use as Next.js <Image> blurDataURL.
 *
 * Returns `undefined` if no hash is provided or if running server-side (no canvas).
 * Pair with `placeholder="blur"` only when this returns a value.
 */
export function blurhashToDataURL(
  blurhash: string | null | undefined,
  width = 32,
  height = 32
): string | undefined {
  if (!blurhash) return undefined
  if (typeof document === 'undefined') return undefined

  try {
    const pixels = decode(blurhash, width, height)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined
    const imageData = ctx.createImageData(width, height)
    imageData.data.set(pixels)
    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL('image/png')
  } catch (e) {
    console.warn('[blurhash] Failed to decode:', blurhash, e)
    return undefined
  }
}

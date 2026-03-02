'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/supabase/storage'
import type { ProductDetailImage } from '@/types/products'
import { blurhashToDataURL } from '@/lib/blurhash'

type ProductGalleryProps = {
  images: ProductDetailImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })

  const activeImage = sorted[activeIndex] || sorted[0]
  const activeBlurUrl = activeImage ? blurhashToDataURL(activeImage.blurhash) : undefined

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  if (!activeImage) {
    return (
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
          <div className="flex items-center justify-center h-full text-gray-400">
            No images available
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Image
          src={getStorageUrl(activeImage.storage_path)}
          alt={activeImage.alt_text || productName}
          fill
          loading="eager"
          quality={90}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={`object-cover transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'
            }`}
          style={
            isZoomed
              ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
              : undefined
          }
          {...(activeBlurUrl ? { placeholder: 'blur', blurDataURL: activeBlurUrl } : {})}
        />
      </div>

      {/* Thumbnail Row */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((image, index) => {
            const thumbBlurUrl = blurhashToDataURL(image.blurhash)
            return (
              <button
                key={image.id}
                onClick={() => setActiveIndex(index)}
                className={`
                  relative shrink-0 w-20 h-20 rounded-lg overflow-hidden
                  border-2 transition-colors
                  ${index === activeIndex
                    ? 'border-black'
                    : 'border-transparent hover:border-gray-300'
                  }
                `}
              >
                <Image
                  src={getStorageUrl(image.storage_path)}
                  alt={image.alt_text || `${productName} view ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  quality={50}
                  {...(thumbBlurUrl ? { placeholder: 'blur', blurDataURL: thumbBlurUrl } : {})}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

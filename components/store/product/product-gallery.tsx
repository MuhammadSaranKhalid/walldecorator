'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/supabase/storage'
import type { ProductDetailImage } from '@/types/products'
import { blurhashToDataURL } from '@/lib/blurhash'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from '@/components/ui/carousel'

type ProductGalleryProps = {
  images: ProductDetailImage[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = images.toSorted((a, b) => a.display_order - b.display_order)

  const [activeIndex, setActiveIndex] = useState(0)
  const [api, setApi] = useState<CarouselApi>()

  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })

  // Sync Carousel selection -> Thumbnails
  useEffect(() => {
    if (!api) return
    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap())
      setIsZoomed(false) // reset zoom when swiping
    }
    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const handleThumbnailClick = useCallback(
    (index: number) => {
      if (!api) return
      api.scrollTo(index)
      setActiveIndex(index)
    },
    [api]
  )

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  if (sorted.length === 0) {
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
      {/* Main Image Carousel */}
      <div
        className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 cursor-zoom-in"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent className="ml-0">
            {sorted.map((image, index) => {
              const blurUrl = blurhashToDataURL(image.blurhash)
              // Only apply zoom styling if this is the currently active image being hovered
              const isCurrentlyZooming = isZoomed && index === activeIndex

              return (
                <CarouselItem key={image.id} className="pl-0 basis-full">
                  <div
                    suppressHydrationWarning
                    className={`relative w-full aspect-square transition-transform duration-200 ${isCurrentlyZooming ? 'scale-150' : 'scale-100'
                      }`}
                    style={
                      isCurrentlyZooming
                        ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
                        : undefined
                    }
                  >
                    <Image
                      src={getStorageUrl(image.storage_path)}
                      alt={image.alt_text || `${productName} image ${index + 1}`}
                      fill
                      priority={index === 0}
                      quality={90}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      {...(blurUrl ? { placeholder: 'blur', blurDataURL: blurUrl } : {})}
                    />
                  </div>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Thumbnail Row */}
      {sorted.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {sorted.map((image, index) => {
            const thumbBlurUrl = blurhashToDataURL(image.blurhash)
            return (
              <button
                key={image.id}
                onClick={() => handleThumbnailClick(index)}
                className={`
                  relative shrink-0 w-20 h-20 rounded-lg overflow-hidden
                  border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${index === activeIndex
                    ? 'border-black'
                    : 'border-transparent hover:border-gray-300'
                  }
                `}
                aria-label={`Select ${productName} image ${index + 1}`}
                aria-current={index === activeIndex}
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
      ) : null}
    </div>
  )
}

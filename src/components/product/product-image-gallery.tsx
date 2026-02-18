"use client";

import { useState } from "react";
import { BlurhashImage } from "@/components/ui/blurhash-image";
import { getImageUrl, getImageSizes } from "@/lib/image-helpers";

interface ProductImage {
    id: string;
    original_url: string;
    alt_text?: string;
    thumbnail_url?: string;
    medium_url?: string;
    large_url?: string;
    blurhash?: string;
    display_order: number;
}

interface ProductImageGalleryProps {
    images: ProductImage[];
    productName: string;
}

export function ProductImageGallery({
    images,
    productName,
}: ProductImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);

    const sortedImages = [...images].sort(
        (a, b) => a.display_order - b.display_order
    );

    const currentImageData = sortedImages[selectedImage];

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image - Use large variant (1200px) for high quality detail view */}
            <div className="relative w-full aspect-3/4 rounded-xl overflow-hidden shadow-sm">
                <BlurhashImage
                    src={getImageUrl(currentImageData, 'large')}
                    alt={currentImageData?.alt_text || productName}
                    blurhash={currentImageData?.blurhash || undefined}
                    fill
                    sizes={getImageSizes('detail-main')}
                    priority
                    objectFit="cover"
                />
            </div>

            {/* Thumbnail Gallery - Use thumbnail variant (400px) for small previews */}
            {sortedImages.length > 1 && (
                <div className="flex overflow-x-auto gap-3 pb-2">
                    {sortedImages.map((image, index) => (
                        <button
                            key={image.id}
                            onClick={() => setSelectedImage(index)}
                            className={`relative shrink-0 w-24 aspect-square rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === index
                                    ? "border-primary"
                                    : "border-transparent hover:border-primary/50"
                                }`}
                        >
                            <BlurhashImage
                                src={getImageUrl(image, 'thumbnail')}
                                alt={
                                    image.alt_text || `${productName} view ${index + 1}`
                                }
                                blurhash={image.blurhash || undefined}
                                fill
                                sizes={getImageSizes('detail-thumb')}
                                objectFit="cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

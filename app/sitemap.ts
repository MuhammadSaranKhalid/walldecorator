import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Fetch all active products with their first image
    const products = await prisma.products.findMany({
        where: {
            status: 'active',
        },
        select: {
            slug: true,
            updated_at: true,
            product_images: {
                select: {
                    storage_path: true,
                },
                orderBy: {
                    display_order: 'asc',
                },
                take: 1,
            },
        },
    })

    // Fetch all categories
    const categories = await prisma.categories.findMany({
        where: {
            is_visible: true,
        },
        select: {
            slug: true,
        },
    })

    const productEntries: MetadataRoute.Sitemap = products.map((product) => {
        // Build the public Supabase storage URL for each product's first image
        const imageStoragePath = product.product_images[0]?.storage_path
        const imageUrl = imageStoragePath
            ? `https://srjfclplxoonrzczpfyz.supabase.co/storage/v1/object/public/product-images/${imageStoragePath}`
            : undefined

        return {
            url: `${baseUrl}/products/${product.slug}`,
            lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
            ...(imageUrl ? { images: [imageUrl] } : {}),
        }
    })

    const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${baseUrl}/products?category=${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    }))

    return [
        {
            url: `${baseUrl}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        ...productEntries,
        ...categoryEntries,
    ]
}

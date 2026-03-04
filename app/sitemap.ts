import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // Fetch all active products
    const { data: products } = await supabase
        .from('products')
        .select('slug, updated_at')
        .eq('status', 'active')

    // Fetch all categories
    const { data: categories } = await supabase
        .from('categories')
        .select('slug')
        .eq('is_visible', true)

    const productEntries: MetadataRoute.Sitemap = (products || []).map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    const categoryEntries: MetadataRoute.Sitemap = (categories || []).map((category) => ({
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

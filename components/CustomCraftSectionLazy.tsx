'use client'

/**
 * Thin client-side wrapper that lazily loads CustomCraftSection.
 *
 * Why this exists:
 *   next/dynamic with ssr:false must live in a Client Component.
 *   `app/(store)/page.tsx` is a Server Component, so the dynamic() call
 *   can't live there directly. This wrapper is that client boundary.
 *
 * Result: the 20KB+ CustomCraftSection bundle (react-hook-form, zod, supabase-js)
 * is NOT shipped in the initial JS bundle — it loads only when needed.
 */
import dynamic from 'next/dynamic'

const CustomCraftSection = dynamic(
    () => import('@/components/CustomCraftSection'),
    {
        ssr: false,
        loading: () => (
            <section className="max-w-7xl mx-auto px-4 py-20">
                <div className="h-96 bg-muted animate-pulse rounded-2xl" />
            </section>
        ),
    }
)

export function CustomCraftSectionLazy() {
    return <CustomCraftSection />
}

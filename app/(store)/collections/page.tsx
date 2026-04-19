import { Suspense, use } from 'react'
import { CollectionsPageContent } from '@/components/obsidian/collections-page'
import { getCollections } from '@/queries/collections'

export const metadata = {
  title: 'Collections | Wall Decorator',
  description:
    'Explore our curated collections of laser-cut wall art. From anime legends to nature & wildlife - discover precision-crafted designs for every passion.',
  openGraph: {
    title: 'Collections | Wall Decorator',
    description: 'Explore our curated collections of laser-cut wall art.',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Wall Decorator — Collections' }],
  },
}

// Enable ISR: revalidate every 30 minutes
export const revalidate = 1800

export default async function CollectionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CollectionsSection />
    </Suspense>
  )
}

function CollectionsSection() {
  const collections = use(getCollections())
  return <CollectionsPageContent collections={collections} />
}

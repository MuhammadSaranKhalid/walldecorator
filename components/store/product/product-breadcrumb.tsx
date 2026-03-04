import Link from 'next/link'
import type { ProductCategory } from '@/types/products'

type ProductBreadcrumbProps = {
  category: ProductCategory
  productName: string
}

export function ProductBreadcrumb({ category, productName }: ProductBreadcrumbProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://walldecorator.com'

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${baseUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${baseUrl}/products?category=${category.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: productName,
      },
    ],
  }

  return (
    <>
      {/* BreadcrumbList JSON-LD for Google rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-gray-900">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-gray-900">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/products?category=${category.slug}`}
              className="hover:text-gray-900"
            >
              {category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li
            className="text-gray-900 font-medium truncate max-w-[200px]"
            aria-current="page"
          >
            {productName}
          </li>
        </ol>
      </nav>
    </>
  )
}

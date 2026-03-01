import Link from 'next/link'
import type { ProductCategory } from '@/types/products'

type ProductBreadcrumbProps = {
  category: ProductCategory
  productName: string
}

export function ProductBreadcrumb({ category, productName }: ProductBreadcrumbProps) {
  return (
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
  )
}

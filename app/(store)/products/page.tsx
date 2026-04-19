import { Suspense, use } from "react";
import type { SearchParams } from "nuqs/server";
import { searchParamsCache } from "@/lib/search-params/products";
import { getProducts, getProductCategories } from "@/queries/products";
import { ObsidianProductsPage } from "@/components/obsidian/products-page";

// Enable ISR: cache products page per unique URL, revalidate every 60s
export const revalidate = 60;

// SEO metadata
export const metadata = {
  title: "Shop Wall Art | Wall Decorator",
  description:
    "Shop our curated collection of premium laser-cut wall art. Explore anime, movies, gaming, nature and more. Free shipping on all orders.",
  openGraph: {
    title: "Shop Wall Art | Wall Decorator",
    description:
      "Shop our curated collection of premium laser-cut wall art. Explore anime, movies, gaming, nature and more.",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Wall Decorator — Wall Art Collection",
      },
    ],
  },
};

type ProductsPageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const parsedParams = await searchParamsCache.parse(searchParams);

  const productsPromise = getProducts(parsedParams);
  const categoriesPromise = getProductCategories();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-[var(--obsidian-text-muted)] text-xs tracking-[2px] uppercase">
          Loading...
        </div>
      }
    >
      <ProductsSection
        productsPromise={productsPromise}
        categoriesPromise={categoriesPromise}
        parsedParams={parsedParams}
      />
    </Suspense>
  );
}

function ProductsSection({
  productsPromise,
  categoriesPromise,
  parsedParams,
}: {
  productsPromise: ReturnType<typeof getProducts>;
  categoriesPromise: ReturnType<typeof getProductCategories>;
  parsedParams: Awaited<ReturnType<typeof searchParamsCache.parse>>;
}) {
  const result = use(productsPromise);
  const categories = use(categoriesPromise);

  return (
    <ObsidianProductsPage
      initialProducts={result.items}
      categories={categories}
      totalCount={result.totalCount}
      currentPage={result.page}
      totalPages={result.totalPages}
      currentCategory={parsedParams.category ?? ''}
      currentSort={parsedParams.sort}
    />
  );
}

"use client";

import { useList } from "@refinedev/core";
import { HeroSection } from "@/components/storefront/hero-section";
import { ProductGrid } from "@/components/storefront/product-grid";
import { CustomOrderForm } from "@/components/storefront/custom-order-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getImageUrl } from "@/lib/image-helpers";

export default function HomePage() {
  // Fetch new arrivals with their materials using Supabase select syntax
  const {
    result: { data: newArrivalsData },
    query: { isLoading: isLoadingNewArrivals },
  } = useList({
    resource: "products",
    filters: [
      { field: "is_new_arrival", operator: "eq", value: true },
      { field: "status", operator: "eq", value: "active" },
    ],
    pagination: { pageSize: 4, currentPage: 1 },
    sorters: [{ field: "created_at", order: "desc" }],
    meta: {
      select: "*, product_materials(id, price, material_id, materials(name)), product_images(id, original_url, thumbnail_url, medium_url, large_url, blurhash, is_primary)",
    },
  });

  // Fetch best sellers with their materials using Supabase select syntax
  const {
    result: { data: bestSellersData },
    query: { isLoading: isLoadingBestSellers },
  } = useList({
    resource: "products",
    filters: [
      { field: "is_best_seller", operator: "eq", value: true },
      { field: "status", operator: "eq", value: "active" },
    ],
    pagination: { pageSize: 4, currentPage: 1 },
    sorters: [{ field: "created_at", order: "desc" }],
    meta: {
      select: "*, product_materials(id, price, material_id, materials(name)), product_images(id, original_url, thumbnail_url, medium_url, large_url, blurhash, is_primary)",
    },
  });

  // Transform product data to match ProductGrid component expectations
  const transformProducts = (products: any[] = []) => {
    return products.map((product) => {
      // Get the first available material or default values
      const firstMaterial = product.product_materials?.[0];
      const materialName =
        firstMaterial?.materials?.name || "Multiple Materials";
      const price = firstMaterial?.price || 0;

      // Get primary image or first image
      const primaryImage = product.product_images?.find((img: any) => img.is_primary) || product.product_images?.[0];
      // Use thumbnail size for grid cards (400px) - optimal for product grid display
      const imageUrl = getImageUrl(primaryImage, 'thumbnail') ||
                      product.primary_image_url ||
                      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070&auto=format&fit=crop";

      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        material: materialName,
        price: price,
        image_url: imageUrl,
        blurhash: primaryImage?.blurhash,
      };
    });
  };

  const newArrivals = transformProducts(newArrivalsData || []);
  const bestSellers = transformProducts(bestSellersData || []);
  return (
    <>
      <HeroSection />

      {/* New Arrivals Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold leading-tight tracking-tight pb-6">
          New Arrivals
        </h2>
        {isLoadingNewArrivals ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : newArrivals.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground text-lg">
              No new arrivals at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <ProductGrid products={newArrivals} columns={4} />
            <div className="flex justify-center pt-8">
              <Link href="/products?filter=new_arrivals">
                <Button variant="secondary" className="font-bold">
                  View All
                </Button>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Best Sellers Section */}
      <section className="bg-card">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold leading-tight tracking-tight pb-6">
            Best Sellers
          </h2>
          {isLoadingBestSellers ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : bestSellers.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-muted-foreground text-lg">
                No best sellers at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <>
              <ProductGrid products={bestSellers} columns={4} />
              <div className="flex justify-center pt-8">
                <Link href="/products?filter=best_sellers">
                  <Button variant="secondary" className="font-bold">
                    Shop Bestsellers
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Custom Order Form Section */}
      <CustomOrderForm />
    </>
  );
}

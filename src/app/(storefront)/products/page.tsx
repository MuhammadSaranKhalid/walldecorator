"use client";

import { useMemo, useEffect, useState } from "react";
import { useList } from "@refinedev/core";
import InfiniteScroll from "react-infinite-scroll-component";
import { X, Loader2 } from "lucide-react";

// Store
import { useProductsStore } from "@/stores/products-store";

// Types
import type { Material, Product } from "@/types/product";

// Helpers
import {
  getMinPrice,
  getPrimaryImage,
  getProductMaterialNames,
} from "@/lib/product-helpers";
import { useEcommerceAnalytics } from "@/lib/analytics-events";
import { getImageUrl } from "@/lib/image-helpers";

// Components
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ProductCard } from "@/components/storefront/product-card";

const ITEMS_PER_PAGE = 20;

export default function ProductsPage() {
  // Get state and actions from Zustand store
  const {
    selectedMaterials,
    priceRange,
    sortBy,
    currentPage,
    hasMore,
    allLoadedProducts,
    toggleMaterial,
    setPriceRange,
    setSortBy,
    handleProductsFetched,
    loadMoreProducts,
    updatePriceRangeMax,
    getFilteredProducts,
    getMaxPrice,
    hasActiveFilters: getHasActiveFilters,
    clearFilters,
  } = useProductsStore();

  // Local state for price slider to enable debouncing
  const [localPriceRange, setLocalPriceRange] =
    useState<[number, number]>(priceRange);

  // Debounce price range updates - only update store after user stops dragging
  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        localPriceRange[0] !== priceRange[0] ||
        localPriceRange[1] !== priceRange[1]
      ) {
        setPriceRange(localPriceRange);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [localPriceRange, priceRange, setPriceRange]);

  // Sync local state when store price range changes externally (e.g., clear filters)
  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  // Fetch all active materials for filters
  const {
    result: { data: materials = [] },
  } = useList<Material>({
    resource: "materials",
    filters: [
      {
        field: "is_active",
        operator: "eq",
        value: true,
      },
    ],
    sorters: [
      {
        field: "display_order",
        order: "asc",
      },
    ],
    pagination: {
      mode: "off",
    },
  });

  // Build dynamic filters for products query
  const productFilters = useMemo(() => {
    const filters: any[] = [
      {
        field: "status",
        operator: "eq",
        value: "active",
      },
    ];

    // Filter by materials - using Supabase's array contains operator
    if (selectedMaterials.length > 0) {
      // Note: This requires a custom filter in your data provider
      // For now, we'll fetch all and filter client-side for material
      // In production, you'd want to add a Postgres function or use proper JSON queries
    }

    return filters;
  }, [selectedMaterials]);

  // Build sorters
  const productSorters = useMemo(() => {
    const sorters: any[] = [];

    if (sortBy === "newest") {
      sorters.push({ field: "created_at", order: "desc" });
    }
    // Note: price sorting requires aggregation, handled client-side for now

    return sorters;
  }, [sortBy]);

  // Fetch products from database with filters
  const {
    result: { data: products = [], total: totalProducts = 0 },
    query: { isLoading: productsLoading, isError: productsError },
  } = useList<Product>({
    resource: "products",
    filters: productFilters,
    sorters: productSorters.length > 0 ? productSorters : undefined,
    pagination: {
      currentPage: currentPage,
      pageSize: ITEMS_PER_PAGE,
    },
    meta: {
      select:
        "*, product_materials(id, material_id, price, inventory_quantity, materials(id, name, slug)), product_images(id, original_url, alt_text, is_primary, thumbnail_url, medium_url, large_url, blurhash)",
    },
    queryOptions: {
      // Prevent query if we know we've loaded everything
      enabled: hasMore || currentPage === 1,
    },
  });

  console.log("ProductsPage render: ", {
    productsLoading,
    productsError,
    totalProducts,
  });

  // Handle products fetched from API
  useEffect(() => {
    const typedProducts = products as unknown as Product[];
    handleProductsFetched(
      typedProducts,
      totalProducts,
      ITEMS_PER_PAGE,
      productsError
    );
  }, [products, totalProducts, productsError, handleProductsFetched]);

  // Get filtered products from store
  const filteredProducts = getFilteredProducts();

  // Get computed values from store
  const maxPrice = getMaxPrice();
  const hasActiveFilters = getHasActiveFilters();

  // Analytics: Track View Item List
  const { viewItemList } = useEcommerceAnalytics();

  useEffect(() => {
    if (filteredProducts.length > 0 && !productsLoading) {
      viewItemList({
        item_list_id: "all_products",
        item_list_name: "All Products",
        items: filteredProducts.slice(0, ITEMS_PER_PAGE).map((p) => ({
          item_id: p.id,
          item_name: p.name,
          price: getMinPrice(p),
          item_category: "Wall Decor", // Can be dynamic if categories exist
        })),
      });
    }
  }, [filteredProducts, productsLoading, viewItemList]);

  // Update price range max when products load
  useEffect(() => {
    const maxPrice = getMaxPrice();
    updatePriceRangeMax(maxPrice);
  }, [getMaxPrice, updatePriceRangeMax]);

  // Load more function for infinite scroll
  const loadMore = () => {
    loadMoreProducts(productsLoading, productsError, totalProducts);
  };

  // UI Handler functions
  const handleMaterialToggle = (materialId: string) => {
    toggleMaterial(materialId);
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const handleRemoveMaterial = (materialId: string) => {
    toggleMaterial(materialId);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters - Hidden on mobile */}
        <aside className="hidden lg:block lg:w-72 xl:w-80 shrink-0">
          <div className="sticky top-28 space-y-6">
            <h3 className="text-xl font-bold">Filters</h3>

            {/* Material Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Material</Label>
              <div className="space-y-2">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Checkbox
                      id={`material-${material.id}`}
                      checked={selectedMaterials.includes(material.id)}
                      onCheckedChange={() => handleMaterialToggle(material.id)}
                    />
                    <Label
                      htmlFor={`material-${material.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {material.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Price Range</Label>
              <div className="pt-4">
                <Slider
                  min={0}
                  max={maxPrice}
                  step={10}
                  value={localPriceRange}
                  onValueChange={(value) =>
                    setLocalPriceRange(value as [number, number])
                  }
                  className="w-full"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>${localPriceRange[0]}</span>
                <span>${localPriceRange[1]}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                variant="secondary"
                className="w-full font-bold"
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header with Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <p className="text-muted-foreground text-base">
              {filteredProducts.length} product
              {filteredProducts.length !== 1 ? "s" : ""}
            </p>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Sort by: Popularity</SelectItem>
                <SelectItem value="price-low">
                  Sort by: Price: Low to High
                </SelectItem>
                <SelectItem value="price-high">
                  Sort by: Price: High to Low
                </SelectItem>
                <SelectItem value="newest">Sort by: Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex gap-3 mb-6 flex-wrap" suppressHydrationWarning>
              {selectedMaterials.map((materialId) => {
                const material = materials.find((m) => m.id === materialId);
                return (
                  <Badge
                    key={materialId}
                    variant="secondary"
                    className="h-8 gap-2 px-3"
                  >
                    <span>Material: {material?.name || "Unknown"}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent hover:text-primary"
                      onClick={() => handleRemoveMaterial(materialId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
              {(priceRange[0] !== 0 || priceRange[1] < maxPrice) && (
                <Badge variant="secondary" className="h-8 gap-2 px-3">
                  <span>
                    Price: ${priceRange[0]} - ${priceRange[1]}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent hover:text-primary"
                    onClick={() => setPriceRange([0, maxPrice])}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-8 text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Loading State */}
          {productsLoading && currentPage === 1 && (
            <div className="flex items-center justify-center py-24" suppressHydrationWarning>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">
                Loading products...
              </span>
            </div>
          )}

          {/* Error State */}
          {productsError && (
            <div className="flex flex-col items-center justify-center py-24 text-center" suppressHydrationWarning>
              <p className="text-lg font-medium mb-2 text-destructive">
                Error loading products
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                There was an error loading products. Please try again later.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!productsLoading &&
            !productsError &&
            filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center" suppressHydrationWarning>
                <p className="text-lg font-medium mb-2">No products found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? "Try adjusting your filters to see more products"
                    : "No products available at the moment"}
                </p>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

          {/* Product Grid with Infinite Scroll */}
          {!productsError && filteredProducts.length > 0 && (
            <InfiniteScroll
              dataLength={allLoadedProducts.length}
              next={loadMore}
              hasMore={hasMore}
              loader={
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading more products...
                  </span>
                </div>
              }
              endMessage={
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  You&apos;ve reached the end of the products
                </div>
              }
            >
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredProducts.map((product, index) => {
                  const minPrice = getMinPrice(product);
                  const primaryImage = getPrimaryImage(product);
                  const materialNames = getProductMaterialNames(product);

                  // Add priority to first 8 products (above the fold)
                  // 2 columns on mobile, 3 on tablet, 4 on desktop
                  // So first 8 covers ~2 rows on desktop, ~3 rows on tablet, ~4 rows on mobile
                  const isPriority = index < 8;

                  return (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      slug={product.slug}
                      name={product.name}
                      material={materialNames}
                      price={minPrice}
                      image_url={
                        // Use thumbnail size (400px) for product grid cards
                        getImageUrl(primaryImage, 'thumbnail') ||
                        product.primary_image_url ||
                        ""
                      }
                      blurhash={primaryImage?.blurhash || ""}
                      priority={isPriority}
                    />
                  );
                })}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  );
}

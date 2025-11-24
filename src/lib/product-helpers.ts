/**
 * Product Helper Functions
 *
 * Utility functions for working with product data
 */

import type { Product, ProductImage } from "@/types/product";

/**
 * Get the minimum price from a product's materials
 */
export function getMinPrice(product: Product): number {
  if (!product.product_materials || product.product_materials.length === 0) {
    return 0;
  }
  const prices = product.product_materials.map((pm) => pm.price);
  return Math.min(...prices);
}

/**
 * Get material IDs for a product (for filtering)
 */
export function getProductMaterialIds(product: Product): string[] {
  if (!product.product_materials || product.product_materials.length === 0) {
    return [];
  }
  return product.product_materials
    .map((pm) => pm.materials?.id || "")
    .filter(Boolean);
}

/**
 * Get the primary image with all variants for a product
 */
export function getPrimaryImage(product: Product): ProductImage | null {
  if (!product.product_images || product.product_images.length === 0) {
    return null;
  }

  // Find the primary image
  const primaryImage = product.product_images.find((img) => img.is_primary);

  // If no primary image is marked, use the first one by display_order
  if (!primaryImage) {
    return product.product_images.sort((a, b) => a.display_order - b.display_order)[0];
  }

  return primaryImage;
}

/**
 * Get formatted material names for display
 */
export function getProductMaterialNames(product: Product): string {
  if (!product.product_materials || product.product_materials.length === 0) {
    return "Various materials";
  }

  const materialNames = product.product_materials
    .map((pm) => pm.materials?.name)
    .filter(Boolean)
    .join(", ");

  return materialNames || "Various materials";
}

/**
 * Calculate dynamic max price from an array of products
 */
export function calculateMaxPrice(products: Product[], minDefault = 100): number {
  if (products.length === 0) return 1000; // Default fallback

  const prices = products.map(getMinPrice);
  const calculatedMax = Math.max(...prices, minDefault);
  return Math.ceil(calculatedMax / 50) * 50; // Round up to nearest 50
}

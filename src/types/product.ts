/**
 * Product-related TypeScript interfaces
 *
 * These interfaces define the shape of product data from the database,
 * including materials, images, and product relationships.
 */

export interface Material {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface ProductMaterial {
  id: string;
  product_id: string;
  material_id: string;
  price: number;
  inventory_quantity: number;
  sku_suffix?: string;
  is_default?: boolean;
  materials?: Material;
}

export interface ProductImage {
  id: string;
  product_id: string;
  original_url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
  // Responsive image variants
  thumbnail_url: string | null; // 400x400 for product cards
  medium_url: string | null; // 800x800 for mobile detail
  large_url: string | null; // 1200x1200 for desktop detail
  // Image metadata
  blurhash: string | null; // BlurHash for progressive loading
  width: number | null;
  height: number | null;
  file_size: number | null;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  primary_image_url: string; // Legacy field, prefer product_images
  status: "active" | "inactive" | "archived" | "draft";
  created_at?: string;
  updated_at?: string;
  // Relationships
  product_materials?: ProductMaterial[];
  product_images?: ProductImage[];
}

export type ProductStatus = Product["status"];

export type SortOption = "popularity" | "price-low" | "price-high" | "newest";

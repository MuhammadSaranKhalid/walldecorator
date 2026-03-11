// =====================================================
// Centralized Image Types
// =====================================================

/**
 * Centralized image type
 * All images (products, categories, reviews, custom orders) are stored in this table
 */
export interface Image {
  id: string;
  entity_type: 'product' | 'category' | 'review' | 'custom_order';
  entity_id: string;
  storage_path: string;
  alt_text: string | null;

  // Auto-generated variants
  thumbnail_path: string | null;
  medium_path: string | null;
  large_path: string | null;

  // Processing status
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error: string | null;

  // Metadata
  blurhash: string | null;
  original_width: number | null;
  original_height: number | null;
  file_size_bytes: number | null;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Junction Table Types
// =====================================================

/**
 * Junction table linking products to images
 * Products can have multiple images
 */
export interface ProductImage {
  product_id: string;
  image_id: string;
  variant_id: string | null;
  display_order: number;
  is_primary: boolean;

  // For joins with images table
  image?: Image;
}

/**
 * Junction table linking reviews to images
 * Reviews can have up to 3 images
 */
export interface ReviewImage {
  review_id: string;
  image_id: string;
  display_order: number;

  // For joins with images table
  image?: Image;
}

// =====================================================
// Entity Types with Direct FK to Images
// =====================================================

/**
 * Category with optional image
 * One-to-one relationship via image_id FK
 */
export interface CategoryWithImage {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_id: string | null;
  display_order: number;
  is_visible: boolean;
  product_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;

  // For joins with images table
  image?: Image | null;

  // DEPRECATED: Use image_id → images table instead
  image_path?: string | null;
}

/**
 * Custom order with optional image
 * One-to-one relationship via image_id FK
 */
export interface CustomOrderWithImage {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  image_id: string | null;
  description: string | null;
  preferred_material: string | null;
  preferred_size: string | null;
  preferred_thickness: string | null;
  status: 'pending' | 'reviewing' | 'quoted' | 'approved' | 'in_production' | 'shipped' | 'completed' | 'cancelled';
  admin_notes: string | null;
  quoted_price: number | null;
  quoted_at: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;

  // For joins with images table
  image?: Image | null;

  // DEPRECATED: Use image_id → images table instead
  image_url?: string | null;
}

// =====================================================
// Helper Types
// =====================================================

/**
 * Image upload response from API
 */
export interface ImageProcessingResponse {
  success: boolean;
  imageId: string;
  blurhash: string;
  variants: {
    thumbnail_path: string;
    medium_path: string;
    large_path: string;
  };
  metadata: {
    originalWidth: number;
    originalHeight: number;
    fileSize: number;
  };
}

/**
 * Image upload request payload
 */
export interface ImageProcessingRequest {
  imageId: string;
  storagePath: string;
  entityType: 'product' | 'category' | 'review' | 'custom_order';
  entityId: string;
}

/**
 * Helper function to get image URL from variant path
 */
export function getImageUrl(path: string | null, bucket: string = 'product-images'): string | null {
  if (!path) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Helper function to get responsive image srcset
 */
export function getImageSrcSet(image: Image | null): string {
  if (!image) return '';

  const srcSet: string[] = [];

  if (image.thumbnail_path) {
    srcSet.push(`${getImageUrl(image.thumbnail_path)} 150w`);
  }
  if (image.medium_path) {
    srcSet.push(`${getImageUrl(image.medium_path)} 600w`);
  }
  if (image.large_path) {
    srcSet.push(`${getImageUrl(image.large_path)} 1200w`);
  }

  return srcSet.join(', ');
}

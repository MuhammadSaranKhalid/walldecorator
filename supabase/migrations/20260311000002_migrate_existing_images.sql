-- =====================================================
-- Migration: Migrate Existing Images to Centralized Table
-- Description: Migrate data from old product_images table and
--              migrate category/custom_order images with reprocessing
-- =====================================================

-- =====================================================
-- PART 1: MIGRATE EXISTING PRODUCT IMAGES
-- =====================================================

-- Step 1: Insert all existing product images into centralized images table
-- Keep same ID for easier junction table migration
INSERT INTO public.images (
  id,  -- Preserve existing ID
  entity_type,
  entity_id,
  storage_path,
  alt_text,
  thumbnail_path,
  medium_path,
  large_path,
  processing_status,
  processing_error,
  blurhash,
  original_width,
  original_height,
  file_size_bytes,
  created_at,
  updated_at
)
SELECT
  id,
  'product'::TEXT AS entity_type,
  product_id AS entity_id,
  storage_path,
  alt_text,
  thumbnail_path,
  medium_path,
  large_path,
  processing_status,
  processing_error,
  blurhash,
  original_width,
  original_height,
  file_size_bytes,
  created_at,
  updated_at
FROM public.product_images;

-- Step 2: Create new product_images junction table structure
CREATE TABLE IF NOT EXISTS public.product_images_temp (
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_id UUID REFERENCES public.images(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  PRIMARY KEY (product_id, image_id)
);

COMMENT ON TABLE public.product_images_temp IS 'Junction table linking products to images';

-- Step 3: Populate temporary junction table with relationships
INSERT INTO public.product_images_temp (
  product_id,
  image_id,
  variant_id,
  display_order,
  is_primary
)
SELECT
  product_id,
  id AS image_id,  -- Image ID (same as in centralized table)
  variant_id,
  display_order,
  is_primary
FROM public.product_images;

-- Step 4: Drop old product_images table and rename new one
DROP TABLE public.product_images CASCADE;

ALTER TABLE public.product_images_temp RENAME TO product_images;

-- Step 5: Create indexes for product_images junction table
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id, display_order);
CREATE INDEX idx_product_images_image_id ON public.product_images(image_id);
CREATE INDEX idx_product_images_variant_id ON public.product_images(variant_id);
CREATE INDEX idx_product_images_primary ON public.product_images(product_id) WHERE is_primary = true;

-- Step 6: Enable RLS and create policies for product_images junction table
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view product_images of active products"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
      AND products.status = 'active'
    )
  );

CREATE POLICY "Service role can manage product_images"
  ON public.product_images FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 7: Create trigger to ensure only one primary image per product
CREATE OR REPLACE FUNCTION public.ensure_single_primary_image()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this image is being set as primary, unset all other primary images for this product
  IF NEW.is_primary = true THEN
    UPDATE public.product_images
    SET is_primary = false
    WHERE product_id = NEW.product_id
      AND image_id != NEW.image_id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_primary_image_trigger
  BEFORE INSERT OR UPDATE OF is_primary ON public.product_images
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.ensure_single_primary_image();

-- =====================================================
-- PART 2: MIGRATE CATEGORY IMAGES WITH REPROCESSING
-- =====================================================

-- Step 1: Insert category images into centralized images table
-- Set processing_status='pending' to trigger variant generation
WITH inserted_images AS (
  INSERT INTO public.images (
    entity_type,
    entity_id,
    storage_path,
    processing_status,
    created_at,
    updated_at
  )
  SELECT
    'category'::TEXT AS entity_type,
    id AS entity_id,
    image_path AS storage_path,
    'pending' AS processing_status,  -- Trigger reprocessing to generate variants
    created_at,
    updated_at
  FROM public.categories
  WHERE image_path IS NOT NULL
  RETURNING id, entity_id
)
-- Step 2: Update categories to reference the new image records
UPDATE public.categories c
SET image_id = i.id
FROM inserted_images i
WHERE c.id = i.entity_id;

-- =====================================================
-- PART 3: MIGRATE CUSTOM ORDER IMAGES WITH REPROCESSING
-- =====================================================

-- Step 1: Insert custom order images into centralized images table
-- Set processing_status='pending' to trigger variant generation
WITH inserted_images AS (
  INSERT INTO public.images (
    entity_type,
    entity_id,
    storage_path,
    processing_status,
    created_at,
    updated_at
  )
  SELECT
    'custom_order'::TEXT AS entity_type,
    id AS entity_id,
    image_url AS storage_path,
    'pending' AS processing_status,  -- Trigger reprocessing to generate variants
    created_at,
    updated_at
  FROM public.custom_orders
  WHERE image_url IS NOT NULL
  RETURNING id, entity_id
)
-- Step 2: Update custom_orders to reference the new image records
UPDATE public.custom_orders co
SET image_id = i.id
FROM inserted_images i
WHERE co.id = i.entity_id;

-- =====================================================
-- MIGRATION 2 COMPLETE
--
-- Completed:
-- - Migrated all product_images to centralized images table
-- - Created product_images junction table (final name, no _temp suffix)
-- - Added indexes, RLS policies, and triggers for product_images
-- - Migrated category images (pending reprocessing)
-- - Migrated custom_order images (pending reprocessing)
--
-- Final Table Structure:
-- - images (centralized, all entity types)
-- - product_images (junction table)
-- - review_images (junction table)
-- - categories.image_id (FK to images)
-- - custom_orders.image_id (FK to images)
-- =====================================================

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify migration)
-- =====================================================

-- Check images table row counts by entity type
-- SELECT entity_type, COUNT(*) FROM public.images GROUP BY entity_type;

-- Check product_images junction table
-- SELECT COUNT(*) FROM public.product_images;

-- Check categories with images
-- SELECT COUNT(*) FROM public.categories WHERE image_id IS NOT NULL;

-- Check custom_orders with images
-- SELECT COUNT(*) FROM public.custom_orders WHERE image_id IS NOT NULL;

-- Check images pending processing (should see category and custom_order)
-- SELECT entity_type, COUNT(*) FROM public.images WHERE processing_status = 'pending' GROUP BY entity_type;

-- Monitor processing progress
-- SELECT processing_status, COUNT(*) FROM public.images GROUP BY processing_status;

-- =====================================================
-- NOTE: Images with processing_status='pending' will be
-- automatically processed by the webhook trigger.
-- Category and custom_order images will get variants generated.
-- Monitor processing progress in the images table.
-- =====================================================

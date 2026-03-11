-- =====================================================
-- Migration: Centralized Image Processing System
-- Description: Refactor to use a single images table for all entities
-- =====================================================

-- =====================================================
-- PART 1: CREATE CENTRALIZED IMAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity context (for storage path organization and relationships)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'category', 'review', 'custom_order')),
  entity_id UUID NOT NULL,

  -- Storage
  storage_path TEXT NOT NULL,
  alt_text TEXT,

  -- Auto-generated variants (WebP format)
  thumbnail_path TEXT,  -- 150x150
  medium_path TEXT,     -- 600x600
  large_path TEXT,      -- 1200x1200

  -- Processing status
  processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  processing_error TEXT,

  -- Metadata
  blurhash TEXT,
  original_width INTEGER,
  original_height INTEGER,
  file_size_bytes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.images IS 'Centralized image storage and processing for all entities (products, categories, reviews, custom orders)';
COMMENT ON COLUMN public.images.entity_type IS 'Type of entity that owns this image (determines storage folder structure)';
COMMENT ON COLUMN public.images.entity_id IS 'ID of the owning entity (product_id, category_id, review_id, or custom_order_id)';
COMMENT ON COLUMN public.images.storage_path IS 'Original uploaded image path in storage';
COMMENT ON COLUMN public.images.thumbnail_path IS 'Auto-generated 150x150 WebP variant';
COMMENT ON COLUMN public.images.medium_path IS 'Auto-generated 600x600 WebP variant';
COMMENT ON COLUMN public.images.large_path IS 'Auto-generated 1200x1200 WebP variant';
COMMENT ON COLUMN public.images.blurhash IS 'BlurHash string for low-quality image placeholder';

-- =====================================================
-- INDEXES FOR IMAGES TABLE
-- =====================================================

CREATE INDEX idx_images_entity ON public.images(entity_type, entity_id);
CREATE INDEX idx_images_processing_status ON public.images(processing_status) WHERE processing_status = 'pending';

-- =====================================================
-- PART 2: CREATE JUNCTION TABLES
-- =====================================================

-- Review images junction table (new)
CREATE TABLE IF NOT EXISTS public.review_images (
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  image_id UUID REFERENCES public.images(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  PRIMARY KEY (review_id, image_id)
);

COMMENT ON TABLE public.review_images IS 'Junction table linking reviews to images (up to 3 images per review)';

-- NOTE: product_images junction table will be created in migration 2
-- after migrating existing data from the old product_images structure

-- =====================================================
-- INDEXES FOR JUNCTION TABLES
-- =====================================================

-- Review images junction
CREATE INDEX idx_review_images_review_id ON public.review_images(review_id, display_order);
CREATE INDEX idx_review_images_image_id ON public.review_images(image_id);

-- =====================================================
-- PART 3: ADD FK COLUMNS TO ENTITIES
-- =====================================================

-- Categories: Direct FK to images (one-to-one)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS image_id UUID REFERENCES public.images(id) ON DELETE SET NULL;

CREATE INDEX idx_categories_image_id ON public.categories(image_id);

COMMENT ON COLUMN public.categories.image_id IS 'Foreign key to centralized images table';
COMMENT ON COLUMN public.categories.image_path IS 'DEPRECATED: Use image_id → images table instead. Maintained for backward compatibility.';

-- Custom orders: Direct FK to images (one-to-one)
ALTER TABLE public.custom_orders
ADD COLUMN IF NOT EXISTS image_id UUID REFERENCES public.images(id) ON DELETE SET NULL;

CREATE INDEX idx_custom_orders_image_id ON public.custom_orders(image_id);

COMMENT ON COLUMN public.custom_orders.image_id IS 'Foreign key to centralized images table';
COMMENT ON COLUMN public.custom_orders.image_url IS 'DEPRECATED: Use image_id → images table instead. Maintained for backward compatibility.';

-- =====================================================
-- PART 4: ROW LEVEL SECURITY POLICIES
-- =====================================================

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

-- Images table policies
CREATE POLICY "Anyone can view images of visible entities"
  ON public.images FOR SELECT
  USING (
    CASE entity_type
      WHEN 'product' THEN
        EXISTS (
          SELECT 1 FROM public.products
          WHERE products.id = images.entity_id
          AND products.status = 'active'
        )
      WHEN 'category' THEN
        EXISTS (
          SELECT 1 FROM public.categories
          WHERE categories.id = images.entity_id
          AND categories.is_visible = true
        )
      WHEN 'review' THEN
        EXISTS (
          SELECT 1 FROM public.reviews
          WHERE reviews.id = images.entity_id
          AND reviews.is_approved = true
        )
      WHEN 'custom_order' THEN
        true  -- Custom orders viewable by anyone (customer needs to see their upload)
      ELSE false
    END
  );

CREATE POLICY "Anyone can upload images"
  ON public.images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage all images"
  ON public.images FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Review images junction policies
CREATE POLICY "Anyone can view review_images of approved reviews"
  ON public.review_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reviews
      WHERE reviews.id = review_images.review_id
      AND reviews.is_approved = true
    )
  );

CREATE POLICY "Anyone can submit review_images"
  ON public.review_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can manage review_images"
  ON public.review_images FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- NOTE: product_images RLS policies will be created in migration 2

-- =====================================================
-- PART 5: TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER set_updated_at_images
  BEFORE UPDATE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- NOTE: ensure_single_primary_image trigger will be created in migration 2
-- after the product_images junction table is created

-- =====================================================
-- PART 6: IMAGE PROCESSING WEBHOOK TRIGGER
-- Single trigger on images table for all entity types
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_image_processing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_webhook_url TEXT;
  v_webhook_secret TEXT;
BEGIN
  -- Get webhook URL from Vault
  SELECT decrypted_secret INTO v_webhook_url
  FROM vault.decrypted_secrets
  WHERE name = 'image_webhook_url'
  LIMIT 1;

  IF v_webhook_url IS NULL THEN
    RAISE WARNING 'image_webhook_url not found in Vault. Skipping image processing.';
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'webhook_secret'
  LIMIT 1;

  -- Call webhook with entity context already in table
  PERFORM net.http_post(
    url := v_webhook_url,
    body := jsonb_build_object(
      'imageId', NEW.id::text,
      'storagePath', NEW.storage_path,
      'entityType', NEW.entity_type,
      'entityId', NEW.entity_id::text
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_webhook_secret, '')
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_image_processing_on_insert
  AFTER INSERT ON public.images
  FOR EACH ROW
  WHEN (NEW.processing_status = 'pending')
  EXECUTE FUNCTION public.trigger_image_processing();

COMMENT ON FUNCTION public.trigger_image_processing IS 'Webhook trigger to call Next.js API for image variant generation. Works for all entity types. Reads secrets from Supabase Vault.';

-- =====================================================
-- PART 7: STORAGE CLEANUP TRIGGERS
-- Delete image files from storage when image record is deleted
-- =====================================================

CREATE OR REPLACE FUNCTION public.delete_image_files_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Delete all variants from storage
  DELETE FROM storage.objects
  WHERE bucket_id = 'product-images'
    AND name IN (
      OLD.storage_path,
      OLD.thumbnail_path,
      OLD.medium_path,
      OLD.large_path
    );

  RETURN OLD;
END;
$$;

CREATE TRIGGER delete_image_files_trigger
  BEFORE DELETE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_image_files_on_delete();

COMMENT ON FUNCTION public.delete_image_files_on_delete IS 'Auto-delete image files (including variants) from storage when image record is deleted';

-- =====================================================
-- MIGRATION 1 COMPLETE
--
-- Created:
-- - Centralized images table
-- - review_images junction table
-- - FK columns on categories and custom_orders
-- - Triggers and RLS policies
--
-- Next step: Run 20260311000002_migrate_existing_images.sql
-- This will:
-- - Migrate existing product_images to centralized structure
-- - Create product_images junction table
-- - Migrate category and custom_order images with reprocessing
-- =====================================================

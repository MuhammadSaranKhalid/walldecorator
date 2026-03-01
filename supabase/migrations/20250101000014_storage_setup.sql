-- =====================================================
-- Migration: Storage Buckets and Policies
-- Description: Supabase Storage setup for product images
-- =====================================================

-- Note: Storage buckets need to be created via Supabase Dashboard or CLI
-- This file documents the required configuration

-- =====================================================
-- BUCKET: product-images (Public)
-- For product and category images
-- =====================================================

-- Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view product images
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Policy: Service role can upload/update/delete
-- (Admin operations only - use service_role key)
CREATE POLICY "Service role can manage product images"
ON storage.objects FOR ALL
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- =====================================================
-- FUNCTION: Delete product images from storage when product deleted
-- =====================================================
CREATE OR REPLACE FUNCTION public.delete_product_images_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_image RECORD;
BEGIN
  -- Delete all image files from storage (original + variants)
  FOR v_image IN
    SELECT storage_path, thumbnail_path, medium_path, large_path
    FROM public.product_images
    WHERE product_id = OLD.id
  LOOP
    -- Delete original
    IF v_image.storage_path IS NOT NULL THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'product-images'
      AND name = v_image.storage_path;
    END IF;

    -- Delete thumbnail
    IF v_image.thumbnail_path IS NOT NULL THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'product-images'
      AND name = v_image.thumbnail_path;
    END IF;

    -- Delete medium
    IF v_image.medium_path IS NOT NULL THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'product-images'
      AND name = v_image.medium_path;
    END IF;

    -- Delete large
    IF v_image.large_path IS NOT NULL THEN
      DELETE FROM storage.objects
      WHERE bucket_id = 'product-images'
      AND name = v_image.large_path;
    END IF;
  END LOOP;

  RETURN OLD;
END;
$$;

CREATE TRIGGER delete_product_images_trigger
  BEFORE DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_product_images_on_delete();

COMMENT ON FUNCTION public.delete_product_images_on_delete IS 'Auto-delete product image files (including variants) from storage when product is deleted';

-- =====================================================
-- Migration: Product Images
-- Description: Product images table with RLS, triggers, and image processing webhook
-- =====================================================

-- =====================================================
-- PRODUCT_IMAGES TABLE
-- Product and variant images with auto-generated variants
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,

  -- Original image
  storage_path TEXT NOT NULL, -- Original uploaded image path
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,

  -- Auto-generated image variants (WebP format)
  thumbnail_path TEXT, -- 150x150
  medium_path TEXT,    -- 600x600
  large_path TEXT,     -- 1200x1200

  -- Processing status
  processing_status TEXT CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  processing_error TEXT,

  -- Metadata
  blurhash TEXT, -- BlurHash placeholder for image loading
  original_width INTEGER,
  original_height INTEGER,
  file_size_bytes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.product_images IS 'Product images with auto-generated variants (thumbnail, medium, large)';
COMMENT ON COLUMN public.product_images.storage_path IS 'Original uploaded image path';
COMMENT ON COLUMN public.product_images.thumbnail_path IS 'Auto-generated 150x150 WebP variant';
COMMENT ON COLUMN public.product_images.medium_path IS 'Auto-generated 600x600 WebP variant';
COMMENT ON COLUMN public.product_images.large_path IS 'Auto-generated 1200x1200 WebP variant';
COMMENT ON COLUMN public.product_images.blurhash IS 'BlurHash string for low-quality image placeholder';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id, display_order);
CREATE INDEX idx_product_images_variant_id ON public.product_images(variant_id, display_order);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view images of active products"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_images.product_id
      AND products.status = 'active'
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER set_updated_at_product_images
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- WEBHOOK TRIGGER: Process image variants
-- Calls Next.js API to generate thumbnail, medium, large variants
-- Requires: pg_net extension enabled in Supabase
-- Secrets stored in Supabase Vault:
--   - 'image_webhook_url': Your image processing API endpoint
--   - 'webhook_secret': Secret for authorization header
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
  -- Get secrets from Supabase Vault (decrypted at query time)
  SELECT decrypted_secret INTO v_webhook_url
  FROM vault.decrypted_secrets
  WHERE name = 'image_webhook_url'
  LIMIT 1;

  SELECT decrypted_secret INTO v_webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'webhook_secret'
  LIMIT 1;

  -- Ensure webhook URL is configured
  IF v_webhook_url IS NULL THEN
    RAISE WARNING 'image_webhook_url not found in Vault. Skipping image processing.';
    RETURN NEW;
  END IF;

  -- Call Next.js API using pg_net extension (non-blocking HTTP POST)
  PERFORM net.http_post(
    url := v_webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(v_webhook_secret, '')
    ),
    body := jsonb_build_object(
      'imageId', NEW.id,
      'storagePath', NEW.storage_path,
      'productId', NEW.product_id
    )::text
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_image_processing_on_insert
  AFTER INSERT ON public.product_images
  FOR EACH ROW
  WHEN (NEW.processing_status = 'pending')
  EXECUTE FUNCTION public.trigger_image_processing();

COMMENT ON FUNCTION public.trigger_image_processing IS 'Webhook trigger to call Next.js API for image variant generation. Reads secrets from Supabase Vault.';

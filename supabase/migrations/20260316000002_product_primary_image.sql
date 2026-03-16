-- =====================================================
-- Migration: Product Primary Image Denormalization
-- Description: Denormalize primary image data directly
--   onto the products table so listing queries need
--   zero joins to display the primary image.
-- =====================================================

-- =====================================================
-- 1. ADD COLUMNS
-- =====================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS primary_image_storage_path  TEXT,
  ADD COLUMN IF NOT EXISTS primary_image_medium_path   TEXT,
  ADD COLUMN IF NOT EXISTS primary_image_blurhash      TEXT,
  ADD COLUMN IF NOT EXISTS primary_image_alt_text      TEXT;

COMMENT ON COLUMN public.products.primary_image_storage_path IS 'Original storage path of the primary image (trigger-maintained). Fallback when medium variant is not yet processed.';
COMMENT ON COLUMN public.products.primary_image_medium_path  IS '600x600 WebP variant path of the primary image (trigger-maintained).';
COMMENT ON COLUMN public.products.primary_image_blurhash     IS 'BlurHash placeholder for the primary image (trigger-maintained).';
COMMENT ON COLUMN public.products.primary_image_alt_text     IS 'Alt text for the primary image (trigger-maintained).';

-- =====================================================
-- 2. FUNCTION: Recalculate primary image data for one product
--
-- Joins product_images → images to read the current
-- primary image's paths. Uses scalar variables so that
-- SELECT INTO sets them to NULL when no rows match
-- (i.e. no primary image set).
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_product_primary_image(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_storage_path  TEXT;
  v_medium_path   TEXT;
  v_blurhash      TEXT;
  v_alt_text      TEXT;
BEGIN
  SELECT i.storage_path, i.medium_path, i.blurhash, i.alt_text
  INTO   v_storage_path, v_medium_path, v_blurhash, v_alt_text
  FROM   public.product_images pi
  JOIN   public.images         i  ON i.id = pi.image_id
  WHERE  pi.product_id = p_product_id
    AND  pi.is_primary  = true
  LIMIT  1;

  -- NULL when no primary image — correct "no image" state
  UPDATE public.products
  SET primary_image_storage_path = v_storage_path,
      primary_image_medium_path  = v_medium_path,
      primary_image_blurhash     = v_blurhash,
      primary_image_alt_text     = v_alt_text
  WHERE id = p_product_id;
END;
$$;

COMMENT ON FUNCTION public.update_product_primary_image IS
  'Recalculate primary image columns for a product from its primary image record';

-- =====================================================
-- 3. TRIGGER FUNCTION: product_images junction changes
--
-- Fires on INSERT, all UPDATE, and DELETE so that
-- adding, swapping, or removing the primary image flag
-- always keeps the denormalized columns in sync.
-- =====================================================
CREATE OR REPLACE FUNCTION public.sync_primary_image_on_junction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Deleting the primary row → product has no primary image.
    IF OLD.is_primary = true THEN
      PERFORM public.update_product_primary_image(OLD.product_id);
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE: row reparented — recalculate the old product.
  IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id AND OLD.is_primary = true THEN
    PERFORM public.update_product_primary_image(OLD.product_id);
  END IF;

  -- Recalculate whenever is_primary is being set or cleared.
  IF NEW.is_primary = true
     OR (TG_OP = 'UPDATE' AND OLD.is_primary = true AND NEW.is_primary = false)
  THEN
    PERFORM public.update_product_primary_image(NEW.product_id);
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_primary_image_on_junction IS
  'Keep products primary_image_* columns in sync with the product_images junction table';

CREATE TRIGGER sync_primary_image_junction
  AFTER INSERT OR UPDATE OR DELETE
  ON public.product_images
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_primary_image_on_junction();

-- =====================================================
-- 4. TRIGGER FUNCTION: images row updated
--
-- When the image processing webhook writes medium_path,
-- blurhash, or alt_text, propagate the change to any
-- product that uses this image as its primary.
-- =====================================================
CREATE OR REPLACE FUNCTION public.sync_primary_image_on_images_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.products p
  SET primary_image_storage_path = NEW.storage_path,
      primary_image_medium_path  = NEW.medium_path,
      primary_image_blurhash     = NEW.blurhash,
      primary_image_alt_text     = NEW.alt_text
  FROM public.product_images pi
  WHERE pi.product_id = p.id
    AND pi.image_id   = NEW.id
    AND pi.is_primary = true;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_primary_image_on_images_update IS
  'When an image is processed (paths/blurhash set), update products using it as primary';

CREATE TRIGGER sync_primary_image_images_update
  AFTER UPDATE OF storage_path, medium_path, blurhash, alt_text
  ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_primary_image_on_images_update();

-- =====================================================
-- 5. BACKFILL existing products
-- =====================================================
UPDATE public.products p
SET primary_image_storage_path = i.storage_path,
    primary_image_medium_path  = i.medium_path,
    primary_image_blurhash     = i.blurhash,
    primary_image_alt_text     = i.alt_text
FROM public.product_images pi
JOIN public.images          i  ON i.id = pi.image_id
WHERE pi.product_id = p.id
  AND pi.is_primary = true;

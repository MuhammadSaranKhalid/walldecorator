-- =====================================================
-- Migration: Product Min Price Denormalization
-- Description: Add min_price / min_compare_at_price to products,
--   maintained by triggers so queries never need to join variants
--   just to display or sort by price.
-- =====================================================

-- =====================================================
-- 1. ADD COLUMNS
-- =====================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS min_price             NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS min_compare_at_price  NUMERIC(10,2);

COMMENT ON COLUMN public.products.min_price            IS 'Price of the cheapest in-stock variant (trigger-maintained). NULL = no in-stock variants.';
COMMENT ON COLUMN public.products.min_compare_at_price IS 'compare_at_price of the cheapest in-stock variant (trigger-maintained).';

-- =====================================================
-- 2. FUNCTION: Recalculate min price for one product
--
-- Uses scalar variables (not RECORD) so that SELECT INTO
-- correctly sets them to NULL when no rows are found,
-- which is exactly the "out of stock" state we want.
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_product_min_price(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price             NUMERIC(10,2);
  v_compare_at_price  NUMERIC(10,2);
BEGIN
  -- Find the cheapest in-stock variant.
  -- quantity_available is a STORED GENERATED column (on_hand - reserved), always accurate.
  -- If no rows match, v_price and v_compare_at_price are set to NULL — no error.
  SELECT pv.price, pv.compare_at_price
  INTO   v_price, v_compare_at_price
  FROM   public.product_variants pv
  JOIN   public.inventory        i  ON i.variant_id = pv.id
  WHERE  pv.product_id = p_product_id
    AND  i.quantity_available > 0
  ORDER BY pv.price ASC
  LIMIT 1;

  UPDATE public.products
  SET    min_price            = v_price,
         min_compare_at_price = v_compare_at_price
  WHERE  id = p_product_id;
END;
$$;

COMMENT ON FUNCTION public.update_product_min_price IS
  'Recalculate min_price / min_compare_at_price for a product from its cheapest in-stock variant';

-- =====================================================
-- 3. TRIGGER FUNCTION: any change on product_variants
--
-- Fires on INSERT, every UPDATE (not just price columns),
-- and DELETE so that renaming a variant, swapping attributes,
-- or moving it to another product all stay in sync.
--
-- On UPDATE, if product_id itself changed we refresh both
-- the old and the new parent product.
-- =====================================================
CREATE OR REPLACE FUNCTION public.sync_min_price_on_variant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_product_min_price(OLD.product_id);
    RETURN OLD;
  END IF;

  -- UPDATE: if the variant was reparented to a different product,
  -- the old product also needs a recalculation.
  IF TG_OP = 'UPDATE' AND OLD.product_id <> NEW.product_id THEN
    PERFORM public.update_product_min_price(OLD.product_id);
  END IF;

  PERFORM public.update_product_min_price(NEW.product_id);
  RETURN NEW;
END;
$$;

-- Fire after every INSERT, every UPDATE (all columns), and DELETE.
CREATE TRIGGER sync_min_price_variant
  AFTER INSERT OR UPDATE OR DELETE
  ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_min_price_on_variant();

-- =====================================================
-- 4. TRIGGER FUNCTION: inventory stock level changes
--
-- quantity_available is GENERATED from quantity_on_hand
-- and quantity_reserved, so we watch those inputs.
-- =====================================================
CREATE OR REPLACE FUNCTION public.sync_min_price_on_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.update_product_min_price(
    (SELECT product_id FROM public.product_variants WHERE id = NEW.variant_id)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_min_price_inventory
  AFTER UPDATE OF quantity_on_hand, quantity_reserved
  ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_min_price_on_inventory();

-- =====================================================
-- 5. BACKFILL existing products
--
-- Single bulk UPDATE using DISTINCT ON — far faster than
-- a row-by-row PL/pgSQL loop for large catalogues.
--
-- Step A: set min_price for products that HAVE in-stock variants.
-- Step B: set min_price = NULL for products that have NONE
--         (out of stock or no variants at all).
-- =====================================================

-- A: products with at least one in-stock variant
UPDATE public.products p
SET
  min_price            = sub.price,
  min_compare_at_price = sub.compare_at_price
FROM (
  SELECT DISTINCT ON (pv.product_id)
    pv.product_id,
    pv.price,
    pv.compare_at_price
  FROM   public.product_variants pv
  JOIN   public.inventory        i  ON i.variant_id = pv.id
  WHERE  i.quantity_available > 0
  ORDER  BY pv.product_id, pv.price ASC
) sub
WHERE p.id = sub.product_id;

-- B: products with no in-stock variants → explicit NULL
UPDATE public.products
SET
  min_price            = NULL,
  min_compare_at_price = NULL
WHERE id NOT IN (
  SELECT DISTINCT pv.product_id
  FROM   public.product_variants pv
  JOIN   public.inventory        i  ON i.variant_id = pv.id
  WHERE  i.quantity_available > 0
);

-- =====================================================
-- 6. INDEX for fast price-sort and in-stock filter
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_min_price
  ON public.products(min_price ASC NULLS LAST);

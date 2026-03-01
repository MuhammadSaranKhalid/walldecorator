-- =====================================================
-- Migration: Products
-- Description: Products table with RLS, triggers, and category count function
-- =====================================================

-- =====================================================
-- PRODUCTS TABLE
-- Wall art designs (base products)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('draft', 'active', 'archived')) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  featured_order INTEGER DEFAULT 0,
  total_sold INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.products IS 'Wall art designs (prices are on variants)';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_featured ON public.products(is_featured, featured_order) WHERE is_featured = true;
CREATE INDEX idx_products_total_sold ON public.products(total_sold DESC);
CREATE INDEX idx_products_view_count ON public.products(view_count DESC);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
-- Public access
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (status = 'active');

-- Admin access (service role)
CREATE POLICY "Service role can insert products"
  ON public.products FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update products"
  ON public.products FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete products"
  ON public.products FOR DELETE
  TO service_role
  USING (true);

CREATE POLICY "Service role can select all products"
  ON public.products FOR SELECT
  TO service_role
  USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: Update category product count
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_category_product_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    UPDATE public.categories
    SET product_count = (
      SELECT COUNT(*) FROM public.products
      WHERE category_id = OLD.category_id AND status = 'active'
    )
    WHERE id = OLD.category_id;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.category_id IS NOT NULL THEN
    UPDATE public.categories
    SET product_count = (
      SELECT COUNT(*) FROM public.products
      WHERE category_id = NEW.category_id AND status = 'active'
    )
    WHERE id = NEW.category_id;
  END IF;

  IF TG_OP = 'DELETE' AND OLD.category_id IS NOT NULL THEN
    UPDATE public.categories
    SET product_count = (
      SELECT COUNT(*) FROM public.products
      WHERE category_id = OLD.category_id AND status = 'active'
    )
    WHERE id = OLD.category_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_category_product_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_product_count();

-- =====================================================
-- FUNCTION: Increment product view count
-- Called from server action when product page is viewed
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_product_view_count(p_product_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET view_count = view_count + 1
  WHERE id = p_product_id;
END;
$$;

COMMENT ON FUNCTION public.increment_product_view_count IS 'Atomically increment product view count';

-- =====================================================
-- TRIGGER: Auto-generate slug on product insert
-- Generates URL-friendly slug from product name
-- Handles duplicates by appending a number
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_generate_product_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Generate slug if not provided OR if name changed on UPDATE
  IF NEW.slug IS NULL OR NEW.slug = '' OR (TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name) THEN
    -- Generate base slug: lowercase, replace spaces with hyphens, remove special chars
    base_slug := lower(NEW.name);
    base_slug := regexp_replace(base_slug, '[\s_]+', '-', 'g');
    base_slug := regexp_replace(base_slug, '[^a-z0-9\-]', '', 'g');
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    base_slug := trim(both '-' from base_slug);

    final_slug := base_slug;

    -- Handle duplicates by appending counter
    WHILE EXISTS (SELECT 1 FROM public.products WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER auto_generate_product_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_product_slug();

COMMENT ON FUNCTION public.auto_generate_product_slug IS 'Auto-generate URL-friendly slug from product name';

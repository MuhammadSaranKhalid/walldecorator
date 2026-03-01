-- =====================================================
-- Migration: Categories
-- Description: Product categories table with RLS and triggers
-- =====================================================

-- =====================================================
-- CATEGORIES TABLE
-- Product categories (e.g., Geometric, Floral, Abstract)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_path TEXT,
  display_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  product_count INTEGER DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.categories IS 'Product categories (wall art styles)';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_visible ON public.categories(is_visible, display_order);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view visible categories"
  ON public.categories FOR SELECT
  USING (is_visible = true);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

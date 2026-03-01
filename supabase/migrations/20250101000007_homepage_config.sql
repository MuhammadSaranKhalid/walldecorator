-- =====================================================
-- Migration: Homepage Config
-- Description: Homepage content configuration table with RLS and triggers
-- =====================================================

-- =====================================================
-- HOMEPAGE_CONFIG TABLE
-- Homepage content configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS public.homepage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hero_headline TEXT DEFAULT 'Transform Your Walls',
  hero_subheadline TEXT DEFAULT 'Precision-crafted laser-cut metal art',
  hero_cta_text TEXT DEFAULT 'Shop Now',
  hero_cta_link TEXT DEFAULT '/products',
  hero_image_path TEXT,
  promo_is_active BOOLEAN DEFAULT false,
  promo_headline TEXT,
  promo_subheadline TEXT,
  promo_cta_text TEXT,
  promo_cta_link TEXT,
  promo_bg_color TEXT DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default homepage config
INSERT INTO public.homepage_config (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.homepage_config ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view homepage config"
  ON public.homepage_config FOR SELECT
  USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER set_updated_at_homepage_config
  BEFORE UPDATE ON public.homepage_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

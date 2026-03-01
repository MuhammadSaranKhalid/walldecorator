-- =====================================================
-- Migration: Reviews
-- Description: Anonymous product reviews table with RLS and rating function
-- =====================================================

-- =====================================================
-- REVIEWS TABLE
-- Anonymous product reviews (no authentication required)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Optional: verify purchase

  -- Reviewer Info (anonymous - no user FK)
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,

  -- Review Content
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title TEXT,
  body TEXT,

  -- Moderation
  is_approved BOOLEAN DEFAULT false,
  is_verified_purchase BOOLEAN DEFAULT false,

  -- Engagement
  helpful_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Prevent duplicate reviews from same email for same product
  UNIQUE (product_id, reviewer_email)
);

COMMENT ON TABLE public.reviews IS 'Anonymous product reviews';
COMMENT ON COLUMN public.reviews.reviewer_email IS 'Email for verification only (not displayed)';
COMMENT ON COLUMN public.reviews.is_verified_purchase IS 'Review linked to actual order';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_product_approved ON public.reviews(product_id, is_approved) WHERE is_approved = true;
CREATE INDEX idx_reviews_rating ON public.reviews(product_id, rating);
CREATE INDEX idx_reviews_verified ON public.reviews(product_id, is_verified_purchase) WHERE is_verified_purchase = true;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- Anyone can view approved reviews
-- Anyone can submit a review (moderation required)
-- =====================================================
CREATE POLICY "Anyone can view approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Anyone can submit reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: Get average rating for product
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_product_rating(p_product_id UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews INTEGER,
  rating_distribution JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(rating), 1) AS average_rating,
    COUNT(*)::INTEGER AS total_reviews,
    jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE rating = 5),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '1', COUNT(*) FILTER (WHERE rating = 1)
    ) AS rating_distribution
  FROM public.reviews
  WHERE product_id = p_product_id
  AND is_approved = true;
END;
$$;

COMMENT ON FUNCTION public.get_product_rating IS 'Get average rating and distribution for a product';

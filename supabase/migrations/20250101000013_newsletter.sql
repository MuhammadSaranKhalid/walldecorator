-- =====================================================
-- Migration: Newsletter Subscribers
-- Description: Email newsletter subscriptions table with RLS
-- =====================================================

-- =====================================================
-- NEWSLETTER_SUBSCRIBERS TABLE
-- Email newsletter subscriptions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  unsubscribed_at TIMESTAMPTZ
);

COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter email subscribers';

-- Case-insensitive unique index
CREATE UNIQUE INDEX idx_newsletter_subscribers_email_lower
  ON public.newsletter_subscribers(LOWER(email));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_newsletter_subscribers_active ON public.newsletter_subscribers(is_active);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- Anyone can subscribe
-- =====================================================
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

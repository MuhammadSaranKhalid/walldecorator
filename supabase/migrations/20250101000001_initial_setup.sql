-- =====================================================
-- Wall Decorator E-Commerce Database
-- Guest Checkout Only (No User Authentication)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_net extension for HTTP requests from database triggers
-- Required for image processing webhook trigger
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =====================================================
-- HELPER FUNCTION: Auto-update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_updated_at IS 'Automatically update updated_at timestamp on row update';

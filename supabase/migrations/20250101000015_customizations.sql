-- =====================================================
-- Migration: Custom Orders
-- Description: Customers upload their own image/photo and
--              request a custom wall art piece based on it.
-- =====================================================

-- =====================================================
-- CUSTOM_ORDERS TABLE
-- A customer submits a photo they want turned into wall art.
-- Admin reviews, quotes a price, and processes it.
-- =====================================================
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Customer Info (no auth required — guest checkout)
  customer_name       TEXT         NOT NULL,
  customer_email      TEXT         NOT NULL,
  customer_phone      TEXT,

  -- The image the customer wants made into wall art
  -- Stored as a Supabase Storage object path
  -- e.g. "custom-orders/2025/abc123.jpg"
  image_url           TEXT         NOT NULL,

  -- What the customer wants
  description         TEXT,                          -- customer notes / special requests

  -- Preferred variant attributes (optional — customer preference)
  preferred_material  TEXT,                          -- e.g. 'metal', 'wood', 'acrylic'
  preferred_size      TEXT,                          -- e.g. '2x2', '3x3', '4x4'
  preferred_thickness TEXT,                          -- e.g. '3', '4'

  -- Admin workflow
  status              TEXT         NOT NULL CHECK (status IN (
                        'pending',                   -- submitted, awaiting admin review
                        'reviewing',                 -- admin is reviewing
                        'quoted',                    -- admin has sent a price quote
                        'approved',                  -- customer accepted the quote
                        'in_production',             -- being manufactured
                        'shipped',                   -- shipped to customer
                        'completed',                 -- delivered / done
                        'cancelled'                  -- cancelled by admin or customer
                      )) DEFAULT 'pending',

  -- Admin fields
  admin_notes         TEXT,                          -- internal notes
  quoted_price        NUMERIC(10,2),                 -- price quoted by admin
  quoted_at           TIMESTAMPTZ,                   -- when quote was sent

  -- Linked to an order once customer confirms & pays
  order_id            UUID         REFERENCES public.orders(id) ON DELETE SET NULL,

  created_at          TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ  DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE  public.custom_orders                    IS 'Customer-submitted custom wall art requests with an uploaded photo';
COMMENT ON COLUMN public.custom_orders.image_url          IS 'Supabase Storage path to the image uploaded by the customer';
COMMENT ON COLUMN public.custom_orders.status             IS 'Admin workflow: pending → reviewing → quoted → approved → in_production → shipped → completed';
COMMENT ON COLUMN public.custom_orders.quoted_price       IS 'Admin-set price for this custom order';
COMMENT ON COLUMN public.custom_orders.order_id           IS 'Linked to orders table once customer confirms and pays';

-- =====================================================
-- STORAGE BUCKET: custom-orders (Public)
-- For customer-uploaded design images
-- =====================================================

-- Create bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-orders', 'custom-orders', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can upload an image
CREATE POLICY "Anyone can upload custom order images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'custom-orders');

-- Policy: Public read access for previewing uploaded custom order images
CREATE POLICY "Public read access for custom order images"
ON storage.objects FOR SELECT
USING (bucket_id = 'custom-orders');

-- Policy: Service role can manage custom order images
CREATE POLICY "Service role can manage custom order images"
ON storage.objects FOR ALL
USING (bucket_id = 'custom-orders')
WITH CHECK (bucket_id = 'custom-orders');

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_custom_orders_email       ON public.custom_orders(customer_email);
CREATE INDEX idx_custom_orders_status      ON public.custom_orders(status, created_at DESC);
CREATE INDEX idx_custom_orders_order_id    ON public.custom_orders(order_id);
CREATE INDEX idx_custom_orders_created_at  ON public.custom_orders(created_at DESC);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Customers can view their own request by email
-- (app verifies email before showing)
CREATE POLICY "Anyone can read custom orders"
  ON public.custom_orders FOR SELECT
  USING (true);

-- Anyone can submit a custom order request
CREATE POLICY "Anyone can submit a custom order"
  ON public.custom_orders FOR INSERT
  WITH CHECK (true);

-- Only service role (admin) can update or delete
CREATE POLICY "Service role can manage custom orders"
  ON public.custom_orders FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TRIGGER: auto-update updated_at
-- =====================================================
CREATE TRIGGER set_updated_at_custom_orders
  BEFORE UPDATE ON public.custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TRIGGER: stamp quoted_at when status changes to 'quoted'
-- =====================================================
CREATE OR REPLACE FUNCTION public.stamp_custom_order_quoted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'quoted' AND (OLD.status IS NULL OR OLD.status != 'quoted') THEN
    NEW.quoted_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.stamp_custom_order_quoted_at IS 'Auto-stamp quoted_at when admin moves custom order to quoted status';

CREATE TRIGGER stamp_custom_order_quoted_at_trigger
  BEFORE UPDATE OF status ON public.custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.stamp_custom_order_quoted_at();

-- =====================================================
-- FUNCTION: Get pending custom orders (for admin dashboard)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_pending_custom_orders(p_limit INT DEFAULT 50)
RETURNS SETOF public.custom_orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.custom_orders
  WHERE status IN ('pending', 'reviewing')
  ORDER BY created_at ASC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_pending_custom_orders IS 'Returns pending custom order requests for admin review, oldest first';

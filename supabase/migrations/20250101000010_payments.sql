-- =====================================================
-- Migration: Payments
-- Description: Payment records and refunds from Stripe
-- Note: payments + refunds are tightly coupled
-- =====================================================

-- =====================================================
-- PAYMENTS TABLE
-- Payment records from Stripe
-- =====================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'PKR' NOT NULL,
  status TEXT CHECK (status IN (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'cancelled',
    'refunded',
    'partially_refunded'
  )) DEFAULT 'pending',
  payment_method_type TEXT, -- 'card', 'wallet', etc.
  payment_method_details JSONB,
  stripe_metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.payments IS 'Payment records from Stripe';

-- =====================================================
-- REFUNDS TABLE
-- Refund records
-- =====================================================
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
  stripe_refund_id TEXT UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'PKR' NOT NULL,
  reason TEXT CHECK (reason IN (
    'duplicate',
    'fraudulent',
    'requested_by_customer',
    'other'
  )),
  status TEXT CHECK (status IN (
    'pending',
    'succeeded',
    'failed',
    'cancelled'
  )) DEFAULT 'pending',
  stripe_metadata JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.refunds IS 'Refund records';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_stripe_payment_intent ON public.payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE INDEX idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX idx_refunds_stripe_refund_id ON public.refunds(stripe_refund_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view payments"
  ON public.payments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view refunds"
  ON public.refunds FOR SELECT
  USING (true);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================================================
CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_refunds
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TRIGGER: Sync payment status to order
-- =====================================================
CREATE OR REPLACE FUNCTION public.sync_payment_status_to_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'succeeded' THEN
    UPDATE public.orders
    SET payment_status = 'paid',
        status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
    WHERE id = NEW.order_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE public.orders
    SET payment_status = 'failed'
    WHERE id = NEW.order_id;
  ELSIF NEW.status IN ('refunded', 'partially_refunded') THEN
    UPDATE public.orders
    SET payment_status = NEW.status
    WHERE id = NEW.order_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_payment_status_to_order_trigger
  AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_payment_status_to_order();

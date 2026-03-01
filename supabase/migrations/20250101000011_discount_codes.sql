-- =====================================================
-- Migration: Discount Codes
-- Description: Promo codes for discounts and usage tracking
-- Note: discount_codes + discount_usages are tightly coupled
-- =====================================================

-- =====================================================
-- DISCOUNT_CODES TABLE
-- Promo codes for discounts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')) NOT NULL,
  value NUMERIC(10,2) NOT NULL CHECK (value >= 0),
  minimum_order_amount NUMERIC(10,2) DEFAULT 0 CHECK (minimum_order_amount >= 0),
  usage_limit INTEGER, -- NULL = unlimited
  usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.discount_codes IS 'Promotional discount codes';

-- Case-insensitive unique index
CREATE UNIQUE INDEX idx_discount_codes_code_lower ON public.discount_codes(LOWER(code));

-- =====================================================
-- DISCOUNT_USAGES TABLE
-- Track discount code usage per order
-- =====================================================
CREATE TABLE IF NOT EXISTS public.discount_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID REFERENCES public.discount_codes(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  discount_applied NUMERIC(10,2) NOT NULL CHECK (discount_applied >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (discount_code_id, order_id)
);

COMMENT ON TABLE public.discount_usages IS 'Discount code usage tracking';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX idx_discount_codes_active ON public.discount_codes(is_active, valid_from, valid_until);

CREATE INDEX idx_discount_usages_discount_code ON public.discount_usages(discount_code_id);
CREATE INDEX idx_discount_usages_order ON public.discount_usages(order_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view active discount codes"
  ON public.discount_codes FOR SELECT
  USING (is_active = true AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()));

CREATE POLICY "Anyone can view discount usages"
  ON public.discount_usages FOR SELECT
  USING (true);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATE
-- =====================================================
CREATE TRIGGER set_updated_at_discount_codes
  BEFORE UPDATE ON public.discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TRIGGER: Increment discount code usage count
-- =====================================================
CREATE OR REPLACE FUNCTION public.increment_discount_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.discount_codes
  SET usage_count = usage_count + 1
  WHERE id = NEW.discount_code_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_discount_usage_trigger
  AFTER INSERT ON public.discount_usages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_discount_usage();

-- =====================================================
-- FUNCTION: Validate discount code
-- =====================================================
CREATE OR REPLACE FUNCTION public.validate_discount_code(
  p_code TEXT,
  p_order_total NUMERIC
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_id UUID,
  discount_type TEXT,
  discount_value NUMERIC,
  error_message TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_discount public.discount_codes;
BEGIN
  -- Find discount code (case-insensitive)
  SELECT * INTO v_discount
  FROM public.discount_codes
  WHERE LOWER(code) = LOWER(p_code);

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Invalid discount code';
    RETURN;
  END IF;

  IF NOT v_discount.is_active THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'This discount code is no longer active';
    RETURN;
  END IF;

  IF v_discount.valid_from > NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'This discount code is not yet valid';
    RETURN;
  END IF;

  IF v_discount.valid_until IS NOT NULL AND v_discount.valid_until < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'This discount code has expired';
    RETURN;
  END IF;

  IF v_discount.usage_limit IS NOT NULL AND v_discount.usage_count >= v_discount.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'This discount code has reached its usage limit';
    RETURN;
  END IF;

  IF p_order_total < v_discount.minimum_order_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC,
      'Order total must be at least Rs. ' || v_discount.minimum_order_amount || ' to use this code';
    RETURN;
  END IF;

  RETURN QUERY SELECT true, v_discount.id, v_discount.type, v_discount.value, NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION public.validate_discount_code IS 'Validate discount code and return details';

-- =====================================================
-- FUNCTION: Calculate discount amount
-- =====================================================
CREATE OR REPLACE FUNCTION public.calculate_discount_amount(
  p_discount_type TEXT,
  p_discount_value NUMERIC,
  p_order_subtotal NUMERIC,
  p_shipping_cost NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE p_discount_type
    WHEN 'percentage' THEN
      RETURN ROUND(p_order_subtotal * (p_discount_value / 100), 2);
    WHEN 'fixed_amount' THEN
      RETURN LEAST(p_discount_value, p_order_subtotal);
    WHEN 'free_shipping' THEN
      RETURN p_shipping_cost;
    ELSE
      RETURN 0;
  END CASE;
END;
$$;

COMMENT ON FUNCTION public.calculate_discount_amount IS 'Calculate discount amount based on type';

-- =====================================================
-- Migration: Inventory System
-- Description: Inventory tracking with event ledger pattern
-- Note: inventory + inventory_transactions are tightly coupled (event sourcing)
-- =====================================================

-- =====================================================
-- INVENTORY TABLE
-- Current stock levels per variant
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID UNIQUE REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  quantity_on_hand INTEGER DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved INTEGER DEFAULT 0 CHECK (quantity_reserved >= 0),
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  low_stock_threshold INTEGER DEFAULT 5,
  allow_backorder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.inventory IS 'Current inventory levels per product variant';
COMMENT ON COLUMN public.inventory.quantity_on_hand IS 'Total physical stock available';
COMMENT ON COLUMN public.inventory.quantity_reserved IS 'Stock reserved in active carts (not yet ordered)';
COMMENT ON COLUMN public.inventory.quantity_available IS 'Computed: on_hand - reserved';

-- =====================================================
-- INVENTORY_TRANSACTIONS TABLE
-- Immutable audit log of all stock movements (event ledger)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('sale', 'return', 'restock', 'adjustment', 'reserve', 'release')) NOT NULL,
  quantity_delta INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_type TEXT, -- 'order', 'cart', 'manual', etc.
  reference_id UUID, -- order_id, cart_id, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.inventory_transactions IS 'Immutable audit log of all inventory changes';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_inventory_variant_id ON public.inventory(variant_id);
CREATE INDEX idx_inventory_low_stock ON public.inventory(variant_id)
  WHERE quantity_available <= low_stock_threshold;

CREATE INDEX idx_inventory_transactions_variant ON public.inventory_transactions(variant_id, created_at DESC);
CREATE INDEX idx_inventory_transactions_reference ON public.inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_inventory_transactions_type ON public.inventory_transactions(type, created_at DESC);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - INVENTORY
-- Anyone can read stock levels (for product pages)
-- =====================================================
CREATE POLICY "Anyone can view inventory levels"
  ON public.inventory FOR SELECT
  USING (true);

-- =====================================================
-- RLS POLICIES - INVENTORY TRANSACTIONS
-- Public read-only (for transparency)
-- =====================================================
CREATE POLICY "Anyone can view inventory transactions"
  ON public.inventory_transactions FOR SELECT
  USING (true);

-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================
CREATE TRIGGER set_updated_at_inventory
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: Adjust inventory (with transaction log)
-- This is the ONLY way to modify inventory quantities
-- =====================================================
CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_variant_id UUID,
  p_quantity_delta INTEGER,
  p_type TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.inventory
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inventory inventory;
  v_quantity_before INTEGER;
  v_quantity_after INTEGER;
BEGIN
  -- Lock the inventory row for update
  SELECT * INTO v_inventory
  FROM public.inventory
  WHERE variant_id = p_variant_id
  FOR UPDATE;

  -- If inventory record doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO public.inventory (variant_id, quantity_on_hand)
    VALUES (p_variant_id, 0)
    RETURNING * INTO v_inventory;
  END IF;

  v_quantity_before := v_inventory.quantity_on_hand;
  v_quantity_after := v_quantity_before + p_quantity_delta;

  -- Prevent negative stock (unless type is 'adjustment')
  IF v_quantity_after < 0 AND p_type != 'adjustment' THEN
    RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %',
      v_quantity_before, ABS(p_quantity_delta);
  END IF;

  -- Update inventory
  UPDATE public.inventory
  SET quantity_on_hand = v_quantity_after,
      updated_at = NOW()
  WHERE variant_id = p_variant_id
  RETURNING * INTO v_inventory;

  -- Create transaction record (immutable audit log)
  INSERT INTO public.inventory_transactions (
    variant_id,
    type,
    quantity_delta,
    quantity_before,
    quantity_after,
    reference_type,
    reference_id,
    notes
  ) VALUES (
    p_variant_id,
    p_type,
    p_quantity_delta,
    v_quantity_before,
    v_quantity_after,
    p_reference_type,
    p_reference_id,
    p_notes
  );

  RETURN v_inventory;
END;
$$;

COMMENT ON FUNCTION public.adjust_inventory IS 'Safely adjust inventory with audit trail';

-- =====================================================
-- FUNCTION: Reserve inventory (for cart items)
-- =====================================================
CREATE OR REPLACE FUNCTION public.reserve_inventory(
  p_variant_id UUID,
  p_quantity INTEGER,
  p_cart_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Get available quantity
  SELECT quantity_available INTO v_available
  FROM public.inventory
  WHERE variant_id = p_variant_id
  FOR UPDATE;

  -- Check if enough stock available
  IF v_available IS NULL OR v_available < p_quantity THEN
    RETURN false;
  END IF;

  -- Increase reserved quantity
  UPDATE public.inventory
  SET quantity_reserved = quantity_reserved + p_quantity,
      updated_at = NOW()
  WHERE variant_id = p_variant_id;

  -- Log transaction
  INSERT INTO public.inventory_transactions (
    variant_id,
    type,
    quantity_delta,
    quantity_before,
    quantity_after,
    reference_type,
    reference_id,
    notes
  ) VALUES (
    p_variant_id,
    'reserve',
    p_quantity,
    v_available,
    v_available - p_quantity,
    'cart',
    p_cart_id,
    'Reserved for cart'
  );

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.reserve_inventory IS 'Reserve stock for cart items';

-- =====================================================
-- FUNCTION: Release reserved inventory
-- =====================================================
CREATE OR REPLACE FUNCTION public.release_inventory(
  p_variant_id UUID,
  p_quantity INTEGER,
  p_cart_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decrease reserved quantity
  UPDATE public.inventory
  SET quantity_reserved = GREATEST(0, quantity_reserved - p_quantity),
      updated_at = NOW()
  WHERE variant_id = p_variant_id;

  -- Log transaction
  INSERT INTO public.inventory_transactions (
    variant_id,
    type,
    quantity_delta,
    quantity_before,
    quantity_after,
    reference_type,
    reference_id,
    notes
  ) VALUES (
    p_variant_id,
    'release',
    -p_quantity,
    (SELECT quantity_on_hand FROM public.inventory WHERE variant_id = p_variant_id),
    (SELECT quantity_on_hand FROM public.inventory WHERE variant_id = p_variant_id),
    'cart',
    p_cart_id,
    'Released from cart'
  );

  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.release_inventory IS 'Release reserved stock from cart';

-- =====================================================
-- FUNCTION: Check if variant is in stock
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_in_stock(p_variant_id UUID, p_quantity INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN allow_backorder THEN true
      WHEN quantity_available >= p_quantity THEN true
      ELSE false
    END
  FROM public.inventory
  WHERE variant_id = p_variant_id;
$$;

COMMENT ON FUNCTION public.is_in_stock IS 'Check if a variant has sufficient stock';

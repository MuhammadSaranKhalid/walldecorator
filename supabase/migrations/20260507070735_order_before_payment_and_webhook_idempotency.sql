-- =====================================================
-- Migration: Order-before-payment flow + Stripe webhook idempotency
--
-- Implements REVIEW #2 and #3:
--   - create_order accepts an initial_status / initial_payment_status so
--     card flows can create a 'pending' order BEFORE charging the card.
--     If the post-charge update fails, the order still exists and can be
--     reconciled by the webhook.
--   - mark_order_paid(): idempotent transition to confirmed/paid. Used by
--     both the post-charge server action and the Stripe webhook.
--   - mark_order_failed(): idempotent transition to cancelled with
--     inventory restock.
--   - stripe_events: tracks processed event IDs so retried webhook
--     deliveries are no-ops.
-- =====================================================

-- 1. Replace create_order with a signature that takes initial_status /
--    initial_payment_status. Drop the old signature first because Postgres
--    treats the new parameter list as a new overload.

DROP FUNCTION IF EXISTS public.create_order(
  TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT, TEXT,
  NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_email   TEXT,
  p_customer_name    TEXT,
  p_customer_phone   TEXT,
  p_shipping_address JSONB,
  p_billing_address  JSONB,
  p_cart_items       JSONB,
  p_payment_intent_id TEXT,
  p_payment_method   TEXT,
  p_shipping_cost    NUMERIC DEFAULT 0,
  p_discount_amount  NUMERIC DEFAULT 0,
  p_tax_rate         NUMERIC DEFAULT 0,
  p_ip_address       TEXT DEFAULT NULL,
  p_user_agent       TEXT DEFAULT NULL,
  p_initial_status         TEXT DEFAULT 'confirmed',
  p_initial_payment_status TEXT DEFAULT 'paid'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id     UUID;
  v_order_number TEXT;
  v_subtotal     NUMERIC := 0;
  v_tax_amount   NUMERIC;
  v_total_amount NUMERIC;
  v_item         JSONB;
  v_variant      RECORD;
  v_variant_id   UUID;
  v_quantity     INTEGER;
  v_unit_price   NUMERIC;
  v_line_total   NUMERIC;
BEGIN
  -- ── Pass 1: validate every cart item AND fetch authoritative price ───────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_quantity   := (v_item->>'quantity')::INTEGER;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION
        'Invalid quantity for variant %.', v_variant_id
        USING ERRCODE = 'invalid_parameter_value';
    END IF;

    SELECT pv.price
      INTO v_unit_price
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_variant_id
      AND p.status = 'active';

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Product variant % is unavailable. Please clear your cart and try again.',
        v_variant_id
        USING ERRCODE = 'invalid_parameter_value';
    END IF;

    v_subtotal := v_subtotal + (v_quantity * v_unit_price);
  END LOOP;

  v_tax_amount   := (v_subtotal - p_discount_amount + p_shipping_cost) * p_tax_rate;
  v_total_amount := v_subtotal - p_discount_amount + p_shipping_cost + v_tax_amount;
  v_order_number := public.generate_order_number();

  INSERT INTO public.orders (
    order_number, customer_email, customer_name, customer_phone,
    shipping_address, billing_address,
    subtotal, discount_amount, shipping_cost, tax_amount, total_amount,
    payment_intent_id, payment_method, payment_status, status,
    confirmed_at,
    ip_address, user_agent
  ) VALUES (
    v_order_number, p_customer_email, p_customer_name, p_customer_phone,
    p_shipping_address, p_billing_address,
    v_subtotal, p_discount_amount, p_shipping_cost, v_tax_amount, v_total_amount,
    p_payment_intent_id, p_payment_method, p_initial_payment_status, p_initial_status,
    CASE WHEN p_initial_status = 'confirmed' THEN now() ELSE NULL END,
    p_ip_address, p_user_agent
  )
  RETURNING id INTO v_order_id;

  -- ── Pass 2: insert order_items + decrement inventory ─────────────────────
  -- Inventory is decremented at order creation regardless of payment status.
  -- For card flows the order is in 'pending' until payment confirms; if
  -- payment fails we restore via mark_order_failed().
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_quantity   := (v_item->>'quantity')::INTEGER;

    SELECT
      pv.sku, pv.price AS unit_price, p.name AS product_name,
      CONCAT(
        (SELECT display_name FROM public.product_attribute_values WHERE id = pv.material_id),
        ' - ',
        (SELECT display_name FROM public.product_attribute_values WHERE id = pv.size_id),
        ' - ',
        (SELECT display_name FROM public.product_attribute_values WHERE id = pv.thickness_id)
      ) AS variant_description
    INTO v_variant
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_variant_id;

    v_unit_price := v_variant.unit_price;
    v_line_total := v_quantity * v_unit_price;

    INSERT INTO public.order_items (
      order_id, variant_id, product_name, variant_description, sku,
      quantity, unit_price, total_price
    ) VALUES (
      v_order_id, v_variant_id,
      v_variant.product_name, v_variant.variant_description, v_variant.sku,
      v_quantity, v_unit_price, v_line_total
    );

    PERFORM public.adjust_inventory(
      v_variant_id, -v_quantity,
      'sale', 'order', v_order_id,
      'Order ' || v_order_number
    );
  END LOOP;

  RETURN v_order_id;
END;
$function$;

-- 2. mark_order_paid: idempotent confirmed/paid transition.
--    Only flips orders that are still pending — no-op if webhook arrives
--    after the client-side confirmation already updated the row.

CREATE OR REPLACE FUNCTION public.mark_order_paid(
  p_order_id          UUID,
  p_payment_intent_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.orders
  SET
    payment_intent_id = COALESCE(payment_intent_id, p_payment_intent_id),
    payment_status    = 'paid',
    status            = 'confirmed',
    confirmed_at      = COALESCE(confirmed_at, now())
  WHERE id = p_order_id
    AND payment_status IN ('pending', 'authorized')
    AND status IN ('pending');

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count > 0;
END;
$function$;

-- 3. mark_order_failed: idempotent cancellation with inventory restock.

CREATE OR REPLACE FUNCTION public.mark_order_failed(
  p_order_id UUID,
  p_reason   TEXT DEFAULT 'Payment failed'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count INTEGER;
  v_item          RECORD;
BEGIN
  -- Restore inventory only when transitioning OUT of pending — guards
  -- against double restock if mark_order_failed is called twice.
  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = p_order_id AND status = 'pending'
  ) THEN
    FOR v_item IN
      SELECT variant_id, quantity FROM public.order_items WHERE order_id = p_order_id
    LOOP
      PERFORM public.adjust_inventory(
        v_item.variant_id, v_item.quantity,
        'restock', 'order', p_order_id,
        'Restock from cancelled order ' || p_order_id::text
      );
    END LOOP;
  END IF;

  UPDATE public.orders
  SET
    payment_status = 'failed',
    status         = 'cancelled',
    cancelled_at   = COALESCE(cancelled_at, now()),
    notes          = COALESCE(notes || E'\n', '') || p_reason
  WHERE id = p_order_id
    AND status = 'pending';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count > 0;
END;
$function$;

-- 4. stripe_events: idempotency log for webhook deliveries.

CREATE TABLE IF NOT EXISTS public.stripe_events (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- No policies — only service_role writes (bypasses RLS).

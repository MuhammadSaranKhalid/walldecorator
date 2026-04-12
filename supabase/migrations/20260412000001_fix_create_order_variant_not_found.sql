-- =====================================================
-- Migration: Fix create_order — guard against missing variants
-- Problem:   SELECT INTO v_variant returns no rows when a cart item
--            references a deleted/stale variant.  PostgreSQL sets
--            v_variant to NULL and the subsequent INSERT blows up
--            with a cryptic NOT-NULL constraint violation on product_name.
-- Fix:       Add a validation pass before touching the DB:
--            iterate every cart item, PERFORM a lookup, and RAISE a
--            clear exception if the variant no longer exists.
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_shipping_address JSONB,
  p_billing_address JSONB,
  p_cart_items JSONB,
  p_payment_intent_id TEXT,
  p_payment_method TEXT,
  p_shipping_cost NUMERIC DEFAULT 0,
  p_discount_amount NUMERIC DEFAULT 0,
  p_tax_rate NUMERIC DEFAULT 0,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC := 0;
  v_tax_amount NUMERIC;
  v_total_amount NUMERIC;
  v_item JSONB;
  v_variant RECORD;
  v_variant_id UUID;
BEGIN
  -- ── Pass 1: validate every cart item variant exists ──────────────────────
  -- Do this BEFORE creating the order so we never produce an orphaned order
  -- row when a stale cart variant causes a failure mid-loop.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;

    PERFORM 1
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_variant_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION
        'Product variant % not found. Please clear your cart and try again.',
        v_variant_id
        USING ERRCODE = 'invalid_parameter_value';
    END IF;

    -- Accumulate subtotal in the same pass to avoid a third loop
    v_subtotal := v_subtotal + (
      (v_item->>'quantity')::INTEGER * (v_item->>'price')::NUMERIC
    );
  END LOOP;

  -- ── Totals ────────────────────────────────────────────────────────────────
  v_tax_amount   := (v_subtotal - p_discount_amount + p_shipping_cost) * p_tax_rate;
  v_total_amount := v_subtotal - p_discount_amount + p_shipping_cost + v_tax_amount;

  -- ── Generate order number ─────────────────────────────────────────────────
  v_order_number := public.generate_order_number();

  -- ── Insert order header ───────────────────────────────────────────────────
  INSERT INTO public.orders (
    order_number,
    customer_email,
    customer_name,
    customer_phone,
    shipping_address,
    billing_address,
    subtotal,
    discount_amount,
    shipping_cost,
    tax_amount,
    total_amount,
    payment_intent_id,
    payment_method,
    payment_status,
    status,
    ip_address,
    user_agent
  ) VALUES (
    v_order_number,
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_shipping_address,
    p_billing_address,
    v_subtotal,
    p_discount_amount,
    p_shipping_cost,
    v_tax_amount,
    v_total_amount,
    p_payment_intent_id,
    p_payment_method,
    'paid',
    'confirmed',
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_order_id;

  -- ── Pass 2: insert order items + decrement inventory ─────────────────────
  -- All variants are guaranteed to exist after Pass 1.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;

    SELECT
      pv.sku,
      p.name AS product_name,
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

    INSERT INTO public.order_items (
      order_id,
      variant_id,
      product_name,
      variant_description,
      sku,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      v_variant_id,
      v_variant.product_name,
      v_variant.variant_description,
      v_variant.sku,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      (v_item->>'quantity')::INTEGER * (v_item->>'price')::NUMERIC
    );

    PERFORM public.adjust_inventory(
      v_variant_id,
      -(v_item->>'quantity')::INTEGER,
      'sale',
      'order',
      v_order_id,
      'Order ' || v_order_number
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;

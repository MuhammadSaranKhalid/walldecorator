-- =====================================================
-- Migration: create_order uses authoritative server-side prices
-- Problem:   The previous create_order accepted `price` from the client
--            cart payload and used it to compute subtotal, unit_price, and
--            total_price. Since the cart lives in localStorage (Zustand
--            persist), a buyer could edit the price client-side and check
--            out a Rs. 50,000 product for Rs. 1.
-- Fix:       Look up `price` from product_variants for an active product
--            inside the RPC. Any client-supplied `price` field is ignored.
--            The cart payload is now `{ variant_id, quantity }` only.
--            Also rejects non-positive quantities.
-- =====================================================

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
  p_user_agent       TEXT DEFAULT NULL
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
  -- Reject the client-supplied price entirely. The variant must belong to
  -- an active product. Pass 1 also rejects bad quantities up front so the
  -- order header is never inserted with malformed data.
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

  -- ── Pass 2: insert order_items + decrement inventory ─────────────────────
  -- Use the same authoritative price lookup; never the client value.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_variant_id := (v_item->>'variant_id')::UUID;
    v_quantity   := (v_item->>'quantity')::INTEGER;

    SELECT
      pv.sku,
      pv.price AS unit_price,
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

    v_unit_price := v_variant.unit_price;
    v_line_total := v_quantity * v_unit_price;

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
      v_quantity,
      v_unit_price,
      v_line_total
    );

    PERFORM public.adjust_inventory(
      v_variant_id,
      -v_quantity,
      'sale',
      'order',
      v_order_id,
      'Order ' || v_order_number
    );
  END LOOP;

  RETURN v_order_id;
END;
$function$;

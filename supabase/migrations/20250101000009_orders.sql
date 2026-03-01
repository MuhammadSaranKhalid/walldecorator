-- =====================================================
-- Migration: Order System (Guest Checkout)
-- Description: Orders with customer info (no user authentication)
-- Note: orders + order_items + order_status_history are tightly coupled
-- =====================================================

-- =====================================================
-- ORDERS TABLE
-- Guest orders with customer information stored directly
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  )) DEFAULT 'pending',

  -- Customer Information (no FK - stored directly)
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,

  -- Shipping Address (stored as JSONB snapshot)
  shipping_address JSONB NOT NULL,

  -- Billing Address (optional - can same as shipping)
  billing_address JSONB,

  -- Financial Details
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
  shipping_cost NUMERIC(10,2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax_amount NUMERIC(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT DEFAULT 'PKR' NOT NULL,

  -- Payment
  payment_status TEXT CHECK (payment_status IN (
    'pending',
    'authorized',
    'paid',
    'failed',
    'refunded',
    'partially_refunded'
  )) DEFAULT 'pending',
  payment_intent_id TEXT UNIQUE, -- Stripe payment intent ID
  payment_method TEXT, -- 'card', 'cash_on_delivery', etc.

  -- Metadata
  notes TEXT,
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.orders IS 'Guest checkout orders (no user authentication)';
COMMENT ON COLUMN public.orders.customer_email IS 'Customer email (no FK to users table)';
COMMENT ON COLUMN public.orders.shipping_address IS 'Shipping address snapshot (JSONB)';

-- =====================================================
-- ORDER_ITEMS TABLE
-- Line items with snapshotted product data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,

  -- Product Snapshots (immutable at time of order)
  product_name TEXT NOT NULL,
  variant_description TEXT, -- e.g., "Metal - 60x40cm - 3mm"
  sku TEXT NOT NULL,

  -- Pricing
  quantity INTEGER CHECK (quantity > 0) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.order_items IS 'Order line items with snapshotted product data';

-- =====================================================
-- ORDER_STATUS_HISTORY TABLE
-- Append-only audit log of status changes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by_type TEXT DEFAULT 'system', -- 'system', 'admin'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.order_status_history IS 'Immutable audit log of order status changes';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_intent_id ON public.orders(payment_intent_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON public.order_items(variant_id);

CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id, created_at DESC);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - ORDERS
-- Allow public read by order ID (for order tracking)
-- =====================================================
CREATE POLICY "Anyone can view order by ID"
  ON public.orders FOR SELECT
  USING (true); -- Order lookup will require order_number + email verification in app

-- =====================================================
-- RLS POLICIES - ORDER ITEMS
-- Allow public read (will be filtered by order in app)
-- =====================================================
CREATE POLICY "Anyone can view order items"
  ON public.order_items FOR SELECT
  USING (true);

-- =====================================================
-- RLS POLICIES - ORDER STATUS HISTORY
-- Allow public read
-- =====================================================
CREATE POLICY "Anyone can view order status history"
  ON public.order_status_history FOR SELECT
  USING (true);

-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================
CREATE TRIGGER set_updated_at_orders
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- TRIGGER: Auto-log status changes
-- =====================================================
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by_type
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'system'
    );

    -- Update timestamp fields based on status
    CASE NEW.status
      WHEN 'confirmed' THEN
        NEW.confirmed_at = NOW();
      WHEN 'shipped' THEN
        NEW.shipped_at = NOW();
      WHEN 'delivered' THEN
        NEW.delivered_at = NOW();
      WHEN 'cancelled' THEN
        NEW.cancelled_at = NOW();
      ELSE
        -- Do nothing
    END CASE;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER log_order_status_change_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- =====================================================
-- FUNCTION: Generate sequential order number
-- Format: ORD-2025-000001
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_seq TEXT;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  v_seq := LPAD(nextval('order_number_seq')::TEXT, 6, '0');
  RETURN 'ORD-' || v_year || '-' || v_seq;
END;
$$;

COMMENT ON FUNCTION public.generate_order_number IS 'Generate sequential human-readable order number';

-- =====================================================
-- FUNCTION: Create order from cart data
-- Called by server action after payment confirmation
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_shipping_address JSONB,
  p_billing_address JSONB,
  p_cart_items JSONB, -- Array of {variant_id, quantity, price}
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
BEGIN
  -- Calculate subtotal from cart items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_subtotal := v_subtotal + ((v_item->>'quantity')::INTEGER * (v_item->>'price')::NUMERIC);
  END LOOP;

  -- Calculate tax and total
  v_tax_amount := (v_subtotal - p_discount_amount + p_shipping_cost) * p_tax_rate;
  v_total_amount := v_subtotal - p_discount_amount + p_shipping_cost + v_tax_amount;

  -- Generate order number
  v_order_number := public.generate_order_number();

  -- Create order
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

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    -- Get variant details
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
    WHERE pv.id = (v_item->>'variant_id')::UUID;

    -- Insert order item
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
      (v_item->>'variant_id')::UUID,
      v_variant.product_name,
      v_variant.variant_description,
      v_variant.sku,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price')::NUMERIC,
      (v_item->>'quantity')::INTEGER * (v_item->>'price')::NUMERIC
    );

    -- Decrement inventory
    PERFORM public.adjust_inventory(
      (v_item->>'variant_id')::UUID,
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

COMMENT ON FUNCTION public.create_order IS 'Create order from cart data after payment confirmation';

-- =====================================================
-- EMAIL_LOGS TABLE
-- Track sent emails for debugging and analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL, -- 'order_confirmation', 'shipping_notification', etc.
  recipient_email TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'bounced')) DEFAULT 'pending',
  resend_id TEXT, -- Resend email ID for tracking
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.email_logs IS 'Email sending audit log';

CREATE INDEX idx_email_logs_order_id ON public.email_logs(order_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_type ON public.email_logs(email_type, created_at DESC);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email logs are not publicly accessible"
  ON public.email_logs FOR SELECT
  USING (false); -- Only accessible via service role

-- =====================================================
-- FUNCTION: Send order confirmation email webhook
-- Calls Next.js API when order status changes to 'confirmed'
-- Requires: pg_net extension enabled in Supabase
-- Secrets stored in Supabase Vault:
--   - 'order_email_webhook_url': Your API endpoint URL
--   - 'webhook_secret': Secret for authorization header
-- =====================================================
CREATE OR REPLACE FUNCTION public.send_order_confirmation_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_webhook_url TEXT;
  v_webhook_secret TEXT;
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN

    -- Get secrets from Supabase Vault (decrypted at query time)
    SELECT decrypted_secret INTO v_webhook_url
    FROM vault.decrypted_secrets
    WHERE name = 'order_email_webhook_url'
    LIMIT 1;

    SELECT decrypted_secret INTO v_webhook_secret
    FROM vault.decrypted_secrets
    WHERE name = 'webhook_secret'
    LIMIT 1;

    -- Ensure webhook URL is configured
    IF v_webhook_url IS NULL THEN
      RAISE WARNING 'order_email_webhook_url not found in Vault. Skipping email.';
      RETURN NEW;
    END IF;

    -- Call Next.js API using pg_net extension (non-blocking HTTP POST)
    -- pg_net must be enabled in Supabase Dashboard > Database > Extensions
    PERFORM net.http_post(
      url := v_webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(v_webhook_secret, '')
      ),
      body := jsonb_build_object(
        'type', 'UPDATE',
        'table', 'orders',
        'record', jsonb_build_object(
          'id', NEW.id,
          'order_number', NEW.order_number,
          'status', NEW.status,
          'customer_email', NEW.customer_email,
          'customer_name', NEW.customer_name,
          'shipping_address', NEW.shipping_address,
          'subtotal', NEW.subtotal,
          'shipping_cost', NEW.shipping_cost,
          'tax_amount', NEW.tax_amount,
          'total_amount', NEW.total_amount,
          'created_at', NEW.created_at
        ),
        'old_record', jsonb_build_object(
          'status', OLD.status
        )
      )::text
    );

  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.send_order_confirmation_email IS 'Webhook trigger to send order confirmation email when order is confirmed. Reads secrets from Supabase Vault.';

-- =====================================================
-- TRIGGER: Send email on order confirmation
-- =====================================================
CREATE TRIGGER send_order_confirmation_email_trigger
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.send_order_confirmation_email();

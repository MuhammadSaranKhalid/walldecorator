-- =====================================================
-- Migration: Product Attributes
-- Description: Product attributes and attribute values tables with RLS
-- =====================================================

-- =====================================================
-- PRODUCT_ATTRIBUTES TABLE
-- Global attributes: Material, Size, Thickness
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'material', 'size', 'thickness'
  display_name TEXT NOT NULL, -- 'Material', 'Size', 'Thickness (mm)'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.product_attributes IS 'Product attribute types (Material, Size, Thickness)';

-- Insert default attributes for wall decorator
INSERT INTO public.product_attributes (name, display_name, display_order)
VALUES
  ('material', 'Material', 1),
  ('size', 'Size', 2),
  ('thickness', 'Thickness (mm)', 3)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- PRODUCT_ATTRIBUTE_VALUES TABLE
-- Actual values for each attribute
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_attribute_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id UUID REFERENCES public.product_attributes(id) ON DELETE CASCADE NOT NULL,
  value TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (attribute_id, value)
);

COMMENT ON TABLE public.product_attribute_values IS 'Attribute values (e.g., Metal, Wood, 60x40cm, 3mm)';

-- Insert sample material values
INSERT INTO public.product_attribute_values (attribute_id, value, display_name, display_order)
SELECT
  (SELECT id FROM public.product_attributes WHERE name = 'material'),
  value,
  display_name,
  display_order
FROM (VALUES
  ('metal', 'Metal', 1),
  ('wood', 'Wood', 2),
  ('acrylic', 'Acrylic', 3)
) AS materials(value, display_name, display_order)
ON CONFLICT DO NOTHING;

-- Insert sample size values
INSERT INTO public.product_attribute_values (attribute_id, value, display_name, display_order)
SELECT
  (SELECT id FROM public.product_attributes WHERE name = 'size'),
  value,
  display_name,
  display_order
FROM (VALUES
  ('2x2', '2ft × 2ft', 1),
  ('3x3', '3ft × 3ft', 2),
  ('4x4', '4ft × 4ft', 3)
) AS sizes(value, display_name, display_order)
ON CONFLICT DO NOTHING;

-- Insert sample thickness values
INSERT INTO public.product_attribute_values (attribute_id, value, display_name, display_order)
SELECT
  (SELECT id FROM public.product_attributes WHERE name = 'thickness'),
  value,
  display_name,
  display_order
FROM (VALUES
  ('3', '3mm', 1),
  ('4', '4mm', 2)
) AS thickness(value, display_name, display_order)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
-- Public access
CREATE POLICY "Anyone can view product attributes"
  ON public.product_attributes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view attribute values"
  ON public.product_attribute_values FOR SELECT
  USING (true);

-- Admin access (service role)
CREATE POLICY "Service role can manage product_attributes"
  ON public.product_attributes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage product_attribute_values"
  ON public.product_attribute_values FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

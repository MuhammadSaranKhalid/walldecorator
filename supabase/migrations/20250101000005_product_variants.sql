-- =====================================================
-- Migration: Product Variants
-- Description: Product variants table with RLS, triggers, and SKU generation
-- =====================================================

-- =====================================================
-- PRODUCT_VARIANTS TABLE
-- Specific combinations: Material × Size × Thickness = SKU + Price
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE NOT NULL,

  -- Attributes
  material_id UUID REFERENCES public.product_attribute_values(id) NOT NULL,
  size_id UUID REFERENCES public.product_attribute_values(id) NOT NULL,
  thickness_id UUID REFERENCES public.product_attribute_values(id) NOT NULL,

  -- Pricing
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price NUMERIC(10,2) CHECK (compare_at_price >= 0),
  cost_per_item NUMERIC(10,2),

  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Ensure unique combination per product
  UNIQUE (product_id, material_id, size_id, thickness_id)
);

COMMENT ON TABLE public.product_variants IS 'Product variants: Material × Size × Thickness combinations';

-- Ensure only one default variant per product
CREATE UNIQUE INDEX idx_product_variants_default
  ON public.product_variants(product_id)
  WHERE is_default = true;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_product_variants_price ON public.product_variants(price);
CREATE INDEX idx_product_variants_material ON public.product_variants(material_id);
CREATE INDEX idx_product_variants_size ON public.product_variants(size_id);
CREATE INDEX idx_product_variants_thickness ON public.product_variants(thickness_id);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view variants of active products"
  ON public.product_variants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_variants.product_id
      AND products.status = 'active'
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER set_updated_at_product_variants
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: Generate SKU for variant
-- Format: {PRODUCT_SLUG}-{MATERIAL}-{SIZE}-{THICKNESS}mm
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_variant_sku(
  p_product_id UUID,
  p_material_id UUID,
  p_size_id UUID,
  p_thickness_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_slug TEXT;
  v_material_value TEXT;
  v_size_value TEXT;
  v_thickness_value TEXT;
BEGIN
  SELECT slug INTO v_product_slug
  FROM public.products
  WHERE id = p_product_id;

  SELECT value INTO v_material_value
  FROM public.product_attribute_values
  WHERE id = p_material_id;

  SELECT value INTO v_size_value
  FROM public.product_attribute_values
  WHERE id = p_size_id;

  SELECT value INTO v_thickness_value
  FROM public.product_attribute_values
  WHERE id = p_thickness_id;

  RETURN UPPER(v_product_slug || '-' || v_material_value || '-' || v_size_value || '-' || v_thickness_value || 'mm');
END;
$$;

COMMENT ON FUNCTION public.generate_variant_sku IS 'Generate SKU from product and attributes';

-- =====================================================
-- FUNCTION: Auto-generate SKU on insert
-- =====================================================
CREATE OR REPLACE FUNCTION public.auto_generate_variant_sku()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate if SKU is not provided
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := public.generate_variant_sku(
      NEW.product_id,
      NEW.material_id,
      NEW.size_id,
      NEW.thickness_id
    );
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_generate_variant_sku IS 'Auto-generate SKU for product variants on insert';

CREATE TRIGGER auto_generate_sku_trigger
  BEFORE INSERT ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_variant_sku();

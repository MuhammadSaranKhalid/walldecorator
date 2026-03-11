-- =====================================================
-- Migration: Material Attribute Relationships
-- Description: Define many-to-many relationship between materials and their allowed sizes/thicknesses
-- =====================================================

CREATE TABLE IF NOT EXISTS public.material_attribute_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.product_attribute_values(id) ON DELETE CASCADE NOT NULL,
  attribute_value_id UUID REFERENCES public.product_attribute_values(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (material_id, attribute_value_id)
);

COMMENT ON TABLE public.material_attribute_relationships IS 'Allowed sizes and thicknesses for each material';

-- Enable Row Level Security
ALTER TABLE public.material_attribute_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view material attribute relationships"
  ON public.material_attribute_relationships FOR SELECT
  USING (true);

-- =====================================================
-- POPULATE FROM EXISTING VARIANTS
-- =====================================================

-- Insert existing material-size combinations
INSERT INTO public.material_attribute_relationships (material_id, attribute_value_id)
SELECT DISTINCT material_id, size_id
FROM public.product_variants
ON CONFLICT (material_id, attribute_value_id) DO NOTHING;

-- Insert existing material-thickness combinations
INSERT INTO public.material_attribute_relationships (material_id, attribute_value_id)
SELECT DISTINCT material_id, thickness_id
FROM public.product_variants
ON CONFLICT (material_id, attribute_value_id) DO NOTHING;

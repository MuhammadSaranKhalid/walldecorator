-- =====================================================
-- Migration: Image Processing Configurations
-- Description: Centralized configuration for image variants per entity type
-- =====================================================

CREATE TABLE IF NOT EXISTS public.image_processing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL UNIQUE CHECK (entity_type IN ('product', 'category', 'review', 'custom_order')),
  
  -- The base folder in the storage bucket for this entity type (e.g., 'products', 'categories')
  folder_prefix TEXT NOT NULL,
  
  -- The variants configuration stored as JSONB
  -- Example: {"thumbnail": {"width": 150, "height": 150, "folder": "thumbnail"}, "medium": {"width": 600, "height": 600, "folder": "medium"}, "large": {"width": 1200, "height": 1200, "folder": "large"}}
  variants JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.image_processing_configs IS 'Configuration for auto-generated image variants per entity type';
COMMENT ON COLUMN public.image_processing_configs.folder_prefix IS 'Base folder prefix in the storage bucket for this entity''s images';
COMMENT ON COLUMN public.image_processing_configs.variants IS 'JSONB configuration of variant dimensions and folder names';

-- =====================================================
-- ROW LEVEL SECURITY 
-- =====================================================
ALTER TABLE public.image_processing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage image_processing_configs"
  ON public.image_processing_configs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER set_updated_at_image_processing_configs
  BEFORE UPDATE ON public.image_processing_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- DEFAULT CONFIGURATIONS
-- =====================================================
INSERT INTO public.image_processing_configs (entity_type, folder_prefix, variants) VALUES
  ('product', 'products', '{"thumbnail": {"width": 150, "height": 150, "folder": "thumbnail"}, "medium": {"width": 600, "height": 600, "folder": "medium"}, "large": {"width": 1200, "height": 1200, "folder": "large"}}'::jsonb),
  ('category', 'categories', '{"thumbnail": {"width": 150, "height": 150, "folder": "thumbnail"}, "medium": {"width": 600, "height": 600, "folder": "medium"}, "large": {"width": 1200, "height": 1200, "folder": "large"}}'::jsonb),
  ('review', 'reviews', '{"thumbnail": {"width": 150, "height": 150, "folder": "thumbnail"}, "medium": {"width": 600, "height": 600, "folder": "medium"}, "large": {"width": 1200, "height": 1200, "folder": "large"}}'::jsonb),
  ('custom_order', 'custom-orders', '{"thumbnail": {"width": 150, "height": 150, "folder": "thumbnail"}, "medium": {"width": 600, "height": 600, "folder": "medium"}, "large": {"width": 1200, "height": 1200, "folder": "large"}}'::jsonb)
ON CONFLICT (entity_type) DO NOTHING;

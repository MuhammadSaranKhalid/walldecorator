-- =====================================================
-- Wall Decorator - Seed Data
-- Run after all migrations complete
-- =====================================================

-- =====================================================
-- 1. CATEGORIES
-- =====================================================
INSERT INTO public.categories (name, slug, description, is_visible, display_order) VALUES
('Geometric', 'geometric', 'Modern geometric patterns and shapes', true, 1),
('Floral', 'floral', 'Beautiful floral and nature-inspired designs', true, 2),
('Abstract', 'abstract', 'Contemporary abstract art pieces', true, 3),
('Islamic', 'islamic', 'Traditional Islamic patterns and calligraphy', true, 4),
('Animals', 'animals', 'Wildlife and animal silhouettes', true, 5),
('Typography', 'typography', 'Words, quotes, and text-based art', true, 6)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. SAMPLE PRODUCTS
-- =====================================================

-- Product 1: Geometric Mandala
INSERT INTO public.products (name, slug, description, category_id, status, is_featured, featured_order)
SELECT
  'Geometric Mandala',
  'geometric-mandala',
  'Intricate laser-cut mandala design perfect for meditation spaces and modern interiors',
  (SELECT id FROM public.categories WHERE slug = 'geometric'),
  'active',
  true,
  1
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'geometric-mandala');

-- Product 2: Rose Garden
INSERT INTO public.products (name, slug, description, category_id, status, is_featured, featured_order)
SELECT
  'Rose Garden',
  'rose-garden',
  'Elegant rose pattern with delicate details, ideal for living rooms and bedrooms',
  (SELECT id FROM public.categories WHERE slug = 'floral'),
  'active',
  true,
  2
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'rose-garden');

-- Product 3: Abstract Waves
INSERT INTO public.products (name, slug, description, category_id, status, is_featured, featured_order)
SELECT
  'Abstract Waves',
  'abstract-waves',
  'Flowing wave pattern that adds movement and depth to any wall',
  (SELECT id FROM public.categories WHERE slug = 'abstract'),
  'active',
  true,
  3
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'abstract-waves');

-- Product 4: Islamic Geometry
INSERT INTO public.products (name, slug, description, category_id, status, is_featured, featured_order)
SELECT
  'Islamic Geometry',
  'islamic-geometry',
  'Traditional Islamic geometric pattern with authentic craftsmanship',
  (SELECT id FROM public.categories WHERE slug = 'islamic'),
  'active',
  true,
  4
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'islamic-geometry');

-- Product 5: Mountain Landscape
INSERT INTO public.products (name, slug, description, category_id, status, is_featured, featured_order)
SELECT
  'Mountain Landscape',
  'mountain-landscape',
  'Minimalist mountain silhouette for nature lovers',
  (SELECT id FROM public.categories WHERE slug = 'abstract'),
  'active',
  false,
  0
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'mountain-landscape');

-- Product 6: Butterfly Collection
INSERT INTO public.products (name, slug, description, category_id, status, is_featured, featured_order)
SELECT
  'Butterfly Collection',
  'butterfly-collection',
  'Delicate butterfly silhouettes in various sizes',
  (SELECT id FROM public.categories WHERE slug = 'animals'),
  'active',
  false,
  0
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'butterfly-collection');

-- =====================================================
-- 3. PRODUCT VARIANTS (Material × Size × Thickness)
-- =====================================================

-- Helper function to create variants for a product
DO $$
DECLARE
  v_product_id UUID;
  v_material RECORD;
  v_size RECORD;
  v_thickness RECORD;
  v_sku TEXT;
  v_base_price NUMERIC;
BEGIN
  -- For each product, create variants
  FOR v_product_id IN (SELECT id FROM public.products WHERE status = 'active')
  LOOP
    -- Determine base price based on product name
    SELECT
      CASE
        WHEN name LIKE '%Islamic%' THEN 5000
        WHEN name LIKE '%Mandala%' THEN 4500
        WHEN name LIKE '%Rose%' THEN 4000
        WHEN name LIKE '%Waves%' THEN 4200
        ELSE 3500
      END INTO v_base_price
    FROM public.products WHERE id = v_product_id;

    -- Create variants for each material/size/thickness combination
    FOR v_material IN (SELECT id, value FROM public.product_attribute_values WHERE attribute_id = (SELECT id FROM public.product_attributes WHERE name = 'material'))
    LOOP
      FOR v_size IN (SELECT id, value FROM public.product_attribute_values WHERE attribute_id = (SELECT id FROM public.product_attributes WHERE name = 'size'))
      LOOP
        FOR v_thickness IN (SELECT id, value FROM public.product_attribute_values WHERE attribute_id = (SELECT id FROM public.product_attributes WHERE name = 'thickness'))
        LOOP
          -- Generate SKU
          v_sku := public.generate_variant_sku(v_product_id, v_material.id, v_size.id, v_thickness.id);

          -- Calculate price based on material, size, and thickness
          INSERT INTO public.product_variants (
            product_id,
            material_id,
            size_id,
            thickness_id,
            sku,
            price,
            is_default
          ) VALUES (
            v_product_id,
            v_material.id,
            v_size.id,
            v_thickness.id,
            v_sku,
            v_base_price
              * CASE v_material.value
                  WHEN 'metal' THEN 1.3
                  WHEN 'wood' THEN 1.0
                  WHEN 'acrylic' THEN 1.5
                  ELSE 1.0
                END
              * CASE v_size.value
                  WHEN '2x2' THEN 1.0
                  WHEN '3x3' THEN 2.0
                  WHEN '4x4' THEN 3.5
                  ELSE 1.0
                END
              * CASE v_thickness.value
                  WHEN '3' THEN 1.0
                  WHEN '4' THEN 1.3
                  ELSE 1.0
                END,
            -- Set acrylic, 2x2, 3mm as default
            (v_material.value = 'acrylic' AND v_size.value = '2x2' AND v_thickness.value = '3')
          )
          ON CONFLICT (product_id, material_id, size_id, thickness_id) DO NOTHING;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- 4. INVENTORY
-- Initialize stock for all variants
-- =====================================================
INSERT INTO public.inventory (variant_id, quantity_on_hand, low_stock_threshold)
SELECT id, 50, 10
FROM public.product_variants
ON CONFLICT (variant_id) DO NOTHING;

-- =====================================================
-- 5. DISCOUNT CODES
-- =====================================================
INSERT INTO public.discount_codes (code, type, value, minimum_order_amount, is_active, valid_from, valid_until) VALUES
('WELCOME10', 'percentage', 10, 2000, true, NOW(), NOW() + INTERVAL '1 year'),
('FIRSTORDER', 'percentage', 15, 3000, true, NOW(), NOW() + INTERVAL '1 year'),
('FREESHIP', 'free_shipping', 0, 5000, true, NOW(), NOW() + INTERVAL '1 year'),
('SAVE500', 'fixed_amount', 500, 5000, true, NOW(), NOW() + INTERVAL '6 months')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 6. HOMEPAGE CONFIG
-- =====================================================
UPDATE public.homepage_config SET
  hero_headline = 'Transform Your Walls',
  hero_subheadline = 'Precision-crafted laser-cut metal art that turns your walls into a gallery',
  hero_cta_text = 'Shop Now',
  hero_cta_link = '/products',
  promo_is_active = true,
  promo_headline = '15% Off Your First Order',
  promo_subheadline = 'Use code FIRSTORDER at checkout',
  promo_cta_text = 'Shop Sale',
  promo_cta_link = '/products',
  promo_bg_color = '#1a1a1a';

-- =====================================================
-- 7. SAMPLE REVIEWS (for demonstration)
-- =====================================================
INSERT INTO public.reviews (
  product_id,
  reviewer_name,
  reviewer_email,
  rating,
  title,
  body,
  is_approved,
  is_verified_purchase
)
SELECT
  (SELECT id FROM public.products WHERE slug = 'geometric-mandala'),
  'Sarah Ahmed',
  'sarah@example.com',
  5,
  'Absolutely Beautiful!',
  'The quality exceeded my expectations. The laser cutting is precise and the metal finish is perfect. Looks stunning in my living room.',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews
  WHERE product_id = (SELECT id FROM public.products WHERE slug = 'geometric-mandala')
  AND reviewer_email = 'sarah@example.com'
);

INSERT INTO public.reviews (
  product_id,
  reviewer_name,
  reviewer_email,
  rating,
  title,
  body,
  is_approved,
  is_verified_purchase
)
SELECT
  (SELECT id FROM public.products WHERE slug = 'rose-garden'),
  'Ali Khan',
  'ali@example.com',
  5,
  'Great Quality',
  'Very happy with this purchase. Shipping was fast and packaging was excellent. The rose pattern is intricate and well-made.',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews
  WHERE product_id = (SELECT id FROM public.products WHERE slug = 'rose-garden')
  AND reviewer_email = 'ali@example.com'
);

INSERT INTO public.reviews (
  product_id,
  reviewer_name,
  reviewer_email,
  rating,
  title,
  body,
  is_approved,
  is_verified_purchase
)
SELECT
  (SELECT id FROM public.products WHERE slug = 'islamic-geometry'),
  'Fatima Hassan',
  'fatima@example.com',
  5,
  'Perfect for My Home',
  'Authentic Islamic design with beautiful craftsmanship. This piece adds so much elegance to my prayer room.',
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.reviews
  WHERE product_id = (SELECT id FROM public.products WHERE slug = 'islamic-geometry')
  AND reviewer_email = 'fatima@example.com'
);

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data loaded successfully!';
  RAISE NOTICE '📦 Created: % categories', (SELECT COUNT(*) FROM public.categories);
  RAISE NOTICE '🎨 Created: % products', (SELECT COUNT(*) FROM public.products);
  RAISE NOTICE '🔧 Created: % variants', (SELECT COUNT(*) FROM public.product_variants);
  RAISE NOTICE '📊 Created: % inventory records', (SELECT COUNT(*) FROM public.inventory);
  RAISE NOTICE '🎟️  Created: % discount codes', (SELECT COUNT(*) FROM public.discount_codes);
  RAISE NOTICE '⭐ Created: % reviews', (SELECT COUNT(*) FROM public.reviews);
END $$;

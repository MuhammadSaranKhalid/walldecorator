-- =============================================================================
-- SEED DATA
-- Initial categories, materials, and sample data
-- =============================================================================

-- =============================================================================
-- MATERIALS
-- =============================================================================

INSERT INTO materials (id, name, slug, description, base_price_multiplier, density, display_order, color_hex, is_active) VALUES
  ('10000001-0001-0001-0001-000000000001', 'Acrylic', 'acrylic', 'Lightweight and durable acrylic material', 1.0, 1.18, 1, '#E3F2FD', TRUE),
  ('10000001-0001-0001-0001-000000000002', 'Steel', 'steel', 'Strong and modern steel material', 1.5, 7.85, 2, '#CFD8DC', TRUE),
  ('10000001-0001-0001-0001-000000000003', 'Iron', 'iron', 'Classic and sturdy iron material', 1.6, 7.87, 3, '#B0BEC5', TRUE),
  ('10000001-0001-0001-0001-000000000004', 'Wood', 'wood', 'Natural and warm wooden finish', 2.0, 0.75, 4, '#BCAAA4', TRUE),
  ('10000001-0001-0001-0001-000000000005', 'Brass', 'brass', 'Premium brass material with golden tone', 2.5, 8.73, 5, '#FFD54F', TRUE),
  ('10000001-0001-0001-0001-000000000006', 'Copper', 'copper', 'Elegant copper with rich color', 2.3, 8.96, 6, '#FF8A65', TRUE),
  ('10000001-0001-0001-0001-000000000007', 'Aluminum', 'aluminum', 'Lightweight aluminum with modern appeal', 1.3, 2.70, 7, '#ECEFF1', TRUE);

-- =============================================================================
-- CATEGORIES
-- =============================================================================

-- Main categories
INSERT INTO categories (id, name, slug, description, parent_id, display_order, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Wall Art', 'wall-art', 'Beautiful wall art pieces for your home', NULL, 1, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Sculptures', 'sculptures', '3D decorative sculptures', NULL, 2, TRUE),
  ('33333333-3333-3333-3333-333333333333', 'Mirrors', 'mirrors', 'Decorative wall mirrors', NULL, 3, TRUE),
  ('44444444-4444-4444-4444-444444444444', 'Shelves', 'shelves', 'Decorative wall shelves', NULL, 4, TRUE),
  ('55555555-5555-5555-5555-555555555555', 'Clocks', 'clocks', 'Designer wall clocks', NULL, 5, TRUE);

-- Sub-categories for Wall Art
INSERT INTO categories (name, slug, description, parent_id, display_order, is_active) VALUES
  ('Abstract Art', 'abstract-art', 'Modern abstract wall art', '11111111-1111-1111-1111-111111111111', 1, TRUE),
  ('Nature & Landscapes', 'nature-landscapes', 'Nature-inspired wall art', '11111111-1111-1111-1111-111111111111', 2, TRUE),
  ('Geometric Designs', 'geometric-designs', 'Geometric pattern wall art', '11111111-1111-1111-1111-111111111111', 3, TRUE),
  ('Custom Designs', 'custom-designs', 'Custom made wall art', '11111111-1111-1111-1111-111111111111', 4, TRUE);

-- Sub-categories for Sculptures
INSERT INTO categories (name, slug, description, parent_id, display_order, is_active) VALUES
  ('Animal Sculptures', 'animal-sculptures', 'Animal-themed sculptures', '22222222-2222-2222-2222-222222222222', 1, TRUE),
  ('Abstract Sculptures', 'abstract-sculptures', 'Abstract sculptural art', '22222222-2222-2222-2222-222222222222', 2, TRUE),
  ('Modern Sculptures', 'modern-sculptures', 'Contemporary sculptural pieces', '22222222-2222-2222-2222-222222222222', 3, TRUE);

-- =============================================================================
-- SAMPLE PRODUCTS (Optional - can be removed in production)
-- =============================================================================

-- Sample Product 1: Mountain Scene
INSERT INTO products (
  id, name, slug, sku, description, category_id, status,
  dimensions_width, dimensions_height, dimensions_depth, weight,
  is_featured, is_new_arrival, is_best_seller
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Mountain Scene Wall Art',
  'mountain-scene-wall-art',
  'MNT-001',
  'Beautiful mountain landscape wall art perfect for living rooms and offices. Features intricate laser-cut details and a modern minimalist design.',
  (SELECT id FROM categories WHERE slug = 'nature-landscapes' LIMIT 1),
  'active',
  24, 18, 0.25, 3.5,
  TRUE, TRUE, FALSE
);

-- Material variants for Mountain Scene
INSERT INTO product_materials (product_id, material_id, price, compare_at_price, cost_price, inventory_quantity, low_stock_threshold, finish, is_available) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10000001-0001-0001-0001-000000000001', 49.99, 69.99, 20.00, 50, 10, 'glossy', TRUE),  -- Acrylic
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10000001-0001-0001-0001-000000000002', 79.99, 99.99, 30.00, 30, 10, 'brushed', TRUE),  -- Steel
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '10000001-0001-0001-0001-000000000004', 119.99, 149.99, 45.00, 20, 5, 'natural', TRUE);  -- Wood

-- Sample Product 2: Geometric Pattern
INSERT INTO products (
  id, name, slug, sku, description, category_id, status,
  dimensions_width, dimensions_height, dimensions_depth, weight,
  is_featured, is_new_arrival, is_best_seller
) VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Hexagon Geometric Wall Art',
  'hexagon-geometric-wall-art',
  'HEX-001',
  'Modern hexagonal pattern wall art with clean lines and contemporary appeal. Perfect for modern interiors.',
  (SELECT id FROM categories WHERE slug = 'geometric-designs' LIMIT 1),
  'active',
  30, 30, 0.25, 4.2,
  FALSE, FALSE, TRUE
);

-- Material variants for Geometric Pattern
INSERT INTO product_materials (product_id, material_id, price, compare_at_price, cost_price, inventory_quantity, low_stock_threshold, finish, is_available) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10000001-0001-0001-0001-000000000001', 59.99, 79.99, 25.00, 40, 10, 'matte', TRUE),  -- Acrylic
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10000001-0001-0001-0001-000000000002', 89.99, 119.99, 35.00, 25, 10, 'polished', TRUE),  -- Steel
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '10000001-0001-0001-0001-000000000003', 99.99, 129.99, 40.00, 15, 5, 'powder-coated', TRUE);  -- Iron

-- Sample Product 3: Abstract Art
INSERT INTO products (
  id, name, slug, sku, description, category_id, status,
  dimensions_width, dimensions_height, dimensions_depth, weight,
  is_featured, is_new_arrival, is_best_seller
) VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Abstract Wave Wall Sculpture',
  'abstract-wave-wall-sculpture',
  'ABS-001',
  'Flowing abstract wave design that adds movement and elegance to any space. Three-dimensional sculptural element.',
  (SELECT id FROM categories WHERE slug = 'abstract-art' LIMIT 1),
  'active',
  36, 24, 1.5, 6.8,
  TRUE, FALSE, TRUE
);

-- Material variants for Abstract Art
INSERT INTO product_materials (product_id, material_id, price, compare_at_price, cost_price, inventory_quantity, low_stock_threshold, finish, is_available) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '10000001-0001-0001-0001-000000000002', 149.99, 199.99, 60.00, 20, 5, 'brushed', TRUE),  -- Steel
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '10000001-0001-0001-0001-000000000005', 199.99, 249.99, 80.00, 10, 3, 'polished', TRUE),  -- Brass
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '10000001-0001-0001-0001-000000000006', 179.99, 229.99, 70.00, 12, 4, 'oxidized', TRUE);  -- Copper

-- =============================================================================
-- SAMPLE PRODUCT IMAGES
-- =============================================================================

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, display_order) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', 'Mountain Scene Wall Art - Front View', TRUE, 1),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://images.unsplash.com/photo-1519681393784-d120267933ba', 'Mountain Scene Wall Art - Detail', FALSE, 2),
  
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73', 'Hexagon Geometric Wall Art - Front View', TRUE, 1),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c', 'Hexagon Geometric Wall Art - Angle View', FALSE, 2),
  
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1549989476-69a92fa57c36', 'Abstract Wave Wall Sculpture - Front', TRUE, 1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://images.unsplash.com/photo-1554629947-334ff61d85dc', 'Abstract Wave Wall Sculpture - Side View', FALSE, 2);

-- =============================================================================
-- ANALYTICS NOTE
-- =============================================================================

COMMENT ON TABLE categories IS 'Optimized categories table with hierarchical structure for easy expansion';
COMMENT ON TABLE products IS 'Core products table - scalable and normalized';
COMMENT ON TABLE product_materials IS 'Material variants enable flexible pricing per material type';


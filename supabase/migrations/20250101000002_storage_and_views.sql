-- =============================================================================
-- STORAGE BUCKETS
-- =============================================================================

-- Product images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Customization files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customization-files',
  'customization-files',
  false, -- Private
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Product images: Public can view, authenticated users can upload
CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Customization files: Only users can upload and view their own
CREATE POLICY "Users can view own customization files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'customization-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload customization files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'customization-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- HELPER VIEWS
-- =============================================================================

-- Product catalog view with pricing information
CREATE OR REPLACE VIEW product_catalog AS
SELECT 
  p.id as product_id,
  p.name,
  p.slug,
  p.sku,
  p.description,
  p.primary_image_url,
  p.status,
  p.is_featured,
  p.is_new_arrival,
  p.is_best_seller,
  p.view_count,
  
  -- Category information
  c.id as category_id,
  c.name as category_name,
  c.slug as category_slug,
  
  -- Pricing information (min and max across all materials)
  MIN(pm.price) as min_price,
  MAX(pm.price) as max_price,
  
  -- Availability
  BOOL_OR(pm.is_available AND pm.inventory_quantity > 0) as in_stock,
  SUM(pm.inventory_quantity) as total_inventory,
  
  -- Materials available (names and slugs)
  ARRAY_AGG(DISTINCT jsonb_build_object(
    'id', m.id,
    'name', m.name,
    'slug', m.slug
  ) ORDER BY m.name) FILTER (WHERE pm.is_available AND m.is_active) as available_materials,
  
  -- Review stats
  COUNT(DISTINCT r.id) as review_count,
  COALESCE(AVG(r.rating), 0) as average_rating,
  
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_materials pm ON p.id = pm.product_id
LEFT JOIN materials m ON pm.material_id = m.id
LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = TRUE
GROUP BY 
  p.id, p.name, p.slug, p.sku, p.description, p.primary_image_url,
  p.status, p.is_featured, p.is_new_arrival, p.is_best_seller, p.view_count,
  c.id, c.name, c.slug, p.created_at, p.updated_at;

-- Product detail view with all related information
CREATE OR REPLACE VIEW product_details AS
SELECT 
  p.id as product_id,
  p.name,
  p.slug,
  p.sku,
  p.description,
  p.primary_image_url,
  p.status,
  p.dimensions_width,
  p.dimensions_height,
  p.dimensions_depth,
  p.weight,
  p.is_featured,
  p.is_new_arrival,
  p.is_best_seller,
  p.view_count,
  
  -- Category
  json_build_object(
    'id', c.id,
    'name', c.name,
    'slug', c.slug
  ) as category,
  
  -- Materials with pricing
  (
    SELECT json_agg(
      json_build_object(
        'id', pm.id,
        'material_id', m.id,
        'material_name', m.name,
        'material_slug', m.slug,
        'price', pm.price,
        'compare_at_price', pm.compare_at_price,
        'inventory_quantity', pm.inventory_quantity,
        'is_available', pm.is_available,
        'finish', pm.finish
      ) ORDER BY pm.price
    )
    FROM product_materials pm
    JOIN materials m ON pm.material_id = m.id
    WHERE pm.product_id = p.id AND pm.is_available = TRUE AND m.is_active = TRUE
  ) as materials,
  
  -- Images
  (
    SELECT json_agg(
      json_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'alt_text', pi.alt_text,
        'is_primary', pi.is_primary
      ) ORDER BY pi.display_order, pi.created_at
    )
    FROM product_images pi
    WHERE pi.product_id = p.id
  ) as images,
  
  -- Reviews summary
  json_build_object(
    'count', COUNT(DISTINCT r.id),
    'average_rating', COALESCE(AVG(r.rating), 0),
    'rating_distribution', (
      SELECT json_object_agg(rating, count)
      FROM (
        SELECT rating, COUNT(*) as count
        FROM reviews
        WHERE product_id = p.id AND is_approved = TRUE
        GROUP BY rating
      ) ratings
    )
  ) as reviews,
  
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = TRUE
GROUP BY p.id, c.id;

-- Low stock alert view
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.sku,
  pm.id as product_material_id,
  m.id as material_id,
  m.name as material_name,
  m.slug as material_slug,
  pm.inventory_quantity,
  pm.low_stock_threshold,
  pm.price
FROM products p
JOIN product_materials pm ON p.id = pm.product_id
JOIN materials m ON pm.material_id = m.id
WHERE pm.inventory_quantity <= pm.low_stock_threshold
  AND pm.is_available = TRUE
  AND m.is_active = TRUE
  AND p.status = 'active'
ORDER BY pm.inventory_quantity ASC;

-- Order summary view
CREATE OR REPLACE VIEW order_summary AS
SELECT 
  o.id as order_id,
  o.order_number,
  o.status,
  o.total,
  o.created_at,
  
  -- Customer info
  json_build_object(
    'id', c.id,
    'email', c.email,
    'first_name', c.first_name,
    'last_name', c.last_name
  ) as customer,
  
  -- Items
  json_build_object(
    'count', COUNT(oi.id),
    'items', json_agg(
      json_build_object(
        'product_name', oi.product_name,
        'material_name', oi.material_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price
      )
    )
  ) as order_items
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, c.id;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Get product price range
CREATE OR REPLACE FUNCTION get_product_price_range(product_uuid UUID)
RETURNS TABLE (
  min_price DECIMAL(10, 2),
  max_price DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    MIN(pm.price) as min_price,
    MAX(pm.price) as max_price
  FROM product_materials pm
  WHERE pm.product_id = product_uuid
    AND pm.is_available = TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Check product availability
CREATE OR REPLACE FUNCTION check_product_availability(
  product_uuid UUID,
  material_uuid UUID,
  quantity_needed INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  available_qty INTEGER;
BEGIN
  SELECT inventory_quantity INTO available_qty
  FROM product_materials
  WHERE product_id = product_uuid
    AND material_id = material_uuid
    AND is_available = TRUE;
  
  RETURN COALESCE(available_qty, 0) >= quantity_needed;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update customer stats after order
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET 
    total_orders = (
      SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'
    ),
    total_spent = (
      SELECT COALESCE(SUM(total), 0) FROM orders WHERE customer_id = NEW.customer_id AND status = 'delivered'
    )
  WHERE id = NEW.customer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer stats
CREATE TRIGGER update_customer_stats_trigger
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION update_customer_stats();

-- Decrease inventory after order
CREATE OR REPLACE FUNCTION decrease_inventory()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product_materials
  SET inventory_quantity = inventory_quantity - NEW.quantity
  WHERE id = NEW.product_material_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrease inventory when order item is created
CREATE TRIGGER decrease_inventory_trigger
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION decrease_inventory();

-- Increment product view count
CREATE OR REPLACE FUNCTION increment_view_count(product_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE products
  SET view_count = view_count + 1
  WHERE id = product_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant SELECT on views to anon and authenticated users
GRANT SELECT ON product_catalog TO anon, authenticated;
GRANT SELECT ON product_details TO anon, authenticated;
GRANT SELECT ON low_stock_products TO authenticated;
GRANT SELECT ON order_summary TO authenticated;

-- Grant EXECUTE on functions
GRANT EXECUTE ON FUNCTION get_product_price_range TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_product_availability TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_view_count TO anon, authenticated;


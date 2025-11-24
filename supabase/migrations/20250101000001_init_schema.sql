-- =============================================================================
-- WALLDECORATOR E-COMMERCE DATABASE SCHEMA
-- Optimized and Scalable Schema Design
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ENUMS
-- =============================================================================

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

CREATE TYPE customization_status AS ENUM (
  'pending',
  'in_review',
  'approved',
  'in_production',
  'completed',
  'cancelled'
);

CREATE TYPE product_status AS ENUM (
  'active',
  'inactive',
  'archived',
  'draft'
);

CREATE TYPE address_type AS ENUM (
  'shipping',
  'billing',
  'both'
);

-- =============================================================================
-- MATERIALS TABLE
-- Scalable materials catalog
-- =============================================================================

CREATE TABLE materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  
  -- Material properties
  base_price_multiplier DECIMAL(5, 2) DEFAULT 1.0, -- Multiplier for pricing calculations
  density DECIMAL(10, 2), -- For weight calculations
  image_url TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  color_hex VARCHAR(7), -- Hex color code for UI display
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for materials
CREATE INDEX idx_materials_slug ON materials(slug);
CREATE INDEX idx_materials_active ON materials(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_materials_display_order ON materials(display_order);

-- Trigger for updated_at
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CATEGORIES TABLE
-- Hierarchical structure with parent-child relationships
-- =============================================================================

CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PRODUCTS TABLE
-- Core product information (without material-specific data)
-- =============================================================================

CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  sku VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  primary_image_url TEXT,
  status product_status DEFAULT 'draft',
  
  -- Dimensions (in inches)
  dimensions_width DECIMAL(10, 2),
  dimensions_height DECIMAL(10, 2),
  dimensions_depth DECIMAL(10, 2),
  weight DECIMAL(10, 2), -- in pounds
  
  -- Marketing flags
  is_featured BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  
  -- SEO
  meta_title VARCHAR(255),
  meta_description TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status) WHERE status = 'active';
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_new_arrival ON products(is_new_arrival) WHERE is_new_arrival = TRUE;
CREATE INDEX idx_products_best_seller ON products(is_best_seller) WHERE is_best_seller = TRUE;

-- Full-text search index
CREATE INDEX idx_products_search ON products USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PRODUCT_MATERIALS TABLE
-- Material variants with individual pricing and inventory
-- =============================================================================

CREATE TABLE product_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  
  -- Pricing per material
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_at_price DECIMAL(10, 2) CHECK (compare_at_price >= price), -- For showing discounts
  cost_price DECIMAL(10, 2) CHECK (cost_price >= 0), -- Internal cost tracking
  
  -- Inventory per material
  inventory_quantity INTEGER DEFAULT 0 CHECK (inventory_quantity >= 0),
  low_stock_threshold INTEGER DEFAULT 10,
  
  -- Material-specific details
  finish VARCHAR(100), -- e.g., "brushed", "polished", "matte"
  weight_adjustment DECIMAL(10, 2), -- Additional weight for this material
  
  is_available BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id, material_id)
);

-- Indexes for product_materials
CREATE INDEX idx_product_materials_product_id ON product_materials(product_id);
CREATE INDEX idx_product_materials_material_id ON product_materials(material_id);
CREATE INDEX idx_product_materials_price ON product_materials(price);
CREATE INDEX idx_product_materials_available ON product_materials(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_product_materials_low_stock ON product_materials(inventory_quantity, low_stock_threshold) 
  WHERE inventory_quantity <= low_stock_threshold;

-- Trigger for updated_at
CREATE TRIGGER update_product_materials_updated_at
  BEFORE UPDATE ON product_materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PRODUCT_IMAGES TABLE
-- Multiple images per product
-- =============================================================================

CREATE TABLE product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text VARCHAR(255),
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for product_images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_product_images_display_order ON product_images(product_id, display_order);

-- =============================================================================
-- CUSTOMERS TABLE
-- Links to Supabase Auth
-- =============================================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  
  -- Marketing preferences
  accepts_marketing BOOLEAN DEFAULT FALSE,
  
  -- Analytics
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for customers
CREATE INDEX idx_customers_email ON customers(email);

-- Trigger for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ADDRESSES TABLE
-- Customer shipping and billing addresses
-- =============================================================================

CREATE TABLE addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_type address_type DEFAULT 'shipping',
  
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  company VARCHAR(255),
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(2) NOT NULL DEFAULT 'US', -- ISO country code
  phone VARCHAR(20),
  
  is_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for addresses
CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);
CREATE INDEX idx_addresses_default ON addresses(customer_id, is_default) WHERE is_default = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ORDERS TABLE
-- Customer orders
-- =============================================================================

CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Order status
  status order_status DEFAULT 'pending',
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost DECIMAL(10, 2) DEFAULT 0 CHECK (shipping_cost >= 0),
  tax_amount DECIMAL(10, 2) DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount DECIMAL(10, 2) DEFAULT 0 CHECK (discount_amount >= 0),
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  
  -- Shipping information
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_method VARCHAR(100),
  tracking_number VARCHAR(255),
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  
  -- Billing information
  billing_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  
  -- Notes
  customer_note TEXT,
  admin_note TEXT,
  
  -- Payment
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for orders
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  counter := (SELECT COUNT(*) + 1 FROM orders);
  new_number := 'WD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(counter::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ORDER_ITEMS TABLE
-- Items in each order
-- =============================================================================

CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_material_id UUID REFERENCES product_materials(id) ON DELETE SET NULL,
  
  -- Snapshot data (in case product is deleted/changed)
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(50),
  material_name VARCHAR(100), -- Snapshot of material name
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_product_material_id ON order_items(product_material_id);

-- =============================================================================
-- CUSTOMIZATION_REQUESTS TABLE
-- Custom order submissions from the website
-- =============================================================================

CREATE TABLE customization_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  email VARCHAR(255) NOT NULL,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  reference_files TEXT[], -- Array of file URLs
  
  status customization_status DEFAULT 'pending',
  
  -- Admin response
  admin_note TEXT,
  estimated_price DECIMAL(10, 2),
  estimated_delivery_days INTEGER,
  
  -- If converted to order
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for customization_requests
CREATE INDEX idx_customization_requests_customer_id ON customization_requests(customer_id);
CREATE INDEX idx_customization_requests_email ON customization_requests(email);
CREATE INDEX idx_customization_requests_material_id ON customization_requests(material_id);
CREATE INDEX idx_customization_requests_status ON customization_requests(status);
CREATE INDEX idx_customization_requests_created_at ON customization_requests(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_customization_requests_updated_at
  BEFORE UPDATE ON customization_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- REVIEWS TABLE
-- Product reviews and ratings
-- =============================================================================

CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  
  -- Verification
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT FALSE,
  admin_note TEXT,
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for reviews
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);
CREATE INDEX idx_reviews_approved ON reviews(product_id, is_approved) WHERE is_approved = TRUE;
CREATE INDEX idx_reviews_rating ON reviews(product_id, rating);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customization_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- DEVELOPMENT POLICIES - ALLOW ALL ACCESS
-- TODO: Replace with proper authentication-based policies in production
-- =============================================================================

-- Materials: Anyone can do everything
CREATE POLICY "Anyone can select materials" ON materials FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert materials" ON materials FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update materials" ON materials FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete materials" ON materials FOR DELETE USING (TRUE);

-- Categories: Anyone can do everything
CREATE POLICY "Anyone can select categories" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert categories" ON categories FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update categories" ON categories FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete categories" ON categories FOR DELETE USING (TRUE);

-- Products: Anyone can do everything
CREATE POLICY "Anyone can select products" ON products FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert products" ON products FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update products" ON products FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete products" ON products FOR DELETE USING (TRUE);

-- Product Materials: Anyone can do everything
CREATE POLICY "Anyone can select product_materials" ON product_materials FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert product_materials" ON product_materials FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update product_materials" ON product_materials FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete product_materials" ON product_materials FOR DELETE USING (TRUE);

-- Product Images: Anyone can do everything
CREATE POLICY "Anyone can select product_images" ON product_images FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert product_images" ON product_images FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update product_images" ON product_images FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete product_images" ON product_images FOR DELETE USING (TRUE);

-- Customers: Anyone can do everything
CREATE POLICY "Anyone can select customers" ON customers FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert customers" ON customers FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update customers" ON customers FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete customers" ON customers FOR DELETE USING (TRUE);

-- Addresses: Anyone can do everything
CREATE POLICY "Anyone can select addresses" ON addresses FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert addresses" ON addresses FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update addresses" ON addresses FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete addresses" ON addresses FOR DELETE USING (TRUE);

-- Orders: Anyone can do everything
CREATE POLICY "Anyone can select orders" ON orders FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete orders" ON orders FOR DELETE USING (TRUE);

-- Order Items: Anyone can do everything
CREATE POLICY "Anyone can select order_items" ON order_items FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert order_items" ON order_items FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update order_items" ON order_items FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete order_items" ON order_items FOR DELETE USING (TRUE);

-- Customization Requests: Anyone can do everything
CREATE POLICY "Anyone can select customization_requests" ON customization_requests FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert customization_requests" ON customization_requests FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update customization_requests" ON customization_requests FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete customization_requests" ON customization_requests FOR DELETE USING (TRUE);

-- Reviews: Anyone can do everything
CREATE POLICY "Anyone can select reviews" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Anyone can insert reviews" ON reviews FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can update reviews" ON reviews FOR UPDATE USING (TRUE);
CREATE POLICY "Anyone can delete reviews" ON reviews FOR DELETE USING (TRUE);


-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE materials IS 'Scalable materials catalog - can be managed via admin panel';
COMMENT ON TABLE categories IS 'Hierarchical product categories with parent-child relationships';
COMMENT ON TABLE products IS 'Core product information without material-specific data';
COMMENT ON TABLE product_materials IS 'Material variants with individual pricing and inventory - links products to materials';
COMMENT ON TABLE product_images IS 'Multiple images per product with display order';
COMMENT ON TABLE customers IS 'Customer profiles linked to Supabase Auth';
COMMENT ON TABLE addresses IS 'Customer shipping and billing addresses';
COMMENT ON TABLE orders IS 'Customer orders with complete order information';
COMMENT ON TABLE order_items IS 'Individual items in orders with snapshot data';
COMMENT ON TABLE customization_requests IS 'Custom order requests from website';
COMMENT ON TABLE reviews IS 'Product reviews and ratings from customers';


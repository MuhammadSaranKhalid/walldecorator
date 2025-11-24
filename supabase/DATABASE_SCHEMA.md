# WallDecorator E-Commerce Database Schema

## Overview
This document describes the complete relational database schema for the WallDecorator e-commerce platform. The schema is optimized for scalability, with materials and categories stored as database tables rather than enums.

---

## Entity Relationship Diagram (Text Format)

```
┌─────────────┐
│  materials  │◄─────┐
└─────────────┘      │
                     │ material_id (FK)
┌─────────────┐      │
│ categories  │      │
└─────────────┘      │
      │              │
      │ parent_id    │
      │ (Self FK)    │
      │              │
      ▼              │
┌─────────────┐      │
│  products   │──────┤
└─────────────┘      │
      │              │
      │ category_id  │
      │ (FK)         │
      │              │
      ├──────────────┴──────────────┐
      │                             │
      ▼                             ▼
┌──────────────────┐      ┌──────────────────┐
│ product_materials│      │  product_images  │
└──────────────────┘      └──────────────────┘
      │
      │ product_material_id (FK)
      │
      ▼
┌─────────────┐      ┌──────────────┐
│ order_items │◄─────┤    orders    │
└─────────────┘      └──────────────┘
                            │
                            ├─ customer_id (FK)
                            ├─ shipping_address_id (FK)
                            └─ billing_address_id (FK)

┌─────────────┐
│  customers  │──────┐
└─────────────┘      │
      │              │ customer_id (FK)
      │              │
      ├──────────────┼──────────────┐
      │              │              │
      ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────────────────┐
│ addresses │  │  orders   │  │ customization_requests│
└───────────┘  └───────────┘  └───────────────────────┘
                     │
                     │ order_id (FK)
                     │
                     ▼
               ┌─────────────┐
               │order_items  │
               └─────────────┘
                     │
                     │ product_id (FK)
                     │
                     ▼
               ┌─────────────┐
               │  reviews    │
               └─────────────┘
```

---

## Tables

### 1. `materials`
**Purpose**: Scalable materials catalog that can be managed via admin panel

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Material name (e.g., "Acrylic") |
| `slug` | VARCHAR(100) | NOT NULL, UNIQUE | URL-friendly identifier |
| `description` | TEXT | | Material description |
| `base_price_multiplier` | DECIMAL(5,2) | DEFAULT 1.0 | Pricing multiplier for calculations |
| `density` | DECIMAL(10,2) | | Material density (for weight calculations) |
| `image_url` | TEXT | | Material preview image |
| `display_order` | INTEGER | DEFAULT 0 | Sort order in UI |
| `color_hex` | VARCHAR(7) | | Hex color code for UI display |
| `is_active` | BOOLEAN | DEFAULT TRUE | Availability flag |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_materials_slug` on `slug`
- `idx_materials_active` on `is_active` (WHERE is_active = TRUE)
- `idx_materials_display_order` on `display_order`

**Relationships:**
- Referenced by `product_materials.material_id`
- Referenced by `customization_requests.material_id`

---

### 2. `categories`
**Purpose**: Hierarchical product categories with unlimited nesting

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Category name |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly identifier |
| `description` | TEXT | | Category description |
| `parent_id` | UUID | FOREIGN KEY → categories(id) | Parent category (NULL for root) |
| `image_url` | TEXT | | Category image |
| `display_order` | INTEGER | DEFAULT 0 | Sort order in UI |
| `is_active` | BOOLEAN | DEFAULT TRUE | Visibility flag |
| `meta_title` | VARCHAR(255) | | SEO meta title |
| `meta_description` | TEXT | | SEO meta description |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_categories_slug` on `slug`
- `idx_categories_parent_id` on `parent_id`
- `idx_categories_active` on `is_active` (WHERE is_active = TRUE)
- `idx_categories_display_order` on `display_order`

**Relationships:**
- Self-referencing: `parent_id` → `categories.id`
- Referenced by `products.category_id`

---

### 3. `products`
**Purpose**: Core product information (material-agnostic)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Product name |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly identifier |
| `sku` | VARCHAR(50) | NOT NULL, UNIQUE | Stock Keeping Unit |
| `description` | TEXT | | Product description |
| `category_id` | UUID | FOREIGN KEY → categories(id) | Product category |
| `primary_image_url` | TEXT | | Main product image |
| `status` | product_status | DEFAULT 'draft' | Product status |
| `dimensions_width` | DECIMAL(10,2) | | Width in inches |
| `dimensions_height` | DECIMAL(10,2) | | Height in inches |
| `dimensions_depth` | DECIMAL(10,2) | | Depth in inches |
| `weight` | DECIMAL(10,2) | | Weight in pounds |
| `is_featured` | BOOLEAN | DEFAULT FALSE | Featured product flag |
| `is_new_arrival` | BOOLEAN | DEFAULT FALSE | New arrival flag |
| `is_best_seller` | BOOLEAN | DEFAULT FALSE | Best seller flag |
| `meta_title` | VARCHAR(255) | | SEO meta title |
| `meta_description` | TEXT | | SEO meta description |
| `view_count` | INTEGER | DEFAULT 0 | Analytics view counter |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_products_slug` on `slug`
- `idx_products_sku` on `sku`
- `idx_products_category_id` on `category_id`
- `idx_products_status` on `status` (WHERE status = 'active')
- `idx_products_featured` on `is_featured` (WHERE is_featured = TRUE)
- `idx_products_new_arrival` on `is_new_arrival` (WHERE is_new_arrival = TRUE)
- `idx_products_best_seller` on `is_best_seller` (WHERE is_best_seller = TRUE)
- `idx_products_search` on full-text search (name, description)

**Relationships:**
- `category_id` → `categories.id`
- Referenced by `product_materials.product_id`
- Referenced by `product_images.product_id`
- Referenced by `order_items.product_id`
- Referenced by `reviews.product_id`

---

### 4. `product_materials`
**Purpose**: Junction table linking products to materials with variant-specific data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `product_id` | UUID | NOT NULL, FOREIGN KEY → products(id) | Product reference |
| `material_id` | UUID | NOT NULL, FOREIGN KEY → materials(id) | Material reference |
| `price` | DECIMAL(10,2) | NOT NULL, CHECK (>= 0) | Variant price |
| `compare_at_price` | DECIMAL(10,2) | CHECK (>= price) | Original price (for discounts) |
| `cost_price` | DECIMAL(10,2) | CHECK (>= 0) | Internal cost tracking |
| `inventory_quantity` | INTEGER | DEFAULT 0, CHECK (>= 0) | Available stock |
| `low_stock_threshold` | INTEGER | DEFAULT 10 | Low stock alert threshold |
| `finish` | VARCHAR(100) | | Material finish (e.g., "brushed") |
| `weight_adjustment` | DECIMAL(10,2) | | Additional weight for material |
| `is_available` | BOOLEAN | DEFAULT TRUE | Availability flag |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Constraints:**
- UNIQUE(`product_id`, `material_id`)

**Indexes:**
- `idx_product_materials_product_id` on `product_id`
- `idx_product_materials_material_id` on `material_id`
- `idx_product_materials_price` on `price`
- `idx_product_materials_available` on `is_available` (WHERE is_available = TRUE)
- `idx_product_materials_low_stock` on `(inventory_quantity, low_stock_threshold)` (WHERE inventory_quantity <= low_stock_threshold)

**Relationships:**
- `product_id` → `products.id`
- `material_id` → `materials.id`
- Referenced by `order_items.product_material_id`

---

### 5. `product_images`
**Purpose**: Multiple images per product

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `product_id` | UUID | NOT NULL, FOREIGN KEY → products(id) | Product reference |
| `image_url` | TEXT | NOT NULL | Image URL |
| `alt_text` | VARCHAR(255) | | Image alt text (SEO) |
| `is_primary` | BOOLEAN | DEFAULT FALSE | Primary image flag |
| `display_order` | INTEGER | DEFAULT 0 | Display order |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_product_images_product_id` on `product_id`
- `idx_product_images_primary` on `(product_id, is_primary)` (WHERE is_primary = TRUE)
- `idx_product_images_display_order` on `(product_id, display_order)`

**Relationships:**
- `product_id` → `products.id`

---

### 6. `customers`
**Purpose**: Customer profiles linked to Supabase Auth

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FOREIGN KEY → auth.users(id) | Auth user reference |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Customer email |
| `first_name` | VARCHAR(100) | | First name |
| `last_name` | VARCHAR(100) | | Last name |
| `phone` | VARCHAR(20) | | Phone number |
| `accepts_marketing` | BOOLEAN | DEFAULT FALSE | Marketing consent |
| `total_orders` | INTEGER | DEFAULT 0 | Total completed orders |
| `total_spent` | DECIMAL(10,2) | DEFAULT 0 | Lifetime spend |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_customers_email` on `email`

**Relationships:**
- `id` → `auth.users.id` (Supabase Auth)
- Referenced by `addresses.customer_id`
- Referenced by `orders.customer_id`
- Referenced by `customization_requests.customer_id`
- Referenced by `reviews.customer_id`

---

### 7. `addresses`
**Purpose**: Customer shipping and billing addresses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `customer_id` | UUID | NOT NULL, FOREIGN KEY → customers(id) | Customer reference |
| `address_type` | address_type | DEFAULT 'shipping' | Address type |
| `first_name` | VARCHAR(100) | | First name |
| `last_name` | VARCHAR(100) | | Last name |
| `company` | VARCHAR(255) | | Company name |
| `address_line1` | VARCHAR(255) | NOT NULL | Address line 1 |
| `address_line2` | VARCHAR(255) | | Address line 2 |
| `city` | VARCHAR(100) | NOT NULL | City |
| `state` | VARCHAR(100) | | State/Province |
| `postal_code` | VARCHAR(20) | NOT NULL | Postal code |
| `country` | VARCHAR(2) | NOT NULL, DEFAULT 'US' | ISO country code |
| `phone` | VARCHAR(20) | | Phone number |
| `is_default` | BOOLEAN | DEFAULT FALSE | Default address flag |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_addresses_customer_id` on `customer_id`
- `idx_addresses_default` on `(customer_id, is_default)` (WHERE is_default = TRUE)

**Relationships:**
- `customer_id` → `customers.id`
- Referenced by `orders.shipping_address_id`
- Referenced by `orders.billing_address_id`

---

### 8. `orders`
**Purpose**: Customer orders with complete order information

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `order_number` | VARCHAR(50) | NOT NULL, UNIQUE | Human-readable order number |
| `customer_id` | UUID | FOREIGN KEY → customers(id) | Customer reference |
| `status` | order_status | DEFAULT 'pending' | Order status |
| `subtotal` | DECIMAL(10,2) | NOT NULL, CHECK (>= 0) | Subtotal amount |
| `shipping_cost` | DECIMAL(10,2) | DEFAULT 0, CHECK (>= 0) | Shipping cost |
| `tax_amount` | DECIMAL(10,2) | DEFAULT 0, CHECK (>= 0) | Tax amount |
| `discount_amount` | DECIMAL(10,2) | DEFAULT 0, CHECK (>= 0) | Discount amount |
| `total` | DECIMAL(10,2) | NOT NULL, CHECK (>= 0) | Total amount |
| `shipping_address_id` | UUID | FOREIGN KEY → addresses(id) | Shipping address |
| `shipping_method` | VARCHAR(100) | | Shipping method |
| `tracking_number` | VARCHAR(255) | | Tracking number |
| `shipped_at` | TIMESTAMP WITH TIME ZONE | | Shipped timestamp |
| `delivered_at` | TIMESTAMP WITH TIME ZONE | | Delivered timestamp |
| `billing_address_id` | UUID | FOREIGN KEY → addresses(id) | Billing address |
| `customer_note` | TEXT | | Customer notes |
| `admin_note` | TEXT | | Admin notes (internal) |
| `payment_method` | VARCHAR(50) | | Payment method |
| `payment_status` | VARCHAR(50) | DEFAULT 'pending' | Payment status |
| `paid_at` | TIMESTAMP WITH TIME ZONE | | Payment timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_orders_order_number` on `order_number`
- `idx_orders_customer_id` on `customer_id`
- `idx_orders_status` on `status`
- `idx_orders_created_at` on `created_at DESC`

**Relationships:**
- `customer_id` → `customers.id`
- `shipping_address_id` → `addresses.id`
- `billing_address_id` → `addresses.id`
- Referenced by `order_items.order_id`
- Referenced by `customization_requests.order_id`

---

### 9. `order_items`
**Purpose**: Individual items in orders with snapshot data

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `order_id` | UUID | NOT NULL, FOREIGN KEY → orders(id) | Order reference |
| `product_id` | UUID | FOREIGN KEY → products(id) | Product reference (nullable) |
| `product_material_id` | UUID | FOREIGN KEY → product_materials(id) | Material variant (nullable) |
| `product_name` | VARCHAR(255) | NOT NULL | Product name snapshot |
| `product_sku` | VARCHAR(50) | | SKU snapshot |
| `material_name` | VARCHAR(100) | | Material name snapshot |
| `quantity` | INTEGER | NOT NULL, CHECK (> 0) | Order quantity |
| `unit_price` | DECIMAL(10,2) | NOT NULL, CHECK (>= 0) | Unit price |
| `total_price` | DECIMAL(10,2) | NOT NULL, CHECK (>= 0) | Total price |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_order_items_order_id` on `order_id`
- `idx_order_items_product_id` on `product_id`
- `idx_order_items_product_material_id` on `product_material_id`

**Relationships:**
- `order_id` → `orders.id`
- `product_id` → `products.id`
- `product_material_id` → `product_materials.id`
- Referenced by `reviews.order_item_id`

---

### 10. `customization_requests`
**Purpose**: Custom order submissions from website

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `customer_id` | UUID | FOREIGN KEY → customers(id) | Customer reference (nullable) |
| `email` | VARCHAR(255) | NOT NULL | Contact email |
| `material_id` | UUID | FOREIGN KEY → materials(id) | Preferred material |
| `description` | TEXT | NOT NULL | Customization details |
| `reference_files` | TEXT[] | | Array of file URLs |
| `status` | customization_status | DEFAULT 'pending' | Request status |
| `admin_note` | TEXT | | Admin notes (internal) |
| `estimated_price` | DECIMAL(10,2) | | Price estimate |
| `estimated_delivery_days` | INTEGER | | Delivery estimate (days) |
| `order_id` | UUID | FOREIGN KEY → orders(id) | Converted order (nullable) |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_customization_requests_customer_id` on `customer_id`
- `idx_customization_requests_email` on `email`
- `idx_customization_requests_material_id` on `material_id`
- `idx_customization_requests_status` on `status`
- `idx_customization_requests_created_at` on `created_at DESC`

**Relationships:**
- `customer_id` → `customers.id`
- `material_id` → `materials.id`
- `order_id` → `orders.id`

---

### 11. `reviews`
**Purpose**: Product reviews and ratings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | DEFAULT uuid_generate_v4(), PRIMARY KEY | Unique identifier |
| `product_id` | UUID | NOT NULL, FOREIGN KEY → products(id) | Product reference |
| `customer_id` | UUID | FOREIGN KEY → customers(id) | Customer reference (nullable) |
| `order_item_id` | UUID | FOREIGN KEY → order_items(id) | Order item reference (nullable) |
| `rating` | INTEGER | NOT NULL, CHECK (1-5) | Star rating (1-5) |
| `title` | VARCHAR(255) | | Review title |
| `comment` | TEXT | | Review comment |
| `is_verified_purchase` | BOOLEAN | DEFAULT FALSE | Verified purchase flag |
| `is_approved` | BOOLEAN | DEFAULT FALSE | Moderation approval |
| `admin_note` | TEXT | | Admin notes (internal) |
| `helpful_count` | INTEGER | DEFAULT 0 | Helpful votes count |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_reviews_product_id` on `product_id`
- `idx_reviews_customer_id` on `customer_id`
- `idx_reviews_approved` on `(product_id, is_approved)` (WHERE is_approved = TRUE)
- `idx_reviews_rating` on `(product_id, rating)`

**Relationships:**
- `product_id` → `products.id`
- `customer_id` → `customers.id`
- `order_item_id` → `order_items.id`

---

## Enums

### `order_status`
- `pending` - Order placed, awaiting confirmation
- `confirmed` - Order confirmed
- `processing` - Order being prepared
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled
- `refunded` - Order refunded

### `customization_status`
- `pending` - Request submitted
- `in_review` - Under review by admin
- `approved` - Request approved
- `in_production` - Being manufactured
- `completed` - Completed
- `cancelled` - Request cancelled

### `product_status`
- `active` - Visible and purchasable
- `inactive` - Hidden from store
- `archived` - Archived (historical)
- `draft` - Work in progress

### `address_type`
- `shipping` - Shipping address
- `billing` - Billing address
- `both` - Both shipping and billing

---

## Relationships Summary

### One-to-Many Relationships
- `categories` ← `categories` (parent-child, self-referencing)
- `categories` ← `products`
- `products` ← `product_materials`
- `products` ← `product_images`
- `products` ← `reviews`
- `materials` ← `product_materials`
- `materials` ← `customization_requests`
- `customers` ← `addresses`
- `customers` ← `orders`
- `customers` ← `customization_requests`
- `customers` ← `reviews`
- `addresses` ← `orders` (shipping)
- `addresses` ← `orders` (billing)
- `orders` ← `order_items`
- `orders` ← `customization_requests` (converted orders)
- `product_materials` ← `order_items`
- `order_items` ← `reviews`

### Many-to-Many Relationships
- `products` ↔ `materials` (through `product_materials`)

---

## Storage Buckets

### `product-images`
- **Public**: Yes
- **Size Limit**: 5MB
- **Allowed Types**: image/jpeg, image/jpg, image/png, image/webp, image/gif
- **Purpose**: Product photos

### `customization-files`
- **Public**: No (user-specific)
- **Size Limit**: 10MB
- **Allowed Types**: images, PDFs, Word documents
- **Purpose**: Custom order reference files

---

## Views

### `product_catalog`
Aggregated product listing with pricing, availability, and materials.

### `product_details`
Complete product information with materials, images, and reviews.

### `low_stock_products`
Products with inventory below threshold (for alerts).

### `order_summary`
Orders with customer and item details.

---

## Functions

### `update_updated_at_column()`
Trigger function to automatically update `updated_at` timestamps.

### `generate_order_number()`
Generates unique order numbers (format: WD20250101-0001).

### `get_product_price_range(product_id)`
Returns min and max price for a product across materials.

### `check_product_availability(product_id, material_id, quantity)`
Checks if sufficient inventory exists for a purchase.

### `update_customer_stats()`
Trigger to auto-update customer `total_orders` and `total_spent`.

### `decrease_inventory()`
Trigger to auto-decrease inventory when order items are created.

### `increment_view_count(product_id)`
Increments product view count for analytics.

---

## Row Level Security (RLS)

⚠️ **DEVELOPMENT MODE**: Currently all tables have open permissions (SELECT, INSERT, UPDATE, DELETE) for everyone.

**RLS is enabled** on all tables but policies are set to allow all operations for development purposes.

**TODO for Production:**
- Implement user-specific policies for `customers`, `addresses`, `orders`
- Restrict public to viewing only `active` products, categories, materials
- Add admin role policies for full access
- Secure storage buckets appropriately

---

## Migrations

1. **20250101000001_init_schema.sql**
   - All tables, enums, indexes, RLS policies, triggers

2. **20250101000002_storage_and_views.sql**
   - Storage buckets, helper views, helper functions

3. **20250101000003_seed_data.sql**
   - Initial materials, categories, sample products

---

## Design Principles

✅ **Normalized Structure** - No data duplication  
✅ **Scalable Materials** - Database table, not enum  
✅ **Hierarchical Categories** - Unlimited nesting  
✅ **Material-Specific Pricing** - Per-variant pricing & inventory  
✅ **Snapshot Data** - Orders preserve product info  
✅ **Audit Trails** - created_at/updated_at on all tables  
✅ **Performance Optimized** - Strategic indexing  
✅ **Type Safety** - Enums for status fields  
✅ **SEO Ready** - Meta fields for products and categories

---

Last Updated: January 1, 2025

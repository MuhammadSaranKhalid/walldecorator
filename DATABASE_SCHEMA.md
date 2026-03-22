# Database Schema Documentation

## Overview

This project uses **PostgreSQL** with **Drizzle ORM** for database queries and operations.

### Schema Definition Setup

- **Prisma Schema** (`prisma/schema.prisma`): Used primarily for **migrations and schema management**
- **Drizzle Schema** (`lib/db/schema.ts`): Used for **runtime queries** with Drizzle ORM
- **Drizzle Relations** (`lib/db/relations.ts`): Defines all table relationships for Drizzle queries

**Important Note:** The Drizzle schema includes **denormalized fields** (trigger-maintained) that may not appear in the Prisma schema. These fields are added via database migrations and are critical for performance.

## Key Models and Their Relationships

### Products Table

The `products` table is the core of the e-commerce system with several **denormalized fields** for performance optimization:

```typescript
products {
  // Core fields
  id: uuid (PK)
  category_id: uuid (FK → categories)
  name: text
  slug: text (unique)
  description: text
  status: text (default: 'draft') // 'draft' | 'active' | 'archived'

  // Feature flags
  is_featured: boolean (default: false)
  featured_order: integer (default: 0)

  // Metrics
  total_sold: integer (default: 0)
  view_count: integer (default: 0)

  // SEO
  seo_title: text
  seo_description: text

  // 🔥 DENORMALIZED FIELDS (trigger-maintained)
  // These are automatically updated by database triggers
  min_price: numeric // Cheapest in-stock variant price
  min_compare_at_price: numeric // Compare-at price of cheapest variant
  primary_image_storage_path: text // Full resolution image
  primary_image_medium_path: text // Medium resolution image
  primary_image_blurhash: text // Blurhash for placeholder
  primary_image_alt_text: text // Alt text for accessibility

  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
}
```

**Key Points:**
- `min_price` and `min_compare_at_price` are **trigger-maintained** - they automatically reflect the cheapest in-stock variant
- Primary image fields are denormalized for fast product listing queries
- No need to join `product_variants` or `product_images` tables for listings

### Product Variants Table

```typescript
product_variants {
  id: uuid (PK)
  product_id: uuid (FK → products)
  sku: text (unique)

  // Attribute references (FK → product_attribute_values)
  material_id: uuid // e.g., "steel", "wood", "acrylic"
  size_id: uuid // e.g., "small", "medium", "large"
  thickness_id: uuid // e.g., "3mm", "5mm", "8mm"

  // Pricing
  price: numeric
  compare_at_price: numeric
  cost_per_item: numeric

  // Flags
  is_default: boolean (default: false)

  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
}
```

**Relationships:**
- `product_id` → `products.id` (CASCADE delete)
- `material_id`, `size_id`, `thickness_id` → `product_attribute_values.id`
- Has ONE `inventory` record (1:1 relationship)

### Inventory Table

```typescript
inventory {
  id: uuid (PK)
  variant_id: uuid (unique, FK → product_variants)

  // Stock tracking
  quantity_on_hand: integer (default: 0)
  quantity_reserved: integer (default: 0)
  quantity_available: integer (computed: quantity_on_hand - quantity_reserved)

  // Thresholds
  low_stock_threshold: integer (default: 5)
  allow_backorder: boolean (default: false)

  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
}
```

### Categories Table

```typescript
categories {
  id: uuid (PK)
  parent_id: uuid (FK → categories, self-reference)
  name: text
  slug: text (unique)
  description: text

  // Display
  image_id: uuid (FK → images)
  image_path: text (deprecated)
  display_order: integer (default: 0)
  is_visible: boolean (default: true)
  product_count: integer (default: 0)

  // SEO
  seo_title: text
  seo_description: text

  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
}
```

**Hierarchy:**
- Supports multi-level hierarchy via `parent_id` self-reference
- Top-level categories have `parent_id = null`

### Images Table (Centralized)

```typescript
images {
  id: uuid (PK)
  entity_type: text // 'product', 'category', 'custom_order', etc.
  entity_id: uuid

  // Paths (all stored in Supabase Storage or similar)
  storage_path: text // Full resolution
  thumbnail_path: text // Small thumbnail
  medium_path: text // Medium size
  large_path: text // Large size

  // Metadata
  alt_text: text
  blurhash: text // For blur placeholder
  original_width: integer
  original_height: integer
  file_size_bytes: integer

  // Processing
  processing_status: text (default: 'pending') // 'pending' | 'completed' | 'failed'
  processing_error: text

  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
}
```

**Junction Tables:**
- `product_images` - Links products to images with display order and is_primary flag
- `review_images` - Links reviews to images

### Product Images Junction Table

```typescript
product_images {
  product_id: uuid (PK, FK → products)
  image_id: uuid (PK, FK → images)
  variant_id: uuid (FK → product_variants, nullable)
  display_order: integer (default: 0)
  is_primary: boolean (default: false)
}
```

**Key Points:**
- Composite primary key (`product_id`, `image_id`)
- `is_primary = true` marks the main product image (only ONE per product)
- `variant_id` allows variant-specific images

### Reviews Table

```typescript
reviews {
  id: uuid (PK)
  product_id: uuid (FK → products)
  order_id: uuid (FK → orders, nullable)

  // Review content
  reviewer_name: text
  reviewer_email: text
  rating: integer (1-5)
  title: text
  body: text

  // Flags
  is_approved: boolean (default: false)
  is_verified_purchase: boolean (default: false)
  helpful_count: integer (default: 0)

  // Timestamps
  created_at: timestamptz
  updated_at: timestamptz
}
```

**Constraint:** Unique on (`product_id`, `reviewer_email`) - one review per product per email

## Query Patterns

### Product Listings

```typescript
// Fast product listing query using denormalized fields
db.query.products.findMany({
  where: (p) => and(
    eq(p.status, 'active'),
    isNotNull(p.min_price) // Only products with in-stock variants
  ),
  columns: {
    id: true,
    name: true,
    slug: true,
    min_price: true,
    min_compare_at_price: true,
    primary_image_storage_path: true,
    primary_image_medium_path: true,
    primary_image_blurhash: true,
    primary_image_alt_text: true,
  },
  orderBy: (p) => [desc(p.created_at)],
  limit: 12,
})
```

**No joins required!** All data needed for product cards is on the `products` table.

### Product Detail

```typescript
// Full product detail with variants and images
db.query.products.findFirst({
  where: (p) => eq(p.slug, slug),
  with: {
    categories: true,
    product_images: {
      orderBy: (pi) => [asc(pi.display_order)],
      with: { images: true },
    },
    product_variants: {
      with: {
        material_attr: { columns: { value: true } },
        size_attr: { columns: { value: true } },
        thickness_attr: { columns: { value: true } },
        inventory: { columns: { quantity_available: true } },
      },
    },
  },
})
```

### Collections (Categories)

```typescript
// Get all top-level categories with images
db.query.categories.findMany({
  where: (c) => and(isNull(c.parent_id), eq(c.is_visible, true)),
  with: {
    images: true,
  },
  orderBy: (c) => [asc(c.display_order)],
})
```

## Data Types in Components

### ProductListing (for product grids)

```typescript
type ProductListing = {
  id: string
  name: string
  slug: string
  price: number // Converted from min_price
  compare_at_price: number | null // Converted from min_compare_at_price

  // Denormalized image fields (use these directly)
  primary_image_storage_path: string | null
  primary_image_medium_path: string | null
  primary_image_blurhash: string | null
  primary_image_alt_text: string | null

  // Other fields...
  status: string
  is_featured: boolean
  total_sold: number
  view_count: number
}
```

**Component Usage:**
```tsx
<Image
  src={product.primary_image_medium_path ?? product.primary_image_storage_path}
  alt={product.primary_image_alt_text ?? product.name}
  placeholder={product.primary_image_blurhash ? 'blur' : undefined}
  blurDataURL={product.primary_image_blurhash || undefined}
/>
```

### HomepageProduct (for featured products)

```typescript
type HomepageProduct = {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice: number | null
  image: {
    storage_path: string
    alt_text: string | null
    blurhash: string | null
  } | null
}
```

## Important Notes

1. **Denormalized Fields:**
   - `products.min_price` and `products.min_compare_at_price` are maintained by database triggers
   - Always check `isNotNull(p.min_price)` to filter out products with no in-stock variants
   - Primary image fields are also denormalized for performance

2. **Image Handling:**
   - **Listing pages**: Use denormalized fields on `products` table
   - **Detail pages**: Use `product_images` junction table with full `images` relation

3. **Price Handling:**
   - Prices in database are `numeric` (string in Drizzle)
   - Always convert to `number` in queries: `Number(product.min_price)`

4. **Category Hierarchy:**
   - Top-level categories: `parent_id = null`
   - Subcategories: `parent_id = parent_category_id`
   - Use recursive queries for full hierarchies

5. **Variant Selection:**
   - Build `selection_map` on product detail pages for instant client-side lookup
   - Key format: `{material}|{size}|{thickness}` → variant data

## Cache Strategy

All queries use Redis caching with appropriate TTLs:

- **Product listings**: 5 minutes (300s)
- **Product detail**: 10 minutes (600s)
- **Categories**: 1 hour (3600s)
- **Collections**: 1 hour (3600s)
- **Reviews**: 15 minutes (900s)

Cache keys follow the pattern: `{entity}:{operation}:{params}`

Examples:
- `products:list:newest:all:1` (newest products, all categories, page 1)
- `product:detail:kid-goku-silhouette` (product detail by slug)
- `collections:all` (all collections)

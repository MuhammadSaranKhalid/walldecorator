# Troubleshooting Guide: Products Not Showing

## Issue: No Products Displayed on Homepage

If products are not showing on your homepage, follow these steps in order:

---

## ✅ Step 1: Verify Database Migrations Have Run

The project requires **denormalized fields** on the `products` table that are added via migrations:

### Required Migrations:
- `20260316000001_product_min_price.sql` - Adds `min_price` and `min_compare_at_price` fields
- `20260316000002_product_primary_image.sql` - Adds `primary_image_*` fields

### Check if Migrations Ran:

```sql
-- Connect to your database and run:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN (
    'min_price',
    'min_compare_at_price',
    'primary_image_storage_path',
    'primary_image_medium_path',
    'primary_image_blurhash',
    'primary_image_alt_text'
  );
```

**Expected Result:** All 6 columns should be returned.

### If Migrations Haven't Run:

```bash
# Run Supabase migrations
npx supabase db push

# Or if using Prisma
npx prisma migrate deploy
```

---

## ✅ Step 2: Check if Products Exist in Database

```sql
-- Check total products
SELECT COUNT(*) as total_products
FROM products;

-- Check active products
SELECT COUNT(*) as active_products
FROM products
WHERE status = 'active';
```

**If 0 products:** You need to seed your database with products.

---

## ✅ Step 3: Check if Products Have Variants

```sql
-- Check products with variants
SELECT
  p.id,
  p.name,
  p.status,
  COUNT(pv.id) as variant_count
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
GROUP BY p.id, p.name, p.status
ORDER BY p.created_at DESC
LIMIT 10;
```

**If variant_count = 0:** Products need variants to be displayed (variants determine pricing).

---

## ✅ Step 4: Check if Variants Have Stock

```sql
-- Check products with in-stock variants
SELECT
  p.id,
  p.name,
  p.min_price,
  COUNT(CASE WHEN i.quantity_available > 0 THEN 1 END) as in_stock_variants,
  COUNT(pv.id) as total_variants
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
LEFT JOIN inventory i ON i.variant_id = pv.id
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.min_price
ORDER BY p.created_at DESC
LIMIT 10;
```

**Key Points:**
- Products with `in_stock_variants = 0` won't show on homepage
- The query filters by `isNotNull(p.min_price)` - only products with in-stock variants have non-NULL min_price

---

## ✅ Step 5: Verify Denormalized Fields Are Populated

```sql
-- Check if denormalized fields are populated
SELECT
  id,
  name,
  status,
  min_price,
  min_compare_at_price,
  primary_image_storage_path,
  primary_image_medium_path
FROM products
WHERE status = 'active'
LIMIT 10;
```

**Expected:**
- `min_price` should NOT be NULL for products you want to display
- At least one of `primary_image_storage_path` or `primary_image_medium_path` should be set

### If Fields Are NULL:

The database triggers should automatically populate these. If they're not:

```sql
-- Manually trigger updates for all products
DO $$
DECLARE
  product_rec RECORD;
BEGIN
  FOR product_rec IN SELECT id FROM products
  LOOP
    PERFORM update_product_min_price(product_rec.id);
    PERFORM update_product_primary_image(product_rec.id);
  END LOOP;
END $$;
```

---

## ✅ Step 6: Check Redis Cache

The queries use Redis caching. If you have stale data:

```bash
# Clear all product caches (if you have Redis CLI access)
redis-cli KEYS "products:*" | xargs redis-cli DEL
redis-cli KEYS "product:*" | xargs redis-cli DEL
```

Or simply **wait 5-10 minutes** for caches to expire.

---

## ✅ Step 7: Verify Query is Working

Create a test file to directly query products:

```typescript
// test-products.ts
import { db } from '@/lib/db/client'
import { eq, isNotNull } from 'drizzle-orm'
import { products } from '@/lib/db/schema'

async function testProducts() {
  console.log('Testing products query...')

  const result = await db.query.products.findMany({
    where: (p, { eq, and, isNotNull }) =>
      and(eq(p.status, 'active'), isNotNull(p.min_price)),
    columns: {
      id: true,
      name: true,
      slug: true,
      min_price: true,
      status: true,
    },
    limit: 10,
  })

  console.log('Found products:', result.length)
  console.log('First product:', result[0])
}

testProducts().catch(console.error)
```

Run with:
```bash
npx tsx test-products.ts
```

---

## Common Issues and Fixes

### Issue 1: "Category 'all' not found"
**Fix:** The homepage was passing `category: 'all'` instead of `category: ''` (empty string).
This is already fixed in the latest code.

### Issue 2: Products exist but min_price is NULL
**Cause:** No in-stock variants, or inventory records missing
**Fix:**
```sql
-- Add inventory records for variants
INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved)
SELECT id, 10, 0
FROM product_variants
WHERE id NOT IN (SELECT variant_id FROM inventory);

-- Manually trigger min_price update
SELECT update_product_min_price(id) FROM products;
```

### Issue 3: Products exist but no primary images
**Cause:** No images marked as `is_primary = true` in `product_images` junction table
**Fix:**
```sql
-- Mark first image as primary for each product
UPDATE product_images pi
SET is_primary = true
WHERE (product_id, image_id) IN (
  SELECT DISTINCT ON (product_id) product_id, image_id
  FROM product_images
  ORDER BY product_id, display_order
);

-- Trigger primary image denormalization
SELECT update_product_primary_image(id) FROM products;
```

### Issue 4: Images table is empty
**Cause:** Images haven't been uploaded or migrated
**Fix:** You need to populate the centralized `images` table. See `20260311000002_migrate_existing_images.sql` for migration from old `image_path` fields.

---

## Quick Fix: Seed Test Data

If you just want to test the UI with dummy data:

```sql
-- 1. Create a test category
INSERT INTO categories (id, name, slug, description, is_visible, product_count)
VALUES (
  gen_random_uuid(),
  'Test Category',
  'test-category',
  'Test category for development',
  true,
  0
) RETURNING id;
-- Copy the returned ID

-- 2. Create a test product (replace YOUR_CATEGORY_ID)
INSERT INTO products (id, category_id, name, slug, description, status)
VALUES (
  gen_random_uuid(),
  'YOUR_CATEGORY_ID',
  'Test Wall Art',
  'test-wall-art',
  'This is a test product',
  'active'
) RETURNING id;
-- Copy the returned ID

-- 3. Create attribute values (material, size, thickness)
INSERT INTO product_attribute_values (id, attribute_id, value)
SELECT gen_random_uuid(), (SELECT id FROM product_attributes WHERE name = 'material' LIMIT 1), 'steel'
UNION ALL
SELECT gen_random_uuid(), (SELECT id FROM product_attributes WHERE name = 'size' LIMIT 1), 'medium'
UNION ALL
SELECT gen_random_uuid(), (SELECT id FROM product_attributes WHERE name = 'thickness' LIMIT 1), '3mm';

-- 4. Create a test variant (replace YOUR_PRODUCT_ID and attribute IDs)
INSERT INTO product_variants (id, product_id, sku, price, compare_at_price, material_id, size_id, thickness_id, is_default)
VALUES (
  gen_random_uuid(),
  'YOUR_PRODUCT_ID',
  'TEST-001',
  1500.00,
  2000.00,
  (SELECT id FROM product_attribute_values WHERE value = 'steel' LIMIT 1),
  (SELECT id FROM product_attribute_values WHERE value = 'medium' LIMIT 1),
  (SELECT id FROM product_attribute_values WHERE value = '3mm' LIMIT 1),
  true
) RETURNING id;
-- Copy the returned variant ID

-- 5. Create inventory (replace YOUR_VARIANT_ID)
INSERT INTO inventory (variant_id, quantity_on_hand, quantity_reserved)
VALUES ('YOUR_VARIANT_ID', 10, 0);

-- 6. Verify min_price was set automatically
SELECT id, name, min_price, min_compare_at_price
FROM products
WHERE id = 'YOUR_PRODUCT_ID';
```

---

## Development Checklist

Before expecting products to show:

- [ ] Database migrations have been run
- [ ] At least one category exists
- [ ] At least one product exists with `status = 'active'`
- [ ] Product has at least one variant
- [ ] Variant has an inventory record with `quantity_available > 0`
- [ ] Product's `min_price` field is NOT NULL (check denormalization)
- [ ] Product has at least one image with `is_primary = true` (optional but recommended)

---

## Still Not Working?

Check browser console and server logs for errors:

```bash
# Start development server with verbose logging
npm run dev

# Check for database connection errors
# Check for Redis connection errors
# Check for query errors in terminal
```

Common error patterns:
- `relation "products" does not exist` → Migrations not run
- `column "min_price" does not exist` → Migration 20260316000001 not run
- `No products found` → Database is empty or filters are too restrictive

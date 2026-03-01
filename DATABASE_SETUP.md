# Wall Decorator - Database Setup Guide

## 🎯 Database Architecture

**Guest Checkout E-Commerce** for wall art with Material × Size × Thickness variants.

### Key Characteristics:
- ✅ **No user authentication** - Guest checkout only
- ✅ **Cart in browser** - LocalStorage/cookies (no database persistence)
- ✅ **Material/Size/Thickness variants** - Each combination = unique SKU + price
- ✅ **Image variants** - Auto-generated thumbnail, medium, large (WebP)
- ✅ **Event ledger inventory** - Full audit trail of stock changes
- ✅ **Anonymous reviews** - Name + email only
- ✅ **Production-ready** - RLS, indexes, triggers, functions

---

## 📁 Migration Files

```
supabase/migrations/
├── 20250101000001_initial_setup.sql           # Helper functions
├── 20250101000002_product_catalog.sql         # Products with M×S×T variants
├── 20250101000003_inventory_system.sql        # Event ledger pattern
├── 20250101000004_order_system.sql            # Guest orders
├── 20250101000005_payments_discounts.sql      # Stripe + promo codes
├── 20250101000006_reviews_newsletter.sql      # Anonymous reviews
└── 20250101000007_storage_setup.sql           # Image storage
```

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest sharp@latest
```

### Step 2: Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for database provisioning (~2 minutes)
3. Go to **Settings → API** and copy your credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### Step 3: Add Environment Variables

Update `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

UPSTASH_REDIS_REST_URL=https://smashing-pika-62238.upstash.io
UPSTASH_REDIS_REST_TOKEN=AfMeAAIncDE1YzBiOGMwZGYwN2M0MTAxYmQ2YzVmYjc5YzIyZGE4N3AxNjIyMzg

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run Migrations

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to **SQL Editor** in your Supabase dashboard
2. Run each migration file in order (001, 002, 003... 007)
3. Copy/paste the entire content and click **Run**

**Option B: Via Supabase CLI (Recommended for Production)**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run all migrations
supabase db push
```

### Step 5: Enable Required Extensions

In **SQL Editor**, run:

```sql
-- Required for webhook triggers (image processing)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Required for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Step 6: Create Storage Bucket

1. Go to **Storage** in Supabase dashboard
2. Click **New Bucket**
3. Name: `product-images`
4. **Public**: ✅ Enabled
5. Click **Create Bucket**

### Step 7: Configure Image Processing Webhook

1. **Deploy your Next.js app** to Vercel/your host
2. Get your production URL (e.g., `https://walldecorator.vercel.app`)
3. In Supabase dashboard, go to **Database → Functions**
4. Find `trigger_image_processing` function
5. Update the webhook URL in the migration file OR set via SQL:

```sql
-- Update webhook URL to your production URL
ALTER DATABASE postgres SET app.settings.image_webhook_url TO 'https://your-domain.vercel.app/api/process-image';
```

---

## 📊 Database Schema Overview

### Products & Variants

```
categories (hierarchical)
  └── products (wall art designs)
      ├── product_images (with auto-generated variants)
      └── product_variants (Material × Size × Thickness)
          └── inventory (stock tracking)
              └── inventory_transactions (event ledger)
```

### Orders & Payments

```
orders (guest checkout - no user FK)
  ├── order_items (snapshotted product data)
  ├── order_status_history (audit log)
  ├── payments (Stripe)
  └── refunds
```

### Marketing

```
discount_codes
  └── discount_usages

reviews (anonymous)

newsletter_subscribers
```

---

## 🔧 Product Variant Example

A single product ("Geometric Pattern Wall Art") has variants:

| Material | Size | Thickness | SKU | Price |
|----------|------|-----------|-----|-------|
| Metal | 60x40cm | 3mm | GEOMETRIC-METAL-60X40-3mm | Rs. 4,500 |
| Wood | 60x40cm | 5mm | GEOMETRIC-WOOD-60X40-5mm | Rs. 3,200 |
| Acrylic | 80x60cm | 2mm | GEOMETRIC-ACRYLIC-80X60-2mm | Rs. 5,800 |

Each variant has its own:
- ✅ Unique SKU (auto-generated)
- ✅ Price
- ✅ Inventory count
- ✅ Optional variant-specific images

---

## 🖼️ Image Processing Workflow

1. **Upload** → Admin uploads image to Supabase Storage
2. **Database Insert** → Row inserted into `product_images` table
3. **Trigger Fires** → `trigger_image_processing()` calls your Next.js API
4. **Processing** → Next.js `/api/process-image` route:
   - Downloads original from Supabase Storage
   - Generates 3 variants using Sharp.js:
     - `thumbnail` (150x150 WebP)
     - `medium` (600x600 WebP)
     - `large` (1200x1200 WebP)
   - Uploads variants back to Supabase Storage
   - Updates database with variant paths
5. **Complete** → `processing_status` = `completed`

---

## 📦 Seed Data

### 1. Sample Categories

```sql
INSERT INTO public.categories (name, slug, description, is_visible) VALUES
('Geometric', 'geometric', 'Modern geometric patterns', true),
('Floral', 'floral', 'Beautiful floral designs', true),
('Abstract', 'abstract', 'Contemporary abstract art', true),
('Islamic', 'islamic', 'Traditional Islamic patterns', true);
```

### 2. Sample Product with Variants

```sql
-- Create product
INSERT INTO public.products (name, slug, description, category_id, status, is_featured)
SELECT
  'Geometric Pattern Wall Art',
  'geometric-pattern-001',
  'Precision laser-cut geometric pattern for modern interiors',
  (SELECT id FROM public.categories WHERE slug = 'geometric'),
  'active',
  true
RETURNING id;

-- Get Material/Size/Thickness IDs
WITH attrs AS (
  SELECT
    (SELECT id FROM public.product_attribute_values WHERE value = 'metal') AS metal_id,
    (SELECT id FROM public.product_attribute_values WHERE value = '60x40') AS size_60x40_id,
    (SELECT id FROM public.product_attribute_values WHERE value = '3') AS thickness_3mm_id
)
-- Create variant: Metal - 60x40cm - 3mm
INSERT INTO public.product_variants (
  product_id,
  material_id,
  size_id,
  thickness_id,
  sku,
  price,
  is_default
)
SELECT
  (SELECT id FROM public.products WHERE slug = 'geometric-pattern-001'),
  attrs.metal_id,
  attrs.size_60x40_id,
  attrs.thickness_3mm_id,
  'GEOMETRIC-PATTERN-001-METAL-60X40-3MM',
  4500.00,
  true
FROM attrs;

-- Add inventory
INSERT INTO public.inventory (variant_id, quantity_on_hand)
SELECT id, 50
FROM public.product_variants
WHERE sku = 'GEOMETRIC-PATTERN-001-METAL-60X40-3MM';
```

### 3. Sample Discount Code

```sql
INSERT INTO public.discount_codes (code, type, value, minimum_order_amount, is_active)
VALUES ('WELCOME10', 'percentage', 10, 2000, true);
```

---

## 🔐 Security (RLS Policies)

### Public Read Access:
- ✅ Products, categories, variants, images
- ✅ Inventory levels (for stock display)
- ✅ Active discount codes
- ✅ Approved reviews

### Admin Only (Service Role):
- ✅ Creating/updating products
- ✅ Managing inventory
- ✅ Approving reviews
- ✅ Uploading images

### Guest Access:
- ✅ Creating orders (after payment)
- ✅ Submitting reviews
- ✅ Newsletter signup

---

## 📈 Performance Optimizations

### Indexes Created:
- All foreign keys
- Frequently queried columns (status, slug, email)
- Compound indexes for common queries
- Partial indexes for filtered queries

### Caching Strategy:
- **Homepage data** → Redis (30 min TTL)
- **Product catalog** → Redis (1 hr TTL)
- **Inventory levels** → Redis (5 min TTL)
- **ISR pages** → Next.js (30 min revalidate)

---

## 🧪 Testing

### 1. Verify Migrations

```sql
-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: 16 tables
```

### 2. Test Product Variant Creation

```sql
-- Should auto-generate SKU
INSERT INTO public.product_variants (
  product_id,
  material_id,
  size_id,
  thickness_id,
  sku,
  price
) VALUES (
  (SELECT id FROM public.products LIMIT 1),
  (SELECT id FROM public.product_attribute_values WHERE value = 'wood'),
  (SELECT id FROM public.product_attribute_values WHERE value = '80x60'),
  (SELECT id FROM public.product_attribute_values WHERE value = '5'),
  public.generate_variant_sku(
    (SELECT id FROM public.products LIMIT 1),
    (SELECT id FROM public.product_attribute_values WHERE value = 'wood'),
    (SELECT id FROM public.product_attribute_values WHERE value = '80x60'),
    (SELECT id FROM public.product_attribute_values WHERE value = '5')
  ),
  6500.00
);
```

### 3. Test Inventory Adjustment

```sql
-- Adjust inventory with audit trail
SELECT public.adjust_inventory(
  (SELECT id FROM public.product_variants LIMIT 1),
  100, -- Add 100 units
  'restock',
  'manual',
  NULL,
  'Initial stock'
);

-- Verify transaction was logged
SELECT * FROM public.inventory_transactions ORDER BY created_at DESC LIMIT 5;
```

### 4. Test Discount Code

```sql
-- Validate discount
SELECT * FROM public.validate_discount_code('WELCOME10', 5000);
-- Should return: is_valid = true, discount_type = 'percentage', value = 10
```

---

## 🐛 Troubleshooting

### Issue: Migrations fail with "relation already exists"

**Solution**: Migrations are idempotent (use `IF NOT EXISTS`). Just re-run.

### Issue: Image processing webhook not firing

**Check**:
1. `pg_net` extension enabled: `CREATE EXTENSION pg_net;`
2. Webhook URL is correct in function
3. Next.js API route `/api/process-image` is deployed
4. Check Supabase logs: **Database → Logs**

### Issue: RLS blocking queries

**Solution**: Use `service_role` key for admin operations, not `anon` key.

### Issue: Inventory going negative

**Solution**: Event ledger prevents this. Check `inventory_transactions` for audit trail.

---

## 🚀 Next Steps

1. **Run all migrations** ✅
2. **Seed sample data** ✅
3. **Test image upload workflow** ✅
4. **Deploy Next.js app** ✅
5. **Configure Stripe webhooks** (separate guide)
6. **Set up email notifications** (OrderEmails after payment)

Your database is production-ready! 🎉

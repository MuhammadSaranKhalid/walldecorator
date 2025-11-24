# Quick Start - Supabase Setup

## 🚀 TL;DR

```bash
# 1. Install CLI
npm install -g supabase

# 2. Link project
supabase link --project-ref your-project-ref

# 3. Push migrations
supabase db push

# 4. Done! ✅
```

## 📊 What You Get

### Tables (10)
- ✅ customers
- ✅ addresses  
- ✅ categories
- ✅ products
- ✅ product_materials
- ✅ product_images
- ✅ orders
- ✅ order_items
- ✅ customization_requests
- ✅ reviews

### Features
- 🔐 Row Level Security on all tables
- 🔑 Auto-generated order numbers (ORD-XXXXX)
- 📝 Auto-generated request numbers (CUST-XXXX)
- 🔍 Full-text search on products
- 📁 Storage buckets configured
- 📊 Analytics views ready
- 🎯 Optimized indexes

### Seed Data
- 4 categories
- 8 products with images
- Sample materials assigned
- Ready to test!

## 📋 Quick Commands

### View all tables
```sql
\dt
```

### Check products
```sql
SELECT name, base_price, inventory_quantity FROM products;
```

### Check orders
```sql
SELECT order_number, status, total_amount FROM orders LIMIT 10;
```

### Search products
```sql
SELECT * FROM search_products(
  search_query := 'lion',
  filter_materials := ARRAY['steel']::material_type[],
  sort_by := 'price',
  sort_order := 'ASC'
);
```

## 🔧 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

## 📦 Key Relationships

```
customers → orders → order_items → products
customers → addresses
customers → customization_requests
customers → reviews → products
products → product_materials
products → product_images
products → categories
```

## 🎨 Sample Queries

### Get all active products with materials
```typescript
const { data: products } = await supabase
  .from('products')
  .select(`
    *,
    product_materials(material),
    product_images(image_url, is_primary)
  `)
  .eq('status', 'active')
```

### Create a new order
```typescript
const { data: order } = await supabase
  .from('orders')
  .insert({
    customer_id: user.id,
    status: 'pending',
    subtotal: 100.00,
    total_amount: 110.00,
    // ... other fields
  })
  .select()
  .single()
```

### Submit customization request
```typescript
const { data: request } = await supabase
  .from('customization_requests')
  .insert({
    customer_email: 'user@example.com',
    material: 'steel',
    description: 'Custom lion design',
    file_url: uploadedFileUrl
  })
  .select()
  .single()
```

## 🔒 Security Notes

- ✅ All tables have RLS enabled
- ✅ Customers can only see their own data
- ✅ Public can view active products
- ✅ Admin role for full access
- ✅ Storage buckets have proper policies

## 📱 Next.js Integration

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

## 🆘 Need Help?

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
2. Check [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for schema details
3. Check migration files in `./migrations/` directory
4. Visit [Supabase Discord](https://discord.supabase.com)

## ✅ Verification Checklist

After running migrations:

- [ ] All 10 tables created
- [ ] 2 storage buckets exist
- [ ] 8 products in database
- [ ] 4 categories in database
- [ ] Can query products successfully
- [ ] RLS policies working
- [ ] Storage buckets accessible
- [ ] Environment variables set


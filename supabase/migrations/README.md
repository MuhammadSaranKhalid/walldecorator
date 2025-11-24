# Database Migrations

This directory contains all Supabase database migrations for the WallDecor Co. e-commerce platform.

## Migration Files

1. **20240101000000_create_enums.sql** - Creates all enum types for status fields
2. **20240101000001_create_customers_table.sql** - Customer profiles and authentication
3. **20240101000002_create_addresses_table.sql** - Shipping and billing addresses
4. **20240101000003_create_categories_table.sql** - Product categories
5. **20240101000004_create_products_table.sql** - Main products table
6. **20240101000005_create_product_materials_table.sql** - Product materials (many-to-many)
7. **20240101000006_create_product_images_table.sql** - Product image gallery
8. **20240101000007_create_orders_table.sql** - Customer orders
9. **20240101000008_create_order_items_table.sql** - Order line items
10. **20240101000009_create_customization_requests_table.sql** - Custom order requests
11. **20240101000010_create_reviews_table.sql** - Product reviews
12. **20240101000011_create_storage_buckets.sql** - Storage buckets and policies
13. **20240101000012_create_functions_and_views.sql** - Helper functions and views
14. **20240101000013_seed_data.sql** - Initial seed data

## How to Run Migrations

### Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your project:
```bash
supabase link --project-ref your-project-ref
```

3. Run all migrations:
```bash
supabase db push
```

### Manual Execution

You can also run these migrations manually through the Supabase Dashboard:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Execute them one by one

## Database Schema Overview

### Core Tables

- **customers** - User profiles linked to Supabase Auth
- **addresses** - Shipping and billing addresses
- **categories** - Product categorization (hierarchical)
- **products** - Wall decor products
- **product_materials** - Materials used in products (many-to-many)
- **product_images** - Product image gallery
- **orders** - Customer orders with full details
- **order_items** - Individual items in orders
- **customization_requests** - Custom order requests from homepage
- **reviews** - Product reviews and ratings

### Enums

- **order_status**: pending, processing, shipped, delivered, cancelled
- **customization_status**: new, processing, reviewed, completed, rejected
- **material_type**: acrylic, steel, iron, wood
- **product_status**: active, inactive, archived

### Key Features

1. **Row Level Security (RLS)** - All tables have RLS policies
2. **Automatic Timestamps** - `created_at` and `updated_at` on all tables
3. **Auto-generated Numbers** - Order numbers (ORD-XXXXX) and request numbers (CUST-XXXX)
4. **Full-text Search** - On products table for efficient searching
5. **Storage Buckets** - For product images and customization files
6. **Helper Functions** - For complex queries and product search
7. **Analytics Views** - For reporting and dashboard data

### Security

- **Authentication** - Integrated with Supabase Auth
- **Authorization** - Role-based access (customer, admin)
- **RLS Policies** - Users can only access their own data
- **Admin Access** - Admin role has full access to all tables

## Environment Variables

After running migrations, make sure to set these in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Notes

- The seed data includes sample products with Unsplash images
- Order numbers start at 10000 (ORD-10000)
- Customization request numbers start at 1000 (CUST-1000)
- Admin users need to be created through Supabase Auth and assigned the 'admin' role in JWT claims
- Storage buckets are configured with appropriate file size limits and MIME types

## Rollback

If you need to rollback migrations, you can drop tables in reverse order or use Supabase's reset functionality:

```bash
supabase db reset
```

**Warning**: This will delete all data!


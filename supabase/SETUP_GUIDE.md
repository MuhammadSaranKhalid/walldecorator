# Supabase Setup Guide

This guide will help you set up the complete database schema for the WallDecor Co. e-commerce platform.

## Prerequisites

- A Supabase account ([sign up here](https://supabase.com))
- Node.js installed (v18 or higher)
- Supabase CLI installed

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

Or using Homebrew (macOS):
```bash
brew install supabase/tap/supabase
```

## Step 2: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: WallDecor Co
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier
4. Wait for project to be provisioned (~2 minutes)

## Step 3: Get Your Project Credentials

From your Supabase dashboard:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project ID/Reference** (short code like: `xxxxx`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Optional - for direct connections)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

## Step 5: Run Migrations

### Option A: Using Supabase CLI (Recommended)

1. Link your local project to Supabase:
```bash
cd walldecorator
supabase link --project-ref your-project-ref
```

2. Push all migrations:
```bash
supabase db push
```

This will execute all migration files in order.

### Option B: Manual Execution via Dashboard

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Execute each migration file in order:
   - Copy the content of `20240101000000_create_enums.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Repeat for each migration file in numerical order

**Important**: Run migrations in this exact order:
1. `20240101000000_create_enums.sql`
2. `20240101000001_create_customers_table.sql`
3. `20240101000002_create_addresses_table.sql`
4. `20240101000003_create_categories_table.sql`
5. `20240101000004_create_products_table.sql`
6. `20240101000005_create_product_materials_table.sql`
7. `20240101000006_create_product_images_table.sql`
8. `20240101000007_create_orders_table.sql`
9. `20240101000008_create_order_items_table.sql`
10. `20240101000009_create_customization_requests_table.sql`
11. `20240101000010_create_reviews_table.sql`
12. `20240101000011_create_storage_buckets.sql`
13. `20240101000012_create_functions_and_views.sql`
14. `20240101000013_seed_data.sql`

## Step 6: Verify the Setup

### Check Tables

In SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see:
- addresses
- categories
- customization_requests
- customers
- order_items
- orders
- product_images
- product_materials
- products
- reviews

### Check Storage Buckets

1. Go to **Storage** in dashboard
2. You should see two buckets:
   - `product-images` (public)
   - `customization-files` (private)

### Check Seed Data

Run this query:
```sql
SELECT COUNT(*) as product_count FROM products;
SELECT COUNT(*) as category_count FROM categories;
```

You should see 8 products and 4 categories.

## Step 7: Configure Authentication

### Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

### Set Up Admin Role (Optional)

For admin users, you need to add custom claims to their JWT.

1. Create an admin user through the Auth UI
2. Go to **Authentication** → **Users**
3. Find the user and copy their UUID
4. Run this in SQL Editor:

```sql
-- Note: This requires setting up custom claims in Supabase Auth
-- For now, admin access can be managed through service role key server-side
```

## Step 8: Test the Connection

Create a test file `test-connection.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Test query
const { data, error } = await supabase
  .from('products')
  .select('*')
  .limit(5)

if (error) {
  console.error('Error:', error)
} else {
  console.log('Products:', data)
}
```

Run it:
```bash
node test-connection.js
```

## Step 9: Start Development

Install Supabase client:
```bash
npm install @supabase/supabase-js
```

Create Supabase client utility (`lib/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Common Issues & Solutions

### Issue: Migration fails with "relation already exists"

**Solution**: Reset the database:
```bash
supabase db reset
```
Then run migrations again.

### Issue: RLS policies blocking queries

**Solution**: 
- For development, you can temporarily disable RLS on a table:
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
```
- Or use the service role key (server-side only)

### Issue: Can't upload to storage

**Solution**: Check storage policies are created correctly:
```sql
SELECT * FROM storage.policies;
```

### Issue: Full-text search not working

**Solution**: Rebuild the search index:
```sql
REINDEX INDEX idx_products_search;
```

## Production Checklist

Before going to production:

- [ ] Change database password
- [ ] Rotate API keys
- [ ] Set up database backups
- [ ] Configure email templates
- [ ] Set up proper error logging
- [ ] Enable database connection pooling
- [ ] Set up monitoring and alerts
- [ ] Review and test all RLS policies
- [ ] Set up custom domain for Auth
- [ ] Configure CORS settings
- [ ] Set up rate limiting
- [ ] Review storage bucket policies
- [ ] Set up CDN for storage buckets

## Backup & Restore

### Create Backup
```bash
supabase db dump -f backup.sql
```

### Restore from Backup
```bash
supabase db reset
psql $DATABASE_URL < backup.sql
```

## Useful Queries

### View all RLS policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### Check table sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### View all indexes
```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Next Steps

1. ✅ Database schema is set up
2. 📝 Update your app to use Supabase client
3. 🔐 Implement authentication flows
4. 🛒 Connect cart to database
5. 💳 Integrate payment processing
6. 📧 Set up email notifications
7. 📊 Build admin dashboard queries
8. 🧪 Write tests for database operations

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Discord Community**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Documentation](https://supabase.com/docs/guides/storage)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)


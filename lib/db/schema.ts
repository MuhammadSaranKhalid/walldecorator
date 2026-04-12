import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  primaryKey,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// Helper for timestamptz(6) columns
const tstz = (name: string) => timestamp(name, { withTimezone: true, mode: 'date', precision: 6 })

// ─── images ───────────────────────────────────────────────────────────────────
// Defined first — referenced by categories, custom_orders, product_images, review_images

export const images = pgTable('images', {
  id: uuid('id').primaryKey().defaultRandom(),
  entity_type: text('entity_type').notNull(),
  entity_id: uuid('entity_id').notNull(),
  storage_path: text('storage_path').notNull(),
  alt_text: text('alt_text'),
  thumbnail_path: text('thumbnail_path'),
  medium_path: text('medium_path'),
  large_path: text('large_path'),
  processing_status: text('processing_status').default('pending'),
  processing_error: text('processing_error'),
  blurhash: text('blurhash'),
  original_width: integer('original_width'),
  original_height: integer('original_height'),
  file_size_bytes: integer('file_size_bytes'),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── categories ──────────────────────────────────────────────────────────────

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  parent_id: uuid('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image_path: text('image_path'),
  display_order: integer('display_order').default(0),
  is_visible: boolean('is_visible').default(true),
  product_count: integer('product_count').default(0),
  seo_title: text('seo_title'),
  seo_description: text('seo_description'),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
  image_id: uuid('image_id').references(() => images.id, { onDelete: 'set null' }),
})

// ─── products ─────────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  category_id: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  status: text('status').default('draft'),
  is_featured: boolean('is_featured').default(false),
  featured_order: integer('featured_order').default(0),
  total_sold: integer('total_sold').default(0),
  view_count: integer('view_count').default(0),
  seo_title: text('seo_title'),
  seo_description: text('seo_description'),
  // Trigger-maintained: price of the cheapest in-stock variant (NULL = no in-stock variants)
  min_price: numeric('min_price', { precision: 10, scale: 2 }),
  min_compare_at_price: numeric('min_compare_at_price', { precision: 10, scale: 2 }),
  // Trigger-maintained primary image paths (NULL = no primary image set)
  primary_image_storage_path: text('primary_image_storage_path'),
  primary_image_medium_path: text('primary_image_medium_path'),
  primary_image_blurhash: text('primary_image_blurhash'),
  primary_image_alt_text: text('primary_image_alt_text'),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── product_attributes ───────────────────────────────────────────────────────

export const product_attributes = pgTable('product_attributes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  display_name: text('display_name').notNull(),
  display_order: integer('display_order').default(0),
  created_at: tstz('created_at').notNull().defaultNow(),
})

// ─── product_attribute_values ─────────────────────────────────────────────────

export const product_attribute_values = pgTable('product_attribute_values', {
  id: uuid('id').primaryKey().defaultRandom(),
  attribute_id: uuid('attribute_id').notNull().references(() => product_attributes.id, { onDelete: 'cascade' }),
  value: text('value').notNull(),
  display_name: text('display_name').notNull(),
  display_order: integer('display_order').default(0),
  created_at: tstz('created_at').notNull().defaultNow(),
})

// ─── product_variants ─────────────────────────────────────────────────────────

export const product_variants = pgTable('product_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  product_id: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku').notNull().unique(),
  material_id: uuid('material_id').notNull().references(() => product_attribute_values.id),
  size_id: uuid('size_id').notNull().references(() => product_attribute_values.id),
  thickness_id: uuid('thickness_id').notNull().references(() => product_attribute_values.id),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  compare_at_price: numeric('compare_at_price', { precision: 10, scale: 2 }),
  cost_per_item: numeric('cost_per_item', { precision: 10, scale: 2 }),
  is_default: boolean('is_default').default(false),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── product_images ───────────────────────────────────────────────────────────

export const product_images = pgTable(
  'product_images',
  {
    product_id: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    image_id: uuid('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
    variant_id: uuid('variant_id').references(() => product_variants.id, { onDelete: 'cascade' }),
    display_order: integer('display_order').default(0),
    is_primary: boolean('is_primary').default(false),
  },
  (table) => [primaryKey({ columns: [table.product_id, table.image_id] })]
)

// ─── inventory ────────────────────────────────────────────────────────────────

export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  variant_id: uuid('variant_id').notNull().unique().references(() => product_variants.id, { onDelete: 'cascade' }),
  quantity_on_hand: integer('quantity_on_hand').default(0),
  quantity_reserved: integer('quantity_reserved').default(0),
  // DB-computed column: always stored, Drizzle will never write to it
  quantity_available: integer('quantity_available').generatedAlwaysAs(
    sql`quantity_on_hand - quantity_reserved`
  ),
  low_stock_threshold: integer('low_stock_threshold').default(5),
  allow_backorder: boolean('allow_backorder').default(false),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── inventory_transactions ───────────────────────────────────────────────────

export const inventory_transactions = pgTable('inventory_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  variant_id: uuid('variant_id').notNull().references(() => product_variants.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  quantity_delta: integer('quantity_delta').notNull(),
  quantity_before: integer('quantity_before').notNull(),
  quantity_after: integer('quantity_after').notNull(),
  reference_type: text('reference_type'),
  reference_id: uuid('reference_id'),
  notes: text('notes'),
  created_at: tstz('created_at').notNull().defaultNow(),
})

// ─── material_attribute_relationships ─────────────────────────────────────────

export const material_attribute_relationships = pgTable('material_attribute_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  material_id: uuid('material_id').notNull().references(() => product_attribute_values.id, { onDelete: 'cascade' }),
  attribute_value_id: uuid('attribute_value_id').notNull().references(() => product_attribute_values.id, { onDelete: 'cascade' }),
  created_at: tstz('created_at').notNull().defaultNow(),
})

// ─── orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_number: text('order_number').notNull().unique(),
  status: text('status').default('pending'),
  customer_email: text('customer_email').notNull(),
  customer_name: text('customer_name').notNull(),
  customer_phone: text('customer_phone').notNull(),
  shipping_address: jsonb('shipping_address').notNull().$type<{
    line1: string; line2?: string | null; city: string
    province: string; postal_code: string; country: string
  }>(),
  billing_address: jsonb('billing_address').$type<{
    line1: string; line2?: string | null; city: string
    province: string; postal_code: string; country: string
  }>(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount_amount: numeric('discount_amount', { precision: 10, scale: 2 }).default('0'),
  shipping_cost: numeric('shipping_cost', { precision: 10, scale: 2 }).default('0'),
  tax_amount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0'),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('PKR'),
  payment_status: text('payment_status').default('pending'),
  payment_intent_id: text('payment_intent_id').unique(),
  payment_method: text('payment_method'),
  notes: text('notes'),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  confirmed_at: tstz('confirmed_at'),
  shipped_at: tstz('shipped_at'),
  delivered_at: tstz('delivered_at'),
  cancelled_at: tstz('cancelled_at'),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── order_items ──────────────────────────────────────────────────────────────

export const order_items = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  variant_id: uuid('variant_id').references(() => product_variants.id, { onDelete: 'set null' }),
  product_name: text('product_name').notNull(),
  variant_description: text('variant_description'),
  sku: text('sku').notNull(),
  quantity: integer('quantity').notNull(),
  unit_price: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  total_price: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  created_at: tstz('created_at').notNull().defaultNow(),
})

// ─── order_status_history ─────────────────────────────────────────────────────

export const order_status_history = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  from_status: text('from_status'),
  to_status: text('to_status').notNull(),
  changed_by_type: text('changed_by_type').default('system'),
  notes: text('notes'),
  created_at: tstz('created_at').notNull().defaultNow(),
})

// ─── payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  stripe_payment_intent_id: text('stripe_payment_intent_id').notNull().unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('PKR'),
  status: text('status').default('pending'),
  payment_method_type: text('payment_method_type'),
  payment_method_details: jsonb('payment_method_details').$type<Record<string, unknown>>(),
  stripe_metadata: jsonb('stripe_metadata').$type<Record<string, unknown>>(),
  error_message: text('error_message'),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── refunds ──────────────────────────────────────────────────────────────────

export const refunds = pgTable('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  payment_id: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  stripe_refund_id: text('stripe_refund_id').notNull().unique(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('PKR'),
  reason: text('reason'),
  status: text('status').default('pending'),
  stripe_metadata: jsonb('stripe_metadata').$type<Record<string, unknown>>(),
  notes: text('notes'),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── discount_codes ───────────────────────────────────────────────────────────

export const discount_codes = pgTable('discount_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minimum_order_amount: numeric('minimum_order_amount', { precision: 10, scale: 2 }).default('0'),
  usage_limit: integer('usage_limit'),
  usage_count: integer('usage_count').default(0),
  is_active: boolean('is_active').default(true),
  valid_from: tstz('valid_from').defaultNow(),
  valid_until: tstz('valid_until'),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── discount_usages ──────────────────────────────────────────────────────────

export const discount_usages = pgTable('discount_usages', {
  id: uuid('id').primaryKey().defaultRandom(),
  discount_code_id: uuid('discount_code_id').notNull().references(() => discount_codes.id, { onDelete: 'cascade' }),
  order_id: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  discount_applied: numeric('discount_applied', { precision: 10, scale: 2 }).notNull(),
  created_at: tstz('created_at').notNull().defaultNow(),
})

// ─── email_logs ───────────────────────────────────────────────────────────────

export const email_logs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  email_type: text('email_type').notNull(),
  recipient_email: text('recipient_email').notNull(),
  status: text('status').default('pending'),
  resend_id: text('resend_id'),
  error_message: text('error_message'),
  sent_at: tstz('sent_at'),
  created_at: tstz('created_at').notNull().defaultNow(),
})

// ─── homepage_config ──────────────────────────────────────────────────────────

export const homepage_config = pgTable('homepage_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  hero_headline: text('hero_headline').default('Transform Your Walls'),
  hero_subheadline: text('hero_subheadline').default('Precision-crafted laser-cut metal art'),
  hero_cta_text: text('hero_cta_text').default('Shop Now'),
  hero_cta_link: text('hero_cta_link').default('/products'),
  hero_image_path: text('hero_image_path'),
  promo_is_active: boolean('promo_is_active').default(false),
  promo_headline: text('promo_headline'),
  promo_subheadline: text('promo_subheadline'),
  promo_cta_text: text('promo_cta_text'),
  promo_cta_link: text('promo_cta_link'),
  promo_bg_color: text('promo_bg_color').default('#000000'),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── newsletter_subscribers ───────────────────────────────────────────────────

export const newsletter_subscribers = pgTable('newsletter_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  is_active: boolean('is_active').default(true),
  subscribed_at: tstz('subscribed_at').notNull().defaultNow(),
  unsubscribed_at: tstz('unsubscribed_at'),
})

// ─── custom_orders ────────────────────────────────────────────────────────────

export const custom_orders = pgTable('custom_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  customer_name: text('customer_name').notNull(),
  customer_email: text('customer_email').notNull(),
  customer_phone: text('customer_phone'),
  image_url: text('image_url').notNull(),
  description: text('description'),
  preferred_material: text('preferred_material'),
  preferred_size: text('preferred_size'),
  preferred_thickness: text('preferred_thickness'),
  status: text('status').notNull().default('pending'),
  admin_notes: text('admin_notes'),
  quoted_price: numeric('quoted_price', { precision: 10, scale: 2 }),
  quoted_at: tstz('quoted_at'),
  order_id: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
  image_id: uuid('image_id').references(() => images.id, { onDelete: 'set null' }),
})

// ─── reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  product_id: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  order_id: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  reviewer_name: text('reviewer_name').notNull(),
  reviewer_email: text('reviewer_email').notNull(),
  rating: integer('rating').notNull(),
  title: text('title'),
  body: text('body'),
  is_approved: boolean('is_approved').default(false),
  is_verified_purchase: boolean('is_verified_purchase').default(false),
  helpful_count: integer('helpful_count').default(0),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

// ─── review_images ────────────────────────────────────────────────────────────

export const review_images = pgTable(
  'review_images',
  {
    review_id: uuid('review_id').notNull().references(() => reviews.id, { onDelete: 'cascade' }),
    image_id: uuid('image_id').notNull().references(() => images.id, { onDelete: 'cascade' }),
    display_order: integer('display_order').default(0),
  },
  (table) => [primaryKey({ columns: [table.review_id, table.image_id] })]
)

// ─── image_processing_configs ─────────────────────────────────────────────────

export const image_processing_configs = pgTable('image_processing_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entity_type: text('entity_type').notNull().unique(),
  folder_prefix: text('folder_prefix').notNull(),
  variants: jsonb('variants').notNull().$type<Record<string, { width: number; height: number; folder: string }>>(),
  created_at: tstz('created_at').notNull().defaultNow(),
  updated_at: tstz('updated_at').notNull().defaultNow(),
})

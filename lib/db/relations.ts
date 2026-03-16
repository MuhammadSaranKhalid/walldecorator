import { relations } from 'drizzle-orm'
import {
  categories,
  custom_orders,
  discount_codes,
  discount_usages,
  email_logs,
  images,
  inventory,
  inventory_transactions,
  material_attribute_relationships,
  order_items,
  order_status_history,
  orders,
  payments,
  product_attribute_values,
  product_attributes,
  product_images,
  product_variants,
  products,
  refunds,
  review_images,
  reviews,
} from './schema'

// ─── categories ──────────────────────────────────────────────────────────────

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  // Self-referential: parent category
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
    relationName: 'categoryHierarchy',
  }),
  // Self-referential: child categories (Prisma used "other_categories" name)
  other_categories: many(categories, { relationName: 'categoryHierarchy' }),
  // FK to images
  images: one(images, {
    fields: [categories.image_id],
    references: [images.id],
  }),
  products: many(products),
}))

// ─── custom_orders ───────────────────────────────────────────────────────────

export const customOrdersRelations = relations(custom_orders, ({ one }) => ({
  images: one(images, {
    fields: [custom_orders.image_id],
    references: [images.id],
  }),
  orders: one(orders, {
    fields: [custom_orders.order_id],
    references: [orders.id],
  }),
}))

// ─── discount_codes ──────────────────────────────────────────────────────────

export const discountCodesRelations = relations(discount_codes, ({ many }) => ({
  discount_usages: many(discount_usages),
}))

// ─── discount_usages ─────────────────────────────────────────────────────────

export const discountUsagesRelations = relations(discount_usages, ({ one }) => ({
  discount_codes: one(discount_codes, {
    fields: [discount_usages.discount_code_id],
    references: [discount_codes.id],
  }),
  orders: one(orders, {
    fields: [discount_usages.order_id],
    references: [orders.id],
  }),
}))

// ─── email_logs ──────────────────────────────────────────────────────────────

export const emailLogsRelations = relations(email_logs, ({ one }) => ({
  orders: one(orders, {
    fields: [email_logs.order_id],
    references: [orders.id],
  }),
}))

// ─── images ──────────────────────────────────────────────────────────────────

export const imagesRelations = relations(images, ({ many }) => ({
  categories: many(categories),
  custom_orders: many(custom_orders),
  product_images: many(product_images),
  review_images: many(review_images),
}))

// ─── inventory ───────────────────────────────────────────────────────────────

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product_variants: one(product_variants, {
    fields: [inventory.variant_id],
    references: [product_variants.id],
  }),
}))

// ─── inventory_transactions ──────────────────────────────────────────────────

export const inventoryTransactionsRelations = relations(inventory_transactions, ({ one }) => ({
  product_variants: one(product_variants, {
    fields: [inventory_transactions.variant_id],
    references: [product_variants.id],
  }),
}))

// ─── material_attribute_relationships ────────────────────────────────────────

export const materialAttributeRelationshipsRelations = relations(
  material_attribute_relationships,
  ({ one }) => ({
    material: one(product_attribute_values, {
      fields: [material_attribute_relationships.material_id],
      references: [product_attribute_values.id],
      relationName: 'materialAttrRel',
    }),
    attribute_value: one(product_attribute_values, {
      fields: [material_attribute_relationships.attribute_value_id],
      references: [product_attribute_values.id],
      relationName: 'attrValueRel',
    }),
  })
)

// ─── order_items ─────────────────────────────────────────────────────────────

export const orderItemsRelations = relations(order_items, ({ one }) => ({
  orders: one(orders, {
    fields: [order_items.order_id],
    references: [orders.id],
  }),
  product_variants: one(product_variants, {
    fields: [order_items.variant_id],
    references: [product_variants.id],
  }),
}))

// ─── order_status_history ────────────────────────────────────────────────────

export const orderStatusHistoryRelations = relations(order_status_history, ({ one }) => ({
  orders: one(orders, {
    fields: [order_status_history.order_id],
    references: [orders.id],
  }),
}))

// ─── orders ──────────────────────────────────────────────────────────────────

export const ordersRelations = relations(orders, ({ many }) => ({
  custom_orders: many(custom_orders),
  discount_usages: many(discount_usages),
  email_logs: many(email_logs),
  order_items: many(order_items),
  order_status_history: many(order_status_history),
  payments: many(payments),
  refunds: many(refunds),
  reviews: many(reviews),
}))

// ─── payments ────────────────────────────────────────────────────────────────

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  orders: one(orders, {
    fields: [payments.order_id],
    references: [orders.id],
  }),
  refunds: many(refunds),
}))

// ─── product_attribute_values ────────────────────────────────────────────────

export const productAttributeValuesRelations = relations(
  product_attribute_values,
  ({ one, many }) => ({
    product_attributes: one(product_attributes, {
      fields: [product_attribute_values.attribute_id],
      references: [product_attributes.id],
    }),
    // Variants that use this value as material
    material_variants: many(product_variants, { relationName: 'materialAttr' }),
    // Variants that use this value as size
    size_variants: many(product_variants, { relationName: 'sizeAttr' }),
    // Variants that use this value as thickness
    thickness_variants: many(product_variants, { relationName: 'thicknessAttr' }),
    material_relationships: many(material_attribute_relationships, {
      relationName: 'materialAttrRel',
    }),
    attribute_value_relationships: many(material_attribute_relationships, {
      relationName: 'attrValueRel',
    }),
  })
)

// ─── product_attributes ──────────────────────────────────────────────────────

export const productAttributesRelations = relations(product_attributes, ({ many }) => ({
  product_attribute_values: many(product_attribute_values),
}))

// ─── product_images ──────────────────────────────────────────────────────────

export const productImagesRelations = relations(product_images, ({ one }) => ({
  products: one(products, {
    fields: [product_images.product_id],
    references: [products.id],
  }),
  images: one(images, {
    fields: [product_images.image_id],
    references: [images.id],
  }),
  product_variants: one(product_variants, {
    fields: [product_images.variant_id],
    references: [product_variants.id],
  }),
}))

// ─── product_variants ────────────────────────────────────────────────────────

export const productVariantsRelations = relations(product_variants, ({ one, many }) => ({
  products: one(products, {
    fields: [product_variants.product_id],
    references: [products.id],
  }),
  // Named relations for the three attribute FKs (material, size, thickness)
  material_attr: one(product_attribute_values, {
    fields: [product_variants.material_id],
    references: [product_attribute_values.id],
    relationName: 'materialAttr',
  }),
  size_attr: one(product_attribute_values, {
    fields: [product_variants.size_id],
    references: [product_attribute_values.id],
    relationName: 'sizeAttr',
  }),
  thickness_attr: one(product_attribute_values, {
    fields: [product_variants.thickness_id],
    references: [product_attribute_values.id],
    relationName: 'thicknessAttr',
  }),
  inventory: one(inventory, {
    fields: [product_variants.id],
    references: [inventory.variant_id],
  }),
  product_images: many(product_images),
  order_items: many(order_items),
  inventory_transactions: many(inventory_transactions),
}))

// ─── products ────────────────────────────────────────────────────────────────

export const productsRelations = relations(products, ({ one, many }) => ({
  categories: one(categories, {
    fields: [products.category_id],
    references: [categories.id],
  }),
  product_images: many(product_images),
  product_variants: many(product_variants),
  reviews: many(reviews),
}))

// ─── refunds ─────────────────────────────────────────────────────────────────

export const refundsRelations = relations(refunds, ({ one }) => ({
  orders: one(orders, {
    fields: [refunds.order_id],
    references: [orders.id],
  }),
  payments: one(payments, {
    fields: [refunds.payment_id],
    references: [payments.id],
  }),
}))

// ─── review_images ───────────────────────────────────────────────────────────

export const reviewImagesRelations = relations(review_images, ({ one }) => ({
  reviews: one(reviews, {
    fields: [review_images.review_id],
    references: [reviews.id],
  }),
  images: one(images, {
    fields: [review_images.image_id],
    references: [images.id],
  }),
}))

// ─── reviews ─────────────────────────────────────────────────────────────────

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  products: one(products, {
    fields: [reviews.product_id],
    references: [products.id],
  }),
  orders: one(orders, {
    fields: [reviews.order_id],
    references: [orders.id],
  }),
  review_images: many(review_images),
}))

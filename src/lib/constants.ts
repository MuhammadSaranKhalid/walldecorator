// =============================================================================
// NOTE: Materials are now stored in the database!
// Fetch materials from the 'materials' table using Supabase.
// This allows admins to add/edit materials without code changes.
// =============================================================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export const CUSTOMIZATION_STATUS = {
  PENDING: 'pending',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  IN_PRODUCTION: 'in_production',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
  DRAFT: 'draft',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type CustomizationStatus = typeof CUSTOMIZATION_STATUS[keyof typeof CUSTOMIZATION_STATUS];
export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS];


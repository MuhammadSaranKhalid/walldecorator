-- =============================================================================
-- MIGRATION: Allow Guest Checkout
-- This migration makes customer_id nullable in addresses and orders tables
-- to support guest checkout functionality
-- =============================================================================

-- Modify addresses table to allow null customer_id for guest checkout
ALTER TABLE addresses
  ALTER COLUMN customer_id DROP NOT NULL;

-- Modify orders table to allow null customer_id for guest checkout
ALTER TABLE orders
  ALTER COLUMN customer_id DROP NOT NULL;

-- Update the comment to reflect the change
COMMENT ON COLUMN addresses.customer_id IS 'Customer ID - can be null for guest checkout';
COMMENT ON COLUMN orders.customer_id IS 'Customer ID - can be null for guest checkout';

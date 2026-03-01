import { z } from 'zod'

/**
 * Checkout form validation schemas
 */

// Pakistan phone number regex
// Accepts: 03001234567, +923001234567, 00923001234567
const pakistanPhoneRegex = /^(03\d{9}|(\+92|0092)3\d{9})$/

// Address validation schema
const addressSchema = z.object({
  line1: z
    .string()
    .min(5, 'Address is too short')
    .max(200, 'Address is too long'),
  line2: z.string().max(200, 'Address is too long').optional(),
  city: z.string().min(2, 'City is required').max(100, 'City name is too long'),
  province: z.string().min(2, 'Province is required').max(100),
  postalCode: z
    .string()
    .regex(/^\d{5}$/, 'Postal code must be 5 digits')
    .length(5, 'Postal code must be 5 digits'),
})

// Main checkout form schema
export const checkoutSchema = z
  .object({
    // Contact Information
    email: z.string().email('Please enter a valid email address'),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long'),
    phone: z
      .string()
      .regex(
        pakistanPhoneRegex,
        'Please enter a valid Pakistan phone number (e.g., 03001234567 or +923001234567)'
      ),

    // Shipping Address
    shipping: addressSchema,

    // Billing Address (conditional)
    useSameAddress: z.boolean(),
    billing: addressSchema.optional(),

    // Optional notes
    orderNotes: z.string().max(500, 'Notes are too long').optional(),
  })
  .refine(
    (data) => {
      // If useSameAddress is false, billing address must be provided
      if (!data.useSameAddress && !data.billing) {
        return false
      }
      return true
    },
    {
      message: 'Billing address is required when different from shipping',
      path: ['billing'],
    }
  )

// Type inference
export type CheckoutFormData = z.infer<typeof checkoutSchema>
export type AddressData = z.infer<typeof addressSchema>

// Export address schema for standalone use
export { addressSchema }

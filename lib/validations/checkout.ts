import { z } from 'zod'
import { isValidPhoneNumber } from 'libphonenumber-js/min'

// Address validation schema
const addressSchema = z.object({
  line1: z
    .string()
    .min(5, 'Address is too short')
    .max(200, 'Address is too long'),
  line2: z.string().max(200, 'Address is too long').optional(),
  city: z.string().min(2, 'City is required').max(100, 'City name is too long'),
  // ISO-3166-1 alpha-2 country code (e.g. "PK", "US", "GB").
  country: z
    .string()
    .min(2, 'Country is required')
    .max(2, 'Country must be a 2-letter code'),
  // Optional: many countries don't use postal codes, and formats vary widely
  // (alphanumeric in UK/CA/NL, 7 digits in JP, etc.). We accept any short
  // string and let the carrier validate downstream.
  postalCode: z
    .string()
    .max(20, 'Postal code is too long')
    .optional()
    .or(z.literal('')),
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
    // Required for COD — the courier needs to reach the customer before delivery.
    phone: z
      .string()
      .min(1, 'Phone number is required for delivery contact')
      .refine(
        (v) => isValidPhoneNumber(v),
        'Please enter a valid phone number for the selected country'
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

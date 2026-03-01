import { z } from 'zod'

// ─── Custom Order Form Schema ─────────────────────────────────────────────────

export const CustomOrderSchema = z.object({
    customer_name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name is too long'),

    customer_email: z.string().email('Please enter a valid email address'),

    customer_phone: z
        .string()
        .optional()
        .or(z.literal('')),

    description: z
        .string()
        .max(1000, 'Description is too long')
        .optional()
        .or(z.literal('')),

    preferred_material: z.string().optional().or(z.literal('')),
    preferred_size: z.string().optional().or(z.literal('')),
    preferred_thickness: z.string().optional().or(z.literal('')),
})

export type CustomOrderFormData = z.infer<typeof CustomOrderSchema>

'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { CustomOrderSchema, type CustomOrderFormData } from '@/lib/validations/customize'

// ─── Direct client upload is used for images to bypass 1MB server limit ────

// ─── Submit Custom Order ─────────────────────────────────────────────────────

/**
 * Insert a new custom order request into the custom_orders table.
 * Called after the image has been successfully uploaded.
 */
export async function submitCustomOrder(
    data: CustomOrderFormData & { image_url: string }
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        // Validate incoming data
        const parsed = CustomOrderSchema.safeParse(data)
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message ?? 'Invalid form data.'
            return { success: false, error: firstError }
        }

        if (!data.image_url) {
            return { success: false, error: 'Image is required.' }
        }

        const supabase = getAdminClient()

        const { error } = await supabase.from('custom_orders').insert({
            customer_name: data.customer_name.trim(),
            customer_email: data.customer_email.trim().toLowerCase(),
            customer_phone: data.customer_phone?.trim() || null,
            image_url: data.image_url,
            description: data.description?.trim() || null,
            preferred_material: data.preferred_material || null,
            preferred_size: data.preferred_size || null,
            preferred_thickness: data.preferred_thickness || null,
            status: 'pending',
        })

        if (error) {
            console.error('Custom order insert error:', error)
            return { success: false, error: 'Failed to submit your request. Please try again.' }
        }

        return { success: true }
    } catch (err) {
        console.error('Unexpected custom order error:', err)
        return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
}

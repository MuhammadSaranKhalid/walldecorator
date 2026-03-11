'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { CustomOrderSchema, type CustomOrderFormData } from '@/lib/validations/customize'

// ─── Direct client upload is used for images to bypass 1MB server limit ────

// ─── Submit Custom Order ─────────────────────────────────────────────────────

/**
 * Insert a new custom order request with centralized image architecture.
 * Flow:
 * 1. Create custom_order record first
 * 2. Create image record in centralized images table
 * 3. Link image to custom_order via image_id FK
 */
export async function submitCustomOrder(
    data: CustomOrderFormData & { storagePath: string }
): Promise<{ success: true } | { success: false; error: string }> {
    try {
        // Validate incoming data
        const parsed = CustomOrderSchema.safeParse(data)
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message ?? 'Invalid form data.'
            return { success: false, error: firstError }
        }

        if (!data.storagePath) {
            return { success: false, error: 'Image is required.' }
        }

        const supabase = getAdminClient()

        // Step 1: Create custom_order record (without image_id first)
        const { data: orderData, error: orderError } = await supabase
            .from('custom_orders')
            .insert({
                customer_name: data.customer_name.trim(),
                customer_email: data.customer_email.trim().toLowerCase(),
                customer_phone: data.customer_phone?.trim() || null,
                description: data.description?.trim() || null,
                preferred_material: data.preferred_material || null,
                preferred_size: data.preferred_size || null,
                preferred_thickness: data.preferred_thickness || null,
                status: 'pending',
            })
            .select('id')
            .single()

        if (orderError || !orderData) {
            console.error('Custom order insert error:', orderError)
            return { success: false, error: 'Failed to submit your request. Please try again.' }
        }

        const customOrderId = orderData.id

        // Step 2: Create image record in centralized images table
        const { data: imageData, error: imageError } = await supabase
            .from('images')
            .insert({
                entity_type: 'custom_order',
                entity_id: customOrderId,
                storage_path: data.storagePath,
                processing_status: 'pending', // Will trigger variant generation
            })
            .select('id')
            .single()

        if (imageError || !imageData) {
            console.error('Image insert error:', imageError)
            // Rollback: delete custom_order
            await supabase.from('custom_orders').delete().eq('id', customOrderId)
            return { success: false, error: 'Failed to process your image. Please try again.' }
        }

        // Step 3: Link image to custom_order via image_id FK
        const { error: updateError } = await supabase
            .from('custom_orders')
            .update({ image_id: imageData.id })
            .eq('id', customOrderId)

        if (updateError) {
            console.error('Custom order update error:', updateError)
            return { success: false, error: 'Failed to link image. Please try again.' }
        }

        // Image processing webhook will automatically fire and create variants
        return { success: true }
    } catch (err) {
        console.error('Unexpected custom order error:', err)
        return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
}

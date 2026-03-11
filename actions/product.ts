"use server";

import { z } from "zod";
import { getAdminClient } from "@/lib/supabase/admin";

// Zod schema for UUID validation (React 19 + Vercel best practice)
const productIdSchema = z.string().uuid({ message: "Invalid product ID format" });

/**
 * Increment product view count
 * Called from client component when product page loads
 *
 * Best practices applied:
 * - Input validation with Zod (UUID format)
 * - Proper error handling
 * - No authentication required (analytics endpoint)
 */
export async function incrementProductViewCount(productId: string) {
  // Validate input
  const validation = productIdSchema.safeParse(productId);

  if (!validation.success) {
    return {
      success: false,
      error: "Invalid product ID",
    };
  }

  try {
    const supabase = getAdminClient();

    // Increment view count atomically using RPC
    const { error } = await supabase.rpc("increment_product_view_count", {
      p_product_id: validation.data,
    });

    if (error) {
      console.error("Error incrementing view count:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("View count error:", error);
    return { success: false, error: "Internal server error" };
  }
}

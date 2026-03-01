"use server";

import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Increment product view count
 * Called from client component when product page loads
 */
export async function incrementProductViewCount(productId: string) {
  try {
    const supabase = getAdminClient();

    // Increment view count atomically using RPC
    const { error } = await supabase.rpc("increment_product_view_count", {
      p_product_id: productId,
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

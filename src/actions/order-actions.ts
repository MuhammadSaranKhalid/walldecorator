"use server";

import { createSupabaseServerClient } from "@/utils/supabase/server";

export interface OrderDetails {
    id: string;
    order_number: string;
    status: string;
    total: number;
    created_at: string;
    shipping_method: string | null;
    tracking_number: string | null;
    shipped_at: string | null;
    delivered_at: string | null;
    shipping_address: {
        first_name: string;
        last_name: string;
        address_line1: string;
        address_line2: string | null;
        city: string;
        state: string | null;
        postal_code: string;
        country: string;
    } | null;
    order_items: {
        id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        product: {
            slug: string;
            product_images: {
                thumbnail_url: string | null;
                original_url: string;
                alt_text: string | null;
            }[];
        } | null;
    }[];
}

export async function getOrderByNumber(orderNumber: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
        .from("orders")
        .select(`
      *,
      shipping_address:addresses!orders_shipping_address_id_fkey(*),
      order_items (
        *,
        product:products (
          slug,
          product_images (
            thumbnail_url,
            original_url,
            alt_text
          )
        )
      )
    `)
        .eq("order_number", orderNumber)
        .single();

    if (error) {
        console.error("Error fetching order:", error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as unknown as OrderDetails };
}

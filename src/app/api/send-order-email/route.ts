import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmationEmail } from "@/actions/email-actions";
import { format } from "date-fns";

// Admin client — uses service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OrderRecord {
  id: string;
  order_number: string;
  customer_email: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  shipping_address_id: string;
  created_at: string;
}

export async function POST(req: NextRequest) {
  // Validate Bearer token — must match the Supabase service role key
  // (the DB trigger sends this from vault secret 'service_role_key')
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[send-order-email] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let record: OrderRecord;
  try {
    const body = await req.json();
    record = body.record;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!record?.id) {
    return NextResponse.json({ error: "Missing order record" }, { status: 400 });
  }

  console.log("[send-order-email] Processing order:", record.order_number);

  // Fetch order items + product primary image
  const { data: rawItems, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select(`
      product_name,
      material_name,
      quantity,
      unit_price,
      total_price,
      products ( primary_image_url )
    `)
    .eq("order_id", record.id);

  if (itemsError) {
    console.error("[send-order-email] Failed to fetch order items:", itemsError);
    return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 });
  }

  const items = (rawItems ?? []).map((row) => ({
    name: row.product_name as string,
    material: row.material_name as string,
    quantity: row.quantity as number,
    unitPrice: row.unit_price as number,
    totalPrice: row.total_price as number,
    imageUrl: (row.products as { primary_image_url?: string } | null)?.primary_image_url,
  }));

  // Fetch shipping address
  const { data: address, error: addressError } = await supabaseAdmin
    .from("addresses")
    .select("first_name, last_name, address_line1, address_line2, city, state, postal_code, country")
    .eq("id", record.shipping_address_id)
    .single();

  if (addressError || !address) {
    console.error("[send-order-email] Failed to fetch shipping address:", addressError);
    return NextResponse.json({ error: "Failed to fetch shipping address" }, { status: 500 });
  }

  const result = await sendOrderConfirmationEmail({
    orderNumber: record.order_number,
    customerEmail: record.customer_email,
    customerName: `${address.first_name} ${address.last_name}`,
    orderDate: format(new Date(record.created_at), "MMMM d, yyyy"),
    items,
    subtotal: record.subtotal,
    shippingCost: record.shipping_cost,
    taxAmount: record.tax_amount,
    total: record.total,
    shippingAddress: {
      firstName: address.first_name,
      lastName: address.last_name,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postalCode: address.postal_code,
      country: address.country,
    },
    trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/track-order`,
  });

  if (!result.success) {
    console.error("[send-order-email] Email send failed:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  console.log("[send-order-email] Email sent successfully, id:", result.emailId);
  return NextResponse.json({ success: true, emailId: result.emailId });
}

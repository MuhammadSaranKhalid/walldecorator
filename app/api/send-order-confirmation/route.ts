import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import OrderConfirmationEmail from "@/emails/order-confirmation";
import { getAdminClient } from "@/lib/supabase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

interface WebhookPayload {
  type: "INSERT" | "UPDATE";
  table: string;
  record: {
    id: string;
    order_number: string;
    status: string;
    customer_email: string;
    customer_name: string;
    shipping_address: {
      firstName: string;
      lastName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    subtotal: number;
    shipping_cost: number;
    tax_amount: number;
    total_amount: number;
    created_at: string;
  };
  old_record?: {
    status: string;
  };
}

interface OrderItem {
  product_name: string;
  variant_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get("authorization");
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;

    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload: WebhookPayload = await request.json();

    // Only send email when order status changes to 'confirmed'
    if (
      payload.type !== "UPDATE" ||
      payload.record.status !== "confirmed" ||
      payload.old_record?.status === "confirmed"
    ) {
      return NextResponse.json({ message: "No email needed" }, { status: 200 });
    }

    const order = payload.record;

    // Fetch order items from database (using admin client to bypass RLS)
    const supabase = getAdminClient();
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        product_name,
        variant_description,
        quantity,
        unit_price,
        total_price
      `)
      .eq("order_id", order.id);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    // Format items for email
    const emailItems = (orderItems as OrderItem[]).map((item) => ({
      name: item.product_name,
      material: item.variant_description || "Standard",
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.total_price),
    }));

    // Format date
    const orderDate = new Date(order.created_at).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Render email HTML
    const emailHtml = await render(
      OrderConfirmationEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        orderDate,
        items: emailItems,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shipping_cost),
        taxAmount: Number(order.tax_amount),
        total: Number(order.total_amount),
        shippingAddress: order.shipping_address,
        trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/orders/track?order=${order.order_number}`,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "WallDecorator <orders@walldecorator.pk>",
      to: order.customer_email,
      subject: `Order Confirmed - ${order.order_number}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    console.log(`Order confirmation email sent for ${order.order_number}`, data);

    return NextResponse.json({
      success: true,
      message: `Email sent to ${order.customer_email}`,
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

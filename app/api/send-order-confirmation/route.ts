import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import OrderConfirmationEmail from "@/emails/order-confirmation";
import { getAdminClient } from "@/lib/supabase/admin";
import { getStorageUrl } from "@/lib/supabase/storage";
import { getRates } from "@/lib/rates";
import type { CurrencyCode } from "@/lib/currency";

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

interface OrderItemWithImage {
  product_name: string;
  variant_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_variants?: Array<{
    products?: Array<{
      product_images?: Array<{
        display_order: number;
        is_primary: boolean;
        images?: Array<{ storage_path: string; medium_path: string | null }>;
      }>;
    }>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
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

    // The trigger payload doesn't include display_currency — re-query it
    // (and live rates) so the email renders in the buyer's chosen currency.
    const supabase = getAdminClient();
    const { data: orderMeta } = await supabase
      .from("orders")
      .select("display_currency")
      .eq("id", order.id)
      .maybeSingle();
    const displayCurrency = ((orderMeta?.display_currency as string | null) ?? "PKR") as CurrencyCode;
    const { rates } = await getRates().catch(() => ({ rates: undefined }));

    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select(`
        product_name,
        variant_description,
        quantity,
        unit_price,
        total_price,
        product_variants (
          products (
            product_images (
              display_order,
              is_primary,
              images (
                storage_path,
                medium_path
              )
            )
          )
        )
      `)
      .eq("order_id", order.id);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch order items" },
        { status: 500 }
      );
    }

    // Format items for email with product images
    const emailItems = (orderItems as unknown as OrderItemWithImage[]).map((item) => {
      // Get the primary image (lowest display_order)
      const productImages = item.product_variants?.[0]?.products?.[0]?.product_images ?? [];
      const primaryImage =
        productImages.find((pi) => pi.is_primary) ??
        productImages.slice().sort((a, b) => a.display_order - b.display_order)[0];
      const img = primaryImage?.images?.[0];
      const imagePath = img?.medium_path ?? img?.storage_path;

      return {
        name: item.product_name,
        material: item.variant_description || "Standard",
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        totalPrice: Number(item.total_price),
        imageUrl: imagePath ? getStorageUrl(imagePath, 'product-images') : undefined,
      };
    });

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
        trackingUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/track-order?order=${order.order_number}&email=${encodeURIComponent(order.customer_email)}`,
        currency: displayCurrency,
        rates,
      })
    );

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Wall Decorator <orders@walldecorator.store>",
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

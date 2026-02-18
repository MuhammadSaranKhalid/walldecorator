"use server";

import { Resend } from "resend";
import { OrderConfirmationEmail } from "@/emails/order-confirmation";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

interface OrderItem {
    name: string;
    material: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl?: string;
}

interface ShippingAddress {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

interface OrderEmailData {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    orderDate: string;
    items: OrderItem[];
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    total: number;
    shippingAddress: ShippingAddress;
    trackingUrl?: string;
}

export async function sendOrderConfirmationEmail(orderData: OrderEmailData) {
    try {
        const { data, error } = await resend.emails.send({
            from: `WallDecorator <${FROM_EMAIL}>`,
            to: [orderData.customerEmail],
            subject: `Order Confirmation - ${orderData.orderNumber}`,
            react: OrderConfirmationEmail({
                orderNumber: orderData.orderNumber,
                customerName: orderData.customerName,
                orderDate: orderData.orderDate,
                items: orderData.items,
                subtotal: orderData.subtotal,
                shippingCost: orderData.shippingCost,
                taxAmount: orderData.taxAmount,
                total: orderData.total,
                shippingAddress: orderData.shippingAddress,
                trackingUrl: orderData.trackingUrl,
            }),
        });

        if (error) {
            console.error("Failed to send order confirmation email:", error);
            return { success: false, error: error.message };
        }

        console.log("Order confirmation email sent successfully:", data?.id);
        return { success: true, emailId: data?.id };
    } catch (error) {
        console.error("Error sending email:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function sendOrderShippedEmail(orderData: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    shippedDate: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    items: { name: string; quantity: number }[];
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: `WallDecorator <${FROM_EMAIL}>`,
            to: [orderData.customerEmail],
            subject: `Your Order ${orderData.orderNumber} Has Shipped!`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#FAFAF7;font-family:'Manrope',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#FFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <div style="background:#1A1A1A;padding:36px 40px 28px;text-align:center;">
    <div style="color:#C8982F;font-size:28px;font-weight:800;letter-spacing:-0.5px;margin:0;">WallDecorator</div>
    <div style="color:#999;font-size:12px;font-weight:500;letter-spacing:2px;text-transform:uppercase;margin-top:8px;">Art That Defines Your Space</div>
  </div>
  <div style="padding:36px 40px 24px;text-align:center;">
    <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background:#F5EFE0;color:#C8982F;font-size:24px;font-weight:bold;margin:0 auto 16px;">📦</div>
    <h2 style="color:#1A1A1A;font-size:26px;font-weight:800;margin:0 0 12px;">Your Order Has Shipped!</h2>
    <p style="color:#737373;font-size:15px;line-height:24px;margin:0;">
      Hi ${orderData.customerName}, great news! Your order <strong>${orderData.orderNumber}</strong> is on its way.
    </p>
  </div>
  <div style="margin:0 40px;padding:20px 24px;background:#F5EFE0;border-radius:10px;border:1px solid #E8E0D0;">
    ${orderData.trackingNumber ? `<p style="color:#737373;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Tracking Number</p><p style="color:#1A1A1A;font-size:15px;font-weight:700;margin:0 0 12px;">${orderData.trackingNumber}</p>` : ""}
    ${orderData.estimatedDelivery ? `<p style="color:#737373;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Estimated Delivery</p><p style="color:#1A1A1A;font-size:15px;font-weight:700;margin:0;">${orderData.estimatedDelivery}</p>` : ""}
  </div>
  <div style="padding:28px 40px 12px;">
    <h3 style="color:#1A1A1A;font-size:16px;font-weight:800;margin:0 0 16px;">Shipped Items</h3>
    ${orderData.items.map((item) => `
      <div style="padding:10px 0;border-bottom:1px solid #F0F0F0;">
        <span style="color:#1A1A1A;font-size:14px;font-weight:600;">${item.name}</span>
        <span style="color:#737373;font-size:13px;"> × ${item.quantity}</span>
      </div>
    `).join("")}
  </div>
  <div style="padding:8px 40px 32px;text-align:center;">
    <hr style="border-color:#E8E0D0;margin:0 0 24px;">
    <div style="color:#C8982F;font-size:18px;font-weight:800;margin:0 0 12px;">WallDecorator</div>
    <p style="color:#737373;font-size:12px;margin:0 0 8px;">Thank you for shopping with us!</p>
    <p style="color:#A0A0A0;font-size:11px;margin:12px 0 0;">© ${new Date().getFullYear()} WallDecorator. All rights reserved.</p>
  </div>
</div>
</body>
</html>
      `,
        });

        if (error) {
            console.error("Failed to send shipped email:", error);
            return { success: false, error: error.message };
        }

        return { success: true, emailId: data?.id };
    } catch (error) {
        console.error("Error sending shipped email:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

export async function sendOrderDeliveredEmail(orderData: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    deliveredDate: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: `WallDecorator <${FROM_EMAIL}>`,
            to: [orderData.customerEmail],
            subject: `Your Order ${orderData.orderNumber} Has Been Delivered`,
            html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#FAFAF7;font-family:'Manrope',Arial,sans-serif;">
<div style="max-width:600px;margin:40px auto;background:#FFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <div style="background:#1A1A1A;padding:36px 40px 28px;text-align:center;">
    <div style="color:#C8982F;font-size:28px;font-weight:800;letter-spacing:-0.5px;margin:0;">WallDecorator</div>
    <div style="color:#999;font-size:12px;font-weight:500;letter-spacing:2px;text-transform:uppercase;margin-top:8px;">Art That Defines Your Space</div>
  </div>
  <div style="padding:36px 40px 24px;text-align:center;">
    <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background:#F5EFE0;color:#C8982F;font-size:24px;font-weight:bold;margin:0 auto 16px;">🎉</div>
    <h2 style="color:#1A1A1A;font-size:26px;font-weight:800;margin:0 0 12px;">Order Delivered!</h2>
    <p style="color:#737373;font-size:15px;line-height:24px;margin:0;">
      Hi ${orderData.customerName}, your order <strong>${orderData.orderNumber}</strong> has been delivered!
    </p>
  </div>
  <div style="margin:0 40px;padding:20px 24px;background:#F5EFE0;border-radius:10px;border:1px solid #E8E0D0;">
    <p style="color:#737373;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Delivery Date</p>
    <p style="color:#1A1A1A;font-size:15px;font-weight:700;margin:0;">${orderData.deliveredDate}</p>
  </div>
  <div style="padding:28px 40px;text-align:center;">
    <p style="color:#333;font-size:15px;line-height:24px;margin:0 0 24px;">
      We hope you love your new wall decor! If you have any questions or concerns, please don&apos;t hesitate to contact us.
    </p>
    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/products" style="background:#C8982F;border-radius:8px;color:#FFF;font-size:15px;font-weight:700;text-decoration:none;display:inline-block;padding:14px 36px;">
      Shop More
    </a>
  </div>
  <div style="padding:8px 40px 32px;text-align:center;">
    <hr style="border-color:#E8E0D0;margin:0 0 24px;">
    <div style="color:#C8982F;font-size:18px;font-weight:800;margin:0 0 12px;">WallDecorator</div>
    <p style="color:#737373;font-size:12px;margin:0 0 8px;">Thank you for shopping with us!</p>
    <p style="color:#A0A0A0;font-size:11px;margin:12px 0 0;">© ${new Date().getFullYear()} WallDecorator. All rights reserved.</p>
  </div>
</div>
</body>
</html>
      `,
        });

        if (error) {
            console.error("Failed to send delivered email:", error);
            return { success: false, error: error.message };
        }

        return { success: true, emailId: data?.id };
    } catch (error) {
        console.error("Error sending delivered email:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}


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
        // For now, we'll send a simple text email
        // You can create a dedicated shipped email template later
        const { data, error } = await resend.emails.send({
            from: `WallDecorator <${FROM_EMAIL}>`,
            to: [orderData.customerEmail],
            subject: `Your Order ${orderData.orderNumber} Has Shipped!`,
            html: `
        <h2>Hi ${orderData.customerName},</h2>
        <p>Great news! Your order <strong>${orderData.orderNumber}</strong> has shipped.</p>
        ${orderData.trackingNumber
                    ? `<p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>`
                    : ""
                }
        ${orderData.estimatedDelivery
                    ? `<p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>`
                    : ""
                }
        <h3>Shipped Items:</h3>
        <ul>
          ${orderData.items.map((item) => `<li>${item.name} (Qty: ${item.quantity})</li>`).join("")}
        </ul>
        <p>Thank you for shopping with WallDecorator!</p>
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
        <h2>Hi ${orderData.customerName},</h2>
        <p>Your order <strong>${orderData.orderNumber}</strong> has been delivered!</p>
        <p><strong>Delivery Date:</strong> ${orderData.deliveredDate}</p>
        <p>We hope you love your new wall decor! If you have any questions or concerns, please don't hesitate to contact us.</p>
        <p>Thank you for shopping with WallDecorator!</p>
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

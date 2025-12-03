import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Row,
    Column,
} from "@react-email/components";
import * as React from "react";

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

interface OrderConfirmationEmailProps {
    orderNumber: string;
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

export const OrderConfirmationEmail = ({
    orderNumber = "ORD-123456",
    customerName = "John Doe",
    orderDate = "December 3, 2024",
    items = [
        {
            name: "Modern Abstract Wall Art",
            material: "Canvas",
            quantity: 2,
            unitPrice: 89.99,
            totalPrice: 179.98,
            imageUrl: "https://placehold.co/80x80",
        },
    ],
    subtotal = 179.98,
    shippingCost = 10.0,
    taxAmount = 19.0,
    total = 208.98,
    shippingAddress = {
        firstName: "John",
        lastName: "Doe",
        addressLine1: "123 Art Street",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "US",
    },
    trackingUrl,
}: OrderConfirmationEmailProps) => {
    const previewText = `Order ${orderNumber} confirmed - Thank you for your purchase!`;

    return (
        <Html>
            <Head />
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Heading style={h1}>WallDecorator</Heading>
                    </Section>

                    {/* Success Message */}
                    <Section style={messageSection}>
                        <Heading style={h2}>Order Confirmed!</Heading>
                        <Text style={text}>
                            Hi {customerName}, thank you for your order. We&apos;ve received your
                            order and will send you another email when it ships.
                        </Text>
                    </Section>

                    {/* Order Details */}
                    <Section style={orderInfoSection}>
                        <Row>
                            <Column>
                                <Text style={orderLabel}>Order Number</Text>
                                <Text style={orderValue}>{orderNumber}</Text>
                            </Column>
                            <Column align="right">
                                <Text style={orderLabel}>Order Date</Text>
                                <Text style={orderValue}>{orderDate}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={hr} />

                    {/* Order Items */}
                    <Section>
                        <Heading style={h3}>Order Items</Heading>
                        {items.map((item, index) => (
                            <Section key={index} style={itemSection}>
                                <Row>
                                    <Column style={itemImageColumn}>
                                        {item.imageUrl && (
                                            <Img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                width="80"
                                                height="80"
                                                style={itemImage}
                                            />
                                        )}
                                    </Column>
                                    <Column style={itemDetailsColumn}>
                                        <Text style={itemName}>{item.name}</Text>
                                        <Text style={itemMaterial}>Material: {item.material}</Text>
                                        <Text style={itemQuantity}>Quantity: {item.quantity}</Text>
                                    </Column>
                                    <Column align="right" style={itemPriceColumn}>
                                        <Text style={itemPrice}>
                                            ${item.totalPrice.toFixed(2)}
                                        </Text>
                                    </Column>
                                </Row>
                            </Section>
                        ))}
                    </Section>

                    <Hr style={hr} />

                    {/* Order Summary */}
                    <Section style={summarySection}>
                        <Row>
                            <Column>
                                <Text style={summaryLabel}>Subtotal</Text>
                            </Column>
                            <Column align="right">
                                <Text style={summaryValue}>${subtotal.toFixed(2)}</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={summaryLabel}>Shipping</Text>
                            </Column>
                            <Column align="right">
                                <Text style={summaryValue}>${shippingCost.toFixed(2)}</Text>
                            </Column>
                        </Row>
                        <Row>
                            <Column>
                                <Text style={summaryLabel}>Tax</Text>
                            </Column>
                            <Column align="right">
                                <Text style={summaryValue}>${taxAmount.toFixed(2)}</Text>
                            </Column>
                        </Row>
                        <Row style={totalRow}>
                            <Column>
                                <Text style={totalLabel}>Total</Text>
                            </Column>
                            <Column align="right">
                                <Text style={totalValue}>${total.toFixed(2)}</Text>
                            </Column>
                        </Row>
                    </Section>

                    <Hr style={hr} />

                    {/* Shipping Address */}
                    <Section>
                        <Heading style={h3}>Shipping Address</Heading>
                        <Text style={address}>
                            {shippingAddress.firstName} {shippingAddress.lastName}
                            <br />
                            {shippingAddress.addressLine1}
                            <br />
                            {shippingAddress.addressLine2 && (
                                <>
                                    {shippingAddress.addressLine2}
                                    <br />
                                </>
                            )}
                            {shippingAddress.city}, {shippingAddress.state}{" "}
                            {shippingAddress.postalCode}
                            <br />
                            {shippingAddress.country}
                        </Text>
                    </Section>

                    <Hr style={hr} />

                    {/* Track Order Button */}
                    {trackingUrl && (
                        <Section style={buttonSection}>
                            <Link style={button} href={trackingUrl}>
                                Track Your Order
                            </Link>
                        </Section>
                    )}

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            If you have any questions, please contact our customer support.
                        </Text>
                        <Text style={footerText}>
                            © 2024 WallDecorator. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default OrderConfirmationEmail;

// Styles
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    maxWidth: "600px",
};

const header = {
    padding: "32px 40px",
    backgroundColor: "#000000",
    textAlign: "center" as const,
};

const h1 = {
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "bold",
    margin: "0",
    padding: "0",
};

const messageSection = {
    padding: "40px 40px 20px",
};

const h2 = {
    color: "#000000",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 16px",
};

const h3 = {
    color: "#000000",
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0 0 12px",
    padding: "0 40px",
};

const text = {
    color: "#525252",
    fontSize: "16px",
    lineHeight: "24px",
    margin: "0",
};

const orderInfoSection = {
    padding: "20px 40px",
};

const orderLabel = {
    color: "#737373",
    fontSize: "12px",
    fontWeight: "500",
    textTransform: "uppercase" as const,
    margin: "0 0 4px",
};

const orderValue = {
    color: "#000000",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0",
};

const hr = {
    borderColor: "#e5e5e5",
    margin: "0",
};

const itemSection = {
    padding: "12px 40px",
};

const itemImageColumn = {
    width: "80px",
    paddingRight: "16px",
};

const itemImage = {
    borderRadius: "8px",
    border: "1px solid #e5e5e5",
};

const itemDetailsColumn = {
    verticalAlign: "top" as const,
};

const itemName = {
    color: "#000000",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0 0 4px",
};

const itemMaterial = {
    color: "#737373",
    fontSize: "14px",
    margin: "0 0 2px",
};

const itemQuantity = {
    color: "#737373",
    fontSize: "14px",
    margin: "0",
};

const itemPriceColumn = {
    verticalAlign: "top" as const,
};

const itemPrice = {
    color: "#000000",
    fontSize: "16px",
    fontWeight: "600",
    margin: "0",
};

const summarySection = {
    padding: "20px 40px",
};

const summaryLabel = {
    color: "#737373",
    fontSize: "14px",
    margin: "0 0 8px",
};

const summaryValue = {
    color: "#000000",
    fontSize: "14px",
    margin: "0 0 8px",
};

const totalRow = {
    marginTop: "12px",
    paddingTop: "12px",
    borderTop: "1px solid #e5e5e5",
};

const totalLabel = {
    color: "#000000",
    fontSize: "16px",
    fontWeight: "bold",
    margin: "0",
};

const totalValue = {
    color: "#000000",
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0",
};

const address = {
    color: "#525252",
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0",
    padding: "0 40px",
};

const buttonSection = {
    padding: "32px 40px",
    textAlign: "center" as const,
};

const button = {
    backgroundColor: "#000000",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "600",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "14px 32px",
};

const footer = {
    padding: "32px 40px",
    textAlign: "center" as const,
};

const footerText = {
    color: "#737373",
    fontSize: "12px",
    lineHeight: "18px",
    margin: "4px 0",
};

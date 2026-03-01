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
    Font,
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

const formatPrice = (amount: number) => `Rs ${amount.toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const OrderConfirmationEmail = ({
    orderNumber = "ORD-123456",
    customerName = "John Doe",
    orderDate = "December 3, 2024",
    items = [
        {
            name: "Modern Abstract Wall Art",
            material: "Canvas",
            quantity: 2,
            unitPrice: 4500,
            totalPrice: 9000,
            imageUrl: "https://placehold.co/80x80",
        },
    ],
    subtotal = 9000,
    shippingCost = 500,
    taxAmount = 0,
    total = 9500,
    shippingAddress = {
        firstName: "Ahmed",
        lastName: "Khan",
        addressLine1: "123 Main Boulevard",
        city: "Lahore",
        state: "Punjab",
        postalCode: "54000",
        country: "Pakistan",
    },
    trackingUrl,
}: OrderConfirmationEmailProps) => {
    const previewText = `Order ${orderNumber} confirmed — Thank you for your purchase!`;

    return (
        <Html>
            <Head>
                <Font
                    fontFamily="Manrope"
                    fallbackFontFamily="Arial"
                    webFont={{
                        url: "https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk79FO_F.woff2",
                        format: "woff2",
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
            </Head>
            <Preview>{previewText}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header with Logo */}
                    <Section style={header}>
                        <Link href={SITE_URL} style={{ textDecoration: "none" }}>
                            <Text style={logoText}>WallDecorator</Text>
                        </Link>
                        <Text style={tagline}>Art That Defines Your Space</Text>
                    </Section>

                    {/* Success Banner */}
                    <Section style={successBanner}>
                        <Text style={checkIcon}>✓</Text>
                        <Heading style={successHeading}>Order Confirmed!</Heading>
                        <Text style={successText}>
                            Hi {customerName}, thank you for your order. We&apos;ve received your
                            order and will notify you once it ships.
                        </Text>
                    </Section>

                    {/* Order Details Card */}
                    <Section style={{ padding: "0 40px" }}>
                        <Section style={orderInfoCardInner}>
                            <Row>
                                <Column style={{ verticalAlign: "top" }}>
                                    <Text style={orderLabel}>Order Number</Text>
                                    <Text style={orderValue}>{orderNumber}</Text>
                                </Column>
                                <Column style={{ width: "170px", verticalAlign: "top" }}>
                                    <Text style={{ ...orderLabel, textAlign: "right" as const }}>Order Date</Text>
                                    <Text style={{ ...orderValue, textAlign: "right" as const }}>{orderDate}</Text>
                                </Column>
                            </Row>
                        </Section>
                    </Section>

                    {/* Order Items */}
                    <Section style={sectionPadding}>
                        <Heading style={sectionTitle}>Order Items</Heading>
                        {items.map((item, index) => (
                            <Section key={index} style={itemRow}>
                                <Row>
                                    <Column style={itemImageCol}>
                                        {item.imageUrl && (
                                            <Img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                width="72"
                                                height="72"
                                                style={itemImage}
                                            />
                                        )}
                                    </Column>
                                    <Column style={itemDetailsCol}>
                                        <Text style={itemName}>{item.name}</Text>
                                        <Text style={itemMeta}>Material: {item.material}</Text>
                                        <Text style={itemMeta}>Qty: {item.quantity} × {formatPrice(item.unitPrice)}</Text>
                                    </Column>
                                    <Column align="right" style={itemPriceCol}>
                                        <Text style={itemPrice}>
                                            {formatPrice(item.totalPrice)}
                                        </Text>
                                    </Column>
                                </Row>
                            </Section>
                        ))}
                    </Section>

                    <Hr style={divider} />

                    {/* Order Summary */}
                    <Section style={summarySection}>
                        <Row>
                            <Column><Text style={summaryLabel}>Subtotal</Text></Column>
                            <Column align="right"><Text style={summaryValue}>{formatPrice(subtotal)}</Text></Column>
                        </Row>
                        <Row>
                            <Column><Text style={summaryLabel}>Shipping</Text></Column>
                            <Column align="right">
                                <Text style={summaryValue}>
                                    {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
                                </Text>
                            </Column>
                        </Row>
                        {taxAmount > 0 && (
                            <Row>
                                <Column><Text style={summaryLabel}>Tax</Text></Column>
                                <Column align="right"><Text style={summaryValue}>{formatPrice(taxAmount)}</Text></Column>
                            </Row>
                        )}
                        <Hr style={summaryDivider} />
                        <Row>
                            <Column><Text style={totalLabel}>Total</Text></Column>
                            <Column align="right"><Text style={totalValue}>{formatPrice(total)}</Text></Column>
                        </Row>
                    </Section>

                    <Hr style={divider} />

                    {/* Shipping Address */}
                    <Section style={sectionPadding}>
                        <Heading style={sectionTitle}>Shipping Address</Heading>
                        <Text style={addressText}>
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

                    {/* Track Order Button */}
                    {trackingUrl && (
                        <Section style={buttonSection}>
                            <Link style={primaryButton} href={trackingUrl}>
                                Track Your Order
                            </Link>
                        </Section>
                    )}

                    {/* Browse More CTA */}
                    <Section style={buttonSection}>
                        <Link style={secondaryButton} href={`${SITE_URL}/products`}>
                            Continue Shopping
                        </Link>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Hr style={footerDivider} />
                        <Link href={SITE_URL} style={{ textDecoration: "none" }}>
                            <Text style={footerLogo}>WallDecorator</Text>
                        </Link>
                        <Text style={footerText}>
                            If you have any questions about your order, please contact us at{" "}
                            <Link href="mailto:support@walldecorator.pk" style={footerLink}>
                                support@walldecorator.pk
                            </Link>
                        </Text>
                        <Text style={footerCopyright}>
                            © {new Date().getFullYear()} WallDecorator. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

export default OrderConfirmationEmail;

// ─── Brand Colors ───
const BRAND_GOLD = "#C8982F";
const BRAND_GOLD_LIGHT = "#F5EFE0";
const BRAND_DARK = "#1A1A1A";
const BRAND_TEXT = "#333333";
const BRAND_MUTED = "#737373";
const BRAND_BORDER = "#E8E0D0";
const BRAND_BG = "#FAFAF7";

// ─── Styles ───
const main: React.CSSProperties = {
    backgroundColor: BRAND_BG,
    fontFamily: "'Manrope', Arial, Helvetica, sans-serif",
};

const container: React.CSSProperties = {
    backgroundColor: "#FFFFFF",
    margin: "0 auto",
    maxWidth: "600px",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
    marginTop: "40px",
    marginBottom: "40px",
};

const header: React.CSSProperties = {
    backgroundColor: BRAND_DARK,
    padding: "36px 40px 28px",
    textAlign: "center",
};

const logoText: React.CSSProperties = {
    color: BRAND_GOLD,
    fontSize: "28px",
    fontWeight: "800",
    letterSpacing: "-0.5px",
    margin: "0",
    fontFamily: "'Manrope', Arial, sans-serif",
};

const tagline: React.CSSProperties = {
    color: "#999999",
    fontSize: "12px",
    fontWeight: "500",
    letterSpacing: "2px",
    textTransform: "uppercase",
    margin: "8px 0 0",
};

const successBanner: React.CSSProperties = {
    padding: "36px 40px 24px",
    textAlign: "center",
};

const checkIcon: React.CSSProperties = {
    display: "inline-block",
    width: "48px",
    height: "48px",
    lineHeight: "48px",
    borderRadius: "50%",
    backgroundColor: BRAND_GOLD_LIGHT,
    color: BRAND_GOLD,
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 auto 16px",
    textAlign: "center",
};

const successHeading: React.CSSProperties = {
    color: BRAND_DARK,
    fontSize: "26px",
    fontWeight: "800",
    margin: "0 0 12px",
    letterSpacing: "-0.3px",
};

const successText: React.CSSProperties = {
    color: BRAND_MUTED,
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0",
};

const orderInfoCardInner: React.CSSProperties = {
    padding: "20px 24px",
    backgroundColor: BRAND_GOLD_LIGHT,
    borderRadius: "10px",
    border: `1px solid ${BRAND_BORDER}`,
};

const orderLabel: React.CSSProperties = {
    color: BRAND_MUTED,
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: "0 0 4px",
};

const orderValue: React.CSSProperties = {
    color: BRAND_DARK,
    fontSize: "15px",
    fontWeight: "700",
    margin: "0",
};

const sectionPadding: React.CSSProperties = {
    padding: "28px 40px 12px",
};

const sectionTitle: React.CSSProperties = {
    color: BRAND_DARK,
    fontSize: "16px",
    fontWeight: "800",
    margin: "0 0 16px",
    letterSpacing: "-0.2px",
};

const itemRow: React.CSSProperties = {
    padding: "12px 0",
    borderBottom: `1px solid #F0F0F0`,
};

const itemImageCol: React.CSSProperties = {
    width: "72px",
    paddingRight: "16px",
};

const itemImage: React.CSSProperties = {
    borderRadius: "8px",
    border: `1px solid ${BRAND_BORDER}`,
    objectFit: "cover",
};

const itemDetailsCol: React.CSSProperties = {
    verticalAlign: "top",
};

const itemName: React.CSSProperties = {
    color: BRAND_DARK,
    fontSize: "15px",
    fontWeight: "700",
    margin: "0 0 4px",
};

const itemMeta: React.CSSProperties = {
    color: BRAND_MUTED,
    fontSize: "13px",
    margin: "0 0 2px",
};

const itemPriceCol: React.CSSProperties = {
    verticalAlign: "top",
    width: "120px",
};

const itemPrice: React.CSSProperties = {
    color: BRAND_DARK,
    fontSize: "15px",
    fontWeight: "700",
    margin: "0",
};

const divider: React.CSSProperties = {
    borderColor: "#F0F0F0",
    margin: "0 40px",
};

const summarySection: React.CSSProperties = {
    padding: "20px 40px",
};

const summaryLabel: React.CSSProperties = {
    color: BRAND_MUTED,
    fontSize: "14px",
    margin: "0 0 8px",
};

const summaryValue: React.CSSProperties = {
    color: BRAND_TEXT,
    fontSize: "14px",
    fontWeight: "500",
    margin: "0 0 8px",
};

const summaryDivider: React.CSSProperties = {
    borderColor: BRAND_BORDER,
    margin: "8px 0",
};

const totalLabel: React.CSSProperties = {
    color: BRAND_DARK,
    fontSize: "17px",
    fontWeight: "800",
    margin: "0",
};

const totalValue: React.CSSProperties = {
    color: BRAND_GOLD,
    fontSize: "20px",
    fontWeight: "800",
    margin: "0",
};

const addressText: React.CSSProperties = {
    color: BRAND_TEXT,
    fontSize: "14px",
    lineHeight: "22px",
    margin: "0",
};

const buttonSection: React.CSSProperties = {
    padding: "8px 40px 16px",
    textAlign: "center",
};

const primaryButton: React.CSSProperties = {
    backgroundColor: BRAND_GOLD,
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "15px",
    fontWeight: "700",
    textDecoration: "none",
    textAlign: "center",
    display: "inline-block",
    padding: "14px 36px",
    letterSpacing: "0.3px",
};

const secondaryButton: React.CSSProperties = {
    backgroundColor: "transparent",
    borderRadius: "8px",
    border: `2px solid ${BRAND_DARK}`,
    color: BRAND_DARK,
    fontSize: "14px",
    fontWeight: "700",
    textDecoration: "none",
    textAlign: "center",
    display: "inline-block",
    padding: "12px 32px",
};

const footer: React.CSSProperties = {
    padding: "8px 40px 32px",
    textAlign: "center",
};

const footerDivider: React.CSSProperties = {
    borderColor: BRAND_BORDER,
    margin: "0 0 24px",
};

const footerLogo: React.CSSProperties = {
    color: BRAND_GOLD,
    fontSize: "18px",
    fontWeight: "800",
    margin: "0 0 12px",
};

const footerText: React.CSSProperties = {
    color: BRAND_MUTED,
    fontSize: "12px",
    lineHeight: "20px",
    margin: "0 0 8px",
};

const footerLink: React.CSSProperties = {
    color: BRAND_GOLD,
    textDecoration: "underline",
};

const footerCopyright: React.CSSProperties = {
    color: "#A0A0A0",
    fontSize: "11px",
    margin: "12px 0 0",
};

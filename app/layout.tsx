import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { JsonLd } from "@/components/seo/json-ld"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://walldecorator.com"

// ─── Viewport (must be separate from metadata in Next.js 14+) ─────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

// ─── Root Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Wall Decorator — Modern Wall Art",
    template: "%s | Wall Decorator",
  },
  description:
    "Precision-crafted laser-cut metal wall art. Custom sizes, premium materials. Free shipping over Rs. 5,000.",
  keywords: [
    "metal wall art",
    "laser cut wall decor",
    "wall decorator Pakistan",
    "custom wall art",
    "anime wall decor",
  ],
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: SITE_URL,
    siteName: "Wall Decorator",
    title: "Wall Decorator — Modern Wall Art",
    description:
      "Precision-crafted laser-cut metal wall art. Custom sizes, premium materials. Free shipping over Rs. 5,000.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Wall Decorator — Metal Wall Art" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wall Decorator — Modern Wall Art",
    description:
      "Precision-crafted laser-cut metal wall art. Custom sizes, premium materials. Free shipping over Rs. 5,000.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

// ─── Global JSON-LD Schemas ───────────────────────────────────────────────────

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Wall Decorator",
  url: SITE_URL,
  description:
    "Precision-crafted laser-cut metal wall art for Pakistani homes.",
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: "Wall Decorator",
  },
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Wall Decorator",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
  },
  areaServed: {
    "@type": "Country",
    name: "Pakistan",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <JsonLd data={websiteSchema} />
        <JsonLd data={organizationSchema} />
        {children}
      </body>
    </html>
  )
}


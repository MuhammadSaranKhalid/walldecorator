import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, DM_Sans } from "next/font/google"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import "./globals.css"
import { JsonLd } from "@/components/seo/json-ld"
import { I18nProvider } from "@/lib/i18n/provider"
import { ThemeProvider } from "@/components/theme-provider"
import { CurrencyProvider } from "@/components/obsidian/currency-provider"
import { getRates } from "@/lib/rates"

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { rates, currencies } = await getRates()
  console.log('RootLayout: fetched rates', rates)
  console.log('RootLayout: fetched currencies', currencies)

  return (
    <html lang="en" className="obsidian-scrollbar" suppressHydrationWarning>
      <body className={`${cormorantGaramond.variable} ${dmSans.variable} font-[family-name:var(--font-dm-sans)] antialiased bg-[var(--obsidian-bg)] text-[var(--obsidian-text)] min-h-screen overflow-x-hidden obsidian-noise`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <CurrencyProvider initialRates={rates} initialCurrencyList={currencies}>
              <NuqsAdapter>
                <JsonLd data={websiteSchema} />
                <JsonLd data={organizationSchema} />
                {children}
              </NuqsAdapter>
            </CurrencyProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import type { Metadata } from "next";
import React, { Suspense } from "react";
import { Manrope } from "next/font/google";
import { RefineContext } from "./_refine_context";
import Script from "next/script";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "WallDecor Co. - Art That Defines Your Space",
  description: "Discover unique wall decor in acrylic, steel, iron, and wood to transform your home.",
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    siteName: "WallDecorator",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@walldecorator",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable} suppressHydrationWarning>
      <body>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-BX2X90WLS9"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-BX2X90WLS9');
          `}
        </Script>
        <Suspense>
          <RefineContext>
            {children}
            <AnalyticsProvider />
          </RefineContext>
        </Suspense>
      </body>
    </html>
  );
}

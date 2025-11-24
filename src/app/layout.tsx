import type { Metadata } from "next";
import React, { Suspense } from "react";
import { Manrope } from "next/font/google";
import { RefineContext } from "./_refine_context";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "WallDecor Co. - Art That Defines Your Space",
  description: "Discover unique wall decor in acrylic, steel, iron, and wood to transform your home.",
  icons: {
    icon: "/favicon.ico",
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
        <Suspense>
          <RefineContext>{children}</RefineContext>
        </Suspense>
      </body>
    </html>
  );
}

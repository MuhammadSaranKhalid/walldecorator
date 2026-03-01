import type { Metadata } from "next";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { CartDrawer } from '@/components/store/cart/cart-drawer'
import Header from '@/components/Header'
import Footer from '@/components/Footer'


export const metadata: Metadata = {
    title: "Wall Decorator - Modern Metal Wall Art",
    description: "Precision-crafted laser-cut designs that turn your walls into a gallery. Custom sizes and materials available.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (

        <NuqsAdapter>
            <Header />
            {children}
            <Footer />
            <CartDrawer />
        </NuqsAdapter>

    );
}

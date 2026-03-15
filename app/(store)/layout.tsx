import type { Metadata } from "next";
import { CartDrawer } from '@/components/store/cart/cart-drawer'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AnnouncementBar } from '@/components/store/home/announcement-bar'


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
        <div className="min-h-screen flex flex-col">
            <AnnouncementBar />
            <Header />
            <div className="flex-1">
                {children}
            </div>
            <Footer />
            <CartDrawer />
        </div>
    );
}

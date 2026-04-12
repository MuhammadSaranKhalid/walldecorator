import type { Metadata } from "next";
import { ObsidianCartDrawer } from '@/components/obsidian/cart-drawer'
import { WishlistDrawer } from '@/components/obsidian/wishlist-drawer'
import { ObsidianNavigation } from '@/components/obsidian/navigation'
import { MobileMenu } from '@/components/obsidian/mobile-menu'
import { ObsidianFooter } from '@/components/obsidian/footer'
import { ToastContainer } from '@/components/obsidian/toast-container'
import { WhatsAppButton } from '@/components/obsidian/whatsapp-button'


export const metadata: Metadata = {
    title: "OBSIDIAN — Wall Art & Decor",
    description: "Precision-crafted laser-cut designs that turn your walls into a gallery. Custom sizes and materials available.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen flex flex-col relative">
            <ObsidianNavigation />
            <MobileMenu />
            <div className="flex-1 pt-20">
                {children}
            </div>
            <ObsidianFooter />
            <ObsidianCartDrawer />
            <WishlistDrawer />
            <ToastContainer />
            <WhatsAppButton />
        </div>
    );
}

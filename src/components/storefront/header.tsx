"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Menu } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useTheme } from "@/components/refine-ui/theme/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CartSheet } from "@/components/storefront/cart-sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const { currency, setCurrency } = usePreferencesStore();
  const { theme, setTheme } = useTheme();

  const totalItems = getTotalItems();

  const handleCartClick = () => {
    // On mobile (< lg), navigate to cart page
    // On desktop (>= lg), open cart sheet
    if (window.innerWidth < 1024) {
      router.push("/cart");
    } else {
      setCartSheetOpen(true);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 text-foreground">
              <Image
                src="/logo.png"
                alt="WallDecorator Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <h2 className="text-xl font-bold">walldecorator</h2>
            </Link>
          </div>

          {/* Centered Navigation */}
          <nav className="hidden lg:flex items-center gap-9 absolute left-1/2 transform -translate-x-1/2">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium hover:text-primary transition-colors",
                isActive("/") && pathname === "/" ? "text-primary font-bold" : ""
              )}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={cn(
                "text-sm font-medium hover:text-primary transition-colors",
                isActive("/products") ? "text-primary font-bold" : ""
              )}
            >
              Shop
            </Link>
            <Link
              href="/about"
              className={cn(
                "text-sm font-medium hover:text-primary transition-colors",
                isActive("/about") ? "text-primary font-bold" : ""
              )}
            >
              About
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Desktop Controls */}
            <div className="hidden md:flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={currency} onValueChange={(value) => setCurrency(value as any)}>
                      <SelectTrigger className="w-[100px] border-0 bg-transparent text-sm font-medium hover:text-primary focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dollar">Dollar</SelectItem>
                        <SelectItem value="Euro">Euro</SelectItem>
                        <SelectItem value="Rupees">Rupees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Change Currency</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-[100px] border-0 bg-transparent text-sm font-medium hover:text-primary focus:ring-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Change Theme</TooltipContent>
              </Tooltip>
            </div>

            {/* Cart Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={handleCartClick}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {totalItems > 0 ? `Cart (${totalItems} items)` : "Cart"}
              </TooltipContent>
            </Tooltip>

            {/* Cart Sheet for Desktop */}
            <CartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen} />

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
                <div className="flex flex-col h-full">
                  {/* Logo Header */}
                  <div className="flex items-center gap-3 p-6 border-b">
                    <Image
                      src="/logo.png"
                      alt="walldecorator Logo"
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                    <h2 className="text-lg font-bold">walldecorator</h2>
                  </div>

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-2 p-6 flex-1">
                    <Link
                      href="/"
                      className={cn(
                        "px-4 py-3.5 text-base font-medium rounded-lg transition-all",
                        isActive("/") && pathname === "/"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      href="/products"
                      className={cn(
                        "px-4 py-3.5 text-base font-medium rounded-lg transition-all",
                        isActive("/products")
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Shop
                    </Link>
                    <Link
                      href="/about"
                      className={cn(
                        "px-4 py-3.5 text-base font-medium rounded-lg transition-all",
                        isActive("/about")
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-accent/50"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      About
                    </Link>
                  </nav>

                  {/* Settings Section */}
                  <div className="p-6 space-y-5 border-t bg-muted/20">
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Currency
                      </label>
                      <Select value={currency} onValueChange={(value) => setCurrency(value as any)}>
                        <SelectTrigger className="w-full h-12 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dollar">Dollar ($)</SelectItem>
                          <SelectItem value="Euro">Euro (€)</SelectItem>
                          <SelectItem value="Rupees">Rupees (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Theme
                      </label>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-full h-12 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}


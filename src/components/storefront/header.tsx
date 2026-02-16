"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Menu, Settings, Sun, Moon, Globe, Check } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useTheme } from "@/components/refine-ui/theme/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CartSheet } from "@/components/storefront/cart-sheet";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const { currency, setCurrency } = usePreferencesStore();
  const { theme, setTheme } = useTheme();

  const totalItems = getTotalItems();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCartClick = () => {
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

  const isHome = pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || !isHome
          ? "h-16 bg-background/80 backdrop-blur-md border-b shadow-sm"
          : "h-20 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 h-full">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 text-foreground group">
              <Image
                src="/logo.png"
                alt="WallDecorator Logo"
                width={36}
                height={36}
                className="object-contain transition-transform group-hover:scale-105"
              />
              {/* <span className={cn(
                "text-xl font-bold tracking-tight transition-colors",
                !scrolled && isHome ? "text-white" : "text-foreground"
              )}>
                walldecorator
              </span> */}
            </Link>
          </div>

          {/* Centered Navigation */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
            {[
              { href: "/", label: "Home" },
              { href: "/products", label: "Shop" },
              { href: "/about", label: "About" },
              { href: "/track-order", label: "Track Order" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative text-sm font-medium transition-colors hover:text-primary py-2",
                  isActive(link.href) ? "font-bold" : "",
                  !scrolled && isHome
                    ? (isActive(link.href) ? "text-white" : "text-white/80 hover:text-white")
                    : (isActive(link.href) ? "text-primary" : "text-foreground/80 hover:text-foreground")
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className={cn(
                    "absolute bottom-0 left-0 w-full h-0.5 rounded-full",
                    !scrolled && isHome ? "bg-white" : "bg-primary"
                  )} />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Settings Dropdown - Hidden as both Currency and Theme are moved/removed
            <div className="hidden md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "transition-colors",
                        !scrolled && isHome ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                     // Currency Selection Commented Out
                    // <DropdownMenuSub>
                    //   <DropdownMenuSubTrigger>
                    //     <Globe className="mr-2 h-4 w-4" />
                    //     <span>Currency</span>
                    //   </DropdownMenuSubTrigger>
                    //   <DropdownMenuSubContent>
                    //     {["Dollar", "Euro", "Rupees"].map((curr) => (
                    //       <DropdownMenuItem key={curr} onClick={() => setCurrency(curr as any)}>
                    //         <span className="flex-1">{curr}</span>
                    //         {currency === curr && <Check className="ml-2 h-4 w-4" />}
                    //       </DropdownMenuItem>
                    //     ))}
                    //   </DropdownMenuSubContent>
                    // </DropdownMenuSub>
                    

                    // Theme Selection Commented Out - Moved to Footer
                    // <DropdownMenuSub>
                    //   <DropdownMenuSubTrigger>
                    //     <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    //     <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    //     <span className="ml-6">Theme</span>
                    //   </DropdownMenuSubTrigger>
                    //   <DropdownMenuSubContent>
                    //     <DropdownMenuItem onClick={() => setTheme("light")}>
                    //       Light
                    //       {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                    //     </DropdownMenuItem>
                    //     <DropdownMenuItem onClick={() => setTheme("dark")}>
                    //       Dark
                    //       {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                    //     </DropdownMenuItem>
                    //     <DropdownMenuItem onClick={() => setTheme("system")}>
                    //       System
                    //       {theme === "system" && <Check className="ml-auto h-4 w-4" />}
                    //     </DropdownMenuItem>
                    //   </DropdownMenuSubContent>
                    // </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
            */}

            {/* Cart Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative transition-colors",
                    !scrolled && isHome ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={handleCartClick}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {mounted && totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow-sm ring-2 ring-background">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {mounted && totalItems > 0 ? `Cart (${totalItems} items)` : "Cart"}
              </TooltipContent>
            </Tooltip>

            {/* Cart Sheet for Desktop */}
            <CartSheet open={cartSheetOpen} onOpenChange={setCartSheetOpen} />

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "lg:hidden transition-colors",
                    !scrolled && isHome ? "text-white hover:bg-white/10 hover:text-white" : "text-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
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
                    {[
                      { href: "/", label: "Home" },
                      { href: "/products", label: "Shop" },
                      { href: "/about", label: "About" },
                      { href: "/track-order", label: "Track Order" },
                    ].map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "px-4 py-3.5 text-base font-medium rounded-lg transition-all",
                          isActive(link.href)
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-accent/50"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Settings Section - Hidden
                  <div className="p-6 space-y-5 border-t bg-muted/20">
                    // Currency Selection Commented Out
                    // <div className="space-y-2.5">
                    //   <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    //     Currency
                    //   </label>
                    //   <div className="flex flex-wrap gap-2">
                    //     {["Dollar", "Euro", "Rupees"].map((curr) => (
                    //       <Button
                    //         key={curr}
                    //         variant={currency === curr ? "default" : "outline"}
                    //         size="sm"
                    //         onClick={() => setCurrency(curr as any)}
                    //         className="flex-1"
                    //       >
                    //         {curr === "Dollar" ? "$" : curr === "Euro" ? "€" : "₹"}
                    //       </Button>
                    //     ))}
                    //   </div>
                    // </div>

                    // Theme Selection Commented Out
                    // <div className="space-y-2.5">
                    //   <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    //     Theme
                    //   </label>
                    //    <div className="flex flex-wrap gap-2">
                    //     {["light", "dark", "system"].map((t) => (
                    //       <Button
                    //         key={t}
                    //         variant={theme === t ? "default" : "outline"}
                    //         size="sm"
                    //         onClick={() => setTheme(t as any)}
                    //         className="flex-1 capitalize"
                    //       >
                    //         {t}
                    //       </Button>
                    //     ))}
                    //   </div>
                    // </div>
                  </div>
                  */}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

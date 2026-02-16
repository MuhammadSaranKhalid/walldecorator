"use client";

import Link from "next/link";
import { ArrowRight, Moon, Sun, Facebook, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useTheme } from "@/components/refine-ui/theme/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Footer() {
  const { setTheme } = useTheme();
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  return (
    <footer className="bg-charcoal text-gray-300">
      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
          {/* Company Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white tracking-wide">WALLDECOR CO.</h3>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Bringing art to your walls with passion, craftsmanship, and a touch of modern elegance.
            </p>
          </div>

          {/* Shop */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Shop</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/products?category=new_arrivals" className="hover:text-primary transition-colors block w-fit">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?category=best_sellers" className="hover:text-primary transition-colors block w-fit">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary transition-colors block w-fit">
                  All Collections
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Support</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link href="/faqs" className="hover:text-primary transition-colors block w-fit">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors block w-fit">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors block w-fit">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors block w-fit">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Stay Connected</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3">
              <div className="flex relative">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="grow h-12 rounded-lg border-gray-700 bg-charcoal-light/50 text-white placeholder:text-gray-500 focus-visible:ring-primary focus-visible:border-primary transition-all pr-12"
                  required
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 rounded-md bg-transparent text-primary hover:bg-primary/10 hover:text-primary"
                >
                  <ArrowRight className="h-5 w-5" />
                  <span className="sr-only">Subscribe</span>
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
          <p>© 2024 WallDecor Co. All rights reserved.</p>

          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-white transition-colors">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-charcoal border-gray-700 text-gray-300">
                <DropdownMenuItem onClick={() => setTheme("light")} className="focus:bg-charcoal-light focus:text-white cursor-pointer">
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="focus:bg-charcoal-light focus:text-white cursor-pointer">
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="focus:bg-charcoal-light focus:text-white cursor-pointer">
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-4 bg-gray-800" />

            <div className="flex items-center gap-4">
              <Link href="https://facebook.com" className="text-gray-500 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="https://instagram.com" className="text-gray-500 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="https://linkedin.com" className="text-gray-500 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement newsletter subscription
    console.log("Newsletter subscription:", email);
    setEmail("");
  };

  return (
    <footer className="bg-[#2F3640] text-gray-300">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">WallDecor Co.</h3>
            <p className="text-sm">Bringing art to your walls with passion and craftsmanship.</p>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-bold text-white mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products?category=new_arrivals" className="hover:text-primary transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products?category=best_sellers" className="hover:text-primary transition-colors">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faqs" className="hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-white mb-4">Stay Connected</h4>
            <p className="text-sm mb-4">Get the latest updates and special offers.</p>
            <form onSubmit={handleNewsletterSubmit} className="flex">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow rounded-r-none border-0 bg-[#3b4450] text-white placeholder:text-gray-400 focus-visible:ring-primary"
                required
              />
              <Button 
                type="submit" 
                className="rounded-l-none bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[#3b4450] flex flex-col sm:flex-row justify-between items-center text-sm">
          <p>© 2024 WallDecor Co. All rights reserved.</p>
          <div className="flex gap-4 mt-4 sm:mt-0">
            <Link href="https://facebook.com" className="hover:text-primary transition-colors">
              FB
            </Link>
            <Link href="https://instagram.com" className="hover:text-primary transition-colors">
              IG
            </Link>
            <Link href="https://pinterest.com" className="hover:text-primary transition-colors">
              PIN
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


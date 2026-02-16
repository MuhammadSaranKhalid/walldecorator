"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Minus, Plus, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { usePrice } from "@/hooks/use-price";
import { useEffect } from "react";
import { toast } from "sonner";
import { useEcommerceAnalytics } from "@/lib/analytics-events";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCartStore();
  const { formatPrice } = usePrice();

  const subtotal = getTotalPrice();
  const totalItems = getTotalItems();

  // Analytics
  const { viewCart, removeFromCart, beginCheckout } = useEcommerceAnalytics();

  // Track View Cart on mount
  useEffect(() => {
    if (items.length > 0) {
      viewCart({
        currency: "PKR",
        value: subtotal,
        items: items.map(item => ({
          item_id: item.product_id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_variant: item.material,
          item_category: "Wall Decor"
        }))
      });
    }
  }, [items.length, subtotal, viewCart]); // Only track initial or significant changes? Actually usually just on mount is standard, but if cart changes while viewing, maybe update? For now, mount is good but items depends on store. Let's start with items.length/mount.

  // Actually standard GA4 view_cart is on page view.
  // Refine: add empty dep array? No, items might load from localStorage.
  // Let's use a ref to track if sent, or just `useEffect` on mount + items ready.
  // Since persistent store, items are ready immediately on client.

  const handleQuantityChange = (productId: string, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string, productName: string, price: number, quantity: number, material: string) => {
    removeItem(productId);

    // Track Remove From Cart
    removeFromCart({
      currency: "PKR",
      value: price * quantity,
      items: [{
        item_id: productId,
        item_name: productName,
        price: price,
        quantity: quantity,
        item_variant: material,
        item_category: "Wall Decor"
      }]
    });

    toast.success(`${productName} removed from cart`);
  };

  return (
    <div className="w-full flex-grow">
      <div className="container mx-auto px-4 py-6 lg:py-12">
        {/* Page Heading */}
        <div className="flex flex-wrap justify-between gap-3 pb-6 lg:pb-8">
          <h1 className="text-2xl lg:text-4xl font-bold lg:font-black leading-tight tracking-tight">
            Your Cart
          </h1>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-muted-foreground mb-6">
              <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link href="/products">
              <Button size="lg" className="font-bold">
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          /* Cart Layout */
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-12">
            {/* Left Column: Cart Items */}
            <div className="w-full lg:w-2/3">
              <div className="flex flex-col gap-4 lg:divide-y lg:gap-0">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex gap-4 lg:py-6 p-4 lg:p-0 rounded-lg lg:rounded-none border lg:border-0 bg-card lg:bg-transparent"
                  >
                    {/* Product Image */}
                    <div className="relative h-20 w-20 lg:h-24 lg:w-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm lg:text-base font-bold line-clamp-2">{item.name}</p>
                          <p className="text-xs lg:text-sm text-muted-foreground mt-1">
                            Material: {item.material}
                          </p>
                          <p className="text-sm lg:text-base font-semibold mt-1">
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleRemoveItem(item.product_id, item.name, item.price, item.quantity, item.material)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                        </button>
                      </div>

                      {/* Bottom Row: Quantity & Total */}
                      <div className="flex items-center justify-between mt-auto">
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-1 border rounded-lg p-0.5">
                          <button
                            onClick={() => handleQuantityChange(item.product_id, item.quantity, -1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.product_id, item.quantity, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <p className="text-base lg:text-lg font-bold">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="w-full lg:w-1/3">
              <div className="lg:sticky lg:top-24">
                <div className="rounded-lg lg:rounded-xl border bg-card p-5 lg:p-6 shadow-sm">
                  <h2 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6">Order Summary</h2>

                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex justify-between text-sm lg:text-base">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm lg:text-base">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="font-semibold text-xs lg:text-sm">Calculated at next step</span>
                    </div>
                  </div>

                  <div className="border-t my-4 lg:my-6"></div>

                  <div className="flex justify-between text-base lg:text-lg font-bold">
                    <span>Grand Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <Button
                    size="lg"
                    className="w-full mt-6 lg:mt-8 font-bold h-11 lg:h-12"
                    onClick={() => {
                      // Track Begin Checkout
                      beginCheckout({ // Use the destructured beginCheckout
                        currency: "PKR",
                        value: subtotal,
                        items: items.map(item => ({
                          item_id: item.product_id,
                          item_name: item.name,
                          price: item.price,
                          quantity: item.quantity,
                          item_variant: item.material,
                          item_category: "Wall Decor"
                        }))
                      });
                      // Navigate
                      router.push("/checkout"); // Use router.push for navigation
                    }}
                  >
                    Proceed to Checkout
                  </Button>

                  <div className="mt-4 text-center">
                    <Link
                      href="/products"
                      className="text-sm text-primary hover:underline font-medium inline-block"
                    >
                      Continue Shopping
                    </Link>
                  </div>

                  <div className="mt-4 pt-4 border-t text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Lock className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    <span>Secure Payments & 30-Day Return Policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}


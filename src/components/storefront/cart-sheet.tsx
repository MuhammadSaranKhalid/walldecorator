"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePrice } from "@/hooks/use-price";
import { useEffect } from "react";
import { useEcommerceAnalytics } from "@/lib/analytics-events";

interface CartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartSheet({ open, onOpenChange }: CartSheetProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const { formatPrice } = usePrice();

  const subtotal = getTotalPrice();

  // Analytics
  const { viewCart, removeFromCart, beginCheckout } = useEcommerceAnalytics();

  // Track View Cart when sheet opens
  useEffect(() => {
    if (open && items.length > 0) {
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
  }, [open, items.length, subtotal, viewCart]);

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
  };

  const handleCheckout = () => {
    onOpenChange(false);

    // Track Begin Checkout
    beginCheckout({
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

    router.push("/checkout");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-xl font-bold">Shopping Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-6">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Your cart is empty
            </p>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Add items to get started
            </p>
            <Button onClick={() => onOpenChange(false)}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div
                    key={`${item.product_id}-${item.material}`}
                    className="flex gap-4 py-4 border-b last:border-0"
                  >
                    {/* Product Image */}
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted shrink-0">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <h3 className="font-semibold text-sm line-clamp-2">
                          {item.name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => handleRemoveItem(item.product_id, item.name, item.price, item.quantity, item.material)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">
                        Material: {item.material}
                      </p>

                      <div className="flex items-center justify-between mt-auto pt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.product_id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <p className="font-bold text-sm">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Cart Footer */}
            <div className="border-t p-6 space-y-4">
              <div className="flex justify-between text-base">
                <span className="font-medium">Subtotal</span>
                <span className="font-bold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
              <Button
                className="w-full h-12 font-bold text-base"
                onClick={handleCheckout}
              >
                Checkout
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

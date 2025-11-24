"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Grid3x3, CreditCard, Lock, ChevronDown } from "lucide-react";
import { useCreate, useCustom } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/stores/cart-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { toast } from "sonner";
import { supabaseBrowserClient } from "@/utils/supabase/client";

const shippingMethods = [
  { id: "standard", name: "Leopard (Standard)", price: 10.00 },
  { id: "priority", name: "FedEx (Priority)", price: 25.00 },
  { id: "express", name: "DHL Express (International)", price: 40.00 },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { language, currency, setLanguage, setCurrency } = usePreferencesStore();
  const [selectedShipping, setSelectedShipping] = useState("standard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "US",
    postalCode: "",
    phone: "",
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  const subtotal = getTotalPrice();
  const shippingCost = shippingMethods.find(m => m.id === selectedShipping)?.price || 0;
  const taxAmount = subtotal * 0.1; // 10% tax rate
  const total = subtotal + shippingCost + taxAmount;

  // Refine hooks for creating database records
  const { mutate: createAddress } = useCreate();
  const { mutate: createOrder } = useCreate();
  const { mutate: createOrderItems } = useCreate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate order number using database RPC function
      const { data: orderNumber, error: orderNumberError } = await supabaseBrowserClient
        .rpc('generate_order_number');

      if (orderNumberError || !orderNumber) {
        throw new Error('Failed to generate order number');
      }

      const shippingMethod = shippingMethods.find(m => m.id === selectedShipping);

      // Step 1: Create shipping address
      const addressPromise = new Promise((resolve, reject) => {
        createAddress(
          {
            resource: "addresses",
            values: {
              customer_id: null, // Guest checkout - will be null
              address_type: "shipping",
              first_name: formData.firstName,
              last_name: formData.lastName,
              address_line1: formData.address,
              address_line2: formData.addressLine2 || null,
              city: formData.city,
              state: formData.state || null,
              postal_code: formData.postalCode,
              country: formData.country,
              phone: formData.phone,
              is_default: false,
            },
          },
          {
            onSuccess: (data) => resolve(data.data.id),
            onError: (error) => reject(error),
          }
        );
      });

      const shippingAddressId = await addressPromise;

      // Step 2: Create order
      const orderPromise = new Promise((resolve, reject) => {
        createOrder(
          {
            resource: "orders",
            values: {
              order_number: orderNumber,
              customer_id: null, // Guest checkout
              status: "pending",
              subtotal: subtotal,
              shipping_cost: shippingCost,
              tax_amount: taxAmount,
              discount_amount: 0,
              total: total,
              shipping_address_id: shippingAddressId,
              billing_address_id: shippingAddressId, // Same as shipping for now
              shipping_method: shippingMethod?.name || "Standard",
              payment_method: "credit_card",
              payment_status: "pending",
            },
          },
          {
            onSuccess: (data) => resolve(data.data.id),
            onError: (error) => reject(error),
          }
        );
      });

      const orderId = await orderPromise;

      // Step 3: Create order items
      const orderItemsPromises = items.map((item) => {
        return new Promise((resolve, reject) => {
          createOrderItems(
            {
              resource: "order_items",
              values: {
                order_id: orderId,
                product_id: item.product_id,
                product_material_id: item.product_material_id || null,
                product_name: item.name,
                product_sku: item.sku || null,
                material_name: item.material,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
              },
            },
            {
              onSuccess: (data) => resolve(data),
              onError: (error) => reject(error),
            }
          );
        });
      });

      await Promise.all(orderItemsPromises);

      // Success!
      toast.success(`Order ${orderNumber} placed successfully!`);
      clearCart();

      // Redirect to order confirmation page (you'll need to create this)
      router.push(`/order-confirmation?order=${orderNumber}`);

    } catch (error) {
      console.error("Order creation failed:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        <div className="flex flex-col-reverse lg:flex-row lg:gap-12 xl:gap-20">
          {/* Left Column: Checkout Form */}
          <div className="w-full lg:w-3/5">
            {/* Breadcrumbs */}
            {/* <div className="flex flex-wrap gap-2 mb-6">
              <Link href="/cart" className="text-muted-foreground text-sm font-medium hover:text-primary">
                Cart
              </Link>
              <span className="text-muted-foreground text-sm">/</span>
              <span className="text-muted-foreground text-sm font-medium">Information</span>
              <span className="text-muted-foreground text-sm">/</span>
              <span className="text-muted-foreground text-sm font-medium">Shipping</span>
              <span className="text-muted-foreground text-sm">/</span>
              <span className="text-foreground text-sm font-bold">Payment</span>
            </div> */}

            {/* Page Heading */}
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight mb-8">
              Checkout
            </h1>

            <form onSubmit={handlePlaceOrder} className="space-y-10">
              {/* Contact & Shipping Section */}
              <section>
                <h2 className="text-xl font-bold pb-4 border-b mb-6">
                  Contact & Shipping
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="123 Art Street"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="New York"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="New York"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      placeholder="10001"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country Code</Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      placeholder="US"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      maxLength={2}
                      className="mt-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="mt-2"
                    />
                  </div>
                </div>
              </section>

              {/* Shipping Method Section */}
              <section>
                <h2 className="text-xl font-bold pb-4 border-b mb-6">
                  Shipping Method
                </h2>
                <RadioGroup value={selectedShipping} onValueChange={setSelectedShipping} className="space-y-4">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedShipping === method.id
                          ? "border-primary ring-2 ring-primary bg-primary/10"
                          : "border-input hover:border-primary"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <span className="font-bold">${method.price.toFixed(2)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              {/* Payment Section */}
              <section>
                <h2 className="text-xl font-bold pb-4 border-b mb-6">Payment</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  All transactions are secure and encrypted.
                </p>
                <div className="bg-muted/30 border rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <div className="relative mt-2">
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          required
                          className="pl-12"
                        />
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input
                        id="cardName"
                        name="cardName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expiryDate">Expiration Date (MM/YY)</Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        type="text"
                        placeholder="MM/YY"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        required
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">Security Code (CVV)</Label>
                      <div className="relative mt-2">
                        <Input
                          id="cvv"
                          name="cvv"
                          type="text"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                          className="pr-12"
                          maxLength={4}
                        />
                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 font-bold text-base"
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? "Processing..." : "Place Order"}
              </Button>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-2/5 mb-10 lg:mb-0">
            <div className="bg-muted/30 p-6 lg:p-8 rounded-xl sticky top-8">
              <h2 className="text-xl font-bold mb-6">Your Order</h2>

              {items.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-5">
                    {items.map((item) => (
                      <div key={item.product_id} className="flex items-center gap-4">
                        <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Material: {item.material}</p>
                          <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="my-6 h-px bg-border"></div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-medium">${subtotal.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Shipping</p>
                      <p className="font-medium">${shippingCost.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Tax (10%)</p>
                      <p className="font-medium">${taxAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-border"></div>

                  <div className="flex justify-between font-bold text-lg">
                    <p>Total</p>
                    <p>${total.toFixed(2)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <p>© 2024 WallDecor Co. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/help" className="hover:text-primary transition-colors">Help</Link>
              <Link href="/returns" className="hover:text-primary transition-colors">Returns Policy</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


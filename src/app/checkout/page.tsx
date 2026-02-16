"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Truck, CheckCircle2, Package, Mail, User, MapPin, Phone } from "lucide-react";
import { useCreate } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// RadioGroup removed - no shipping method selection
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/stores/cart-store";
// import { usePreferencesStore } from "@/stores/preferences-store"; // Removed - not used anymore
import { usePrice } from "@/hooks/use-price";
import { toast } from "sonner";
import { supabaseBrowserClient } from "@/utils/supabase/client";
import { sendOrderConfirmationEmail } from "@/actions/email-actions";
import { format } from "date-fns";
import { useEcommerceAnalytics } from "@/lib/analytics-events";

// Shipping methods removed - using free standard delivery
// const shippingMethods = [
//   { id: "standard", name: "Leopard (Standard)", price: 2780.00 },
//   { id: "priority", name: "FedEx (Priority)", price: 6950.00 },
//   { id: "express", name: "DHL Express (International)", price: 11120.00 },
// ];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { formatPrice } = usePrice();
  // const [selectedShipping, setSelectedShipping] = useState("standard"); // Removed - no shipping selection
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "PK",
    postalCode: "",
    phone: "",
    // Card fields removed - Cash on Delivery only
    // cardNumber: "",
    // cardName: "",
    // expiryDate: "",
    // cvv: "",
  });

  const subtotal = getTotalPrice();
  const shippingCost = 0; // Free shipping - no shipping selection
  const taxAmount = 0; // Tax removed - no tax applied
  // const taxAmount = subtotal * 0.1; // 10% tax rate
  const total = subtotal + shippingCost; // Tax removed from total

  // Refine hooks for creating database records
  const { mutate: createAddress } = useCreate();
  const { mutate: createOrder } = useCreate();
  const { mutate: createOrderItems } = useCreate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Analytics
  const { addPaymentInfo, purchase } = useEcommerceAnalytics();

  // handleShippingChange removed - no shipping selection needed
  // const handleShippingChange = (methodId: string) => {
  //   setSelectedShipping(methodId);
  //   const method = shippingMethods.find(m => m.id === methodId);
  //   if (method) {
  //     addShippingInfo({
  //       currency: "PKR",
  //       value: subtotal,
  //       shipping_tier: method.name,
  //       items: items.map(item => ({
  //         item_id: item.product_id,
  //         item_name: item.name,
  //         price: item.price,
  //         quantity: item.quantity,
  //         item_category: "Wall Decor"
  //       }))
  //     });
  //   }
  // };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Track Add Payment Info - Cash on Delivery
    addPaymentInfo({
      currency: "PKR",
      value: total,
      payment_type: "Cash on Delivery",
      items: items.map(item => ({
        item_id: item.product_id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: "Wall Decor"
      }))
    });

    setIsSubmitting(true);

    try {
      // Generate order number using database RPC function
      const { data: orderNumber, error: orderNumberError } = await supabaseBrowserClient
        .rpc('generate_order_number');

      if (orderNumberError || !orderNumber) {
        throw new Error('Failed to generate order number');
      }

      // Shipping method removed - using default free delivery
      // const shippingMethod = shippingMethods.find(m => m.id === selectedShipping);

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
              customer_email: formData.email,
              status: "pending",
              subtotal: subtotal,
              shipping_cost: shippingCost,
              tax_amount: taxAmount,
              discount_amount: 0,
              total: total,
              shipping_address_id: shippingAddressId,
              billing_address_id: shippingAddressId, // Same as shipping for now
              shipping_method: "Standard Delivery",
              payment_method: "cash_on_delivery",
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

      // Track Purchase
      purchase({
        transaction_id: orderNumber as string,
        value: total,
        currency: "PKR",
        tax: taxAmount,
        shipping: shippingCost,
        items: items.map(item => ({
          item_id: item.product_id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_category: "Wall Decor"
        }))
      });

      // Step 4: Send order confirmation email
      const trackingUrl = `${window.location.origin}/track-order`;
      const emailResult = await sendOrderConfirmationEmail({
        orderNumber: orderNumber,
        customerEmail: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`,
        orderDate: format(new Date(), "MMMM d, yyyy"),
        items: items.map(item => ({
          name: item.name,
          material: item.material,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          imageUrl: item.image_url,
        })),
        subtotal: subtotal,
        shippingCost: shippingCost,
        taxAmount: taxAmount,
        total: total,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.address,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        trackingUrl: trackingUrl,
      });

      // Log email result but don't fail the order if email fails
      if (!emailResult.success) {
        console.error("Failed to send confirmation email:", emailResult.error);
      }

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
    <div className="relative flex min-h-screen w-full flex-col bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        {/* Progress Indicator */}
        {/* <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -z-10"></div>
            <div className="flex flex-col items-center relative bg-background px-2">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">Cart</span>
            </div>
            <div className="flex flex-col items-center relative bg-background px-2">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                2
              </div>
              <span className="text-xs font-medium">Information</span>
            </div>
            <div className="flex flex-col items-center relative bg-background px-2">
              <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold mb-2">
                3
              </div>
              <span className="text-xs font-medium text-muted-foreground">Complete</span>
            </div>
          </div>
        </div> */}

        <div className="flex flex-col lg:flex-row lg:gap-12 xl:gap-16 max-w-7xl mx-auto">
          {/* Left Column: Checkout Form */}
          <div className="w-full lg:w-3/5">
            {/* Page Heading with Trust Badge */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
                Secure Checkout
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Your information is protected with SSL encryption</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-8">
              {/* Contact Information Section */}
              <section className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Contact Information</h2>
                    <p className="text-sm text-muted-foreground">We'll send order confirmation here</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      autoComplete="email"
                      className="mt-2 h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll receive order confirmation and tracking details here
                    </p>
                  </div>
                </div>
              </section>

              {/* Shipping Address Section */}
              <section className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Delivery Address</h2>
                    <p className="text-sm text-muted-foreground">Where should we deliver your order?</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Ahmed"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      autoComplete="given-name"
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Khan"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      autoComplete="family-name"
                      className="mt-2 h-11"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      autoComplete="tel"
                      className="mt-2 h-11"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      For delivery coordination and order updates
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Street Address <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="House 123, Street 456, Block ABC"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      autoComplete="street-address"
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="Karachi"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      autoComplete="address-level2"
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium">
                      State/Province
                    </Label>
                    <Input
                      id="state"
                      name="state"
                      type="text"
                      placeholder="Sindh"
                      value={formData.state}
                      onChange={handleInputChange}
                      autoComplete="address-level1"
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium">
                      Postal Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      type="text"
                      placeholder="75500"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      autoComplete="postal-code"
                      className="mt-2 h-11"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country" className="text-sm font-medium">
                      Country Code <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      type="text"
                      placeholder="PK"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      maxLength={2}
                      autoComplete="country"
                      className="mt-2 h-11"
                    />
                  </div>
                </div>
              </section>

              {/* Delivery Information */}
              <section className="bg-muted/30 border border-dashed rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Estimated Delivery</h3>
                    <p className="text-sm text-muted-foreground">
                      Standard delivery takes 3-5 business days within Pakistan
                    </p>
                  </div>
                </div>
              </section>

              {/* Shipping Method Section - COMMENTED OUT: Default shipping applied */}
              {/* <section>
                <h2 className="text-xl font-bold pb-4 border-b mb-6">
                  Shipping Method
                </h2>
                <RadioGroup value={selectedShipping} onValueChange={handleShippingChange} className="space-y-4">
                  {shippingMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${selectedShipping === method.id
                        ? "border-primary ring-2 ring-primary bg-primary/10"
                        : "border-input hover:border-primary"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value={method.id} id={method.id} />
                        <span className="font-medium">{method.name}</span>
                      </div>
                      <span className="font-bold">{formatPrice(method.price)}</span>
                    </label>
                  ))}
                </RadioGroup>
              </section> */}

              {/* Payment Section - COMMENTED OUT: Cash on Delivery Only */}
              {/* <section>
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
              </section> */}

              {/* Payment Method - Cash on Delivery */}
              <section className="bg-card border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Payment Method</h2>
                    <p className="text-sm text-muted-foreground">How you'll pay for your order</p>
                  </div>
                </div>
                <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Cash on Delivery</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pay with cash when your order is delivered to your doorstep
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Submit Button */}
              <div className="space-y-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 font-bold text-base shadow-lg hover:shadow-xl transition-all"
                  disabled={isSubmitting || items.length === 0}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Your Order...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Complete Order
                    </span>
                  )}
                </Button>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Truck className="w-4 h-4" />
                    <span>Free Delivery</span>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-2/5 mb-8 lg:mb-0">
            <div className="bg-card border rounded-xl p-6 lg:sticky lg:top-24 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h2 className="text-xl font-bold">Order Summary</h2>
                <span className="text-sm text-muted-foreground">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              ) : (
                <>
                  {/* Items List */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.product_id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0 border">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow">
                            {item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-2">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.material}
                          </p>
                        </div>
                        <p className="font-semibold text-sm whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="my-6 h-px bg-border"></div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-semibold">{formatPrice(subtotal)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <p className="text-muted-foreground">Shipping</p>
                      </div>
                      <p className="font-semibold text-green-600">Free</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-muted-foreground">Tax (10%)</p>
                      <p className="font-semibold">{formatPrice(taxAmount)}</p>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-border"></div>

                  {/* Total */}
                  <div className="flex justify-between items-center bg-primary/5 rounded-lg p-4">
                    <p className="font-bold text-lg">Total</p>
                    <p className="font-bold text-2xl text-primary">{formatPrice(total)}</p>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span className="text-muted-foreground">
                        Safe & secure checkout
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
            <div className="flex items-center gap-4">
              <Link href="/cart" className="hover:text-primary transition-colors font-medium">
                ← Return to Cart
              </Link>
              <span className="hidden md:inline">|</span>
              <p className="hidden md:inline">© 2024 WallDecor Co.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/help" className="hover:text-primary transition-colors">Help</Link>
              <Link href="/returns" className="hover:text-primary transition-colors">Returns</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


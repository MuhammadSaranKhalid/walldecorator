"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Truck, ChevronRight, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useCreate, useCreateMany } from "@refinedev/core";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import { useCartStore, CartItem } from "@/stores/cart-store";
import { usePrice } from "@/hooks/use-price";
import { toast } from "sonner";
import { supabaseBrowserClient } from "@/utils/supabase/client";
import { useEcommerceAnalytics } from "@/lib/analytics-events";

const checkoutSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  addressLine2: z.string(),
  city: z.string().min(1, "City is required"),
  state: z.string(),
  country: z.string().length(2, "Must be a 2-letter country code"),
  postalCode: z.string().min(1, "Postal code is required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { formatPrice } = usePrice();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
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
    },
  });

  const subtotal = getTotalPrice();
  const shippingCost = 0;
  const taxAmount = 0;
  const total = subtotal + shippingCost;

  const { mutateAsync: createAddress } = useCreate();
  const { mutateAsync: createOrder } = useCreate();
  const { mutateAsync: createOrderItems } = useCreateMany();

  const { addPaymentInfo, purchase } = useEcommerceAnalytics();

  const onSubmit = async (formData: CheckoutFormValues) => {
    console.log("[onSubmit] Form submitted", { formData, items, subtotal, total });

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    addPaymentInfo({
      currency: "PKR",
      value: total,
      payment_type: "Cash on Delivery",
      items: items.map((item) => ({
        item_id: item.product_id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: "Wall Decor",
      })),
    });

    setIsSubmitting(true);

    try {
      const { data: orderNumber, error: orderNumberError } =
        await supabaseBrowserClient.rpc("generate_order_number");

      if (orderNumberError || !orderNumber) {
        console.error("[onSubmit] Failed to generate order number", orderNumberError);
        throw new Error("Failed to generate order number");
      }

      console.log("[onSubmit] Order number generated:", orderNumber);

      // Step 1: Create shipping address
      const { data: { id: shippingAddressId } } = await createAddress({
        resource: "addresses",
        values: {
          customer_id: null,
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
      });

      console.log("[onSubmit] Step 1 — Shipping address created, id:", shippingAddressId);

      // Step 2: Create order
      const { data: { id: orderId } } = await createOrder({
        resource: "orders",
        values: {
          order_number: orderNumber,
          customer_id: null,
          customer_email: formData.email,
          status: "pending",
          subtotal: subtotal,
          shipping_cost: shippingCost,
          tax_amount: taxAmount,
          discount_amount: 0,
          total: total,
          shipping_address_id: shippingAddressId,
          billing_address_id: shippingAddressId,
          shipping_method: "Standard Delivery",
          payment_method: "cash_on_delivery",
          payment_status: "pending",
        },
      });

      console.log("[onSubmit] Step 2 — Order created, id:", orderId);

      // Step 3: Create order items (bulk insert via useCreateMany)
      await createOrderItems({
        resource: "order_items",
        values: items.map((item) => ({
          order_id: orderId,
          product_id: item.product_id,
          product_material_id: item.product_material_id || null,
          product_name: item.name,
          product_sku: item.sku || null,
          material_name: item.material,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        })),
      });

      console.log("[onSubmit] Step 3 — Order items created");

      purchase({
        transaction_id: orderNumber as string,
        value: total,
        currency: "PKR",
        tax: taxAmount,
        shipping: shippingCost,
        items: items.map((item) => ({
          item_id: item.product_id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          item_category: "Wall Decor",
        })),
      });

      console.log("[onSubmit] Order placed successfully:", orderNumber);
      toast.success(`Order ${orderNumber} placed successfully!`);
      clearCart();
      router.push(`/order-confirmation?order=${orderNumber}`);
    } catch (error) {
      console.error("[onSubmit] Order creation failed:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── LEFT PANEL ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:max-w-[58%]">
        {/* Header */}
        <header className="px-6 sm:px-10 xl:px-16 pt-8 pb-6">
          <Link
            href="/"
            className="inline-block text-2xl font-bold tracking-tight text-foreground mb-6"
          >
            Wall<span className="text-primary">Decorator</span>
          </Link>

          {/* Breadcrumb */}
          <nav
            aria-label="Checkout steps"
            className="flex items-center gap-1.5 text-sm"
          >
            <Link
              href="/cart"
              className="text-primary hover:underline font-medium"
            >
              Cart
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-semibold text-foreground">Information</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Payment</span>
          </nav>
        </header>

        {/* Mobile order summary toggle */}
        <div className="lg:hidden border-y bg-muted/30">
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-medium"
          >
            <span className="flex items-center gap-2 text-primary">
              {summaryOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              {summaryOpen ? "Hide" : "Show"} order summary
            </span>
            <span className="font-bold text-base">{formatPrice(total)}</span>
          </button>

          {summaryOpen && (
            <div className="px-6 pb-6">
              <MobileOrderSummary
                items={items}
                subtotal={subtotal}
                total={total}
                formatPrice={formatPrice}
              />
            </div>
          )}
        </div>

        {/* Form */}
        <div className="flex-1 px-6 sm:px-10 xl:px-16 py-8">
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-10">
            {/* ── Contact ────────────────────────────────── */}
            <section>
              <h2 className="text-base font-semibold mb-4">Contact</h2>
              <div className="rounded-lg border overflow-hidden">
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                      className="h-12 rounded-none border-0 border-b focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm"
                    />
                  )}
                />
              </div>
              {errors.email && (
                <FieldError errors={[errors.email]} className="mt-2" />
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Order confirmation and tracking details will be sent here.
              </p>
            </section>

            {/* ── Delivery ───────────────────────────────── */}
            <section>
              <h2 className="text-base font-semibold mb-4">Delivery</h2>
              <div className="rounded-lg border overflow-hidden divide-y">
                {/* First / Last name */}
                <div className="flex divide-x">
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        id="firstName"
                        type="text"
                        placeholder="First name"
                        autoComplete="given-name"
                        aria-invalid={fieldState.invalid}
                        className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm w-1/2"
                      />
                    )}
                  />
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        autoComplete="family-name"
                        aria-invalid={fieldState.invalid}
                        className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm w-1/2"
                      />
                    )}
                  />
                </div>

                {/* Phone */}
                <Controller
                  name="phone"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="phone"
                      type="tel"
                      placeholder="Phone number"
                      autoComplete="tel"
                      aria-invalid={fieldState.invalid}
                      className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm"
                    />
                  )}
                />

                {/* Address line 1 */}
                <Controller
                  name="address"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="address"
                      type="text"
                      placeholder="Address"
                      autoComplete="street-address"
                      aria-invalid={fieldState.invalid}
                      className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm"
                    />
                  )}
                />

                {/* Address line 2 (optional) */}
                <Controller
                  name="addressLine2"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      id="addressLine2"
                      type="text"
                      placeholder="Apartment, suite, etc. (optional)"
                      autoComplete="address-line2"
                      aria-invalid={fieldState.invalid}
                      className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm"
                    />
                  )}
                />

                {/* City / Postal */}
                <div className="flex divide-x">
                  <Controller
                    name="city"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        id="city"
                        type="text"
                        placeholder="City"
                        autoComplete="address-level2"
                        aria-invalid={fieldState.invalid}
                        className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm w-1/2"
                      />
                    )}
                  />
                  <Controller
                    name="postalCode"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        id="postalCode"
                        type="text"
                        placeholder="Postal code"
                        autoComplete="postal-code"
                        aria-invalid={fieldState.invalid}
                        className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm w-1/2"
                      />
                    )}
                  />
                </div>

                {/* State / Country */}
                <div className="flex divide-x">
                  <Controller
                    name="state"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        id="state"
                        type="text"
                        placeholder="State / Province"
                        autoComplete="address-level1"
                        aria-invalid={fieldState.invalid}
                        className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm w-1/2"
                      />
                    )}
                  />
                  <Controller
                    name="country"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Input
                        {...field}
                        id="country"
                        type="text"
                        placeholder="Country code (e.g. PK)"
                        maxLength={2}
                        autoComplete="country"
                        aria-invalid={fieldState.invalid}
                        className="h-12 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 text-sm w-1/2"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Delivery field errors */}
              {(errors.firstName || errors.lastName || errors.phone || errors.address || errors.city || errors.postalCode || errors.country) && (
                <FieldError
                  className="mt-2"
                  errors={[
                    errors.firstName,
                    errors.lastName,
                    errors.phone,
                    errors.address,
                    errors.city,
                    errors.postalCode,
                    errors.country,
                  ]}
                />
              )}

              {/* Delivery estimate */}
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Truck className="w-3.5 h-3.5" />
                <span>Standard delivery · 3–5 business days · Free</span>
              </div>
            </section>

            {/* ── Payment ────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold">Payment</h2>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  All transactions are secure and encrypted
                </span>
              </div>

              <div className="rounded-lg border overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-4 bg-primary/5 border-l-2 border-primary">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Cash on Delivery</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pay with cash when your order arrives
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Submit ─────────────────────────────────── */}
            <div className="space-y-4 pb-4">
              <Button
                type="submit"
                size="lg"
                className="w-full h-13 font-semibold text-base shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing…
                  </span>
                ) : (
                  "Complete Order"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By placing your order, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-foreground">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline hover:text-foreground"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="px-6 sm:px-10 xl:px-16 py-6 border-t mt-auto">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link href="/cart" className="hover:text-primary transition-colors">
              ← Return to cart
            </Link>
            <Link
              href="/shipping"
              className="hover:text-primary transition-colors"
            >
              Shipping policy
            </Link>
            <Link
              href="/contact"
              className="hover:text-primary transition-colors"
            >
              Contact us
            </Link>
            <span className="ml-auto hidden sm:block">
              © {new Date().getFullYear()} WallDecorator
            </span>
          </div>
        </footer>
      </div>

      {/* ── RIGHT PANEL — Order Summary ──────────────────────────── */}
      <aside className="hidden lg:flex lg:w-[42%] xl:w-[38%] bg-muted/40 dark:bg-muted/20 border-l flex-col">
        <div className="sticky top-0 max-h-screen overflow-y-auto px-8 xl:px-12 py-16 flex flex-col gap-8">
          {/* Item list */}
          <div className="space-y-5">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Your cart is empty.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-4"
                >
                  {/* Thumbnail */}
                  <div className="relative h-16 w-16 shrink-0 rounded-md border bg-background overflow-hidden shadow-sm">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    {/* Quantity badge */}
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-muted-foreground text-background text-[10px] font-bold flex items-center justify-center shadow">
                      {item.quantity}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 leading-snug">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.material}
                    </p>
                  </div>

                  {/* Price */}
                  <p className="text-sm font-semibold whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Price breakdown */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-green-600 dark:text-green-500">
                Free
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-base">Total</p>
              <p className="text-xs text-muted-foreground">Including all taxes</p>
            </div>
            <p className="text-2xl font-bold text-primary">
              {formatPrice(total)}
            </p>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
            <Shield className="w-4 h-4 shrink-0" />
            <span>Safe &amp; secure checkout — your data is protected</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ─── Mobile order summary (used in the collapsible panel) ─── */
function MobileOrderSummary({
  items,
  subtotal,
  total,
  formatPrice,
}: {
  items: CartItem[];
  subtotal: number;
  total: number;
  formatPrice: (price: number) => string;
}) {
  return (
    <div className="space-y-4 pt-4">
      {items.map((item) => (
        <div key={item.product_id} className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 rounded-md border bg-background overflow-hidden">
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              className="object-cover"
            />
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-muted-foreground text-background text-[10px] font-bold flex items-center justify-center shadow">
              {item.quantity}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-1">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.material}</p>
          </div>
          <p className="text-sm font-semibold whitespace-nowrap">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>
      ))}

      <div className="h-px bg-border" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-green-600">Free</span>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex justify-between font-bold">
        <span>Total</span>
        <span className="text-primary text-lg">{formatPrice(total)}</span>
      </div>
    </div>
  );
}

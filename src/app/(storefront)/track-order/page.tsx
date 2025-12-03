"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Search, Package, Truck, CheckCircle, Clock, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BlurhashImage } from "@/components/ui/blurhash-image";

import { getOrderByNumber, type OrderDetails } from "@/actions/order-actions";
import { usePrice } from "@/hooks/use-price";

const formSchema = z.object({
    orderNumber: z.string().min(1, "Order number is required"),
});

export default function TrackOrderPage() {
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { formatPrice } = usePrice();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            orderNumber: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true);
        setError(null);
        setOrder(null);

        try {
            const result = await getOrderByNumber(values.orderNumber);

            console.log(result.data)
            if (result.success && result.data) {
                setOrder(result.data);
            } else {
                setError("Order not found. Please check the order number and try again.");
            }
        } catch (err) {
            setError("An error occurred while fetching the order. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const getStatusStep = (status: string) => {
        switch (status.toLowerCase()) {
            case "pending":
            case "processing":
                return 1;
            case "shipped":
                return 2;
            case "delivered":
                return 3;
            case "cancelled":
                return -1;
            default:
                return 0;
        }
    };

    const currentStep = order ? getStatusStep(order.status) : 0;

    return (
        <main className="container mx-auto px-4 py-8 md:py-12 min-h-[60vh]">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Track Your Order</h1>
                    <p className="text-muted-foreground text-lg">
                        Enter your order number to check the current status and delivery details.
                    </p>
                </div>

                <Card className="border-2">
                    <CardContent className="pt-6">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
                                <FormField
                                    control={form.control}
                                    name="orderNumber"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Enter Order Number (e.g., ORD-123456)"
                                                        className="pl-9 h-12 text-base"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" size="lg" className="h-12 px-8 font-bold" disabled={loading}>
                                    {loading ? "Tracking..." : "Track Order"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center gap-3 border border-destructive/20">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                {order && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Timeline */}
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-xl">Order Status</CardTitle>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Order placed on {format(new Date(order.created_at), "MMMM d, yyyy")}
                                        </p>
                                    </div>
                                    <Badge
                                        variant={order.status === 'cancelled' ? "destructive" : "secondary"}
                                        className="w-fit text-base px-4 py-1 capitalize"
                                    >
                                        {order.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {order.status === 'cancelled' ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        This order has been cancelled.
                                    </div>
                                ) : (
                                    <div className="relative py-8">
                                        <div className="absolute left-0 top-1/2 w-full h-1 bg-muted -translate-y-1/2 hidden md:block" />
                                        <div className="absolute left-4 top-0 h-full w-1 bg-muted -translate-x-1/2 md:hidden" />

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
                                            {/* Step 1: Processing */}
                                            <div className={`flex md:flex-col items-center gap-4 md:gap-2 relative z-10 ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background transition-colors ${currentStep >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>
                                                    <Package className="h-4 w-4" />
                                                </div>
                                                <div className="md:text-center">
                                                    <p className="font-bold">Processing</p>
                                                    <p className="text-xs text-muted-foreground">We are preparing your order</p>
                                                </div>
                                            </div>

                                            {/* Step 2: Shipped */}
                                            <div className={`flex md:flex-col items-center gap-4 md:gap-2 relative z-10 ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background transition-colors ${currentStep >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>
                                                    <Truck className="h-4 w-4" />
                                                </div>
                                                <div className="md:text-center">
                                                    <p className="font-bold">Shipped</p>
                                                    {order.shipped_at && (
                                                        <p className="text-xs text-muted-foreground">{format(new Date(order.shipped_at), "MMM d, yyyy")}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Step 3: Delivered */}
                                            <div className={`flex md:flex-col items-center gap-4 md:gap-2 relative z-10 ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background transition-colors ${currentStep >= 3 ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>
                                                    <CheckCircle className="h-4 w-4" />
                                                </div>
                                                <div className="md:text-center">
                                                    <p className="font-bold">Delivered</p>
                                                    {order.delivered_at && (
                                                        <p className="text-xs text-muted-foreground">{format(new Date(order.delivered_at), "MMM d, yyyy")}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Order Details */}
                            <div className="md:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Order Items</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {order.order_items.map((item) => (
                                            <div key={item.id} className="flex gap-4">
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden border bg-muted shrink-0">
                                                    {item.product?.product_images?.[0] ? (
                                                        <BlurhashImage
                                                            src={item.product.product_images[0].thumbnail_url || item.product.product_images[0].original_url}
                                                            alt={item.product.product_images[0].alt_text || item.product_name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                                            <Package className="h-8 w-8 opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-semibold line-clamp-2">
                                                                {item.product?.slug ? (
                                                                    <Link href={`/products/${item.product.slug}`} className="hover:underline">
                                                                        {item.product_name}
                                                                    </Link>
                                                                ) : (
                                                                    item.product_name
                                                                )}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                Qty: {item.quantity} × {formatPrice(item.unit_price)}
                                                            </p>
                                                        </div>
                                                        <p className="font-bold">
                                                            {formatPrice(item.total_price)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <Separator />
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span>{formatPrice(order.total)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span>{order.shipping_method || "Standard"}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-lg pt-2">
                                                <span>Total</span>
                                                <span>{formatPrice(order.total)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Shipping Info */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Shipping Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {order.shipping_address ? (
                                            <div className="flex gap-3">
                                                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                                                <div className="text-sm">
                                                    <p className="font-semibold">
                                                        {order.shipping_address.first_name} {order.shipping_address.last_name}
                                                    </p>
                                                    <p>{order.shipping_address.address_line1}</p>
                                                    {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                                                    <p>
                                                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                                                    </p>
                                                    <p>{order.shipping_address.country}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No shipping address available</p>
                                        )}

                                        {order.tracking_number && (
                                            <>
                                                <Separator />
                                                <div className="space-y-2">
                                                    <p className="text-sm font-semibold">Tracking Number</p>
                                                    <div className="flex items-center gap-2 bg-muted p-2 rounded text-sm font-mono">
                                                        {order.tracking_number}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

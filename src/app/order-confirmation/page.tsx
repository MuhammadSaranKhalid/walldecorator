"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, Mail, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function OrderConfirmationPage() {
    const searchParams = useSearchParams();
    const orderNumber = searchParams.get("order");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    if (!orderNumber) {
        return (
            <main className="container mx-auto px-4 py-16 min-h-[60vh] flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground mb-4">No order information found.</p>
                        <Button asChild>
                            <Link href="/">Return Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    return (
        <main className="container mx-auto px-4 py-8 md:py-16 min-h-[60vh]">
            <div className="max-w-3xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        Order Confirmed!
                    </h1>
                    <p className="text-lg text-muted-foreground mb-2">
                        Thank you for your purchase
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Your order number is:{" "}
                        <span className="font-mono font-semibold text-foreground">
                            {orderNumber}
                        </span>
                    </p>
                </div>

                {/* Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Email Confirmation Card */}
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Check Your Email</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                We&apos;ve sent a confirmation email with your order details and
                                tracking information.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Order Status Card */}
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Package className="w-5 h-5 text-primary" />
                                </div>
                                <CardTitle className="text-lg">Order Processing</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                We&apos;re preparing your order for shipment. You&apos;ll receive
                                another email when it ships.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Separator className="my-8" />

                {/* What's Next Section */}
                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                    <h2 className="text-2xl font-bold mb-4">What&apos;s Next?</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Order Processing</h3>
                                <p className="text-sm text-muted-foreground">
                                    We&apos;re preparing your items for shipment
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Shipping Notification</h3>
                                <p className="text-sm text-muted-foreground">
                                    You&apos;ll receive an email with tracking information once your
                                    order ships
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                3
                            </div>
                            <div>
                                <h3 className="font-semibold mb-1">Delivery</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your beautiful wall decor arrives at your door
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
                    <Button asChild size="lg" className="flex-1 font-bold">
                        <Link href="/track-order">
                            <Package className="w-4 h-4 mr-2" />
                            Track Your Order
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="flex-1 font-bold">
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" />
                            Continue Shopping
                        </Link>
                    </Button>
                </div>

                {/* Help Section */}
                <Card className="mt-8 bg-muted/30 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <h3 className="font-semibold mb-2">Need Help?</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                If you have any questions about your order, please don&apos;t hesitate
                                to contact us.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                                <a
                                    href="mailto:support@walldecorator.com"
                                    className="text-primary hover:underline"
                                >
                                    support@walldecorator.com
                                </a>
                                <span className="hidden sm:inline text-muted-foreground">•</span>
                                <a
                                    href="tel:+1-555-123-4567"
                                    className="text-primary hover:underline"
                                >
                                    +1 (555) 123-4567
                                </a>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Number Reminder */}
                <div className="mt-8 text-center text-sm text-muted-foreground animate-in fade-in duration-500 delay-600">
                    <p>
                        Please keep your order number{" "}
                        <span className="font-mono font-semibold text-foreground">
                            {orderNumber}
                        </span>{" "}
                        for your records
                    </p>
                </div>
            </div>
        </main>
    );
}

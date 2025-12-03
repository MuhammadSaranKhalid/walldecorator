import { Metadata } from "next";
import { Truck, Globe, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
    title: "Shipping Policy | WallDecorator",
    description: "Information about our shipping rates, delivery times, and policies.",
};

export default function ShippingPage() {
    return (
        <main className="container px-4 md:px-6 py-12 md:py-24">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black tracking-tighter mb-4">Shipping Policy</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        We want to ensure your art arrives safely and on time. Here's everything you need to know about our shipping process.
                    </p>
                </div>

                <div className="grid gap-8">
                    {/* Shipping Methods */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Truck className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Shipping Methods & Rates</h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Standard Shipping</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="font-bold text-2xl">Free</span>
                                        <span className="text-muted-foreground">Orders over $100</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Otherwise $9.99 flat rate
                                    </p>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4 mr-2" />
                                        5-7 business days
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Express Shipping</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="font-bold text-2xl">$24.99</span>
                                        <span className="text-muted-foreground">Flat rate</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Priority handling and delivery
                                    </p>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4 mr-2" />
                                        2-3 business days
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>

                    <Separator />

                    {/* International Shipping */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Globe className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold">International Shipping</h2>
                        </div>
                        <div className="prose max-w-none text-muted-foreground">
                            <p>
                                We currently ship to select international destinations including Canada, UK, Australia, and most EU countries. International shipping rates are calculated at checkout based on the destination and weight of the package.
                            </p>
                            <p className="mt-4">
                                Please note that international orders may be subject to import duties and taxes, which are the responsibility of the recipient. Delivery times for international orders typically range from 10-15 business days.
                            </p>
                        </div>
                    </section>

                    <Separator />

                    {/* Processing Time */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Clock className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Order Processing</h2>
                        </div>
                        <div className="prose max-w-none text-muted-foreground">
                            <p>
                                All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
                            </p>
                            <p className="mt-4">
                                If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery. If there will be a significant delay in shipment of your order, we will contact you via email or telephone.
                            </p>
                        </div>
                    </section>

                    <Separator />

                    {/* Damages */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Damages & Issues</h2>
                        </div>
                        <div className="prose max-w-none text-muted-foreground">
                            <p>
                                WallDecorator is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim.
                            </p>
                            <p className="mt-4">
                                Please save all packaging materials and damaged goods before filing a claim. We recommend taking photos of the damaged packaging and product as soon as it arrives.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}

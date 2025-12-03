import { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Heart, Shield, Truck, Users } from "lucide-react";

export const metadata: Metadata = {
    title: "About Us | WallDecorator",
    description: "Learn about WallDecorator's mission to bring premium wall art to your home.",
};

export default function AboutPage() {
    return (
        <main className="flex-1">
            {/* Hero Section */}
            <section className="relative h-[400px] flex items-center justify-center bg-muted/30 overflow-hidden">
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Our Story
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        We believe that every wall tells a story. We're here to help you tell yours with premium, curated wall art.
                    </p>
                </div>
                <div className="absolute inset-0 z-0 opacity-10 pattern-grid-lg" />
            </section>

            {/* Mission Section */}
            <section className="py-16 md:py-24 px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mx-auto max-w-7xl">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold tracking-tight">Crafting Beauty for Your Home</h2>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            Founded in 2023, WallDecorator started with a simple mission: to make high-quality, artistic wall decor accessible to everyone. We collaborate with talented artists and use premium materials to create pieces that transform spaces.
                        </p>
                        <p className="text-muted-foreground text-lg leading-relaxed">
                            From modern minimalist prints to classic canvas textures, our collection is curated to suit diverse tastes and interior styles.
                        </p>
                        <div className="pt-4">
                            <Button asChild size="lg">
                                <Link href="/products">
                                    Explore Collection <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="relative aspect-square md:aspect-[4/3] bg-muted rounded-2xl overflow-hidden shadow-xl">
                        {/* Placeholder for About Image - In a real app, use a real image */}
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                            <span className="text-muted-foreground font-medium">About Us Image</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 md:py-24 bg-muted/30">
                <div className="container px-4 md:px-6 mx-auto max-w-7xl">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Why Choose WallDecorator?</h2>
                        <p className="text-muted-foreground">
                            We're committed to quality, sustainability, and customer satisfaction in everything we do.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Heart,
                                title: "Curated with Love",
                                description: "Hand-picked designs from talented artists around the world."
                            },
                            {
                                icon: Shield,
                                title: "Premium Quality",
                                description: "Museum-grade materials that ensure your art lasts a lifetime."
                            },
                            {
                                icon: Truck,
                                title: "Fast Shipping",
                                description: "Secure packaging and reliable delivery to your doorstep."
                            },
                            {
                                icon: Users,
                                title: "Customer First",
                                description: "Dedicated support team ready to help with any questions."
                            }
                        ].map((value, index) => (
                            <div key={index} className="bg-background p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                                    <value.icon className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                                <p className="text-muted-foreground text-sm">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team/CTA Section */}
            <section className="py-16 md:py-24 container px-4 md:px-6 text-center mx-auto max-w-7xl">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-3xl font-bold tracking-tight">Join Our Community</h2>
                    <p className="text-muted-foreground text-lg">
                        Follow us on social media for daily inspiration, styling tips, and exclusive offers.
                        We love seeing how you style your WallDecorator pieces!
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" asChild>
                            <Link href="/contact">Contact Us</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/products">Shop Now</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </main>
    );
}

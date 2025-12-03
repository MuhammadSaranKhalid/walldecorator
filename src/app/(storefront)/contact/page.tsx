"use client";

import { useState } from "react";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success("Message sent successfully! We'll get back to you soon.");
        setIsSubmitting(false);
        (e.target as HTMLFormElement).reset();
    };

    return (
        <main className="flex-1">
            {/* Hero Section */}
            <section className="relative h-[400px] flex items-center justify-center bg-muted/30 overflow-hidden">
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        Get in Touch
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        Have a question about our products, shipping, or custom orders? We're here to help!
                    </p>
                </div>
                <div className="absolute inset-0 z-0 opacity-10 pattern-grid-lg" />
            </section>

            {/* Contact Section */}
            <section className="py-16 md:py-24 px-4 md:px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Information */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold">Contact Information</h2>
                            <p className="text-muted-foreground">
                                Fill out the form and our team will get back to you within 24 hours.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                        <Mail className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Email</h3>
                                        <a href="mailto:support@walldecorator.com" className="text-muted-foreground hover:text-primary transition-colors">
                                            support@walldecorator.com
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                        <Phone className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Phone</h3>
                                        <a href="tel:+15551234567" className="text-muted-foreground hover:text-primary transition-colors">
                                            +1 (555) 123-4567
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Office</h3>
                                        <p className="text-muted-foreground">
                                            123 Art Avenue, Design District<br />
                                            New York, NY 10001
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Card className="bg-muted/50 border-none">
                            <CardHeader>
                                <CardTitle>Business Hours</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Monday - Friday</span>
                                    <span className="font-medium">9:00 AM - 6:00 PM EST</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Saturday</span>
                                    <span className="font-medium">10:00 AM - 4:00 PM EST</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Sunday</span>
                                    <span>Closed</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Send us a Message</CardTitle>
                            <CardDescription>
                                We'd love to hear from you. Please fill out this form.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="firstName" className="text-sm font-medium">First Name</label>
                                        <Input id="firstName" placeholder="John" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="lastName" className="text-sm font-medium">Last Name</label>
                                        <Input id="lastName" placeholder="Doe" required />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                                    <Input id="email" type="email" placeholder="john@example.com" required />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="text-sm font-medium">Subject</label>
                                    <Input id="subject" placeholder="Order inquiry, Custom request, etc." required />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="message" className="text-sm font-medium">Message</label>
                                    <Textarea
                                        id="message"
                                        placeholder="How can we help you?"
                                        className="min-h-[150px]"
                                        required
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        "Sending..."
                                    ) : (
                                        <>
                                            Send Message <Send className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                    </div>
                </div>
            </section>
        </main>
    );
}

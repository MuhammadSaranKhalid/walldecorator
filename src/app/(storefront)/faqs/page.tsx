import { Metadata } from "next";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
    title: "Frequently Asked Questions | WallDecorator",
    description: "Find answers to common questions about our products, shipping, and returns.",
};

export default function FAQsPage() {
    const faqs = [
        {
            category: "Orders & Shipping",
            items: [
                {
                    question: "How long will it take to receive my order?",
                    answer: "Standard shipping typically takes 5-7 business days within the US. Express shipping takes 2-3 business days. International orders usually arrive within 10-15 business days."
                },
                {
                    question: "Do you ship internationally?",
                    answer: "Yes, we ship to select countries including Canada, UK, Australia, and most EU countries. Shipping rates and delivery times vary by location."
                },
                {
                    question: "Can I track my order?",
                    answer: "Yes! Once your order ships, you'll receive a confirmation email with a tracking number. You can also track your order status directly on our website using the 'Track Order' page."
                }
            ]
        },
        {
            category: "Products & Care",
            items: [
                {
                    question: "What materials do you use?",
                    answer: "We use premium, museum-grade materials. Our canvas prints use archival inks on poly-cotton blend canvas. Our framed prints feature solid wood frames and UV-protective acrylic glazing."
                },
                {
                    question: "Does the art come with hanging hardware?",
                    answer: "Yes, all our wall art comes ready to hang with pre-installed hardware. We also include a hanging kit with instructions to make installation easy."
                },
                {
                    question: "How do I clean my wall art?",
                    answer: "For canvas and framed prints, lightly dust with a soft, dry microfiber cloth. Avoid using water, cleaning fluids, or abrasive materials as these can damage the finish."
                }
            ]
        },
        {
            category: "Returns & Exchanges",
            items: [
                {
                    question: "What is your return policy?",
                    answer: "We offer a 30-day satisfaction guarantee. If you're not completely happy with your purchase, you can return it within 30 days of delivery for a full refund or exchange."
                },
                {
                    question: "What if my order arrives damaged?",
                    answer: "Please contact us immediately at support@walldecorator.com with photos of the damage. We will arrange for a replacement to be sent to you right away at no additional cost."
                }
            ]
        }
    ];

    return (
        <main className="container px-4 md:px-6 py-12 md:py-24">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black tracking-tighter mb-4">Frequently Asked Questions</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Quick answers to your most common questions. Can't find what you're looking for? Contact our support team.
                    </p>
                </div>

                <div className="space-y-12">
                    {faqs.map((section, index) => (
                        <div key={index} className="space-y-6">
                            <h2 className="text-2xl font-bold">{section.category}</h2>
                            <Accordion type="single" collapsible className="w-full">
                                {section.items.map((item, itemIndex) => (
                                    <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                                        <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground">
                                            {item.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}

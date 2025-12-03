import { Metadata } from "next";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
    title: "Terms & Conditions | WallDecorator",
    description: "Read our terms of service, privacy policy, and conditions of use.",
};

export default function TermsPage() {
    return (
        <main className="container px-4 md:px-6 py-12 md:py-24">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-black tracking-tighter mb-4">Terms & Conditions</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Please read these terms carefully before using our service.
                    </p>
                </div>

                <div className="prose prose-gray max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
                        <p className="text-muted-foreground">
                            By accessing or using the WallDecorator website, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you disagree with any part of the terms, you may not access the service.
                        </p>
                    </section>

                    <Separator />

                    <section>
                        <h2 className="text-2xl font-bold mb-4">2. Intellectual Property</h2>
                        <p className="text-muted-foreground">
                            The service and its original content, features, and functionality are and will remain the exclusive property of WallDecorator and its licensors. The service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                        </p>
                    </section>

                    <Separator />

                    <section>
                        <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                        <p className="text-muted-foreground">
                            When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our service.
                        </p>
                        <p className="text-muted-foreground mt-4">
                            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password, whether your password is with our service or a third-party service.
                        </p>
                    </section>

                    <Separator />

                    <section>
                        <h2 className="text-2xl font-bold mb-4">4. Purchases</h2>
                        <p className="text-muted-foreground">
                            If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
                        </p>
                        <p className="text-muted-foreground mt-4">
                            You represent and warrant that: (i) you have the legal right to use any credit card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct, and complete.
                        </p>
                    </section>

                    <Separator />

                    <section>
                        <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
                        <p className="text-muted-foreground">
                            In no event shall WallDecorator, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
                        </p>
                    </section>

                    <Separator />

                    <section>
                        <h2 className="text-2xl font-bold mb-4">6. Changes</h2>
                        <p className="text-muted-foreground">
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                        </p>
                    </section>

                    <Separator />

                    <section>
                        <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
                        <p className="text-muted-foreground">
                            If you have any questions about these Terms, please contact us at support@walldecorator.com.
                        </p>
                    </section>
                </div>
            </div>
        </main>
    );
}

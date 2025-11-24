import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="container mx-auto px-4 pt-8 pb-12 md:pt-16 md:pb-24">
      <div 
        className="flex min-h-[520px] flex-col items-center justify-center gap-6 rounded-xl bg-cover bg-center bg-no-repeat p-8 text-center relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.6) 100%), url("https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop")`
        }}
      >
        <div className="flex flex-col gap-4 max-w-2xl z-10">
          <h1 className="text-white text-4xl font-black leading-tight tracking-tighter md:text-6xl">
            Art That Defines Your Space
          </h1>
          <p className="text-gray-200 text-lg font-normal leading-normal">
            Discover unique wall decor in acrylic, steel, iron, and wood to transform your home.
          </p>
        </div>
        <Link href="/products">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold z-10">
            Explore Collections
          </Button>
        </Link>
      </div>
    </section>
  );
}


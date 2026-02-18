"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    id: 1,
    title: "Modern Abstract Art",
    description: "Elevate your space with our exclusive collection of contemporary acrylic designs.",
    image: "https://images.unsplash.com/photo-1549887534-1541e9326642?q=80&w=2070&auto=format&fit=crop",
    cta: "Shop Abstract",
    href: "/products?category=abstract",
  },
  {
    id: 2,
    title: "Elegant Metal Work",
    description: "Discover the timeless beauty of handcrafted steel and iron wall decor.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2070&auto=format&fit=crop",
    cta: "View Metal Art",
    href: "/products?category=metal",
  },
  {
    id: 3,
    title: "Nature & Wood",
    description: "Bring the warmth of nature indoors with our sustainable wood wall art pieces.",
    image: "https://images.unsplash.com/photo-1582560475093-6e3e5c92bda7?q=80&w=2069&auto=format&fit=crop",
    cta: "Explore Wood",
    href: "/products?category=wood",
  },
];

export function HeroSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <section className="relative w-full overflow-hidden -mt-20">
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {HERO_SLIDES.map((slide, index) => (
            <CarouselItem key={slide.id}>
              <div className="relative h-[80vh] min-h-[600px] w-full overflow-hidden">
                {/* Parallax-like Background Image */}
                <div
                  className={cn(
                    "absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-2000 ease-out",
                    current === index + 1 ? "scale-110" : "scale-100"
                  )}
                  style={{
                    backgroundImage: `url("${slide.image}")`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/40" />
                </div>

                {/* Content Container */}
                <div className="container relative mx-auto flex h-full flex-col justify-center px-4 md:px-8">
                  <div
                    className={cn(
                      "max-w-3xl space-y-8 rounded-3xl bg-white/10 p-8 backdrop-blur-md border border-white/20 shadow-2xl transition-all duration-700 md:p-12",
                      current === index + 1 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
                    )}
                  >
                    <div className="space-y-4">
                      <div className="inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-semibold text-primary-foreground backdrop-blur-sm border border-primary/30">
                        New Collection 2024
                      </div>
                      <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
                        {slide.title}
                      </h1>
                      <p className="max-w-xl text-lg font-medium text-gray-100 md:text-xl leading-relaxed">
                        {slide.description}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row pt-4">
                      <Link href={slide.href}>
                        <Button size="lg" className="w-full bg-white text-black hover:bg-gray-100 font-bold sm:w-auto text-lg px-8 py-6 rounded-full shadow-lg transition-transform hover:scale-105">
                          {slide.cta}
                        </Button>
                      </Link>
                      <Link href="/products">
                        <Button size="lg" variant="outline" className="w-full bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white font-bold sm:w-auto text-lg px-8 py-6 rounded-full backdrop-blur-sm">
                          View All Collections
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Custom Navigation & Progress */}
        <div className="absolute bottom-8 left-0 right-0 z-20">
          <div className="container mx-auto flex items-center justify-between px-4 md:px-8">
            {/* Progress Indicators */}
            <div className="flex gap-3">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    current === i + 1 ? "w-12 bg-white" : "w-6 bg-white/40 hover:bg-white/60"
                  )}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="hidden md:flex gap-4">
              <CarouselPrevious className="static translate-y-0 h-14 w-14 border-white/20 bg-black/30 text-white hover:bg-white hover:text-black hover:border-white transition-all duration-300 backdrop-blur-sm" />
              <CarouselNext className="static translate-y-0 h-14 w-14 border-white/20 bg-black/30 text-white hover:bg-white hover:text-black hover:border-white transition-all duration-300 backdrop-blur-sm" />
            </div>
          </div>
        </div>
      </Carousel>
    </section>
  );
}


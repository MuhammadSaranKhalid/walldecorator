import Image from 'next/image';

export default function HeroSection() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      <Image
        alt="Modern living room with statement metal wall art"
        className="absolute inset-0 w-full h-full object-cover"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrChf7boHOkimtVZruybNtpCxGExkfNEzVDITgWwQMW-RKcDRFB94IFwqJ7v2S-Kqno9_YT2Yc8brrYzC_KE4jjFW6yoT-SGDj8nijgIGX9FR1KweITob6TARcU5_wEbKwq8ZV7nj1IylTk_OoEx2VoP3LxxbzHYvqGnLowSAh6HzxNht2KR9tPCE7mxPZUXKHnOjaUw5DTwz-tdfhpo0C0BC-fVfufT8QHvmJsBYNF02uM3Jt4_LhtpX1zSwXM7B7ix6aXV-cRBU"
        fill
        priority
        unoptimized
      />

      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
          Transform Your Space with Statement Metal Art
        </h1>
        <p className="text-lg md:text-xl mb-10 text-gray-100 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Precision-crafted laser-cut designs that turn your walls into a gallery. Custom sizes and materials available.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            className="px-8 py-4 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy-dark font-bold rounded-md transition-all transform hover:scale-105 shadow-xl text-lg"
            href="#"
          >
            Shop the Collection
          </a>
        </div>
      </div>
    </section>
  );
}

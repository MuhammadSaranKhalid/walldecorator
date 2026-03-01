import Image from 'next/image';

export default function CustomCraftSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-6">Your Vision, Our Craft</h2>
            <p className="text-gray-600 leading-relaxed text-sm max-w-lg">
              Have a unique idea? We specialize in bringing custom wall decor to life. Describe your vision below, and our designers will collaborate with you to create a piece that&apos;s truly yours.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-sm relative h-[400px]">
            <Image
              alt="Crafting tools and materials"
              className="w-full h-auto object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhehHTxXFanmuEpilGW_UyY7j8tg2PsWPN2s173PHGMUTj3_Feaw0rRgsjCLsL07BkMUzcywJHgCtjIO5bKoBIJr2VrT6Vyqf_6s1_FxXUyNsZs_7YRjnYE5q3K2ZRiF4k1g3QAPuX9_eItIFGIlhMV_8SsbuQQdq6ygyAh2RyWx51Ctzf2LnZnzRtBk2cZ4J9OLaA1CJAqVKhxCXVufXOGCTaElxtfiOSmMdNTpS_x1AgKYxUcrffJP1oO8h6Qo4ZXK8IMZylzWk"
              fill
              unoptimized
            />
          </div>
        </div>

        <div className="bg-white p-0" data-purpose="lead-capture-form">
          <form className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="email">
                Email
              </label>
              <input
                className="w-full border-gray-200 rounded-md focus:ring-brand-gold focus:border-brand-gold text-sm"
                id="email"
                placeholder="you@example.com"
                type="email"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="material">
                Material
              </label>
              <select
                className="w-full border-gray-200 rounded-md focus:ring-brand-gold focus:border-brand-gold text-sm text-gray-500"
                id="material"
              >
                <option value="">Select a material</option>
                <option value="steel">Powder Coated Steel</option>
                <option value="stainless">Stainless Steel</option>
                <option value="aluminum">Aluminum</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="description">
                Describe your customization
              </label>
              <textarea
                className="w-full border-gray-200 rounded-md focus:ring-brand-gold focus:border-brand-gold text-sm"
                id="description"
                placeholder="E.g., size, color, specific design elements..."
                rows={4}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Upload design file
              </label>
              <div className="upload-box bg-gray-50 rounded-lg p-10 flex flex-col items-center justify-center text-center">
                <svg className="h-10 w-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                </svg>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="text-brand-gold font-medium cursor-pointer">Upload a file</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            <button
              className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-navy-dark font-semibold py-3 rounded-md transition-colors text-sm shadow-md shadow-brand-navy/10"
              type="submit"
            >
              Get a Quote
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

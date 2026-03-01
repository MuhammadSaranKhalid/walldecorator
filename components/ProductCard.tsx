import Image from 'next/image';

interface ProductCardProps {
  title: string;
  material: string;
  price: string;
  imageUrl: string;
  imageAlt: string;
  showPlaceholder?: boolean;
}

export default function ProductCard({
  title,
  material,
  price,
  imageUrl,
  imageAlt,
  showPlaceholder = false
}: ProductCardProps) {
  return (
    <div className="product-card group cursor-pointer" data-purpose="product-item">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
        {showPlaceholder ? (
          <div className="flex items-center justify-center border w-full h-full">
            <div className="text-center text-gray-400">
              <svg className="h-10 w-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
              </svg>
              <span className="text-xs">Image failed to load</span>
            </div>
          </div>
        ) : (
          <Image
            alt={imageAlt}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            src={imageUrl}
            fill
            unoptimized
          />
        )}
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-gray-500 mb-2">{material}</p>
      <p className="text-sm font-bold">{price}</p>
    </div>
  );
}

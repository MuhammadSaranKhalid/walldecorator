import Link from "next/link";
import { cn } from "@/lib/utils";
import { BlurhashImage } from "@/components/ui/blurhash-image";

import { usePrice } from "@/hooks/use-price";
import { useEcommerceAnalytics } from "@/lib/analytics-events";
import { getImageSizes } from "@/lib/image-helpers";

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  material: string;
  price: number;
  image_url: string;
  blurhash?: string;
  className?: string;
  // Priority loading for above-the-fold images
  priority?: boolean;
}

export function ProductCard({
  id,
  slug,
  name,
  material,
  price,
  image_url,
  blurhash,
  className,
  priority = false,
}: ProductCardProps) {
  const { formatPrice } = usePrice();

  // Analytics
  const { selectItem } = useEcommerceAnalytics();

  const handleProductClick = () => {
    selectItem({
      item_list_id: "all_products",
      item_list_name: "All Products",
      items: [{
        item_id: id,
        item_name: name,
        price,
        item_category: "Wall Decor",
      }]
    });
  };

  return (
    <Link
      href={`/products/${slug}`}
      className={cn("flex flex-col gap-3 group", className)}
      onClick={handleProductClick}
    >
      <div className="relative w-full overflow-hidden rounded-lg aspect-square bg-muted">
        <BlurhashImage
          src={image_url}
          alt={name}
          blurhash={blurhash}
          sizes={getImageSizes('card')}
          fill
          priority={priority}
          className="w-full h-full transition-transform duration-300 group-hover:scale-105 p-2"
          objectFit="contain"
        />
      </div>
      <div>
        <p className="text-foreground text-base font-medium leading-normal">{name}</p>
        <p className="text-muted-foreground text-sm font-normal leading-normal">{material}</p>
        <p className="text-foreground text-sm font-semibold leading-normal">{formatPrice(price)}</p>
      </div>
    </Link>
  );
}


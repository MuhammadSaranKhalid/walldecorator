import Link from "next/link";
import { cn } from "@/lib/utils";
import { BlurhashImage } from "@/components/ui/blurhash-image";

import { usePrice } from "@/hooks/use-price";

interface ProductCardProps {
  id: string;
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
  name,
  material,
  price,
  image_url,
  blurhash,
  className,
  priority = false,
}: ProductCardProps) {
  const { formatPrice } = usePrice();

  return (
    <Link href={`/products/${id}`} className={cn("flex flex-col gap-3 group", className)}>
      <div className="relative w-full overflow-hidden rounded-lg aspect-[3/4] bg-muted">
        <BlurhashImage
          src={image_url}
          alt={name}
          blurhash={blurhash}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          fill
          priority={priority}
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
          objectFit="cover"
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


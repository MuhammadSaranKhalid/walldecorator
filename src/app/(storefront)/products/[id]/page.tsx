import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Facebook, Twitter, Instagram } from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { ProductActions } from "@/components/product/product-actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Material {
  id: string;
  name: string;
  slug: string;
}

interface ProductMaterial {
  id: string;
  material_id: string;
  price: number;
  inventory_quantity: number;
  finish?: string;
  materials?: Material;
}

interface ProductImage {
  id: string;
  product_id: string;
  original_url: string;
  alt_text?: string;
  is_primary: boolean;
  display_order: number;
  thumbnail_url?: string;
  medium_url?: string;
  large_url?: string;
  blurhash?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  dimensions_width?: number;
  dimensions_height?: number;
  dimensions_depth?: number;
  weight?: number;
  categories?: Category;
  product_materials?: ProductMaterial[];
  product_images?: ProductImage[];
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_materials(id, material_id, price, inventory_quantity, finish, materials(id, name, slug)),
      product_images(id, product_id, original_url, alt_text, is_primary, display_order, thumbnail_url, medium_url, large_url, blurhash),
      categories(id, name, slug)
    `
    )
    .eq("id", slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Product;
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0];
  const price = product.product_materials?.[0]?.price;

  return {
    title: `${product.name} | WallDecorator`,
    description: product.description || `Buy ${product.name} - Premium wall decor from WallDecorator`,
    openGraph: {
      title: product.name,
      description: product.description || `Buy ${product.name} - Premium wall decor`,
      images: primaryImage ? [
        {
          url: primaryImage.large_url || primaryImage.original_url,
          width: 1200,
          height: 1200,
          alt: primaryImage.alt_text || product.name,
        },
      ] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description || `Buy ${product.name}`,
      images: primaryImage ? [primaryImage.large_url || primaryImage.original_url] : [],
    },
    other: {
      "product:price:amount": price?.toString() || "0",
      "product:price:currency": "USD",
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  // Get sorted images with all variants
  const productImages = product.product_images || [];

  // Get materials with prices
  const materials =
    product.product_materials?.map((pm) => ({
      id: pm.id,
      material_id: pm.material_id,
      name: pm.materials?.name || "Unknown",
      price: pm.price,
      inventory: pm.inventory_quantity,
    })) || [];

  // Get primary image for cart
  const primaryImage = productImages.find((img) => img.is_primary) || productImages[0];
  const currentImageUrl = primaryImage?.thumbnail_url || primaryImage?.original_url || "";

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Image Gallery */}
        <ProductImageGallery images={productImages} productName={product.name} />

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tighter">
              {product.name}
            </h1>
            {product.sku && (
              <p className="text-muted-foreground text-sm font-mono mt-2">
                SKU: {product.sku}
              </p>
            )}
          </div>

          {/* Interactive Product Actions */}
          <ProductActions
            productId={product.id}
            productName={product.name}
            productSku={product.sku}
            materials={materials}
            currentImageUrl={currentImageUrl}
          />

          {/* Share */}
          <div className="flex items-center gap-4 border-t pt-6">
            <span className="text-sm font-bold">Share:</span>
            <div className="flex gap-3">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Share on Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="border-t mt-8 md:mt-12 pt-8">
        <Tabs defaultValue="description" className="w-full">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            {(product.dimensions_width ||
              product.dimensions_height ||
              product.dimensions_depth ||
              product.weight) && (
                <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
              )}
            <TabsTrigger value="care">Care Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="py-6">
            <p className="text-muted-foreground text-base leading-relaxed">
              {product.description}
            </p>
          </TabsContent>

          {(product.dimensions_width ||
            product.dimensions_height ||
            product.dimensions_depth ||
            product.weight) && (
              <TabsContent value="dimensions" className="py-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {product.dimensions_width && (
                    <div>
                      <p className="text-sm font-bold mb-1">Width</p>
                      <p className="text-muted-foreground">
                        {product.dimensions_width} inches
                      </p>
                    </div>
                  )}
                  {product.dimensions_height && (
                    <div>
                      <p className="text-sm font-bold mb-1">Height</p>
                      <p className="text-muted-foreground">
                        {product.dimensions_height} inches
                      </p>
                    </div>
                  )}
                  {product.dimensions_depth && (
                    <div>
                      <p className="text-sm font-bold mb-1">Depth</p>
                      <p className="text-muted-foreground">
                        {product.dimensions_depth} inches
                      </p>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <p className="text-sm font-bold mb-1">Weight</p>
                      <p className="text-muted-foreground">
                        {product.weight} lbs
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

          <TabsContent value="care" className="py-6">
            <p className="text-muted-foreground text-base leading-relaxed">
              Wipe clean with a soft, dry cloth. Avoid harsh chemicals or
              abrasive materials. For metal pieces, use metal polish
              occasionally to maintain shine.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            sku: product.sku,
            image: productImages.map((img) => img.large_url || img.original_url),
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "USD",
              lowPrice: Math.min(...materials.map((m) => m.price)),
              highPrice: Math.max(...materials.map((m) => m.price)),
              availability: materials.some((m) => m.inventory > 0)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            },
          }),
        }}
      />
    </main>
  );
}

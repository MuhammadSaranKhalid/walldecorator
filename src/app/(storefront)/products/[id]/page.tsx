import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Facebook, Twitter, Instagram, MessageCircle } from "lucide-react";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductImageGallery } from "@/components/product/product-image-gallery";
import { ProductActions } from "@/components/product/product-actions";
import { ProductShare } from "@/components/product/product-share";
import { ProductAnalyticsWrapper } from "@/components/product/product-analytics-wrapper";
import { getImageUrl } from "@/lib/image-helpers";

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
  is_available?: boolean;
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
      product_materials!inner(id, material_id, price, inventory_quantity, finish, is_available, materials(id, name, slug)),
      product_images!product_images_product_id_fkey(id, product_id, original_url, alt_text, is_primary, display_order, thumbnail_url, medium_url, large_url, blurhash),
      categories(id, name, slug)
    `
    )
    .eq("slug", slug)
    .eq("status", "active")
    .eq("product_materials.is_available", true)
    .order("display_order", { foreignTable: "product_images" })
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
      description: "The product you're looking for could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const primaryImage = product.product_images?.find((img) => img.is_primary) || product.product_images?.[0];
  const price = product.product_materials?.[0]?.price;
  const minPrice = product.product_materials && product.product_materials.length > 0
    ? Math.min(...product.product_materials.map((m) => m.price))
    : price;
  const maxPrice = product.product_materials && product.product_materials.length > 0
    ? Math.max(...product.product_materials.map((m) => m.price))
    : price;

  // Use large variant (1200px) for social media sharing images
  const shareImageUrl = getImageUrl(primaryImage, 'large');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const productUrl = `${siteUrl}/products/${product.slug}`;

  // Generate keywords from product data
  const keywords = [
    product.name,
    product.categories?.name,
    'wall decor',
    'home decor',
    ...(product.product_materials?.map(pm => pm.materials?.name).filter(Boolean) || []),
  ].filter(Boolean);

  return {
    title: `${product.name} | WallDecorator`,
    description: product.description || `Buy ${product.name} - Premium wall decor from WallDecorator. Available in multiple materials and finishes.`,
    keywords: keywords.join(', '),
    authors: [{ name: 'WallDecorator' }],
    creator: 'WallDecorator',
    publisher: 'WallDecorator',
    alternates: {
      canonical: productUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: product.name,
      description: product.description || `Buy ${product.name} - Premium wall decor`,
      url: productUrl,
      images: shareImageUrl ? [
        {
          url: shareImageUrl,
          width: 1200,
          height: 1200,
          alt: primaryImage?.alt_text || product.name,
        },
      ] : [],
      type: "website",
      siteName: "WallDecorator",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description || `Buy ${product.name}`,
      images: shareImageUrl ? [shareImageUrl] : [],
      site: "@walldecorator",
      creator: "@walldecorator",
    },
    other: {
      "og:type": "product",
      "product:brand": "WallDecorator",
      "product:availability": product.product_materials?.some(m => m.inventory_quantity > 0) ? "in stock" : "out of stock",
      "product:condition": "new",
      "product:price:amount": minPrice?.toString() || "0",
      "product:price:currency": "PKR",
      ...(product.categories?.name && { "product:category": product.categories.name }),
      ...(product.sku && { "product:retailer_item_id": product.sku }),
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  console.log(product);

  if (!product) {
    notFound();
  }

  // Get sorted images with all variants (ordered by display_order from query)
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

  // Get primary image for cart - use thumbnail size (400px) for cart preview
  const primaryImage = productImages.find((img) => img.is_primary) || productImages[0];
  const currentImageUrl = getImageUrl(primaryImage, 'thumbnail');

  // Get the lowest price for sharing
  const minPrice = materials.length > 0 ? Math.min(...materials.map((m) => m.price)) : undefined;

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
          <ProductShare
            productName={product.name}
            productDescription={product.description}
            price={minPrice}
          />
        </div>
      </div>

      <ProductAnalyticsWrapper
        product={{
          id: product.id,
          name: product.name,
          price: minPrice || 0,
          category: product.categories?.name
        }}
      />

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
            brand: {
              "@type": "Brand",
              name: "WallDecorator"
            },
            image: productImages.map((img) => getImageUrl(img, 'large')).filter(Boolean),
            offers: materials.length > 0 ? {
              "@type": "AggregateOffer",
              priceCurrency: "PKR",
              lowPrice: Math.min(...materials.map((m) => m.price)),
              highPrice: Math.max(...materials.map((m) => m.price)),
              offerCount: materials.length,
              availability: materials.some((m) => m.inventory > 0)
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/products/${product.slug}`,
              seller: {
                "@type": "Organization",
                name: "WallDecorator"
              },
            } : undefined,
            ...(product.categories?.name && {
              category: product.categories.name
            }),
            ...(product.dimensions_width && product.dimensions_height && {
              width: {
                "@type": "QuantitativeValue",
                value: product.dimensions_width,
                unitCode: "INH"
              },
              height: {
                "@type": "QuantitativeValue",
                value: product.dimensions_height,
                unitCode: "INH"
              },
              ...(product.dimensions_depth && {
                depth: {
                  "@type": "QuantitativeValue",
                  value: product.dimensions_depth,
                  unitCode: "INH"
                }
              }),
            }),
            ...(product.weight && {
              weight: {
                "@type": "QuantitativeValue",
                value: product.weight,
                unitCode: "LBR"
              }
            }),
          }),
        }}
      />
    </main>
  );
}

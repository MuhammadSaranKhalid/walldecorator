"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOne } from "@refinedev/core";
import Link from "next/link";
import {
  Minus,
  Plus,
  Facebook,
  Twitter,
  Instagram,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Types
import type { Product, ProductImage } from "@/types/product";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlurhashImage } from "@/components/ui/blurhash-image";

// Stores
import { useCartStore } from "@/stores/cart-store";

// Utils
import { toast } from "sonner";

// Helpers
import { getPrimaryImage } from "@/lib/product-helpers";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ExtendedProduct extends Product {
  categories?: Category;
  dimensions_width?: number;
  dimensions_height?: number;
  dimensions_depth?: number;
  weight?: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  // Fetch product from database
  const {
    result: product = null,
    query: { isLoading, isError },
  } = useOne<ExtendedProduct>({
    resource: "products",
    id: productId,
    meta: {
      select:
        "*, product_materials(id, material_id, price, inventory_quantity, finish, materials(id, name, slug)), product_images(id, product_id, original_url, alt_text, is_primary, display_order, thumbnail_url, medium_url, large_url, blurhash), categories(id, name, slug)",
    },
  });

  // Transform data for UI
  const productData = product as unknown as ExtendedProduct;

  // Get sorted images with all variants
  const productImages = productData?.product_images
    ? [...productData.product_images].sort(
        (a, b) => a.display_order - b.display_order
      )
    : [];

  // Get current selected image data
  const currentImageData = productImages[selectedImage];

  // Get materials with prices
  const materials =
    productData?.product_materials?.map((pm) => ({
      id: pm.id,
      material_id: pm.material_id,
      name: pm.materials?.name || "Unknown",
      price: pm.price,
      inventory: pm.inventory_quantity,
      // finish: pm.finish,
    })) || [];

  // Current selections
  const currentMaterial = materials[selectedMaterialIndex];
  const currentPrice = currentMaterial?.price || 0;
  const currentMaterialName = currentMaterial?.name || "";

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToCart = () => {
    if (!productData || !currentMaterial) return;

    const imageUrl =
      currentImageData?.thumbnail_url ||
      currentImageData?.original_url ||
      "";

    addItem({
      product_id: productData.id,
      product_material_id: currentMaterial.id,
      name: productData.name,
      material: currentMaterialName,
      price: currentPrice,
      quantity: quantity,
      image_url: imageUrl,
      sku: productData.sku,
    });
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const handlePlaceOrder = () => {
    if (!productData || !currentMaterial) return;

    const imageUrl =
      currentImageData?.thumbnail_url ||
      currentImageData?.original_url ||
      "";

    addItem({
      product_id: productData.id,
      product_material_id: currentMaterial.id,
      name: productData.name,
      material: currentMaterialName,
      price: currentPrice,
      quantity: quantity,
      image_url: imageUrl,
      sku: productData.sku,
    });

    router.push("/checkout");
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (isError || !productData) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The product you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/products">Back to Products</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Product Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          {/* Main Image */}
          <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm">
            <BlurhashImage
              src={
                currentImageData?.large_url ||
                currentImageData?.original_url ||
                ""
              }
              alt={currentImageData?.alt_text || productData.name}
              blurhash={currentImageData?.blurhash || undefined}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              objectFit="cover"
            />
          </div>

          {/* Thumbnail Gallery */}
          {productImages.length > 1 && (
            <div className="flex overflow-x-auto gap-3 pb-2">
              {productImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative shrink-0 w-24 aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <BlurhashImage
                    src={image.thumbnail_url || image.original_url}
                    alt={
                      image.alt_text || `${productData.name} view ${index + 1}`
                    }
                    blurhash={image.blurhash || undefined}
                    fill
                    sizes="96px"
                    objectFit="cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tighter">
              {productData.name}
            </h1>
            {productData.sku && (
              <p className="text-muted-foreground text-sm font-mono mt-2">
                SKU: {productData.sku}
              </p>
            )}
          </div>

          {/* Material Selector */}
          {materials.length > 0 && (
            <div>
              <label className="text-sm font-bold mb-2 block">
                Select Material
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {materials.map((material, index) => (
                  <button
                    key={material.id}
                    onClick={() => setSelectedMaterialIndex(index)}
                    className={`flex flex-col items-center justify-center p-3 text-sm font-semibold rounded-lg border-2 transition-colors ${
                      selectedMaterialIndex === index
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:border-primary bg-card"
                    }`}
                  >
                    <span>{material.name}</span>
                    <span className="text-xs font-normal opacity-80 mt-1">
                      ${material.price.toFixed(2)}
                    </span>
                    {/* {material.finish && (
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {material.finish}
                      </span>
                    )} */}
                  </button>
                ))}
              </div>
              {currentMaterial && currentMaterial.inventory > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {currentMaterial.inventory} in stock
                </p>
              )}
            </div>
          )}

          {/* Price */}
          <div className="text-4xl font-bold text-primary">
            ${currentPrice.toFixed(2)}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex flex-col gap-4">
            {/* Quantity Selector */}
            <div className="flex items-center border rounded-lg w-fit">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="p-3 text-muted-foreground hover:text-primary transition-colors"
              >
                <Minus className="h-5 w-5" />
              </button>
              <Input
                type="text"
                value={quantity}
                readOnly
                className="w-12 text-center border-0 bg-transparent focus-visible:ring-0"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                className="p-3 text-muted-foreground hover:text-primary transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddToCart}
                size="lg"
                variant="outline"
                className="w-full sm:flex-1 font-bold"
              >
                Add to Cart
              </Button>
              <Button
                onClick={handlePlaceOrder}
                size="lg"
                className="w-full sm:flex-1 font-bold"
              >
                Place Order
              </Button>
            </div>
          </div>

          {/* Share */}
          <div className="flex items-center gap-4 border-t pt-6">
            <span className="text-sm font-bold">Share:</span>
            <div className="flex gap-3">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a
                href="#"
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
            {(productData.dimensions_width ||
              productData.dimensions_height ||
              productData.dimensions_depth ||
              productData.weight) && (
              <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            )}
            <TabsTrigger value="care">Care Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="py-6">
            <p className="text-muted-foreground text-base leading-relaxed">
              {productData.description}
            </p>
          </TabsContent>

          {(productData.dimensions_width ||
            productData.dimensions_height ||
            productData.dimensions_depth ||
            productData.weight) && (
            <TabsContent value="dimensions" className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {productData.dimensions_width && (
                  <div>
                    <p className="text-sm font-bold mb-1">Width</p>
                    <p className="text-muted-foreground">
                      {productData.dimensions_width} inches
                    </p>
                  </div>
                )}
                {productData.dimensions_height && (
                  <div>
                    <p className="text-sm font-bold mb-1">Height</p>
                    <p className="text-muted-foreground">
                      {productData.dimensions_height} inches
                    </p>
                  </div>
                )}
                {productData.dimensions_depth && (
                  <div>
                    <p className="text-sm font-bold mb-1">Depth</p>
                    <p className="text-muted-foreground">
                      {productData.dimensions_depth} inches
                    </p>
                  </div>
                )}
                {productData.weight && (
                  <div>
                    <p className="text-sm font-bold mb-1">Weight</p>
                    <p className="text-muted-foreground">
                      {productData.weight} lbs
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
    </main>
  );
}

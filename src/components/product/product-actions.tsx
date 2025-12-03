"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";
import { usePrice } from "@/hooks/use-price";

interface Material {
    id: string;
    material_id: string;
    name: string;
    price: number;
    inventory: number;
}

interface ProductActionsProps {
    productId: string;
    productName: string;
    productSku?: string;
    materials: Material[];
    currentImageUrl: string;
}

export function ProductActions({
    productId,
    productName,
    productSku,
    materials,
    currentImageUrl,
}: ProductActionsProps) {
    const router = useRouter();
    const [selectedMaterialIndex, setSelectedMaterialIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const addItem = useCartStore((state) => state.addItem);
    const { formatPrice } = usePrice();

    const currentMaterial = materials[selectedMaterialIndex];
    const currentPrice = currentMaterial?.price || 0;
    const currentMaterialName = currentMaterial?.name || "";

    const handleQuantityChange = (delta: number) => {
        setQuantity(Math.max(1, quantity + delta));
    };

    const handleAddToCart = () => {
        if (!currentMaterial) return;

        addItem({
            product_id: productId,
            product_material_id: currentMaterial.id,
            name: productName,
            material: currentMaterialName,
            price: currentPrice,
            quantity: quantity,
            image_url: currentImageUrl,
            sku: productSku,
        });
        toast.success(`Added ${quantity} item(s) to cart`);
    };

    const handlePlaceOrder = () => {
        if (!currentMaterial) return;

        addItem({
            product_id: productId,
            product_material_id: currentMaterial.id,
            name: productName,
            material: currentMaterialName,
            price: currentPrice,
            quantity: quantity,
            image_url: currentImageUrl,
            sku: productSku,
        });

        router.push("/checkout");
    };

    return (
        <div className="space-y-6">
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
                                className={`flex flex-col items-center justify-center p-3 text-sm font-semibold rounded-lg border-2 transition-colors ${selectedMaterialIndex === index
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-input hover:border-primary bg-card"
                                    }`}
                            >
                                <span>{material.name}</span>
                                <span className="text-xs font-normal opacity-80 mt-1">
                                    {formatPrice(material.price)}
                                </span>
                            </button>
                        ))}
                    </div>
                    {currentMaterial && currentMaterial.inventory > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                            {currentMaterial.inventory} in stock
                        </p>
                    )}
                </div>
            )
            }

            {/* Price */}
            <div className="text-4xl font-bold text-primary">
                {formatPrice(currentPrice)}
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
        </div >
    );
}

"use client";

import { useEffect } from "react";
import { useEcommerceAnalytics } from "@/lib/analytics-events";

interface ProductAnalyticsWrapperProps {
    product: {
        id: string;
        name: string;
        price: number;
        category?: string;
    };
}

export function ProductAnalyticsWrapper({ product }: ProductAnalyticsWrapperProps) {
    const { viewItem } = useEcommerceAnalytics();

    useEffect(() => {
        viewItem({
            items: [{
                item_id: product.id,
                item_name: product.name,
                price: product.price,
                item_category: product.category || "Wall Decor",
                quantity: 1
            }]
        });
    }, [product, viewItem]);

    return null;
}

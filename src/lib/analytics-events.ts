import { useAnalytics } from "@/hooks/use-analytics";

// --- Event Interfaces ---

export interface ProductItem {
    item_id: string;
    item_name: string;
    price: number;
    quantity?: number;
    currency?: string;
    item_category?: string;
    item_variant?: string;
}

export interface ViewItemListEvent {
    item_list_id?: string;
    item_list_name?: string;
    items: ProductItem[];
}

export interface ViewItemEvent {
    currency?: string;
    value?: number;
    items: ProductItem[];
}

export interface SelectItemEvent {
    item_list_id?: string;
    item_list_name?: string;
    items: ProductItem[];
}

export interface AddToCartEvent {
    currency: string;
    value: number;
    items: ProductItem[];
}

export interface RemoveFromCartEvent {
    currency: string;
    value: number;
    items: ProductItem[];
}

export interface ViewCartEvent {
    currency: string;
    value: number;
    items: ProductItem[];
}

export interface BeginCheckoutEvent {
    currency: string;
    value: number;
    coupon?: string;
    items: ProductItem[];
}

export interface AddShippingInfoEvent {
    currency: string;
    value: number;
    coupon?: string;
    shipping_tier: string;
    items: ProductItem[];
}

export interface AddPaymentInfoEvent {
    currency: string;
    value: number;
    coupon?: string;
    payment_type: string;
    items: ProductItem[];
}

export interface PurchaseEvent {
    transaction_id: string;
    value: number;
    currency: string;
    tax?: number;
    shipping?: number;
    coupon?: string;
    items: ProductItem[];
}

export interface RefundEvent {
    transaction_id: string;
    value?: number;
    currency?: string;
    items?: ProductItem[];
}

export interface SearchEvent {
    search_term: string;
}

// --- Typed Helper Hook ---

export const useEcommerceAnalytics = () => {
    const { trackEvent } = useAnalytics();

    return {
        // Product Interaction
        viewItemList: (params: ViewItemListEvent) => trackEvent('view_item_list', params),
        selectItem: (params: SelectItemEvent) => trackEvent('select_item', params),
        viewItem: (params: ViewItemEvent) => trackEvent('view_item', params),
        search: (params: SearchEvent) => trackEvent('search', params as unknown as Record<string, any>),

        // Cart & Checkout
        addToCart: (params: AddToCartEvent) => trackEvent('add_to_cart', params),
        removeFromCart: (params: RemoveFromCartEvent) => trackEvent('remove_from_cart', params),
        viewCart: (params: ViewCartEvent) => trackEvent('view_cart', params),
        beginCheckout: (params: BeginCheckoutEvent) => trackEvent('begin_checkout', params),
        addShippingInfo: (params: AddShippingInfoEvent) => trackEvent('add_shipping_info', params),
        addPaymentInfo: (params: AddPaymentInfoEvent) => trackEvent('add_payment_info', params),

        // Transaction
        purchase: (params: PurchaseEvent) => trackEvent('purchase', params),
        refund: (params: RefundEvent) => trackEvent('refund', params),
    };
};

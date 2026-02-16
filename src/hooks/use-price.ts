import { usePreferencesStore } from "@/stores/preferences-store";

export const usePrice = () => {
    const { currency } = usePreferencesStore();

    const formatPrice = (amount: number) => {
        if (amount === undefined || amount === null) return "";

        let convertedAmount = amount;
        let currencyCode = "PKR";
        let locale = "en-PK";

        switch (currency) {
            case "Euro":
                convertedAmount = amount / 278 * 0.95;
                currencyCode = "EUR";
                locale = "de-DE";
                break;
            case "Dollar":
                convertedAmount = amount / 278;
                currencyCode = "USD";
                locale = "en-US";
                break;
            case "Rupees":
            default:
                convertedAmount = amount;
                currencyCode = "PKR";
                locale = "en-PK";
                break;
        }

        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(convertedAmount);
    };

    return { formatPrice };
};

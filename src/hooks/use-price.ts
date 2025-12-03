import { usePreferencesStore } from "@/stores/preferences-store";

export const usePrice = () => {
    const { currency } = usePreferencesStore();

    const formatPrice = (amount: number) => {
        if (amount === undefined || amount === null) return "";

        let convertedAmount = amount;
        let currencyCode = "USD";
        let locale = "en-US";

        switch (currency) {
            case "Euro":
                convertedAmount = amount * 0.95;
                currencyCode = "EUR";
                locale = "de-DE";
                break;
            case "Rupees":
                convertedAmount = amount * 278;
                currencyCode = "PKR";
                locale = "en-PK";
                break;
            case "Dollar":
            default:
                convertedAmount = amount;
                currencyCode = "USD";
                locale = "en-US";
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

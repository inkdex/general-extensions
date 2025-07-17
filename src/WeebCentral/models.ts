// Constants

export const WC_DOMAIN = "https://weebcentral.com/";
export const DEFAULT_LANGUAGE_CODE = "🇬🇧";

// Enums

export enum TagSectionId {
    Genres = "included_tag",
    SeriesStatus = "included_status",
    SeriesType = "included_type",
    Order = "order",
}

export enum TagSectionTitle {
    Genres = "Genres",
    SeriesStatus = "Series Status",
    SeriesType = "Series Type",
    Order = "Order",
}

// Interfaces

export interface Metadata {
    page?: number; // For homepage sections
    offset?: number; // For search results
}

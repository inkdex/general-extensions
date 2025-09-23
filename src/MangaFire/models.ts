export interface Metadata {
    offset?: number;
    collectedIds?: string[];
}
export interface Result {
    status: number;
    result: { html: string; title_format: string };
}

export interface PageResponse {
    status: number;
    result: { images: ImageData[] };
}

export interface FilterOption {
    id: string;
    name: string;
    type: "type" | "genres";
}

export interface SearchFilter {
    id: string;
    value: string;
}

// Represents each image entry in the "images" array
// Each entry is an array where:
// - index 0 is a string (image URL)
// - index 1 is a number (possibly an identifier or category)
// - index 2 is a number (possibly a flag or status indicator)
export type ImageData = [string, number, number];

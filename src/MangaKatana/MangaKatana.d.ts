declare namespace Katana {
  type Metadata = { offset?: number; collectedIds?: string[] };

  interface Result {
    status: number;
    result: { html: string; title_format: string };
  }

  interface PageResponse {
    status: number;
    result: { images: ImageData[] };
  }

  const Types: { [key: string]: string };

  interface FilterOption {
    id: string;
    name: string;
    type: "type" | "genres";
  }

  interface SearchFilter {
    id: string;
    value: string;
  }

  // Represents each image entry in the "images" array
  // Each entry is an array where:
  // - index 0 is a string (image URL)
  // - index 1 is a number (possibly an identifier or category)
  // - index 2 is a number (possibly a flag or status indicator)
  type ImageData = [string, number, number];
}

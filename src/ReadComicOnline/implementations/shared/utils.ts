import {
  DISCOVER_SECTIONS,
  DOMAIN_IMAGE,
  DOMAIN_IMAGE_PROXY,
  SEARCH_GENRE_OPTIONS,
  type DiscoverSectionDefinition,
  type SearchGenreOption,
} from "./models";

export function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null),
      );
    });
  });
}

export function getDiscoverSectionDefinition(
  sectionId: string,
): DiscoverSectionDefinition | undefined {
  return DISCOVER_SECTIONS.find((section) => section.id === sectionId);
}

export function getSearchGenreOption(genreId: string): SearchGenreOption | undefined {
  return SEARCH_GENRE_OPTIONS.find((genre) => genre.id === genreId);
}

// reimplements rguard beau() image URL decoding
// source: https://readcomiconline.li/Scripts/rguard.min.js?v=1.5.8
// strips anti-scraping padding, decodes the cdn path, then restores auth params
export function beauDecode(url: string): string | null {
  // rguard hardcoded replacements
  url = url.replace(/pw_.g28x/g, "b").replace(/d2pr.x_27/g, "h");

  // already decoded after replacements
  if (url.indexOf("https") === 0) return url;

  // split auth query params before path cleanup
  const qIdx = url.indexOf("?");
  if (qIdx < 0) return null;
  const queryParams = url.substring(qIdx);

  // detect image quality suffix before path cleanup
  const isS0 = url.indexOf("=s0?") > 0;
  let path: string;
  if (isS0) {
    path = url.substring(0, url.indexOf("=s0?"));
  } else {
    const idx = url.indexOf("=s1600?");
    if (idx < 0) return null;
    path = url.substring(0, idx);
  }

  // strip 15-byte prefix and 17-byte middle padding
  path = path.substring(15, 33) + path.substring(50);

  // strip 9-byte padding before the final 2 chars
  path = path.substring(0, path.length - 11) + path[path.length - 2] + path[path.length - 1];

  // decode real cdn path
  const decoded = Application.base64Decode(path);
  if (typeof decoded !== "string") {
    return null;
  }

  // strip 4-byte decoded path padding at position 13
  let result = decoded.substring(0, 13) + decoded.substring(17);

  // restore size suffix
  result = result.substring(0, result.length - 2) + (isS0 ? "=s0" : "=s1600");

  // rguard proxies ip= image urls through ano1 before assigning img src
  const host = queryParams.includes("ip=") ? DOMAIN_IMAGE_PROXY : DOMAIN_IMAGE;
  const imagePath = result.startsWith("/") ? result : `/${result}`;

  return host + imagePath + queryParams;
}

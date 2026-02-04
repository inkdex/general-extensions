export type Metadata = {
  page?: number;
  completed?: boolean;
};

export type BrowseResult = {
  results_html: string;
  page: number;
  num_pages: number;
};

export const DOMAIN = "https://www.mgeko.cc";

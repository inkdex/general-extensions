import type {
    PagedResults,
    Request,
    SearchFilter,
    SearchQuery,
    SearchResultItem,
    SortingOption,
} from "@paperback/types";
import { URL } from "@paperback/types";
import { QISCANS_API, QISCANS_API_BASE } from "../../main";
import type {
    Metadata,
    QIScansGenre,
    QIScansQueryResponse,
} from "../shared/models";
import { fetchJSON } from "../shared/utils";
import { parseSearchResults } from "./parsers";

const PAGE_SIZE = 20;

export class SearchProvider {
    async getSearchResults(
        query: SearchQuery,
        metadata: Metadata,
        sortingOption?: SortingOption,
    ): Promise<PagedResults<SearchResultItem>> {
        const page = metadata?.page ?? 1;

        const searchTerm = (query.title ?? "")
            .trim()
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/\s+/g, " ");

        let urlBuilder = new URL(QISCANS_API)
            .setQueryItem("perPage", PAGE_SIZE.toString())
            .setQueryItem("page", page.toString());

        if (searchTerm) {
            urlBuilder = urlBuilder.setQueryItem("searchTerm", searchTerm);
        }

        // get status
        const statusFilter = query.filters?.find((f) => f.id === "status");
        if (statusFilter?.value) {
            urlBuilder = urlBuilder.setQueryItem(
                "seriesStatus",
                statusFilter.value as string,
            );
        }

        // get genres
        const genreFilter = query.filters?.find((f) => f.id === "genres");
        if (
            genreFilter?.value &&
            typeof genreFilter.value === "object" &&
            !Array.isArray(genreFilter.value)
        ) {
            const genreValue = genreFilter.value as Record<
                string,
                "included" | "excluded"
            >;
            const selectedGenres = Object.keys(genreValue).filter(
                (key) => genreValue[key] === "included",
            );
            if (selectedGenres.length > 0) {
                urlBuilder = urlBuilder.setQueryItem(
                    "genreIds",
                    selectedGenres.join(","),
                );
            }
        }

        // get sort
        const sortBy = sortingOption?.id ?? "createdAt";
        urlBuilder = urlBuilder.setQueryItem("orderBy", sortBy);

        const url = urlBuilder.toString();
        const request: Request = { url, method: "GET" };
        let json = await fetchJSON<QIScansQueryResponse>(request);
        let results = parseSearchResults(json);

        // if no results and search contains straight apostrophe, try with curly
        if (results.length === 0 && searchTerm.includes("'")) {
            const curlySearchTerm = searchTerm.replace(/'/g, "\u2019");
            urlBuilder = urlBuilder.setQueryItem("searchTerm", curlySearchTerm);
            const retryUrl = urlBuilder.toString();

            const retryRequest: Request = { url: retryUrl, method: "GET" };
            json = await fetchJSON<QIScansQueryResponse>(retryRequest);
            results = parseSearchResults(json);
        }

        // check if there's a next page based on totalCount
        const hasNext = json.totalCount
            ? page * PAGE_SIZE < json.totalCount
            : results.length >= PAGE_SIZE;

        return {
            items: results,
            metadata: hasNext ? { page: page + 1 } : undefined,
        };
    }

    async getSearchFilters(): Promise<SearchFilter[]> {
        const statusFilter: SearchFilter = {
            type: "dropdown",
            id: "status",
            title: "Status",
            options: [
                { id: "", value: "All" },
                { id: "ONGOING", value: "Ongoing" },
                { id: "HIATUS", value: "Hiatus" },
                { id: "DROPPED", value: "Dropped" },
                { id: "COMPLETED", value: "Completed" },
            ],
            value: "",
        };

        // fetch and cache genres
        const genresCacheDate = Number(
            Application.getState("genres-cache-date") ?? 0,
        );
        let genres: QIScansGenre[];

        if (genresCacheDate + 604800 > Date.now() / 1000) {
            // cache valid for 1 week
            genres = JSON.parse(
                Application.getState("genres") as string,
            ) as QIScansGenre[];
        } else {
            const url = `${QISCANS_API_BASE}/genres`;
            const request: Request = { url, method: "GET" };
            genres = await fetchJSON<QIScansGenre[]>(request);

            Application.setState(JSON.stringify(genres), "genres");
            Application.setState(
                String(Date.now() / 1000),
                "genres-cache-date",
            );
        }

        const genreFilter: SearchFilter = {
            type: "multiselect",
            id: "genres",
            title: "Genres",
            options: genres
                .filter((g) => g.name !== "hidden")
                .map((g) => ({
                    id: g.id.toString(),
                    value: g.name,
                })),
            value: {},
            allowExclusion: false,
            allowEmptySelection: true,
            maximum: undefined,
        };

        return [statusFilter, genreFilter];
    }

    async getSortingOptions(): Promise<SortingOption[]> {
        return [
            { id: "createdAt", label: "Created At" },
            { id: "updatedAt", label: "Updated At" },
            { id: "totalViews", label: "Views" },
            { id: "postTitle", label: "Title" },
        ];
    }
}

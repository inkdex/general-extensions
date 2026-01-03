import type {
    DiscoverSection,
    DiscoverSectionItem,
    PagedResults,
    Request,
} from "@paperback/types";
import { DiscoverSectionType, URL } from "@paperback/types";
import { QISCANS_API_BASE } from "../../main";
import { type Metadata, type QIScansV2Response } from "../shared/models";
import { fetchJSON } from "../shared/utils";
import { parseDiscoverItems } from "./parsers";

export class DiscoverProvider {
    async getDiscoverSections(): Promise<DiscoverSection[]> {
        return [
            {
                id: "featured",
                title: "Featured",
                type: DiscoverSectionType.prominentCarousel,
            },
            {
                id: "popular",
                title: "Popular Today",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "pinned",
                title: "Pinned",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "latest",
                title: "Latest Updates",
                type: DiscoverSectionType.chapterUpdates,
            },
            {
                id: "editors-pick",
                title: "Editor's Pick",
                type: DiscoverSectionType.simpleCarousel,
            },
            {
                id: "new",
                title: "New Fresh Series",
                type: DiscoverSectionType.simpleCarousel,
            },
        ];
    }

    async getDiscoverSectionItems(
        section: DiscoverSection,
        metadata?: Metadata,
    ): Promise<PagedResults<DiscoverSectionItem>> {
        const page = metadata?.page ?? 1;
        let perPage = 15;
        let skipItems = 0;

        const urlBuilder = new URL(QISCANS_API_BASE)
            .addPathComponent("v2")
            .addPathComponent("posts")
            .setQueryItem("perPage", perPage.toString())
            .setQueryItem("page", page.toString());

        switch (section.id) {
            case "featured":
                perPage = 25;
                skipItems = 10;
                urlBuilder
                    .setQueryItem("featured", "true")
                    .setQueryItem("perPage", perPage.toString());
                break;

            case "popular":
                urlBuilder
                    .setQueryItem("sortBy", "totalViews")
                    .setQueryItem("sortOrder", "desc");
                break;

            case "pinned":
                urlBuilder.setQueryItem("pinned", "true");
                break;

            case "latest":
                urlBuilder
                    .setQueryItem("sortBy", "lastChapterAddedAt")
                    .setQueryItem("sortOrder", "desc");
                break;

            case "editors-pick":
                perPage = 40;
                skipItems = 25;
                urlBuilder
                    .setQueryItem("editorsPick", "true")
                    .setQueryItem("perPage", perPage.toString());
                break;

            case "new":
                urlBuilder
                    .setQueryItem("sortBy", "createdAt")
                    .setQueryItem("sortOrder", "desc");
                break;

            default:
                throw new Error(
                    `[QiScans] Unknown discover section: ${section.id}`,
                );
        }

        const url = urlBuilder.toString();
        const request: Request = { url, method: "GET" };
        const json = await fetchJSON<QIScansV2Response>(request);

        let items = parseDiscoverItems(json, section.id);

        if (skipItems > 0 && items.length > skipItems) {
            items = items.slice(skipItems);
        }

        const canPaginate = section.id === "pinned" || section.id === "latest";
        const hasMore = canPaginate && items.length >= 15;

        return {
            items,
            metadata: hasMore ? { page: page + 1 } : undefined,
        };
    }
}

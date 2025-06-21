import {
    BasicRateLimiter,
    Extension,
    PagedResults,
    Request,
    Response,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { CheerioAPI } from "cheerio";
import { WebtoonDto } from "./WebtoonDtos";
import { WebtoonParser, WebtoonsSearchingMetadata } from "./WebtoonParser";
import { BASE_URL, MOBILE_URL } from "./WebtoonSettings";

export abstract class WebtoonInfra extends WebtoonParser implements Extension {
    cheerio = cheerio;
    websiteRateLimiter = new WebtoonWebSiteRateLimiter();
    mobileApiRateLimiter = new WebtoonMobileApiRateLimiter();
    cookies: Record<string, string>;

    constructor() {
        super();
        this.cookies = {
            ageGatePass: "true",
        };
    }

    async initialise(): Promise<void> {
        this.registerInterceptors();
    }

    registerInterceptors() {
        this.websiteRateLimiter.registerInterceptor();
        this.mobileApiRateLimiter.registerInterceptor();
        Application.registerInterceptor(
            "requestInterceptor",
            Application.Selector(this as WebtoonInfra, "interceptRequest"),
            Application.Selector(this as WebtoonInfra, "interceptResponse"),
        );
    }

    async interceptRequest(request: Request): Promise<Request> {
        request.headers = {
            ...(request.headers ?? {}),
            ...{
                referer: request.headers?.referer ?? `${BASE_URL}/`,
                "user-agent": await Application.getDefaultUserAgent(),
            },
        };
        request.cookies = { ...request.cookies, ...this.cookies };
        return request;
    }

    async interceptResponse(
        _request: Request,
        _response: Response,
        data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
        return data;
    }

    async ExecRequest<T>(
        infos: {
            url: string;
            headers?: Record<string, string>;
            params?: Record<string, string | number>;
        },
        parseMethods: (_: CheerioAPI) => T,
    ): Promise<T> {
        if (infos.params)
            infos.url += `?${Object.entries(infos.params)
                .map(([key, value]) => `${key}=${value}`)
                .join("&")}`;

        const request = { ...infos, method: "GET" };
        const data = (await Application.scheduleRequest(request))[1];
        const $ = this.cheerio.load(Application.arrayBufferToUTF8String(data));
        return parseMethods.call(this, $);
    }

    async ExecApiRequest<TDto, T>(
        infos: {
            url: string;
            headers?: Record<string, string>;
            params?: Record<string, string | number>;
        },
        parseMethods: (_: TDto) => T,
    ) {
        if (infos.params)
            infos.url += `?${Object.entries(infos.params)
                .map(([key, value]) => `${key}=${value}`)
                .join("&")}`;

        const request = { ...infos, method: "GET" };
        const data = (await Application.scheduleRequest(request))[1];
        const rootDto = JSON.parse(
            Application.arrayBufferToUTF8String(data),
        ) as WebtoonDto;
        if (rootDto?.success !== true) throw new Error();
        const dto = rootDto.result as TDto;
        return parseMethods.call(this, dto);
    }

    async ExecPagedResultsRequest<T>(
        infos: {
            url: string;
            headers?: Record<string, string>;
            params?: Record<string, string | number>;
        },
        metadata: WebtoonsSearchingMetadata,
        parseMethods: (_: CheerioAPI) => PagedResults<T>,
    ): Promise<PagedResults<T>> {
        infos.params ??= {};
        const page = (infos.params.page = metadata.page + 1);

        if (metadata?.maxPages && page > metadata.maxPages)
            return { items: [], metadata };

        return {
            items: (await this.ExecRequest(infos, parseMethods)).items,
            metadata: { ...metadata, page: page },
        };
    }
}

class WebtoonWebSiteRateLimiter extends BasicRateLimiter {
    constructor() {
        super("WebSiteRateLimiter", {
            numberOfRequests: 10,
            bufferInterval: 1,
            ignoreImages: false,
        });
    }

    async interceptRequest(request: Request): Promise<Request> {
        if (request.url.startsWith(MOBILE_URL)) return request;
        return super.interceptRequest(request);
    }
}

class WebtoonMobileApiRateLimiter extends BasicRateLimiter {
    constructor() {
        super("MobileApiRateLimiter", {
            numberOfRequests: 9,
            bufferInterval: 11,
            ignoreImages: false,
        });
    }

    async interceptRequest(request: Request): Promise<Request> {
        if (!request.url.startsWith(MOBILE_URL)) return request;
        return super.interceptRequest(request);
    }
}

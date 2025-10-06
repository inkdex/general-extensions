import {
    CloudflareError,
    PaperbackInterceptor,
    Request,
    Response,
} from "@paperback/types";
import * as cheerio from "cheerio";
import { SCYLLA_COMICS_DOMAIN } from "./main";

export class ScyllaComicsInterceptor extends PaperbackInterceptor {
    async interceptRequest(request: Request): Promise<Request> {
        request.headers = request.headers ?? {};
        request.headers.referer = `${SCYLLA_COMICS_DOMAIN}/`;
        return request;
    }

    override async interceptResponse(
        request: Request,
        response: Response,
        data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
        return data;
    }
}

// may need to check for cf headers if challenges appear in future
export function checkCloudflareStatus(status: number): void {
    if (status === 503) {
        throw new CloudflareError({
            url: SCYLLA_COMICS_DOMAIN,
            method: "GET",
        });
    }
    if (status === 403) {
        throw new Error(
            "Server returned 403 Forbidden. This title may have been removed due to a DMCA request or is otherwise unavailable.",
        );
    }
}

/** Makes a request and returns a Cheerio document */
export async function fetchCheerio(
    request: Request,
): Promise<cheerio.CheerioAPI> {
    const [response, data] = await Application.scheduleRequest(request);
    checkCloudflareStatus(response.status);
    return cheerio.load(Application.arrayBufferToUTF8String(data), {
        xml: {
            xmlMode: false,
            decodeEntities: false,
        },
    });
}

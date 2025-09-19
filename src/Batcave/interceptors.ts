import { PaperbackInterceptor, Request, Response } from "@paperback/types";

export class CaveInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        let referer = `https://batcave.biz`;
        if (request.url.includes("readcomicsonline.ru")) {
            referer = `https://readcomicsonline.ru`;
        }

        request.headers = {
            ...request.headers,
            origin: referer,
            referer: referer,
            "user-agent": await Application.getDefaultUserAgent(),
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "accept-language": "en-US,en;q=0.5",
            "accept-encoding": "gzip, deflate, br",
            "x-requested-with": "com.batcave.android",
        };
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

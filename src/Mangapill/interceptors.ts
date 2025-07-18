import { PaperbackInterceptor, Request, Response } from "@paperback/types";
import { MANGA_PILL_DOMAIN } from "./models";

export class MangapillInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        request.headers = {
            ...request.headers,
            referer: `${MANGA_PILL_DOMAIN}/`,
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

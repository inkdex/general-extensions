import { PaperbackInterceptor, Request, Response } from "@paperback/types";
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

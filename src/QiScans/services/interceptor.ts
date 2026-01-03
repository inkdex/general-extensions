import type { Request, Response } from "@paperback/types";
import { PaperbackInterceptor } from "@paperback/types";
import { QISCANS_DOMAIN } from "../main";

export class QiScansInterceptor extends PaperbackInterceptor {
    async interceptRequest(request: Request): Promise<Request> {
        request.headers = request.headers ?? {};
        request.headers.referer = `${QISCANS_DOMAIN}/`;
        console.log(`[QiScans] Interceptor adding referer to: ${request.url}`);
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

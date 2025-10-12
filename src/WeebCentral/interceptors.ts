import {
    PaperbackInterceptor,
    type Request,
    type Response,
} from "@paperback/types";
import { WC_DOMAIN } from "./models";

export class WeebCentralInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        request.headers = {
            ...request.headers,
            referer: `${WC_DOMAIN}/`,
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

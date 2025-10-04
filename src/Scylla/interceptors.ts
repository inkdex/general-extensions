import { 
    PaperbackInterceptor,
    Request,
    Response,
} from "@paperback/types";
import { 
    SCYLLA_DOMAIN,
} from "./main";

export class ScyllaInterceptor extends PaperbackInterceptor {
    async interceptRequest(request: Request): Promise<Request> {
        request.headers = request.headers ?? {};
        request.headers.referer = `${SCYLLA_DOMAIN}/`;
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

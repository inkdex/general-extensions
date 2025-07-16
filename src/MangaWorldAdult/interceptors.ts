import { PaperbackInterceptor, Request, Response } from "@paperback/types";

// Intercepts all the requests and responses and allows you to make changes to them
export class MainInterceptor extends PaperbackInterceptor {
    override async interceptRequest(request: Request): Promise<Request> {
        return request;
    }

    override async interceptResponse(
        request: Request,
        response: Response,
        data: ArrayBuffer,
    ): Promise<ArrayBuffer> {
        void request;
        void response;

        return data;
    }
}

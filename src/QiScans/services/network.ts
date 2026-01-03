import type { Request, Response } from "@paperback/types";
import { CloudflareError, PaperbackInterceptor } from "@paperback/types";
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

export function checkCloudflareStatus(request: Request, status: number): void {
  if (status === 503) {
    throw new CloudflareError({
      url: request.url,
      method: request.method ?? "GET",
    });
  }
  if (status === 403) {
    throw new Error(
      "Server returned 403 Forbidden. This title may have been removed due to a DMCA request or is otherwise unavailable.",
    );
  }
}

import {
  CloudflareError,
  PaperbackInterceptor,
  type Request,
  type Response,
} from "@paperback/types";
import { DOMAIN } from "./models";

export class MangaFoxInterceptor extends PaperbackInterceptor {
  async interceptRequest(request: Request): Promise<Request> {
    return {
      ...request,
      headers: {
        ...request.headers,
        referer: `${DOMAIN}/`,
        "user-agent": await Application.getDefaultUserAgent(),
      },
      cookies: { ...request.cookies, name: "isAdult", value: "1", domain: "fanfox.net" },
    };
  }

  override async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    const cfMitigated = response.headers?.["cf-mitigated"];
    if (cfMitigated === "challenge") {
      throw new CloudflareError({
        url: `${DOMAIN}/`,
        method: request.method ?? "GET",
      });
    }

    return data;
  }
}

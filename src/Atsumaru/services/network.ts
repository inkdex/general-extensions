import type { Request, Response } from "@paperback/types";
import { CloudflareError, PaperbackInterceptor } from "@paperback/types";
import { ATSUMARU_DOMAIN } from "../main";

export class AtsuInterceptor extends PaperbackInterceptor {
  async interceptRequest(request: Request): Promise<Request> {
    request.headers = request.headers ?? {};
    request.headers.referer = `${ATSUMARU_DOMAIN}/`;
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

export async function fetchJSON<T>(request: Request): Promise<T> {
  const [response, buffer] = await Application.scheduleRequest(request);

  checkCloudflareStatus(request, response.status);

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${request.url}`);
  }

  const data = Application.arrayBufferToUTF8String(buffer);

  try {
    return typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON from ${request.url}: ${reason}`);
  }
}

export async function fetchText(request: Request): Promise<string> {
  const [response, buffer] = await Application.scheduleRequest(request);

  checkCloudflareStatus(request, response.status);

  if (response.status !== 200) {
    throw new Error(`Request failed with status ${response.status}: ${request.url}`);
  }

  const data = Application.arrayBufferToUTF8String(buffer);
  return typeof data === "string" ? data : String(data);
}

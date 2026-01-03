import type { Request } from "@paperback/types";
import { checkCloudflareStatus } from "../../services/requests";

export async function fetchJSON<T>(request: Request): Promise<T> {
    const [response, buffer] = await Application.scheduleRequest(request);

    checkCloudflareStatus(request, response.status);

    if (response.status !== 200) {
        throw new Error(
            `[QiScans] Request failed with status ${response.status}: ${request.url}`,
        );
    }

    const data = Application.arrayBufferToUTF8String(buffer);

    try {
        return typeof data === "string" ? (JSON.parse(data) as T) : (data as T);
    } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(
            `[QiScans] Failed to parse JSON from ${request.url}: ${reason}`,
        );
    }
}

export async function fetchText(request: Request): Promise<string> {
    const [response, buffer] = await Application.scheduleRequest(request);

    checkCloudflareStatus(request, response.status);

    if (response.status !== 200) {
        throw new Error(
            `[QiScans] Request failed with status ${response.status}: ${request.url}`,
        );
    }

    const data = Application.arrayBufferToUTF8String(buffer);
    return typeof data === "string" ? data : String(data);
}

export async function fetchImage(request: Request): Promise<ArrayBuffer> {
    const [response, buffer] = await Application.scheduleRequest(request);

    checkCloudflareStatus(request, response.status);

    if (response.status !== 200) {
        throw new Error(
            `[QiScans] Request failed with status ${response.status}: ${request.url}`,
        );
    }

    return buffer;
}

import type { Request } from "@paperback/types";
import { CloudflareError } from "@paperback/types";

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

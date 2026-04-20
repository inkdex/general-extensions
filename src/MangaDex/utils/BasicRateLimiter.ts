/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { lock, unlock } from "@paperback/types/src/impl/Lock";
import { PaperbackInterceptor } from "@paperback/types/src/impl/PaperbackInterceptor";
import { type Request } from "@paperback/types/src/Request";
import { type Response } from "@paperback/types/src/Response";

export type BasicRateLimiterOptions = {
  numberOfRequests: number;
  bufferInterval: number;
  ignoreImages: boolean;
};

export class BasicRateLimiter extends PaperbackInterceptor {
  private promise?: Promise<void>;
  private currentRequestsMade: number = 0;
  private lastReset: number = Date.now();
  private readonly imageRegex = new RegExp(/\.(png|gif|jpeg|jpg|webp)(\?|$)/i);

  constructor(
    id: string,
    readonly options: BasicRateLimiterOptions,
  ) {
    super(id);
  }

  async interceptRequest(request: Request): Promise<Request> {
    if (this.options.ignoreImages && this.imageRegex.test(request.url)) {
      return request;
    }

    await lock(this.id);
    await this.incrementRequestCount();
    unlock(this.id);
    return request;
  }

  async interceptResponse(
    request: Request,
    response: Response,
    data: ArrayBuffer,
  ): Promise<ArrayBuffer> {
    return data;
  }

  async incrementRequestCount() {
    await this.promise;

    const secondsSinceLastReset = (Date.now() - this.lastReset) / 1000;
    if (secondsSinceLastReset > this.options.bufferInterval) {
      this.currentRequestsMade = 0;
      this.lastReset = Date.now();
    }

    this.currentRequestsMade += 1;

    if (this.currentRequestsMade >= this.options.numberOfRequests) {
      if (secondsSinceLastReset <= this.options.bufferInterval) {
        const sleepTime = this.options.bufferInterval - secondsSinceLastReset;
        console.log(`[BasicRateLimiter] rate limit hit, sleeping for ${sleepTime}`);
        this.promise = Application.sleep(sleepTime);
        await this.promise;
      }
    }
  }
}

/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

// Side effect import. Must be loaded before `upng-js` and `jpeg-js`,
// which touch window and require at module init.
const scope = globalThis as { window?: unknown; require?: unknown };
if (typeof scope.window === "undefined") {
  scope.window = globalThis;
}
if (typeof scope.require !== "function") {
  scope.require = () => undefined;
}

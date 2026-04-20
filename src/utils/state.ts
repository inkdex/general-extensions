/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

function getState<T>(key: string, defaultValue: T): T {
  return (Application.getState(key) as T | undefined) ?? defaultValue;
}

export { getState };

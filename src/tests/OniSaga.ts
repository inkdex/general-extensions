/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type TestLogger } from "@paperback/types";

import { OniSaga } from "../OniSaga/main.js";
import sourceInfo from "../OniSaga/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("OniSaga tests", logger);

  registerDefaultTests(suite, OniSaga, sourceInfo, {
    searchResultsProviding: {
      getSearchResults: [{ title: "love" }, undefined, undefined],
    },
  });

  await suite.run();
}

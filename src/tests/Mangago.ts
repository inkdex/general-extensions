/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type TestLogger } from "@paperback/types";

import { Mangago } from "../Mangago/main.js";
import sourceInfo from "../Mangago/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Mangago tests", logger);

  // Drive the default tests with concrete inputs: a title search and a known
  // manga id, so the chapter/reader walk is exercised against real content.
  registerDefaultTests(suite, Mangago, sourceInfo, {
    searchResultsProviding: {
      getSearchResults: [{ title: "love" }, undefined, undefined],
    },
    mangaProviding: {
      getMangaDetails: ["/read-manga/love_is_an_illusion/"],
    },
  });

  await suite.run();
}

/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  implementsChapterProviding,
  implementsSearchResultsProviding,
  SourceIntents,
  type Chapter,
  type ChapterProviding,
  type Extension,
  type ExtensionInfo,
  type MangaProviding,
  type PagedResults,
  type SearchResultItem,
  type SearchResultsProviding,
  type SortingOption,
  type SourceManga,
  type TestLogger,
} from "@paperback/types";
import { expect } from "chai";

// Types for test cases and results
export type TestCase = {
  name: string;
  fn: (testLogger: TestLogger) => Promise<unknown>;
};

export type TestResult = {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
  returnValue?: unknown;
};

// Test Suite class
export class TestSuite {
  readonly state: Record<string, unknown> = {};
  private testCases: TestCase[] = [];
  private logger: TestLogger;

  constructor(name: string, logger: TestLogger) {
    this.logger = logger;
    this.logger.log("name", name);
  }

  // Register a test case
  test(name: string, fn: () => Promise<void>): void {
    this.testCases.push({ name, fn });
  }

  // Run all test cases sequentially
  async run() {
    const startTime = Date.now();
    let passed = 0;
    let failed = 0;

    const tests = this.logger.list("tests");
    for (const testCase of this.testCases) {
      const testStartTime = Date.now();

      const testLogger = tests.scope(testCase.name);
      try {
        const returnValue = await testCase.fn(testLogger.scope("runner"));
        const duration = Date.now() - testStartTime;
        passed++;
        testLogger.log("status", "pass");
        testLogger.log("duration", duration);
        testLogger.log("returnValue", returnValue);
      } catch (error) {
        const duration = Date.now() - testStartTime;
        failed++;
        testLogger.log("status", "fail");
        testLogger.log("error", String(error));
        testLogger.log("duration", duration);
      }
    }

    const totalDuration = Date.now() - startTime;
    const suiteResult = {
      passed,
      failed,
      total: this.testCases.length,
      duration: totalDuration,
    };

    this.logger.log("summary", suiteResult);
  }
}

type ExtensionTestData = {
  searchResultsProviding?:
    | {
        getSearchResults: Parameters<SearchResultsProviding["getSearchResults"]> | false;
        getSortingOptions?:
          | Parameters<Exclude<SearchResultsProviding["getSortingOptions"], undefined>>
          | false;
      }
    | false;
  mangaProviding?:
    | {
        getMangaDetails: Parameters<MangaProviding["getMangaDetails"]> | false;
      }
    | false;
  chapterProviding?:
    | {
        getChapters: Parameters<ChapterProviding["getChapters"]> | false;
        getChapterDetails: Parameters<ChapterProviding["getChapterDetails"]> | false;
      }
    | false;
};

export const registerDefaultTests = function (
  suite: TestSuite,
  extension: Extension,
  extensionInfo: ExtensionInfo,
  testData: ExtensionTestData = {},
) {
  registerDefaultInitialisationTests(suite, extension);

  let sourceCapabilities: SourceIntents = 0;
  if (Array.isArray(extensionInfo.capabilities)) {
    sourceCapabilities = extensionInfo.capabilities.reduce((a, b) => a | b, sourceCapabilities);
  } else {
    sourceCapabilities = extensionInfo.capabilities;
  }

  if (
    sourceCapabilities & SourceIntents.SEARCH_RESULT_PROVIDING &&
    testData.searchResultsProviding !== false
  ) {
    if (implementsSearchResultsProviding(extension)) {
      registerDefaultSearchResultsProvidingSourceTests(
        suite,
        extension,
        testData.searchResultsProviding,
      );
    } else {
      throw new Error(
        `extension does not implement 'SearchResultsProviding' but has the 'SEARCH_RESULTS_PROVIDING' capability`,
      );
    }
  }

  if (testData.mangaProviding !== false) {
    registerDefaultMangaProvidingSourceTests(suite, extension, testData.mangaProviding);
  }

  if (sourceCapabilities & SourceIntents.CHAPTER_PROVIDING && testData.chapterProviding !== false) {
    if (implementsChapterProviding(extension)) {
      registerDefaultChapterProvidingSourceTests(suite, extension, testData.chapterProviding);
    } else {
      throw new Error(
        `extension does not implement 'ChapterProviding' but has the 'CHAPTER_PROVIDING' capability`,
      );
    }
  }
};

export const registerDefaultInitialisationTests = function (
  suite: TestSuite,
  extension: Extension,
) {
  suite.test("initialisation", async () => {
    await extension.initialise();
  });
};

const STATE_KEY = {
  SearchResultsProviding: {
    getSearchResults: "SearchResultsProviding.getSearchResults",
    getSortingOptions: "SearchResultsProviding.getSortingOptions",
  },
  MangaProviding: {
    getMangaDetails: "MangaProviding.getMangaDetails",
  },
  ChapterProviding: {
    getChapters: "ChapterProviding.getChapters",
    getChapterDetails: "ChapterProviding.getChapterDetails",
  },
};

export const registerDefaultSearchResultsProvidingSourceTests = function (
  suite: TestSuite,
  extension: Extension & SearchResultsProviding,
  testData: Exclude<ExtensionTestData["searchResultsProviding"], false>,
) {
  if ("getSortingOptions" in extension && testData?.getSortingOptions !== false) {
    suite.test("getSortingOptions", async () => {
      let params = testData?.getSortingOptions;
      if (!params) {
        params = [{ title: "" }];
      }

      const sortingOptions = await extension.getSortingOptions!(...params);
      expect(sortingOptions).not.empty;

      suite.state[STATE_KEY.SearchResultsProviding.getSortingOptions] = sortingOptions;
    });
  }

  if (testData?.getSearchResults !== false) {
    suite.test("getSearchResults", async () => {
      expect(extension).to.have.property("getSearchResults");

      let params = testData?.getSearchResults;
      if (!params) {
        const sortingOptions = suite.state[STATE_KEY.SearchResultsProviding.getSortingOptions] as
          | SortingOption[]
          | undefined;
        params = [{ title: "" }, undefined, sortingOptions?.[0]];
      }

      const searchResults = await extension.getSearchResults(...params);
      expect(searchResults).not.empty;
      expect(searchResults.items).not.be.empty;

      suite.state[STATE_KEY.SearchResultsProviding.getSearchResults] = searchResults;
    });
  }
};

export const registerDefaultMangaProvidingSourceTests = function (
  suite: TestSuite,
  extension: Extension,
  testData: Exclude<ExtensionTestData["mangaProviding"], false>,
) {
  if (testData?.getMangaDetails !== false) {
    suite.test("getMangaDetails", async () => {
      expect(extension).to.have.property("getMangaDetails");

      let params = testData?.getMangaDetails;
      if (!params) {
        const searchResults = suite.state[STATE_KEY.SearchResultsProviding.getSearchResults] as
          | PagedResults<SearchResultItem>
          | undefined;
        if (searchResults?.items[0]?.mangaId) {
          params = [searchResults.items[0].mangaId];
        } else {
          throw new Error(
            "No `mangaId` provided in test data. Unable to infer from `SearchResultsProviding.getSearchResults`",
          );
        }
      }

      const mangaDetails = await extension.getMangaDetails(...params);
      expect(mangaDetails).to.not.be.undefined;
      expect(mangaDetails.mangaInfo).to.not.be.undefined;

      suite.state[STATE_KEY.MangaProviding.getMangaDetails] = mangaDetails;
    });
  }
};

export const registerDefaultChapterProvidingSourceTests = function (
  suite: TestSuite,
  extension: Extension & ChapterProviding,
  testData: Exclude<ExtensionTestData["chapterProviding"], false>,
) {
  if (testData?.getChapters !== false) {
    suite.test("getChapters", async () => {
      expect(extension).to.have.property("getChapters");

      let params = testData?.getChapters;
      if (!params) {
        const sourceManga = suite.state[STATE_KEY.MangaProviding.getMangaDetails] as
          | SourceManga
          | undefined;

        if (sourceManga) {
          params = [sourceManga];
        } else {
          throw new Error(
            "No `sourceManga` provided in test data. Unable to infer from `MangaProviding.getMangaDetails`",
          );
        }
      }

      const chapters = await extension.getChapters(...params);
      expect(chapters).to.not.be.empty;

      suite.state[STATE_KEY.ChapterProviding.getChapters] = chapters;
    });
  }

  if (testData?.getChapterDetails !== false) {
    suite.test("getChapterDetails", async () => {
      expect(extension).to.have.property("getChapterDetails");

      let params = testData?.getChapterDetails;
      if (!params) {
        const chapters = suite.state[STATE_KEY.ChapterProviding.getChapters] as
          | Chapter[]
          | undefined;

        if (chapters?.[0]) {
          params = [chapters[0]];
        } else {
          throw new Error(
            "No `sourceManga` provided in test data. Unable to infer from `MangaProviding.getMangaDetails`",
          );
        }
      }

      const chapterDetails = await extension.getChapterDetails(...params);
      expect(chapterDetails).to.not.be.undefined;

      suite.state[STATE_KEY.ChapterProviding.getChapterDetails] = chapterDetails;
    });
  }
};

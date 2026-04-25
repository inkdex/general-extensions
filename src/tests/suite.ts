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
  type SearchFilter,
  type SearchResultItem,
  type SearchResultsProviding,
  type SortingOption,
  type SourceManga,
} from "@paperback/types";

import { expect } from "chai";

// Types for test cases and results
export type TestCase = {
  name: string;
  fn: () => Promise<unknown>;
};

export type TestResult = {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
  returnValue?: unknown;
};

export type SuiteResult = {
  suiteName: string;
  passed: number;
  failed: number;
  total: number;
  duration: number;
  testResults: TestResult[];
};

// Test Suite class
export class TestSuite {
  readonly state: Record<string, unknown> = {};
  private testCases: TestCase[] = [];
  private suiteName: string;

  constructor(name: string) {
    this.suiteName = name;
  }

  // Register a test case
  test(name: string, fn: () => Promise<void>): void {
    this.testCases.push({ name, fn });
  }

  // Run all test cases sequentially
  async run(): Promise<SuiteResult> {
    console.log(`\n🧪 Running test suite: ${this.suiteName}`);
    console.log("=".repeat(50));

    const startTime = Date.now();
    const testResults: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const testCase of this.testCases) {
      const testStartTime = Date.now();
      let testResult: TestResult;

      try {
        const returnValue = await testCase.fn();
        const duration = Date.now() - testStartTime;
        testResult = {
          name: testCase.name,
          passed: true,
          duration,
          returnValue,
        };
        passed++;
        console.log(`✅ ${testCase.name} (${duration}ms)`);
      } catch (error) {
        const duration = Date.now() - testStartTime;
        testResult = {
          name: testCase.name,
          passed: false,
          error: error as Error,
          duration,
        };
        failed++;
        console.log(`❌ ${testCase.name} (${duration}ms)`);
        console.log(`   Error: ${(error as Error).message}`);
      }

      testResults.push(testResult);
    }

    const totalDuration = Date.now() - startTime;
    const suiteResult: SuiteResult = {
      suiteName: this.suiteName,
      passed,
      failed,
      total: this.testCases.length,
      duration: totalDuration,
      testResults,
    };

    this.printSummary(suiteResult);
    return suiteResult;
  }

  private printSummary(result: SuiteResult): void {
    console.log("\n📊 Test Summary:");
    console.log(`   Total: ${result.total}`);
    console.log(`   Passed: ${result.passed}`);
    console.log(`   Failed: ${result.failed}`);
    console.log(`   Duration: ${result.duration}ms`);

    if (result.failed > 0) {
      console.log(`\n❌ Suite "${result.suiteName}" failed`);
    } else {
      console.log(`\n✅ Suite "${result.suiteName}" passed`);
    }
  }
}

type ExtensionTestData = {
  searchResultsProviding?: {
    getSearchResults: Parameters<SearchResultsProviding["getSearchResults"]>;
    getSortingOptions?: Parameters<Exclude<SearchResultsProviding["getSortingOptions"], undefined>>;
  };
  mangaProviding?: {
    getMangaDetails: Parameters<MangaProviding["getMangaDetails"]>;
  };
  chapterProviding?: {
    getChapters: Parameters<ChapterProviding["getChapters"]>;
    getChapterDetails: Parameters<ChapterProviding["getChapterDetails"]>;
  };
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

  if (sourceCapabilities & SourceIntents.SEARCH_RESULTS_PROVIDING) {
    if (implementsSearchResultsProviding(extension)) {
      registerDefaultSearchResultsProvidingSourceTests(suite, extension, testData);
    } else {
      throw new Error(
        `extension does not implement 'SearchResultsProviding' but has the 'SEARCH_RESULTS_PROVIDING' capability`,
      );
    }
  }

  registerDefaultMangaProvidingSourceTests(suite, extension, testData);

  if (sourceCapabilities & SourceIntents.CHAPTER_PROVIDING) {
    if (implementsChapterProviding(extension)) {
      registerDefaultChapterProvidingSourceTests(suite, extension, testData);
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
    getSearchFilters: "SearchResultsProviding.getSearchFilters",
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
  { searchResultsProviding: testData }: Pick<ExtensionTestData, "searchResultsProviding">,
) {
  suite.test("getSearchFilters", async () => {
    expect(extension).to.have.property("getSearchFilters");

    const searchFilters = await extension.getSearchFilters();

    expect(searchFilters).to.not.be.undefined;
    suite.state[STATE_KEY.SearchResultsProviding.getSearchFilters] = searchFilters;
  });

  if ("getSortingOptions" in extension) {
    suite.test("getSortingOptions", async () => {
      let params = testData?.getSortingOptions;
      if (!params) {
        const searchFilters = suite.state[STATE_KEY.SearchResultsProviding.getSearchFilters] as
          | SearchFilter[]
          | undefined;
        params = [{ title: "", filters: searchFilters ?? [] }];
      }

      const sortingOptions = await extension.getSortingOptions!(...params);
      expect(sortingOptions).not.empty;

      suite.state[STATE_KEY.SearchResultsProviding.getSortingOptions] = sortingOptions;
    });
  }

  suite.test("getSearchResults", async () => {
    expect(extension).to.have.property("getSearchResults");

    let params = testData?.getSearchResults;
    if (!params) {
      const searchFilters = suite.state[STATE_KEY.SearchResultsProviding.getSearchFilters] as
        | SearchFilter[]
        | undefined;
      const sortingOptions = suite.state[STATE_KEY.SearchResultsProviding.getSortingOptions] as
        | SortingOption[]
        | undefined;
      params = [{ title: "", filters: searchFilters ?? [] }, undefined, sortingOptions?.[0]];
    }

    const searchResults = await extension.getSearchResults(...params);
    expect(searchResults).not.empty;
    expect(searchResults.items).not.be.empty;

    suite.state[STATE_KEY.SearchResultsProviding.getSearchResults] = searchResults;
  });
};

export const registerDefaultMangaProvidingSourceTests = function (
  suite: TestSuite,
  extension: Extension,
  { mangaProviding: testData }: Pick<ExtensionTestData, "mangaProviding">,
) {
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
};

export const registerDefaultChapterProvidingSourceTests = function (
  suite: TestSuite,
  extension: Extension & ChapterProviding,
  { chapterProviding: testData }: Pick<ExtensionTestData, "chapterProviding">,
) {
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

  suite.test("getChapterDetails", async () => {
    expect(extension).to.have.property("getChapterDetails");

    let params = testData?.getChapterDetails;
    if (!params) {
      const chapters = suite.state[STATE_KEY.ChapterProviding.getChapters] as Chapter[] | undefined;

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
};

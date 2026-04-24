import { expect } from "chai";
import type {
  Chapter,
  ChapterDetails,
  DiscoverSection,
  DiscoverSectionItem,
  SearchFilter,
  SearchResultItem,
  SortingOption,
  SourceManga,
} from "@paperback/types";
import {
  ReadComicOnline,
  type ReadComicOnlineExtension,
  type ReadComicOnlineImplementation,
} from "../ReadComicOnline/main.js";
import { TestSuite } from "./suite.js";

const SEARCH_QUERY = "Batman";
const extension = ReadComicOnline as ReadComicOnlineExtension & ReadComicOnlineImplementation;

const STATE_KEY = {
  discoverSelection: "discoverSelection",
  searchResults: "searchResults",
  searchResult: "searchResult",
  searchFilters: "searchFilters",
  mangaDetails: "mangaDetails",
  chapterList: "chapterList",
  chapterListSelection: "chapterListSelection",
  chapterImages: "chapterImages",
} as const;

type DiscoverMangaItem = Extract<
  DiscoverSectionItem,
  { mangaId: string; title: string; imageUrl: string }
>;

type DiscoverSelection = {
  section: DiscoverSection;
  item: DiscoverMangaItem;
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function titlesRelated(left: string, right: string): boolean {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);
  return normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

let activeDetailMessages: string[] | undefined;
let pendingDetailMessages: string[] = [];

function logDetail(message: string): void {
  if (activeDetailMessages) {
    activeDetailMessages.push(`   detail: ${message}`);
    return;
  }

  console.log(`   detail: ${message}`);
}

function registerDetailedTest(suite: TestSuite, name: string, fn: () => Promise<void>): void {
  suite.test(name, async () => {
    const detailMessages: string[] = [];
    activeDetailMessages = detailMessages;

    try {
      await fn();
    } finally {
      pendingDetailMessages = detailMessages;
      activeDetailMessages = undefined;
    }
  });
}

async function runSuiteWithDeferredDetails(suite: TestSuite): Promise<void> {
  const originalLog = console.log;

  console.log = (...args: unknown[]) => {
    originalLog(...args);

    const [firstArg] = args;
    if (
      typeof firstArg === "string" &&
      /^(?:✅|❌) /.test(firstArg) &&
      pendingDetailMessages.length > 0
    ) {
      for (const detailMessage of pendingDetailMessages) {
        originalLog(detailMessage);
      }

      originalLog("");
      pendingDetailMessages = [];
    }
  };

  try {
    await suite.run();
  } finally {
    console.log = originalLog;
    activeDetailMessages = undefined;
    pendingDetailMessages = [];
  }
}

function getCachedState<T>(suite: TestSuite, key: string): T | undefined {
  return suite.state[key] as T | undefined;
}

function setCachedState<T>(suite: TestSuite, key: string, value: T): T {
  suite.state[key] = value;
  return value;
}

function isDiscoverMangaItem(item: DiscoverSectionItem): item is DiscoverMangaItem {
  const candidate = item as unknown as Record<string, unknown>;
  return (
    typeof candidate.mangaId === "string" &&
    candidate.mangaId.length > 0 &&
    typeof candidate.title === "string" &&
    candidate.title.length > 0 &&
    typeof candidate.imageUrl === "string" &&
    candidate.imageUrl.length > 0
  );
}

async function getDiscoverSelection(suite: TestSuite): Promise<DiscoverSelection> {
  const cached = getCachedState<DiscoverSelection>(suite, STATE_KEY.discoverSelection);
  if (cached) {
    return cached;
  }

  const sections = await extension.getDiscoverSections();

  for (const section of sections) {
    const page = await extension.getDiscoverSectionItems(section);
    const item = page.items.find(isDiscoverMangaItem);
    if (item) {
      return setCachedState(suite, STATE_KEY.discoverSelection, { section, item });
    }
  }

  throw new Error("No discover section returned a live manga item");
}

async function getSearchResultsForQuery(suite: TestSuite): Promise<SearchResultItem[]> {
  const cached = getCachedState<SearchResultItem[]>(suite, STATE_KEY.searchResults);
  if (cached) {
    return cached;
  }

  const results = await extension.getSearchResults({
    title: SEARCH_QUERY,
    filters: [],
  });

  return setCachedState(suite, STATE_KEY.searchResults, results.items);
}

async function getSelectedSearchResult(suite: TestSuite): Promise<SearchResultItem> {
  const cached = getCachedState<SearchResultItem>(suite, STATE_KEY.searchResult);
  if (cached) {
    return cached;
  }

  const results = await getSearchResultsForQuery(suite);
  const matchingResult = results.find((item) =>
    normalizeText(item.title).includes(normalizeText(SEARCH_QUERY)),
  );

  if (!matchingResult) {
    throw new Error(`No live search result matched "${SEARCH_QUERY}"`);
  }

  return setCachedState(suite, STATE_KEY.searchResult, matchingResult);
}

async function getLiveSearchFilters(suite: TestSuite): Promise<SearchFilter[]> {
  const cached = getCachedState<SearchFilter[]>(suite, STATE_KEY.searchFilters);
  if (cached) {
    return cached;
  }

  const filters = await extension.getSearchFilters();
  return setCachedState(suite, STATE_KEY.searchFilters, filters);
}

async function getSelectedMangaDetails(suite: TestSuite): Promise<SourceManga> {
  const cached = getCachedState<SourceManga>(suite, STATE_KEY.mangaDetails);
  if (cached) {
    return cached;
  }

  const searchResult = await getSelectedSearchResult(suite);
  const mangaDetails = await extension.getMangaDetails(searchResult.mangaId);
  return setCachedState(suite, STATE_KEY.mangaDetails, mangaDetails);
}

async function getChapterList(suite: TestSuite): Promise<Chapter[]> {
  const cached = getCachedState<Chapter[]>(suite, STATE_KEY.chapterList);
  if (cached) {
    return cached;
  }

  const mangaDetails = await getSelectedMangaDetails(suite);
  const chapters = await extension.getChapters(mangaDetails);
  return setCachedState(suite, STATE_KEY.chapterList, chapters);
}

async function getChapterListSelection(suite: TestSuite): Promise<Chapter> {
  const cached = getCachedState<Chapter>(suite, STATE_KEY.chapterListSelection);
  if (cached) {
    return cached;
  }

  const chapters = await getChapterList(suite);
  const titledChapter = chapters.find((chapter) => (chapter.title ?? "").trim().length > 0);

  if (!titledChapter) {
    throw new Error("No chapter with a title was returned");
  }

  return setCachedState(suite, STATE_KEY.chapterListSelection, titledChapter);
}

async function getChapterImages(suite: TestSuite): Promise<ChapterDetails> {
  const cached = getCachedState<ChapterDetails>(suite, STATE_KEY.chapterImages);
  if (cached) {
    return cached;
  }

  const chapter = await getChapterListSelection(suite);
  const chapterDetails = await extension.getChapterDetails(chapter);
  return setCachedState(suite, STATE_KEY.chapterImages, chapterDetails);
}

async function findSearchResultWithStatus(
  results: SearchResultItem[],
  expectedStatus: string,
): Promise<SearchResultItem | undefined> {
  for (const item of results.slice(0, 10)) {
    const manga = await extension.getMangaDetails(item.mangaId);
    if (normalizeText(manga.mangaInfo.status ?? "") === normalizeText(expectedStatus)) {
      return item;
    }
  }

  return undefined;
}

async function findSearchResultWithGenre(
  results: SearchResultItem[],
  expectedGenre: string,
): Promise<SearchResultItem | undefined> {
  for (const item of results.slice(0, 10)) {
    const manga = await extension.getMangaDetails(item.mangaId);
    const tags = (manga.mangaInfo.tagGroups ?? []).flatMap((group) => group.tags ?? []);
    if (tags.some((tag) => normalizeText(tag.title) === normalizeText(expectedGenre))) {
      return item;
    }
  }

  return undefined;
}

export async function runTests() {
  await extension.initialise();

  const suite = new TestSuite("ReadComicOnline integration tests");

  registerDetailedTest(suite, "[getDiscoverSectionItems] returned mangaId length > 0", async () => {
    const discovered = await getDiscoverSelection(suite);
    logDetail(`section=${discovered.section.id}`);
    logDetail(`mangaId=${discovered.item.mangaId}`);
    expect(discovered.item.mangaId.length).to.be.greaterThan(0);
  });

  registerDetailedTest(
    suite,
    "[getDiscoverSectionItems] item title matches getMangaDetails primaryTitle",
    async () => {
      const discovered = await getDiscoverSelection(suite);
      const mangaDetails = await extension.getMangaDetails(discovered.item.mangaId);

      logDetail(`discoverTitle="${discovered.item.title}"`);
      logDetail(`primaryTitle="${mangaDetails.mangaInfo.primaryTitle}"`);
      expect(titlesRelated(discovered.item.title, mangaDetails.mangaInfo.primaryTitle)).to.equal(
        true,
      );
    },
  );

  registerDetailedTest(
    suite,
    `[getSearchResults] results length > 0 for "${SEARCH_QUERY}"`,
    async () => {
      const results = await getSearchResultsForQuery(suite);
      logDetail(`query="${SEARCH_QUERY}"`);
      logDetail(`resultCount=${results.length}`);
      expect(results.length).to.be.greaterThan(0);
    },
  );

  registerDetailedTest(
    suite,
    `[getSearchResults] includes title matching "${SEARCH_QUERY}"`,
    async () => {
      const searchResult = await getSelectedSearchResult(suite);
      logDetail(`query="${SEARCH_QUERY}"`);
      logDetail(`matchedTitle="${searchResult.title}"`);
      expect(normalizeText(searchResult.title).includes(normalizeText(SEARCH_QUERY))).to.equal(
        true,
      );
    },
  );

  registerDetailedTest(
    suite,
    "[getSearchResults] sorted results include manga with requested status",
    async () => {
      const sortingOptions = await extension.getSortingOptions();
      const sortingOption = sortingOptions.find(
        (option): option is SortingOption =>
          typeof option.id === "string" && option.id.trim().length > 0,
      );

      expect(sortingOption, "Expected at least one usable sorting option").to.not.equal(undefined);

      const statusLabel = sortingOption!.label.trim() || sortingOption!.id.trim();
      const sortedResults = await extension.getSearchResults(
        {
          title: SEARCH_QUERY,
          filters: [],
        },
        undefined,
        sortingOption,
      );

      expect(sortedResults.items.length).to.be.greaterThan(0);

      const matchingResult = await findSearchResultWithStatus(sortedResults.items, statusLabel);

      logDetail(`requestedStatus="${statusLabel}"`);
      logDetail(`matchedTitle="${matchingResult?.title ?? "none"}"`);
      expect(
        matchingResult,
        `Expected sorted results to include a manga with status "${statusLabel}"`,
      ).to.not.equal(undefined);
    },
  );

  registerDetailedTest(
    suite,
    "[getSearchResults] genre-filtered results include manga tagged with selected genre",
    async () => {
      const mangaDetails = await getSelectedMangaDetails(suite);
      const liveTags = (mangaDetails.mangaInfo.tagGroups ?? []).flatMap(
        (group) => group.tags ?? [],
      );
      const selectedTag = liveTags[0];

      expect(selectedTag, "Expected manga details to include at least one live tag").to.not.equal(
        undefined,
      );

      const filters = await getLiveSearchFilters(suite);
      const genresFilter = filters.find(
        (filter): filter is Extract<SearchFilter, { type: "multiselect" }> =>
          filter.id === "genres" && filter.type === "multiselect",
      );

      expect(genresFilter, 'Expected the extension to expose a "genres" filter').to.not.equal(
        undefined,
      );

      const genreOption = genresFilter?.options.find(
        (option) => normalizeText(option.value) === normalizeText(selectedTag!.title),
      );

      expect(
        genreOption,
        `Expected the extension to expose a genre option for "${selectedTag!.title}"`,
      ).to.not.equal(undefined);

      const filteredResults = await extension.getSearchResults({
        title: "",
        filters: [
          {
            id: "genres",
            value: {
              [genreOption!.id]: "included",
            },
          },
        ],
      });

      expect(filteredResults.items.length).to.be.greaterThan(0);

      const matchingResult = await findSearchResultWithGenre(
        filteredResults.items,
        selectedTag!.title,
      );

      logDetail(`selectedGenre="${selectedTag!.title}"`);
      logDetail(`matchedTitle="${matchingResult?.title ?? "none"}"`);
      expect(
        matchingResult,
        `Expected filtered results to include a manga tagged "${selectedTag!.title}"`,
      ).to.not.equal(undefined);
    },
  );

  registerDetailedTest(
    suite,
    "[getMangaDetails] primaryTitle matches selected search result",
    async () => {
      const searchResult = await getSelectedSearchResult(suite);
      const mangaDetails = await getSelectedMangaDetails(suite);

      logDetail(`searchTitle="${searchResult.title}"`);
      logDetail(`primaryTitle="${mangaDetails.mangaInfo.primaryTitle}"`);
      expect(titlesRelated(searchResult.title, mangaDetails.mangaInfo.primaryTitle)).to.equal(true);
    },
  );

  registerDetailedTest(
    suite,
    "[getMangaDetails] thumbnailUrl fetch returns bytes > 0",
    async () => {
      const mangaDetails = await getSelectedMangaDetails(suite);
      const thumbnailUrl = mangaDetails.mangaInfo.thumbnailUrl ?? "";

      expect(thumbnailUrl.trim().length).to.be.greaterThan(0);

      const [, data] = await Application.scheduleRequest({
        url: thumbnailUrl,
        method: "GET",
      });

      logDetail(`thumbnailUrl="${thumbnailUrl}"`);
      logDetail(`thumbnailBytes=${data.byteLength}`);
      expect(data.byteLength).to.be.greaterThan(0);
    },
  );

  registerDetailedTest(suite, "[getMangaDetails] author length > 0", async () => {
    const mangaDetails = await getSelectedMangaDetails(suite);
    logDetail(`author="${mangaDetails.mangaInfo.author ?? ""}"`);
    expect((mangaDetails.mangaInfo.author ?? "").trim().length).to.be.greaterThan(0);
  });

  registerDetailedTest(
    suite,
    "[getMangaDetails] tags length > 0 and each tag title length > 0",
    async () => {
      const mangaDetails = await getSelectedMangaDetails(suite);
      const tags = (mangaDetails.mangaInfo.tagGroups ?? []).flatMap((group) => group.tags ?? []);

      logDetail(`tagCount=${tags.length}`);
      logDetail(
        `sampleTags="${tags
          .slice(0, 3)
          .map((tag) => tag.title)
          .join(", ")}"`,
      );
      expect(tags.length).to.be.greaterThan(0);
      expect(tags.every((tag) => tag.title.trim().length > 0)).to.equal(true);
    },
  );

  registerDetailedTest(suite, "[getMangaDetails] synopsis length > 0", async () => {
    const mangaDetails = await getSelectedMangaDetails(suite);
    logDetail(`synopsisLength=${(mangaDetails.mangaInfo.synopsis ?? "").trim().length}`);
    expect((mangaDetails.mangaInfo.synopsis ?? "").trim().length).to.be.greaterThan(0);
  });

  registerDetailedTest(suite, "[getChapters] chapter list length > 0", async () => {
    const mangaDetails = await getSelectedMangaDetails(suite);
    const chapters = await getChapterList(suite);
    logDetail(`primaryTitle="${mangaDetails.mangaInfo.primaryTitle}"`);
    logDetail(`chapterCount=${chapters.length}`);
    expect(chapters.length).to.be.greaterThan(0);
  });

  registerDetailedTest(suite, "[getChapters] selected chapter title length > 0", async () => {
    const chapter = await getChapterListSelection(suite);
    logDetail(`selectedChapterTitle="${chapter.title ?? ""}"`);
    expect((chapter.title ?? "").trim().length).to.be.greaterThan(0);
  });

  registerDetailedTest(suite, "[getChapterDetails] chapter image page URL count > 0", async () => {
    const chapter = await getChapterListSelection(suite);
    const chapterDetails = await getChapterImages(suite);
    logDetail(`selectedChapterTitle="${chapter.title ?? ""}"`);
    logDetail(`pageCount=${chapterDetails.pages.length}`);
    expect(chapterDetails.pages.length).to.be.greaterThan(0);
  });

  registerDetailedTest(
    suite,
    "[getChapterDetails] first chapter image page URL fetch returns bytes > 0",
    async () => {
      const chapter = await getChapterListSelection(suite);
      const chapterDetails = await getChapterImages(suite);
      const firstPageUrl = chapterDetails.pages[0];

      const [, data] = await Application.scheduleRequest({
        url: firstPageUrl,
        method: "GET",
      });

      logDetail(`selectedChapterTitle="${chapter.title ?? ""}"`);
      logDetail(`firstChapterImagePageUrl="${firstPageUrl}"`);
      logDetail(`firstPageBytes=${data.byteLength}`);
      expect(data.byteLength).to.be.greaterThan(0);
    },
  );

  await runSuiteWithDeferredDetails(suite);
}

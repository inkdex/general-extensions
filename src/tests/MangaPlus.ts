import { type TestLogger } from "@paperback/types";

import { MangaPlus } from "../MangaPlus/main.js";
import sourceInfo from "../MangaPlus/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaPlus tests", logger);
  registerDefaultTests(suite, MangaPlus, sourceInfo);

  suite.test("filters inaccessible deluxe chapters", async () => {
    const sourceManga = await MangaPlus.getMangaDetails("100037");
    const chapters = await MangaPlus.getChapters(sourceManga);

    if (chapters.some((chapter) => chapter.chapterId === "1028085")) {
      throw new Error("Expected inaccessible chapter 1028085 to be filtered out.");
    }
  });

  await suite.run();
}

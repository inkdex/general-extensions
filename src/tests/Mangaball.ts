import { TestSuite, registerDefaultTests } from "./suite.js";
import { Mangaball } from "../Mangaball/main.js";
import sourceInfo from "../MangaDex/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("Mangaball tests");
  registerDefaultTests(suite, Mangaball, sourceInfo);

  await suite.run();
}

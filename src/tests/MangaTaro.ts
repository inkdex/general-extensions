import { TestSuite, registerDefaultTests } from "./suite.js";
import { MangaTaro } from "../MangaTaro/main.js";
import sourceInfo from "../MangaTaro/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("MangaTaro tests");
  //@ts-expect-error
  registerDefaultTests(suite, MangaTaro, sourceInfo);

  await suite.run();
}

import { TestSuite, registerDefaultTests } from "./suite.js";
import { Comix } from "../Comix/main.js";
import sourceInfo from "../Comix/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("Comix tests");
  registerDefaultTests(suite, Comix, sourceInfo);

  await suite.run();
}

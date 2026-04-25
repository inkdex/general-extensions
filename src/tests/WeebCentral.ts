import { TestSuite, registerDefaultTests } from "./suite.js";
import { WeebCentral } from "../WeebCentral/main.js";
import sourceInfo from "../WeebCentral/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("WeebCentral tests");
  registerDefaultTests(suite, WeebCentral, sourceInfo);

  await suite.run();
}

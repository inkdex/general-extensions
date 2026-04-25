import { TestSuite, registerDefaultTests } from "./suite.js";
import { QiScans } from "../QiScans/main.js";
import sourceInfo from "../QiScans/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("QiScans tests");
  //@ts-expect-error
  registerDefaultTests(suite, QiScans, sourceInfo);

  await suite.run();
}

import { TestSuite, registerDefaultTests } from "./suite.js";
import { QToon } from "../QToon/main.js";
import sourceInfo from "../QToon/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("QToon tests");
  //@ts-expect-error
  registerDefaultTests(suite, QToon, sourceInfo);

  await suite.run();
}

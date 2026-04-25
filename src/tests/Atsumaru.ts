import { TestSuite, registerDefaultTests } from "./suite.js";
import { Atsumaru } from "../Atsumaru/main.js";
import sourceInfo from "../Atsumaru/pbconfig.js";

export async function runTests() {
  const suite = new TestSuite("Atsumaru tests");
  //@ts-expect-error
  registerDefaultTests(suite, Atsumaru, sourceInfo);

  await suite.run();
}

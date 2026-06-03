import { type TestLogger } from "@paperback/types";

import { RoyalRoad } from "../RoyalRoad/main.js";
import sourceInfo from "../RoyalRoad/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("RoyalRoad tests", logger);
  registerDefaultTests(suite, RoyalRoad, sourceInfo);

  await suite.run();
}

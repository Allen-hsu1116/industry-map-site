import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const largeHolderScript = fs.readFileSync(path.join(process.cwd(), "scripts/update-large-holder-sample.ts"), "utf8");

test("large holder refresh follows FinMind manual by sending token in Authorization header", () => {
  assert.match(largeHolderScript, /Authorization:\s*`Bearer \$\{token\}`/);
  assert.doesNotMatch(largeHolderScript, /searchParams\.set\("token"/);
  assert.match(largeHolderScript, /TaiwanStockHoldingSharesPer requires Backer\/Sponsor auth/);
});

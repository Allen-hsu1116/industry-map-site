import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

test("daily analysis generation does not read legacy industries.json runtime fallback", async () => {
  const script = await fs.readFile("scripts/generate-daily-analysis.ts", "utf8");

  assert.doesNotMatch(script, /industries\.json/);
  assert.doesNotMatch(script, /INDUSTRIES_PATH/);
  assert.doesNotMatch(script, /buildLegacyCompanyAnalysisFallbacks/);
  assert.doesNotMatch(script, /mergeLegacyCompanyAnalysisFallback/);
});

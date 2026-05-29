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

test("legacy industry fallback adapter has been retired from source", async () => {
  await assert.rejects(fs.access("src/lib/legacyIndustryAnalysis.ts"));
  await assert.rejects(fs.access("src/lib/legacyIndustryAnalysis.test.ts"));
});

test("legacy inventory extraction pipeline has been retired from source", async () => {
  await assert.rejects(fs.access("scripts/generate-v2-inventory.ts"));
  await assert.rejects(fs.access("src/lib/legacyKnowledgeInventory.ts"));
  await assert.rejects(fs.access("src/lib/canonicalRoles.ts"));
  await assert.rejects(fs.access("src/lib/canonicalProducts.ts"));

  const packageJson = await fs.readFile("package.json", "utf8");
  assert.doesNotMatch(packageJson, /knowledge:v2:inventory/);
});

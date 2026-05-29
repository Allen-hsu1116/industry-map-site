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

test("runtime and checked-in snapshots no longer keep legacy industry_analysis fallbacks", async () => {
  await assert.rejects(fs.access("public/data/industries.json"));

  const homepage = await fs.readFile("src/app/page.tsx", "utf8");
  assert.doesNotMatch(homepage, /data\.industry_analysis/);
  assert.doesNotMatch(homepage, /rawTopicAnalysis/);

  const checkedSnapshotPaths = [
    "public/data/financials/2330.json",
    "public/data/financials/2337.json",
    "public/data/company-knowledge/2330.json",
    "public/data/company-knowledge/2337.json",
  ];

  for (const snapshotPath of checkedSnapshotPaths) {
    const snapshot = await fs.readFile(snapshotPath, "utf8");
    assert.doesNotMatch(snapshot, /industry_analysis/);
    assert.doesNotMatch(snapshot, /internal topic role map/);
  }
});

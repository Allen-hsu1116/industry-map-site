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

test("package scripts expose a daily refresh workflow that updates K-lines, chip feeds, and event focus before regenerating analysis", async () => {
  const packageJson = JSON.parse(await fs.readFile("package.json", "utf8")) as { scripts: Record<string, string> };

  assert.equal(packageJson.scripts["data:kline:update"], "tsx scripts/update-kline-data.ts");
  assert.equal(packageJson.scripts["data:market-feeds:update"], "tsx scripts/update-market-feeds.ts");
  assert.equal(packageJson.scripts["data:event-focus:update"], "tsx scripts/update-event-focus.ts");
  assert.equal(
    packageJson.scripts["data:daily-refresh"],
    "npm run data:kline:update -- --limit=30 && npm run data:market-feeds:update -- --limit=30 && npm run data:event-focus:update && npm run analysis:daily && npm run knowledge:validate",
  );
  assert.equal(
    packageJson.scripts["data:daily-refresh:dry-run"],
    "npm run data:kline:update -- --dry-run --limit=2 && npm run data:market-feeds:update -- --dry-run --limit=2 && npm run data:event-focus:update -- --dry-run --limit=10 && npm run knowledge:validate",
  );
  assert.ok(packageJson.scripts["data:daily-refresh"].indexOf("data:kline:update") < packageJson.scripts["data:daily-refresh"].indexOf("data:market-feeds:update"));
  assert.ok(packageJson.scripts["data:daily-refresh"].indexOf("data:market-feeds:update") < packageJson.scripts["data:daily-refresh"].indexOf("data:event-focus:update"));
  assert.ok(packageJson.scripts["data:daily-refresh"].indexOf("data:event-focus:update") < packageJson.scripts["data:daily-refresh"].indexOf("analysis:daily"));
  assert.ok(packageJson.scripts["data:daily-refresh"].indexOf("analysis:daily") < packageJson.scripts["data:daily-refresh"].indexOf("knowledge:validate"));
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

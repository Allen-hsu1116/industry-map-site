import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildMarketIndicatorStrip, type MarketIndicatorSourceSnapshot } from "./marketIndicatorStrip";

const sourceSnapshot: MarketIndicatorSourceSnapshot = {
  schemaVersion: 1,
  generatedAt: "2026-06-07T22:57:40.573Z",
  source: {
    name: "TWSE Exchange Report + TWSE MI_INDEX Advance/Decline Report",
    scope: "Taiwan listed market official daily close and breadth; no ADR/VIX/global proxy source verified",
  },
  indexRows: [
    { 日期: "1150605", 指數: "發行量加權股價指數", 收盤指數: "45070.94", 漲跌: "-", 漲跌點數: "606.52", 漲跌百分比: "-1.33", 特殊處理註記: "" },
    { 日期: "1150605", 指數: "金融保險類指數", 收盤指數: "2930.55", 漲跌: "+", 漲跌點數: "23.03", 漲跌百分比: "0.79", 特殊處理註記: "" },
  ],
  advanceDecline: {
    date: "20260605",
    advancingStocks: 342,
    decliningStocks: 671,
    unchangedStocks: 59,
    limitUpStocks: 19,
    limitDownStocks: 10,
    marketValue: 1319821926499,
    marketVolume: 16019783711,
  },
  unavailable: [
    {
      id: "global-vix",
      label: "VIX / global risk",
      reason: "No verified checked-in source yet; do not fill with AI or unsourced web snippets.",
    },
  ],
};

test("buildMarketIndicatorStrip preserves official TWSE index and breadth semantics with source labels", () => {
  const strip = buildMarketIndicatorStrip(sourceSnapshot);

  assert.equal(strip.status, "partial");
  assert.equal(strip.latestDate, "2026-06-05");
  assert.equal(strip.source.name, sourceSnapshot.source.name);
  assert.match(strip.source.scope, /Taiwan listed market official/);
  assert.match(strip.source.warning, /ADR\/VIX\/global proxy source not verified/);

  assert.deepEqual(strip.indicators.map((item) => item.id), ["twse-weighted", "financial-insurance", "breadth", "turnover"]);

  const twse = strip.indicators.find((item) => item.id === "twse-weighted");
  assert.ok(twse);
  assert.equal(twse.label, "發行量加權股價指數");
  assert.equal(twse.value, 45070.94);
  assert.equal(twse.change, -606.52);
  assert.equal(twse.changePercent, -1.33);
  assert.equal(twse.status, "verified");
  assert.match(twse.note, /official TWSE close/);

  const breadth = strip.indicators.find((item) => item.id === "breadth");
  assert.ok(breadth);
  assert.equal(breadth.value, 342);
  assert.equal(breadth.secondaryValue, 671);
  assert.match(breadth.note, /stocks only/);

  assert.equal(strip.unavailable[0].id, "global-vix");
  assert.match(strip.unavailable[0].reason, /No verified checked-in source/);
});

test("buildMarketIndicatorStrip exposes honest empty state when no verified official rows exist", () => {
  const strip = buildMarketIndicatorStrip({
    schemaVersion: 1,
    generatedAt: "2026-06-07T00:00:00.000Z",
    source: { name: "TWSE Exchange Report", scope: "Taiwan listed market" },
    indexRows: [],
    unavailable: [],
  });

  assert.equal(strip.status, "empty");
  assert.deepEqual(strip.indicators, []);
  assert.match(strip.emptyReason ?? "", /No verified TWSE market indicator rows/);
});

test("checked-in market indicator strip is wired into Daily Report and source-status rail", () => {
  const artifact = JSON.parse(fs.readFileSync("public/data/market-indicator-strip.json", "utf8")) as {
    schemaVersion: number;
    indicators: Array<{ source: string; status: string }>;
    unavailable: Array<{ reason: string }>;
  };
  const report = JSON.parse(fs.readFileSync("public/data/daily-report.json", "utf8")) as {
    freshness?: { sources?: Array<{ module: string; source: string; warning?: string }> };
  };
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };

  assert.equal(artifact.schemaVersion, 1);
  assert.ok(artifact.indicators.length >= 4);
  assert.ok(artifact.indicators.every((item) => item.source.includes("TWSE")));
  assert.ok(artifact.unavailable.some((item) => item.reason.includes("source not verified")));

  const marketIndicatorSource = report.freshness?.sources?.find((source) => source.module === "market-indicator-strip");
  assert.ok(marketIndicatorSource);
  assert.match(marketIndicatorSource.source, /TWSE/);
  assert.match(marketIndicatorSource.warning ?? "", /ADR\/VIX\/global/);

  assert.match(page, /market-indicator-strip\.json/);
  assert.match(page, /市場指標列/);
  assert.match(page, /source not verified/);
  assert.match(packageJson.scripts["report:market-indicators"], /generate-market-indicator-strip/);
  assert.ok(packageJson.scripts["data:daily-refresh"].indexOf("report:market-indicators") < packageJson.scripts["data:daily-refresh"].indexOf("report:daily"));
});

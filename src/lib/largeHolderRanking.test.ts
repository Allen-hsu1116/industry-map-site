import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  buildLargeHolderRanking,
  type LargeHolderCompanyInput,
  type LargeHolderTier,
  type LargeHolderWindow,
} from "./largeHolderRanking";

function rows(code: string, values: Array<[string, string, number, number, number?]>) {
  return values.map(([date, level, percent, people, unit = percent * 1000]) => ({
    date,
    stock_id: code,
    level,
    percent,
    people,
    unit,
  }));
}

const companies: LargeHolderCompanyInput[] = [
  {
    code: "1111",
    name: "Accumulating Holder",
    holdingSharesPer: rows("1111", [
      ["2026-05-15", "more than 1,000,001", 52.1, 50],
      ["2026-05-15", "total", 100, 20000],
      ["2026-05-22", "more than 1,000,001", 53.2, 49],
      ["2026-05-22", "total", 100, 19900],
      ["2026-05-29", "more than 1,000,001", 56.4, 51],
      ["2026-05-29", "total", 100, 20100],
    ]),
  },
  {
    code: "2222",
    name: "Broad Holder",
    holdingSharesPer: rows("2222", [
      ["2026-05-15", "more than 1,000,001", 70.0, 20],
      ["2026-05-15", "400,001-600,000", 3.0, 8],
      ["2026-05-22", "more than 1,000,001", 69.6, 20],
      ["2026-05-22", "400,001-600,000", 3.8, 9],
      ["2026-05-29", "more than 1,000,001", 69.1, 19],
      ["2026-05-29", "400,001-600,000", 6.3, 10],
    ]),
  },
  {
    code: "3333",
    name: "Stale Whale",
    holdingSharesPer: rows("3333", [
      ["2026-05-08", "more than 1,000,001", 80.0, 10],
      ["2026-05-15", "more than 1,000,001", 90.0, 8],
    ]),
  },
];

test("buildLargeHolderRanking ranks weekly share-tier changes from fresh FinMind holding-share rows and labels tracked sample scope", () => {
  const ranking = buildLargeHolderRanking(companies, { tier: "1m_plus", window: "1w", topN: 10 });

  assert.equal(ranking.status, "partial");
  assert.equal(ranking.tier, "1m_plus");
  assert.equal(ranking.window, "1w");
  assert.equal(ranking.source.name, "FinMind TaiwanStockHoldingSharesPer checked-in tracked sample");
  assert.equal(ranking.source.latestDate, "2026-05-29");
  assert.match(ranking.source.scope, /tracked sample 2 \/ 3/);
  assert.match(ranking.source.warning, /not full market/i);
  assert.match(ranking.source.warning, /share-tier/i);

  assert.deepEqual(ranking.items.map((item) => item.code), ["1111", "2222"]);
  assert.equal(ranking.items[0].latestPercent, 56.4);
  assert.equal(ranking.items[0].baselinePercent, 53.2);
  assert.equal(ranking.items[0].changePctPoint, 3.2);
  assert.match(ranking.items[0].reason, /1m\+ holders \+3\.20pp/);
  assert.equal(ranking.items.some((item) => item.code === "3333"), false);
});

test("buildLargeHolderRanking supports broader tiers and longer windows without fabricating missing share levels", () => {
  const ranking = buildLargeHolderRanking(companies, { tier: "400k_plus", window: "4w", topN: 10 });

  assert.deepEqual(ranking.items.map((item) => item.code), ["1111", "2222"]);
  assert.equal(ranking.items[0].changePctPoint, 4.3);
  assert.equal(ranking.items[1].changePctPoint, 2.4);
  assert.match(ranking.items[1].reason, /400k\+ holders \+2\.40pp/);
});

test("buildLargeHolderRanking exposes honest empty/unavailable state when no trusted tier rows exist", () => {
  const ranking = buildLargeHolderRanking([
    { code: "4444", name: "No Tier Data", holdingSharesPer: [] },
  ], { tier: "1m_plus", window: "1w" });

  assert.equal(ranking.status, "empty");
  assert.deepEqual(ranking.items, []);
  assert.match(ranking.emptyReason ?? "", /No checked-in FinMind holding-share tier rows/);
  assert.match(ranking.source.scope, /tracked sample 0 \/ 1/);
});

test("checked-in large-holder artifact is wired into Daily Report with tracked-sample source copy", () => {
  const artifact = JSON.parse(fs.readFileSync("public/data/large-holder-ranking.json", "utf8")) as {
    schemaVersion: number;
    rankings: Array<{ tier: LargeHolderTier; window: LargeHolderWindow; source: { scope: string; warning: string } }>;
  };
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };

  assert.equal(artifact.schemaVersion, 1);
  assert.deepEqual(artifact.rankings.map((ranking) => `${ranking.tier}:${ranking.window}`), [
    "1m_plus:1w",
    "1m_plus:4w",
    "400k_plus:1w",
    "400k_plus:4w",
  ]);
  assert.ok(artifact.rankings.every((ranking) => ranking.source.scope.includes("tracked sample")));
  assert.ok(artifact.rankings.every((ranking) => ranking.source.warning.includes("not full market")));

  assert.match(page, /large-holder-ranking\.json/);
  assert.match(page, /大戶分級排行/);
  assert.match(page, /tracked sample/);
  assert.match(page, /not full market/);
  assert.match(packageJson.scripts["data:daily-refresh"], /report:large-holders/);
});

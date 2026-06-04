import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  buildStrongStockRanking,
  type StrongStockCompanyInput,
  type StrongStockTimeframe,
} from "./strongStockRanking";

function prices(values: Array<[string, number, number?]>) {
  return values.map(([date, close, volume = 1000]) => ({
    date,
    open: close,
    high: close * 1.02,
    low: close * 0.98,
    close,
    volume,
  }));
}

const companies: StrongStockCompanyInput[] = [
  {
    code: "1111",
    name: "Fresh Winner",
    topicCount: 5,
    dailyPrices: prices([
      ["2026-06-01", 100, 1000],
      ["2026-06-02", 104, 1200],
      ["2026-06-03", 108, 1600],
      ["2026-06-04", 116, 2500],
    ]),
    // This must not affect ranking: Slice 7 is pure price/technical only.
    institutionalNet: -999999999,
  },
  {
    code: "2222",
    name: "Fresh Slow",
    topicCount: 9,
    dailyPrices: prices([
      ["2026-06-01", 100, 1000],
      ["2026-06-02", 101, 1000],
      ["2026-06-03", 102, 1000],
      ["2026-06-04", 103, 1000],
    ]),
    institutionalNet: 999999999,
  },
  {
    code: "3333",
    name: "Stale Rocket",
    topicCount: 20,
    dailyPrices: prices([
      ["2026-06-01", 100, 1000],
      ["2026-06-02", 200, 9000],
    ]),
  },
];

test("buildStrongStockRanking ranks only fresh checked-in K-line technical data and excludes stale rockets", () => {
  const ranking = buildStrongStockRanking(companies, { timeframe: "5d", topN: 10 });

  assert.equal(ranking.status, "partial");
  assert.equal(ranking.timeframe, "5d");
  assert.equal(ranking.source.name, "FinMind TaiwanStockPrice checked-in financial snapshots");
  assert.equal(ranking.source.latestDate, "2026-06-04");
  assert.match(ranking.source.scope, /fresh K-line coverage 2 \/ 3/);
  assert.match(ranking.source.warning ?? "", /price\/technical only/i);

  assert.deepEqual(ranking.items.map((item) => item.code), ["1111", "2222"]);
  assert.equal(ranking.items.some((item) => item.code === "3333"), false);
  assert.ok(ranking.items[0].score > ranking.items[1].score);
  assert.match(ranking.items[0].reason, /5d return|volume ratio|MA/);
});

test("buildStrongStockRanking exposes honest timeframe availability and empty state", () => {
  const ranking = buildStrongStockRanking([
    {
      code: "4444",
      name: "Too Short",
      topicCount: 1,
      dailyPrices: prices([["2026-06-04", 10, 100]]),
    },
  ], { timeframe: "20d", topN: 5 });

  assert.equal(ranking.status, "empty");
  assert.deepEqual(ranking.items, []);
  assert.match(ranking.emptyReason ?? "", /20d/);
  assert.match(ranking.source.scope, /fresh K-line coverage 1 \/ 1/);
});

test("checked-in strong-stock ranking artifact is generated from semantic modules and wired into daily report", () => {
  const artifact = JSON.parse(fs.readFileSync("public/data/strong-stock-ranking.json", "utf8")) as {
    schemaVersion: number;
    rankings: Array<{ timeframe: StrongStockTimeframe; items: unknown[]; source: { scope: string; warning?: string } }>;
  };
  const page = fs.readFileSync("src/app/daily-report/page.tsx", "utf8");
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };

  assert.equal(artifact.schemaVersion, 1);
  assert.deepEqual(artifact.rankings.map((ranking) => ranking.timeframe), ["1d", "5d", "20d"]);
  assert.ok(artifact.rankings.every((ranking) => ranking.source.scope.includes("fresh K-line coverage")));
  assert.ok(artifact.rankings.every((ranking) => ranking.source.warning?.includes("price/technical only")));

  assert.match(page, /strong-stock-ranking\.json/);
  assert.match(page, /強勢股排行/);
  assert.match(page, /price\/technical only/);
  assert.match(packageJson.scripts["data:daily-refresh"], /report:strong-stocks/);
});

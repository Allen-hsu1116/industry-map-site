import assert from "node:assert/strict";
import test from "node:test";
import { mergeDailyPrices, normalizeFinMindPriceRow, planKLineUpdate, selectPriorityCompanies } from "./klineRefresh";

const existingFinancial = {
  code: "2330",
  name: "台積電",
  price: { date: "2026-05-30", open: 100, high: 110, low: 99, close: 108, volume: 1000 },
  trends: {
    daily_prices: [
      { date: "2026-05-29", open: 98, high: 101, low: 97, close: 100, volume: 800 },
      { date: "2026-05-30", open: 100, high: 110, low: 99, close: 108, volume: 1000 },
    ],
  },
};

test("normalizeFinMindPriceRow preserves FinMind OHLCV semantics and rejects impossible ranges", () => {
  assert.deepEqual(
    normalizeFinMindPriceRow({ date: "2026-06-01", open: "109", max: "115", min: "107", close: "112", Trading_Volume: "12345" }),
    { date: "2026-06-01", open: 109, high: 115, low: 107, close: 112, volume: 12345 },
  );

  assert.throws(
    () => normalizeFinMindPriceRow({ date: "2026-06-01", open: 116, max: 115, min: 107, close: 112, Trading_Volume: 12345 }),
    /invalid OHLC range/,
  );
  assert.throws(
    () => normalizeFinMindPriceRow({ date: "2026-06-01", open: 109, max: 115, min: 107, close: 112, Trading_Volume: -1 }),
    /negative volume/,
  );
});

test("mergeDailyPrices dedupes by date, sorts ascending, and lets newer FinMind rows replace same-date rows", () => {
  const merged = mergeDailyPrices(existingFinancial.trends.daily_prices, [
    { date: "2026-05-30", open: 101, high: 111, low: 100, close: 109, volume: 2000 },
    { date: "2026-06-01", open: 109, high: 115, low: 107, close: 112, volume: 12345 },
  ]);

  assert.deepEqual(merged.map((row) => row.date), ["2026-05-29", "2026-05-30", "2026-06-01"]);
  assert.equal(merged.at(-1)?.close, 112);
  assert.equal(merged.find((row) => row.date === "2026-05-30")?.volume, 2000);
});

test("planKLineUpdate mirrors latest K-line into top-level price and supports dry-run without returning writable JSON", () => {
  const fetchedRows = [
    { date: "2026-06-01", open: 109, high: 115, low: 107, close: 112, volume: 12345 },
  ];

  const dryRun = planKLineUpdate(existingFinancial, fetchedRows, { asOfDate: "2026-06-01", dryRun: true });
  assert.equal(dryRun.changed, true);
  assert.equal(dryRun.writableJson, null);
  assert.equal(dryRun.next.price.date, "2026-06-01");
  assert.equal(dryRun.next.price.close, 112);
  assert.match(dryRun.next.priceSource, /FinMind TaiwanStockPrice/);
  assert.match(dryRun.next.priceSource, /no AI-filled K-line rows/);

  const writePlan = planKLineUpdate(existingFinancial, fetchedRows, { asOfDate: "2026-06-01", dryRun: false });
  assert.equal(writePlan.changed, true);
  assert.ok(writePlan.writableJson?.endsWith("\n"));
  assert.match(writePlan.writableJson ?? "", /\"date\": \"2026-06-01\"/);
});

test("planKLineUpdate returns unchanged when fetched rows add no semantic data even if refresh date changed", () => {
  const alreadyCurrent = {
    ...existingFinancial,
    priceSource: "FinMind TaiwanStockPrice via api.finmindtrade.com; updated batch 2026-06-01; raw daily OHLCV only, no AI-filled K-line rows",
  };
  const unchanged = planKLineUpdate(alreadyCurrent, [alreadyCurrent.trends.daily_prices.at(-1)!], { asOfDate: "2026-06-02", dryRun: false });
  assert.equal(unchanged.changed, false);
  assert.equal(unchanged.writableJson, null);
});

test("selectPriorityCompanies follows topic_count priority and applies limit", () => {
  const companies = [
    { code: "1000", name: "低優先", topic_count: 1 },
    { code: "2000", name: "高優先", topic_count: 5 },
    { code: "3000", name: "中優先", topic_count: 3 },
  ];

  assert.deepEqual(selectPriorityCompanies(companies, 2).map((company) => company.code), ["2000", "3000"]);
});

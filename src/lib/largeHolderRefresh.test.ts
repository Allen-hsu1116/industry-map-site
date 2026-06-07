import assert from "node:assert/strict";
import test from "node:test";
import { normalizeFinMindHoldingRows, planLargeHolderSampleRefresh, type LargeHolderSampleArtifact } from "./largeHolderRefresh";

const current: LargeHolderSampleArtifact = {
  schemaVersion: 1,
  generatedAt: "2026-05-30T00:00:00.000Z",
  source: {
    name: "FinMind TaiwanStockHoldingSharesPer",
    retrieval: "manual fixture",
    scope: "tracked sample selected from high topic-count companies; not full market",
    semantics: "Weekly shareholding distribution by share-count tier.",
  },
  companies: [
    {
      code: "2330",
      name: "台積電",
      holdingSharesPer: [
        { date: "2026-05-29", stock_id: "2330", level: "400,001-600,000", people: 10, percent: 1.1, unit: 1000 },
        { date: "2026-05-29", stock_id: "2330", level: "more than 1,000,001", people: 5, percent: 80, unit: 9000 },
      ],
    },
  ],
};

test("normalizeFinMindHoldingRows keeps only ranking tiers and parses numeric fields", () => {
  const rows = normalizeFinMindHoldingRows([
    { date: "2026-06-05", stock_id: "2330", level: "1-999", people: "2,000", percent: "0.9", unit: "123" },
    { date: "2026-06-05", stock_id: "2330", level: "400,001-600,000", people: "563", percent: "1.06", unit: "276,059,662" },
    { date: "2026-06-05", stock_id: "2330", level: "more than 1,000,001", people: 1499, percent: 85.42, unit: 22151774520 },
    { date: "2026-06-05", stock_id: "2330", level: "total", people: 2678648, percent: 100, unit: 25932524521 },
  ], "2330");

  assert.deepEqual(rows.map((row) => row.level), ["400,001-600,000", "more than 1,000,001"]);
  assert.equal(rows[0].people, 563);
  assert.equal(rows[0].unit, 276059662);
});

test("planLargeHolderSampleRefresh merges automated FinMind rows into selected tracked sample", () => {
  const plan = planLargeHolderSampleRefresh(
    current,
    [
      { code: "2330", name: "台積電", topic_count: 99 },
      { code: "2317", name: "鴻海", topic_count: 80 },
      { code: "9999", name: "不應選到", topic_count: 1 },
    ],
    [
      {
        code: "2330",
        name: "台積電",
        rows: [
          { date: "2026-06-05", stock_id: "2330", level: "400,001-600,000", people: 12, percent: 1.2, unit: 1200 },
          { date: "2026-06-05", stock_id: "2330", level: "more than 1,000,001", people: 6, percent: 81, unit: 9100 },
        ],
      },
    ],
    { limit: 2, startDate: "2026-05-01", endDate: "2026-06-07" },
  );

  assert.equal(plan.changed, true);
  assert.deepEqual(plan.selectedCodes, ["2330", "2317"]);
  assert.deepEqual(plan.updatedCodes, ["2330"]);
  assert.deepEqual(plan.skippedCodes, ["2317"]);
  assert.equal(plan.latestDate, "2026-06-05");
  assert.ok(plan.writableJson?.includes("Automated FinMind API refresh"));
  assert.ok(plan.writableJson?.includes("2026-05-29"));
  assert.ok(plan.writableJson?.includes("2026-06-05"));
});

test("planLargeHolderSampleRefresh preserves existing data and does not add empty companies when a fetch is skipped", () => {
  const plan = planLargeHolderSampleRefresh(
    current,
    [
      { code: "2330", name: "台積電", topic_count: 99 },
      { code: "2317", name: "鴻海", topic_count: 80 },
    ],
    [],
    { limit: 2, startDate: "2026-05-01", endDate: "2026-06-07" },
  );

  assert.equal(plan.changed, false);
  assert.deepEqual(plan.skippedCodes, ["2330", "2317"]);
  assert.equal(plan.writableJson, undefined);
});

test("planLargeHolderSampleRefresh preserves existing artifact when every automated fetch is unavailable", () => {
  const plan = planLargeHolderSampleRefresh(
    current,
    [
      { code: "2330", name: "台積電", topic_count: 9 },
      { code: "9999", name: "缺資料", topic_count: 8 },
    ],
    [],
    { limit: 2, startDate: "2026-05-01", endDate: "2026-06-01" },
  );

  assert.equal(plan.changed, false);
  assert.equal(plan.writableJson, undefined);
  assert.deepEqual(plan.updatedCodes, []);
  assert.deepEqual(plan.skippedCodes, ["2330", "9999"]);
  assert.equal(plan.latestDate, "2026-05-29");
});

test("planLargeHolderSampleRefresh dry-run reports changes without writable JSON", () => {
  const plan = planLargeHolderSampleRefresh(
    current,
    [{ code: "2330", name: "台積電", topic_count: 99 }],
    [{ code: "2330", name: "台積電", rows: [{ date: "2026-06-05", stock_id: "2330", level: "more than 1,000,001", people: 6, percent: 81, unit: 9100 }] }],
    { limit: 1, startDate: "2026-05-01", endDate: "2026-06-07", dryRun: true },
  );

  assert.equal(plan.changed, true);
  assert.equal(plan.writableJson, undefined);
});

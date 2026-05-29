import assert from "node:assert/strict";
import test from "node:test";
import { computeTechnicalSummary, formatTWSEQuote, normalizeFinancialData } from "./marketData";

test("formatTWSEQuote maps TWSE five-level asks/bids without confusing stock code with ask volume", () => {
  const quote = formatTWSEQuote({
    c: "2330",
    n: "台積電",
    z: "2270.00",
    y: "2310.00",
    o: "2320.00",
    h: "2325.00",
    l: "2270.00",
    v: "22459000",
    tval: "51372670000",
    a: "2275.00_2280.00_2285.00_2290.00_2295.00_",
    f: "19_35_22_11_9_",
    b: "2270.00_2265.00_2260.00_2255.00_2250.00_",
    g: "50_41_33_20_12_",
    d: "20260526",
    t: "14:30:00",
  }, "TSE");

  assert.equal(quote.symbol, "2330");
  assert.equal(quote.sellPrice, 2275);
  assert.equal(quote.sellVolume, 19);
  assert.equal(quote.buyPrice, 2270);
  assert.equal(quote.buyVolume, 50);
  assert.deepEqual(quote.orderBook?.asks[0], { price: 2275, volume: 19 });
  assert.deepEqual(quote.orderBook?.bids[0], { price: 2270, volume: 50 });
});

test("formatTWSEQuote uses live five-level book when last-traded price is temporarily unavailable", () => {
  const quote = formatTWSEQuote({
    c: "2330",
    n: "台積電",
    z: "-",
    y: "2295.0000",
    o: "2340.0000",
    h: "2360.0000",
    l: "2330.0000",
    v: "14217",
    a: "2360.0000_2365.0000_2370.0000_2375.0000_2380.0000_",
    f: "2085_959_1070_475_807_",
    b: "2355.0000_2350.0000_2345.0000_2340.0000_2335.0000_",
    g: "355_453_474_383_379_",
    d: "20260529",
    t: "09:56:30",
  }, "TSE");

  assert.equal(quote.price, 2357.5);
  assert.equal(quote.previousClose, 2295);
  assert.equal(quote.change, 62.5);
  assert.equal(quote.changePercent, 2.72);
  assert.equal(quote.buyPrice, 2355);
  assert.equal(quote.sellPrice, 2360);
});

test("computeTechnicalSummary returns latest moving averages and volume metrics", () => {
  const daily = Array.from({ length: 20 }, (_, i) => ({
    date: `2026-05-${String(i + 1).padStart(2, "0")}`,
    open: 100 + i,
    high: 102 + i,
    low: 99 + i,
    close: 100 + i,
    volume: 1000 + i * 100,
  }));

  const summary = computeTechnicalSummary(daily);
  assert.equal(summary.latestClose, 119);
  assert.equal(summary.ma5, 117);
  assert.equal(summary.ma10, 114.5);
  assert.equal(summary.ma20, 109.5);
  assert.equal(summary.volume, 2900);
  assert.equal(summary.avgVolume20, 1950);
  assert.equal(summary.aboveMa20, true);
});

test("normalizeFinancialData deep-fills missing nested fields so detail tabs do not crash", () => {
  const data = normalizeFinancialData({ code: "9999", name: "測試", trends: { daily_prices: undefined } });

  assert.equal(data.profile.industry, "");
  assert.equal(data.valuation.pe, "");
  assert.equal(data.income.revenue, "");
  assert.deepEqual(data.trends?.daily_prices, []);
  assert.deepEqual(data.institutional_history, []);
  assert.deepEqual(data.margin_history, []);
});

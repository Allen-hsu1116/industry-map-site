import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
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

test("checked-in high-priority financial K-lines are fresh and OHLC-valid", () => {
  const repoRoot = path.resolve(__dirname, "../..");
  const companies = JSON.parse(fs.readFileSync(path.join(repoRoot, "public/data/companies.json"), "utf-8")) as { code: string; name: string; topic_count: number }[];
  const targetCompanies = companies
    .slice()
    .sort((a, b) => b.topic_count - a.topic_count)
    .slice(0, 30);

  assert.equal(targetCompanies.length, 30);

  for (const company of targetCompanies) {
    const file = path.join(repoRoot, "public/data/financials", `${company.code}.json`);
    const data = JSON.parse(fs.readFileSync(file, "utf-8")) as { trends?: { daily_prices?: { date: string; open: number; high: number; low: number; close: number; volume: number }[] }; price?: { date?: string; open?: number; high?: number; low?: number; close?: number; volume?: number }; updatedAt?: string };
    const prices = data.trends?.daily_prices ?? [];
    assert.ok(prices.length >= 5, `${company.code} ${company.name} should have at least 5 K-line rows`);

    const sorted = prices.slice().sort((a, b) => a.date.localeCompare(b.date));
    assert.deepEqual(prices.map((row) => row.date), sorted.map((row) => row.date), `${company.code} K-line dates must be ascending`);
    assert.ok(sorted.at(-1)?.date >= "2026-06-01", `${company.code} ${company.name} K-line latest date is stale: ${sorted.at(-1)?.date}`);

    for (const row of sorted.slice(-10)) {
      assert.ok(row.low <= row.open && row.open <= row.high, `${company.code} invalid open range on ${row.date}`);
      assert.ok(row.low <= row.close && row.close <= row.high, `${company.code} invalid close range on ${row.date}`);
      assert.ok(row.volume >= 0, `${company.code} negative volume on ${row.date}`);
    }

    const latest = sorted.at(-1)!;
    assert.equal(data.price?.date, latest.date, `${company.code} top-level price date should mirror latest K-line date`);
    assert.equal(data.price?.open, latest.open, `${company.code} top-level price open should mirror latest K-line open`);
    assert.equal(data.price?.high, latest.high, `${company.code} top-level price high should mirror latest K-line high`);
    assert.equal(data.price?.low, latest.low, `${company.code} top-level price low should mirror latest K-line low`);
    assert.equal(data.price?.close, latest.close, `${company.code} top-level price close should mirror latest K-line close`);
  }
});

test("checked-in high-priority financial chip feeds are fresh and sourced", () => {
  const repoRoot = path.resolve(__dirname, "../..");
  const companies = JSON.parse(fs.readFileSync(path.join(repoRoot, "public/data/companies.json"), "utf-8")) as { code: string; name: string; topic_count: number }[];
  const targetCompanies = companies
    .slice()
    .sort((a, b) => b.topic_count - a.topic_count)
    .slice(0, 30);

  for (const company of targetCompanies) {
    const file = path.join(repoRoot, "public/data/financials", `${company.code}.json`);
    const data = JSON.parse(fs.readFileSync(file, "utf-8")) as {
      institutional_history?: { date: string; total_net?: number; foreign_net?: number; investment_trust_net?: number; dealer_net?: number }[];
      margin_history?: { date: string; margin_buy?: number; margin_sell?: number; margin_balance?: number; short_sell?: number; short_buy?: number; short_balance?: number }[];
      per_history?: { date: string; pe?: number; pb?: number; dividend_yield?: number }[];
      valuation?: { date?: string; pe?: string; pb?: string; dividendYield?: string };
      marketFeedSource?: string;
    };
    const institutional = data.institutional_history ?? [];
    const margin = data.margin_history ?? [];
    const per = data.per_history ?? [];
    assert.ok(institutional.length >= 5, `${company.code} ${company.name} should have institutional history rows`);
    assert.ok(margin.length >= 5, `${company.code} ${company.name} should have margin history rows`);
    assert.ok(per.length >= 5, `${company.code} ${company.name} should have PER/PBR/dividend-yield rows`);
    const latestInstitutional = institutional.at(-1);
    const latestMargin = margin.at(-1);
    const latestPer = per.at(-1);
    assert.ok(latestInstitutional, `${company.code} institutional should have latest row`);
    assert.ok(latestMargin, `${company.code} margin should have latest row`);
    assert.ok(latestPer, `${company.code} PER should have latest row`);
    assert.ok(latestInstitutional.date >= "2026-06-01", `${company.code} institutional latest date is stale: ${latestInstitutional.date}`);
    assert.ok(latestMargin.date >= "2026-06-01", `${company.code} margin latest date is stale: ${latestMargin.date}`);
    assert.ok(latestPer.date >= "2026-06-01", `${company.code} PER latest date is stale: ${latestPer.date}`);
    assert.equal(data.valuation?.date, latestPer.date.replaceAll("-", ""), `${company.code} valuation date should mirror latest PER row`);
    assert.match(String(data.marketFeedSource), /FinMind TaiwanStockInstitutionalInvestorsBuySell/);
    assert.match(String(data.marketFeedSource), /FinMind TaiwanStockMarginPurchaseShortSale/);
    assert.match(String(data.marketFeedSource), /FinMind TaiwanStockPER/);
    assert.match(String(data.marketFeedSource), /no AI-filled chip rows/);
  }
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

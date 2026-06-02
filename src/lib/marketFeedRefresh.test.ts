import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeInstitutionalHistory,
  mergeMarginHistory,
  mergePerHistory,
  normalizeFinMindInstitutionalRows,
  normalizeFinMindMarginRow,
  normalizeFinMindPerRow,
  planMarketFeedUpdate,
} from "./marketFeedRefresh";

test("normalizeFinMindInstitutionalRows aggregates official investor categories without fabricating missing values", () => {
  const rows = normalizeFinMindInstitutionalRows([
    { date: "2026-06-01", name: "Foreign_Investor", buy: 1000, sell: 300 },
    { date: "2026-06-01", name: "Investment_Trust", buy: 200, sell: 500 },
    { date: "2026-06-01", name: "Dealer_self", buy: 70, sell: 10 },
    { date: "2026-06-01", name: "Dealer_Hedging", buy: 30, sell: 80 },
    { date: "2026-06-01", name: "Foreign_Dealer_Self", buy: 0, sell: 0 },
  ]);

  assert.deepEqual(rows, [
    {
      date: "2026-06-01",
      foreign_buy: 1000,
      foreign_sell: 300,
      foreign_net: 700,
      investment_trust_buy: 200,
      investment_trust_sell: 500,
      investment_trust_net: -300,
      dealer_buy: 100,
      dealer_sell: 90,
      dealer_net: 10,
      dealer_hedge_buy: 30,
      dealer_hedge_sell: 80,
      dealer_hedge_net: -50,
      total_buy: 1300,
      total_sell: 890,
      total_net: 410,
    },
  ]);
});

test("normalizeFinMindMarginRow preserves FinMind margin and short-sale raw semantics", () => {
  assert.deepEqual(normalizeFinMindMarginRow({
    date: "2026-06-01",
    MarginPurchaseBuy: 2142,
    MarginPurchaseSell: 967,
    MarginPurchaseCashRepayment: 260,
    MarginPurchaseTodayBalance: 29079,
    MarginPurchaseYesterdayBalance: 28164,
    MarginPurchaseLimit: 6483131,
    ShortSaleSell: 2,
    ShortSaleBuy: 9,
    ShortSaleCashRepayment: 0,
    ShortSaleTodayBalance: 99,
    ShortSaleYesterdayBalance: 106,
    ShortSaleLimit: 6483131,
    OffsetLoanAndShort: 0,
  }), {
    date: "2026-06-01",
    margin_buy: 2142,
    margin_sell: 967,
    margin_cash_repayment: 260,
    margin_balance: 29079,
    margin_yesterday_balance: 28164,
    margin_limit: 6483131,
    short_sell: 2,
    short_buy: 9,
    short_cash_repayment: 0,
    short_balance: 99,
    short_yesterday_balance: 106,
    short_limit: 6483131,
    offset: 0,
  });
});

test("normalizeFinMindPerRow preserves daily valuation semantics", () => {
  assert.deepEqual(normalizeFinMindPerRow({
    date: "2026-06-01",
    per: 31.66,
    pbr: 10.37,
    dividend_yield: 0.93,
  }), {
    date: "2026-06-01",
    pe: 31.66,
    pb: 10.37,
    dividend_yield: 0.93,
  });
});

test("market feed merge dedupes by date and keeps dates ascending", () => {
  const institutional = mergeInstitutionalHistory(
    [{ date: "2026-05-31", total_net: 1, foreign_net: 1, investment_trust_net: 0, dealer_net: 0 }],
    [{ date: "2026-06-01", total_net: 2, foreign_net: 2, investment_trust_net: 0, dealer_net: 0 }],
  );
  const margin = mergeMarginHistory(
    [{ date: "2026-05-31", margin_buy: 1, margin_sell: 2, margin_balance: 10, short_sell: 0, short_buy: 0, short_balance: 0 }],
    [{ date: "2026-06-01", margin_buy: 3, margin_sell: 4, margin_balance: 11, short_sell: 1, short_buy: 0, short_balance: 1 }],
  );

  const per = mergePerHistory(
    [{ date: "2026-05-31", pe: 10, pb: 2, dividend_yield: 3 }],
    [{ date: "2026-06-01", pe: 11, pb: 2.1, dividend_yield: 2.9 }],
  );

  assert.deepEqual(institutional.map((row) => row.date), ["2026-05-31", "2026-06-01"]);
  assert.deepEqual(margin.map((row) => row.date), ["2026-05-31", "2026-06-01"]);
  assert.deepEqual(per.map((row) => row.date), ["2026-05-31", "2026-06-01"]);
});

test("planMarketFeedUpdate updates chip histories and source stamp while dry-run returns no writable JSON", () => {
  const plan = planMarketFeedUpdate({
    code: "2330",
    institutional_history: [{ date: "2026-05-25", total_net: 1, foreign_net: 1, investment_trust_net: 0, dealer_net: 0 }],
    margin_history: [{ date: "2026-05-25", margin_buy: 1, margin_sell: 1, margin_balance: 10, short_sell: 0, short_buy: 0, short_balance: 0 }],
  }, {
    institutionalRows: [{ date: "2026-06-01", total_net: 2, foreign_net: 2, investment_trust_net: 0, dealer_net: 0 }],
    marginRows: [{ date: "2026-06-01", margin_buy: 2, margin_sell: 1, margin_balance: 11, short_sell: 0, short_buy: 0, short_balance: 0 }],
    perRows: [{ date: "2026-06-01", pe: 31.66, pb: 10.37, dividend_yield: 0.93 }],
    asOfDate: "2026-06-02",
    dryRun: true,
  });

  assert.equal(plan.changed, true);
  assert.equal(plan.latestInstitutionalDate, "2026-06-01");
  assert.equal(plan.latestMarginDate, "2026-06-01");
  assert.equal(plan.latestPerDate, "2026-06-01");
  assert.equal(plan.next.valuation.date, "20260601");
  assert.equal(plan.next.valuation.pe, "31.66");
  assert.equal(plan.writableJson, null);
  assert.match(String(plan.next.marketFeedSource), /FinMind TaiwanStockInstitutionalInvestorsBuySell/);
  assert.match(String(plan.next.marketFeedSource), /FinMind TaiwanStockMarginPurchaseShortSale/);
  assert.match(String(plan.next.marketFeedSource), /FinMind TaiwanStockPER/);
});

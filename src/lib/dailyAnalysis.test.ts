import { test } from "node:test";
import assert from "node:assert/strict";
import { generateDailyAnalysis } from "./dailyAnalysis";

function makePrices(days = 30) {
  return Array.from({ length: days }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    const close = 100 + index;
    return {
      date: `2026-05-${day}`,
      open: close - 1,
      high: close + 2,
      low: close - 2,
      close,
      volume: index === days - 1 ? 3000 : 1000,
    };
  });
}

test("generateDailyAnalysis summarizes bullish technical and accumulation chip signals", () => {
  const analysis = generateDailyAnalysis({
    code: "2330",
    name: "台積電",
    updatedAt: "2026-05-30",
    trends: { daily_prices: makePrices(30) },
    valuation: { pe: "25.5" },
    monthly_revenue: { yoy: "18.2" },
    institutional_history: Array.from({ length: 20 }, (_, index) => ({
      date: `2026-05-${String(index + 1).padStart(2, "0")}`,
      foreign_net: 1000,
      investment_trust_net: 500,
      dealer_net: 100,
      total_net: 1600,
    })),
    products: ["先進製程", "CoWoS"],
    industry_analysis: {
      "ai-server": {
        market_position: "🟢 產業龍頭",
        market_position_detail: "AI GPU / ASIC 先進製程與封裝核心供應商",
        products: ["N3/N2 製程", "CoWoS 先進封裝"],
        customers: ["NVIDIA", "Apple"],
        swot: {
          strengths: ["先進製程領先且客戶黏著度高"],
          weaknesses: ["海外設廠成本高"],
          opportunities: ["AI/HPC 需求推升先進製程與封裝需求"],
          threats: ["地緣政治與出口管制風險"],
        },
      },
    },
    margin_history: Array.from({ length: 10 }, (_, index) => ({
      date: `2026-05-${String(index + 1).padStart(2, "0")}`,
      margin_buy: 100,
      margin_sell: 120,
      margin_balance: 10000 - index * 100,
      short_sell: 10,
      short_buy: 8,
      short_balance: 500,
    })),
  }, new Date("2026-05-31T00:00:00.000Z"));

  assert.equal(analysis.schemaVersion, 1);
  assert.equal(analysis.mode, "rule-batch");
  assert.equal(analysis.technical.stance, "bullish");
  assert.equal(analysis.chips.stance, "accumulation");
  assert.equal(analysis.industry.label, "核心題材受惠");
  assert.ok(analysis.knowledge.products.includes("CoWoS"));
  assert.ok(analysis.knowledge.topicRoles.some((role) => role.topicId === "ai-server"));
  assert.ok(analysis.knowledge.swot.strengths.some((point) => point.includes("先進製程")));
  assert.ok(analysis.knowledge.dataSources.some((source) => source.includes("FinMind")));
  assert.match(analysis.technical.summary, /台積電/);
  assert.ok(analysis.nextSession.triggerRules.length >= 3);
});

test("generateDailyAnalysis returns insufficient labels when data is sparse", () => {
  const analysis = generateDailyAnalysis({
    code: "0000",
    name: "測試股",
    trends: { daily_prices: [] },
    institutional_history: [],
    margin_history: [],
  }, new Date("2026-05-31T00:00:00.000Z"));

  assert.equal(analysis.technical.stance, "insufficient");
  assert.equal(analysis.chips.stance, "insufficient");
  assert.equal(analysis.industry.label, "產業資料待補");
  assert.equal(analysis.knowledge.swot.freshness, "unknown");
  assert.ok(analysis.technical.signals[0].includes("資料不足"));
});

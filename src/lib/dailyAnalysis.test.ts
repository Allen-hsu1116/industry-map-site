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
  assert.equal(analysis.marketDataDate, "2026-05-30");
  assert.equal(analysis.chipDataDate, "2026-05-20");
  assert.match(analysis.technical.summary, /台積電/);
  assert.ok(analysis.nextSession.triggerRules.length >= 3);
});

test("generateDailyAnalysis prefers V2 topic roles, canonical topics, and evidence-backed SWOT", () => {
  const analysis = generateDailyAnalysis({
    code: "2308",
    name: "台達電",
    trends: { daily_prices: makePrices(30) },
    institutional_history: Array.from({ length: 5 }, (_, index) => ({
      date: `2026-05-${String(index + 1).padStart(2, "0")}`,
      foreign_net: 0,
      investment_trust_net: 0,
      dealer_net: 0,
      total_net: 0,
    })),
    margin_history: [],
    products: ["電源供應器"],
    industry_analysis: {
      "ai-server": {
        market_position: "legacy high",
        relevance: "high",
        products: ["legacy product"],
        swot: {
          strengths: ["legacy strength"],
          weaknesses: ["legacy weakness"],
          opportunities: ["legacy opportunity"],
          threats: ["legacy threat"],
        },
      },
    },
    companyTopicRoles: {
      schemaVersion: 1,
      companyCode: "2308",
      companyName: "台達電",
      updatedAt: "2026-05-28",
      roles: [{
        topicId: "ai-server-power",
        topicName: "AI 伺服器電源",
        topicType: "supply_chain_segment",
        directness: "direct_enabler",
        supplyChainStage: "power",
        roleType: "power supplier",
        roleSummary: "提供 AI 伺服器所需高功率電源與電源管理方案。",
        products: ["AI 伺服器電源供應器"],
        evidence: [{ sourceId: "delta-2025-ar", publisher: "Delta", title: "Annual Report", url: "https://example.com", claim: "power" }],
        confidence: "high",
        lastVerified: "2026-05-28",
        status: "verified",
      }],
    },
    companySwot: {
      schemaVersion: 1,
      companyCode: "2308",
      companyName: "台達電",
      updatedAt: "2026-05-28",
      items: [{
        id: "2308-o-ai-power-demand",
        category: "opportunity",
        statement: "AI 伺服器功耗提升推升高效率電源供應器需求。",
        rationale: "高功率 GPU 伺服器需要更高效率與更高瓦數的電源架構。",
        timeHorizon: "structural",
        relatedTopicIds: ["ai-server"],
        evidence: [{ sourceId: "delta-2025-ar", publisher: "Delta", title: "Annual Report", url: "https://example.com", claim: "AI power demand" }],
        confidence: "high",
        lastVerified: "2026-05-28",
        status: "verified",
      }],
    },
    canonicalTopics: {
      schemaVersion: 1,
      updatedAt: "2026-05-28",
      topicDefinition: { rule: "test", notTopic: [] },
      topics: [{
        id: "ai-server",
        name: "AI 伺服器",
        type: "theme",
        status: "active",
        definition: "AI server topic",
        whyItMatters: "AI server demand",
        aliases: [],
        legacyTopicIds: ["ai-server-power"],
        include: [],
        exclude: [],
        activationSignals: ["CSP capex", "電源規格升級"],
        evidence: [],
        confidence: "medium",
        lastVerified: "2026-05-28",
      }],
    },
  }, new Date("2026-05-31T00:00:00.000Z"));

  assert.equal(analysis.industry.label, "核心題材受惠");
  assert.match(analysis.industry.summary, /V2 角色/);
  assert.ok(analysis.industry.signals.some((signal) => signal.includes("V2 題材角色：AI 伺服器")));
  assert.ok(analysis.industry.watch.some((item) => item.includes("V2 O：AI 伺服器功耗提升")));
  assert.equal(analysis.canonicalKnowledge.topicRoles[0].canonicalTopicId, "ai-server");
  assert.equal(analysis.canonicalKnowledge.swot[0].id, "2308-o-ai-power-demand");
});

test("generateDailyAnalysis scores industry quality with directness, topic status, evidence confidence, and catalysts", () => {
  const baseInput = {
    code: "2308",
    name: "台達電",
    trends: { daily_prices: makePrices(30) },
    institutional_history: [],
    margin_history: [],
    products: ["電源供應器"],
    companyTopicRoles: {
      schemaVersion: 1 as const,
      companyCode: "2308",
      companyName: "台達電",
      updatedAt: "2026-05-28",
      roles: [{
        topicId: "ai-server-power",
        topicName: "AI 伺服器電源",
        topicType: "supply_chain_segment" as const,
        directness: "direct_enabler" as const,
        supplyChainStage: "power",
        roleType: "power supplier",
        roleSummary: "提供 AI 伺服器高功率電源與電源管理方案。",
        products: ["AI 伺服器電源供應器"],
        evidence: [{ sourceId: "delta-2025-ar", publisher: "Delta", title: "Annual Report", url: "https://example.com", claim: "power" }],
        confidence: "high" as const,
        lastVerified: "2026-05-28",
        status: "verified" as const,
      }],
    },
    canonicalTopics: {
      schemaVersion: 1 as const,
      updatedAt: "2026-05-28",
      topicDefinition: { rule: "test", notTopic: [] },
      topics: [{
        id: "ai-server",
        name: "AI 伺服器",
        type: "theme" as const,
        status: "active" as const,
        definition: "AI server topic",
        whyItMatters: "AI server demand",
        aliases: [],
        legacyTopicIds: ["ai-server-power"],
        include: [],
        exclude: [],
        activationSignals: ["CSP capex", "電源規格升級", "GPU 平台換代"],
        evidence: [],
        confidence: "high" as const,
        lastVerified: "2026-05-28",
      }],
    },
    companySwot: {
      schemaVersion: 1 as const,
      companyCode: "2308",
      companyName: "台達電",
      updatedAt: "2026-05-28",
      items: [{
        id: "2308-o-ai-power-demand",
        category: "opportunity" as const,
        statement: "AI 伺服器功耗提升推升高效率電源需求。",
        rationale: "高功率 GPU 伺服器需要更高瓦數的電源架構。",
        timeHorizon: "structural" as const,
        relatedTopicIds: ["ai-server"],
        evidence: [{ sourceId: "delta-2025-ar", publisher: "Delta", title: "Annual Report", url: "https://example.com", claim: "AI power demand" }],
        confidence: "high" as const,
        lastVerified: "2026-05-28",
        status: "verified" as const,
      }],
    },
  };

  const strong = generateDailyAnalysis(baseInput, new Date("2026-05-31T00:00:00.000Z"));
  const weak = generateDailyAnalysis({
    ...baseInput,
    companyTopicRoles: {
      ...baseInput.companyTopicRoles,
      roles: [{
        ...baseInput.companyTopicRoles.roles[0],
        directness: "indirect" as const,
        confidence: "low" as const,
        evidence: [],
      }],
    },
    canonicalTopics: {
      ...baseInput.canonicalTopics,
      topics: [{ ...baseInput.canonicalTopics.topics[0], status: "legacy_candidate" as const, activationSignals: [] }],
    },
  }, new Date("2026-05-31T00:00:00.000Z"));

  assert.ok(strong.industry.score > weak.industry.score, `expected strong ${strong.industry.score} > weak ${weak.industry.score}`);
  assert.ok(strong.industry.score >= 70);
  assert.equal(strong.industry.label, "核心題材受惠");
  assert.ok(strong.industry.signals.some((signal) => signal.includes("產業評分")));
  assert.ok(strong.industry.watch.some((item) => item.includes("催化訊號")));
  assert.match(strong.industry.summary, /score/);
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

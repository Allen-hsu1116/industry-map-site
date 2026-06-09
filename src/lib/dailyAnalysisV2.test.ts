import { test } from "node:test";
import assert from "node:assert/strict";
import { buildDailyAnalysisV2GateDecision, normalizeDailyAnalysisV2 } from "./dailyAnalysisV2";

const baseInput = {
  date: "2026-06-08",
  companyCode: "2330",
  companyName: "台積電",
  grade: "B",
  tier: "strong_watchlist",
  headline: "先進封裝仍是今日主軸",
  summary: "AI/HPC 需求帶動先進封裝供應鏈，但仍需觀察籌碼延續。",
  score: {
    total: 76,
    technical: 14,
    chip: 12,
    event: 8,
    industryTopic: 12,
    productRole: 12,
    swotRisk: -4,
    researchDirection: 6,
    knowledgeRuleFit: 6,
    dataQuality: 8,
  },
  reasons: [{
    domain: "industry",
    title: "先進封裝需求延續",
    detail: "題材仍有基本面支撐，但不是所有供應鏈同等受惠。",
    weight: 12,
    polarity: "bullish",
    sourceRefs: ["topic-role:2330:cowos"],
    derivedBy: "rule",
  }],
  risks: [],
  sourceStatus: {
    status: "partial",
    freshness: "this_week",
    sourceRefs: ["twse:daily", "topic-role:2330:cowos"],
    warnings: ["部分籌碼資料非今日"],
  },
};

test("DailyAnalysisV2 schema normalizes missing optional context into empty arrays", () => {
  const normalized = normalizeDailyAnalysisV2(baseInput);

  assert.ok(normalized);
  assert.equal(normalized.grade, "B");
  assert.equal(normalized.tier, "strong_watchlist");
  assert.deepEqual(normalized.productContext, []);
  assert.deepEqual(normalized.topicRoleContext, []);
  assert.deepEqual(normalized.swotContext, []);
  assert.deepEqual(normalized.researchContext, []);
  assert.deepEqual(normalized.knowledgeRulesApplied, []);
  assert.deepEqual(normalized.nextWatchPoints, []);
});

test("DailyAnalysisV2 schema rejects invalid grade, tier, reason domain, and score domains", () => {
  assert.equal(normalizeDailyAnalysisV2({ ...baseInput, grade: "Z" }), null);
  assert.equal(normalizeDailyAnalysisV2({ ...baseInput, tier: "recommend_now" }), null);
  assert.equal(normalizeDailyAnalysisV2({ ...baseInput, reasons: [{ ...baseInput.reasons[0], domain: "magic" }] }), null);
  assert.equal(normalizeDailyAnalysisV2({ ...baseInput, score: { ...baseInput.score, total: "76" } }), null);
});

test("DailyAnalysisV2 schema keeps source refs and evidence metadata attached to analysis fields", () => {
  const normalized = normalizeDailyAnalysisV2({
    ...baseInput,
    productContext: [{
      productName: "CoWoS",
      whatItIs: "先進封裝技術",
      whyItMatters: "AI/HPC 晶片需要高頻寬封裝整合。",
      sourceRefs: ["company:2330:annual-report"],
      confidence: "high",
      lastVerified: "2026-05-30",
    }],
    topicRoleContext: [{
      topicId: "advanced-packaging",
      topicName: "先進封裝",
      role: "核心製造者",
      stageId: "manufacturing",
      directness: "direct",
      confidence: "high",
      sourceRefs: ["topic-role:2330:advanced-packaging"],
      lastVerified: "2026-05-30",
    }],
  });

  assert.ok(normalized);
  assert.deepEqual(normalized.productContext[0].sourceRefs, ["company:2330:annual-report"]);
  assert.equal(normalized.topicRoleContext[0].directness, "direct");
});


test("grade gating blocks D/F from candidate tiers", () => {
  const decision = buildDailyAnalysisV2GateDecision({
    proposedGrade: "D",
    proposedTier: "top_candidate",
    score: baseInput.score,
    productContext: [],
    topicRoleContext: [],
    risks: [],
    sourceStatus: { status: "verified", freshness: "today", sourceRefs: ["market:today"], warnings: [] },
  });

  assert.equal(decision.grade, "D");
  assert.equal(decision.tier, "weak_signal");
  assert.ok(decision.gates.some((gate) => gate.id === "recommendation_grade_floor"));
});

test("grade gating caps missing and stale source data by severity", () => {
  const missing = buildDailyAnalysisV2GateDecision({
    proposedGrade: "A",
    proposedTier: "top_candidate",
    score: baseInput.score,
    productContext: [],
    topicRoleContext: [],
    risks: [],
    sourceStatus: { status: "insufficient", freshness: "unknown", sourceRefs: [], warnings: ["missing market data"] },
  });
  const stale = buildDailyAnalysisV2GateDecision({
    proposedGrade: "A",
    proposedTier: "top_candidate",
    score: baseInput.score,
    productContext: [],
    topicRoleContext: [],
    risks: [],
    sourceStatus: { status: "verified", freshness: "stale", sourceRefs: ["market:old"], warnings: [] },
  });

  assert.equal(missing.grade, "F");
  assert.equal(missing.tier, "insufficient_data");
  assert.ok(missing.gates.some((gate) => gate.id === "missing_core_sources"));
  assert.equal(stale.grade, "D");
  assert.equal(stale.tier, "weak_signal");
  assert.ok(stale.gates.some((gate) => gate.id === "stale_core_sources"));
});

test("grade gating caps missing product or verified direct topic role at C", () => {
  const decision = buildDailyAnalysisV2GateDecision({
    proposedGrade: "A",
    proposedTier: "top_candidate",
    score: baseInput.score,
    productContext: [{ productName: "CoWoS", whatItIs: "先進封裝", whyItMatters: "AI/HPC", sourceRefs: ["product:2330"], confidence: "high" }],
    topicRoleContext: [{ topicId: "advanced-packaging", topicName: "先進封裝", role: "題材敘事待驗證", directness: "narrative_only", confidence: "low", sourceRefs: [] }],
    risks: [],
    sourceStatus: { status: "verified", freshness: "today", sourceRefs: ["market:today"], warnings: [] },
  });

  assert.equal(decision.grade, "C");
  assert.equal(decision.tier, "observation");
  assert.ok(decision.gates.some((gate) => gate.id === "missing_verified_topic_role"));
});

test("grade gating prevents strong technical alone from becoming A", () => {
  const decision = buildDailyAnalysisV2GateDecision({
    proposedGrade: "A",
    proposedTier: "top_candidate",
    score: { ...baseInput.score, technical: 20, chip: 0, event: 0, industryTopic: 0, productRole: 0, researchDirection: 0, total: 82 },
    productContext: [{ productName: "CoWoS", whatItIs: "先進封裝", whyItMatters: "AI/HPC", sourceRefs: ["product:2330"], confidence: "high" }],
    topicRoleContext: [{ topicId: "advanced-packaging", topicName: "先進封裝", role: "核心製造者", directness: "direct", confidence: "high", sourceRefs: ["role:2330"] }],
    reasons: [{ domain: "technical", title: "突破", detail: "價量突破", weight: 20, polarity: "bullish", sourceRefs: ["market:today"], derivedBy: "rule" }],
    risks: [],
    sourceStatus: { status: "verified", freshness: "today", sourceRefs: ["market:today", "role:2330"], warnings: [] },
  });

  assert.equal(decision.grade, "B");
  assert.equal(decision.tier, "strong_watchlist");
  assert.ok(decision.gates.some((gate) => gate.id === "technical_only"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildDailyAnalysisV2Artifact, planDailyAnalysisV2ArtifactWrite } from "./dailyAnalysisV2Generator";
import { normalizeDailyAnalysisV2 } from "./dailyAnalysisV2";

const completeContext = {
  companyCode: "2330",
  companyName: "台積電",
  productContext: [{
    productName: "CoWoS-S",
    whatItIs: "用矽中介層整合 AI 加速器與 HBM 的先進封裝。",
    whyItMatters: "AI/HPC 晶片大量出貨受 CoWoS 產能與良率影響。",
    sourceRefs: ["tsmc-cowos-platform"],
    confidence: "high" as const,
    lastVerified: "2026-06-08",
  }],
  topicRoleContext: [{
    topicId: "advanced-packaging",
    topicName: "先進封裝與 CoWoS",
    role: "核心先進封裝製造者",
    stageId: "advanced_packaging",
    directness: "direct" as const,
    confidence: "high" as const,
    sourceRefs: ["role:2330:advanced-packaging"],
    lastVerified: "2026-06-08",
  }],
  swotContext: [{
    category: "threat" as const,
    statement: "先進封裝擴產需要高資本支出。",
    rationale: "如果需求節奏低於產能開出，資本支出會壓縮自由現金流彈性。",
    confidence: "medium" as const,
    sourceRefs: ["swot:2330:capex"],
    lastVerified: "2026-06-08",
  }],
  researchContext: [{
    researchSignalId: "trendforce-advanced-packaging",
    sourceName: "TrendForce",
    thesis: "AI accelerator demand supports advanced packaging direction.",
    scope: "topic",
    confidence: "medium" as const,
    sourceRefs: ["trendforce-advanced-packaging"],
  }],
  knowledgeRulesApplied: [{
    ruleId: "risk.insufficient-evidence",
    title: "資料不足不升級推薦",
    category: "risk",
    implication: "缺核心證據時只能觀察。",
    sourceRefs: ["stock-knowledge:risk"],
  }],
  sourceStatus: {
    status: "verified" as const,
    freshness: "today" as const,
    sourceRefs: ["tsmc-cowos-platform", "role:2330:advanced-packaging", "swot:2330:capex"],
    warnings: [],
  },
};

test("DailyAnalysisV2 generator builds normalized deterministic artifact with product, role, SWOT, research, and knowledge context", () => {
  const analysis = buildDailyAnalysisV2Artifact({
    date: "2026-06-08",
    companyCode: "2330",
    companyName: "台積電",
    context: completeContext,
    technical: { score: 16, summary: "價量站上短均線，仍需追蹤量能延續。", signals: ["收盤站上 MA20"], risks: [], watch: ["觀察量能是否延續"], sourceRefs: ["market:2330:2026-06-08"] },
    chip: { score: 12, summary: "投信連續買超，但外資仍需確認。", signals: ["投信近 5 日買超"], risks: [], watch: ["外資是否轉買"], sourceRefs: ["chip:2330:2026-06-08"] },
  });

  assert.ok(normalizeDailyAnalysisV2(analysis));
  assert.equal(analysis.companyCode, "2330");
  assert.equal(analysis.grade, "A");
  assert.equal(analysis.tier, "top_candidate");
  assert.equal(analysis.productContext[0].productName, "CoWoS-S");
  assert.equal(analysis.topicRoleContext[0].directness, "direct");
  assert.ok(analysis.reasons.some((reason) => reason.domain === "product_role" && reason.sourceRefs.includes("tsmc-cowos-platform")));
  assert.ok(analysis.reasons.some((reason) => reason.domain === "research" && reason.derivedBy === "rule"));
  assert.ok(analysis.risks.some((risk) => risk.sourceRefs.includes("swot:2330:capex")));

  const again = buildDailyAnalysisV2Artifact({
    date: "2026-06-08",
    companyCode: "2330",
    companyName: "台積電",
    context: completeContext,
    technical: { score: 16, summary: "價量站上短均線，仍需追蹤量能延續。", signals: ["收盤站上 MA20"], risks: [], watch: ["觀察量能是否延續"], sourceRefs: ["market:2330:2026-06-08"] },
    chip: { score: 12, summary: "投信連續買超，但外資仍需確認。", signals: ["投信近 5 日買超"], risks: [], watch: ["外資是否轉買"], sourceRefs: ["chip:2330:2026-06-08"] },
  });
  assert.deepEqual(analysis, again);
});

test("DailyAnalysisV2 generator preserves source warnings and caps missing verified role despite research direction", () => {
  const contextWithoutVerifiedRole = {
    ...completeContext,
    topicRoleContext: [],
    sourceStatus: { status: "partial" as const, freshness: "today" as const, sourceRefs: ["tsmc-cowos-platform", "trendforce-advanced-packaging"], warnings: ["Missing topic role context"] },
  };

  const analysis = buildDailyAnalysisV2Artifact({
    date: "2026-06-08",
    companyCode: "2330",
    companyName: "台積電",
    context: contextWithoutVerifiedRole,
    technical: { score: 16, summary: "技術訊號偏強。", signals: ["收盤站上 MA20"], risks: [], watch: [], sourceRefs: ["market:2330:2026-06-08"] },
    chip: { score: 12, summary: "籌碼訊號偏強。", signals: ["投信買超"], risks: [], watch: [], sourceRefs: ["chip:2330:2026-06-08"] },
  });

  assert.equal(analysis.grade, "C");
  assert.equal(analysis.tier, "observation");
  assert.match(analysis.sourceStatus.warnings.join(" "), /Missing topic role context/);
  assert.ok(analysis.reasons.some((reason) => reason.domain === "research"));
  assert.ok(!analysis.reasons.some((reason) => reason.domain === "industry" && reason.sourceRefs.includes("trendforce-advanced-packaging")));
});

test("DailyAnalysisV2 artifact write planner avoids timestamp-only churn when semantic content is unchanged", () => {
  const analysis = buildDailyAnalysisV2Artifact({
    date: "2026-06-08",
    companyCode: "2330",
    companyName: "台積電",
    context: completeContext,
  });
  const currentJson = `${JSON.stringify(analysis, null, 2)}\n`;

  assert.equal(planDailyAnalysisV2ArtifactWrite({ analysis, currentJson }).changed, false);
  assert.equal(planDailyAnalysisV2ArtifactWrite({ analysis, currentJson: "" }).changed, true);
});

test("package exposes DailyAnalysisV2 dry-run artifact command", () => {
  const packageJson = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(packageJson.scripts["analysis:daily-v2"], "tsx scripts/generate-daily-analysis-v2.ts");
});

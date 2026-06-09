import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCompanyAnalysisContext } from "./companyAnalysisContext";

const productKnowledge = {
  schemaVersion: 1,
  code: "2330",
  name: "台積電",
  updatedAt: "2026-06-01",
  products: [{
    name: "CoWoS",
    category: "advanced-packaging",
    plainLanguage: "先進封裝服務，用來整合高效能運算晶片與高頻寬記憶體。",
    whyItMatters: "AI/HPC 晶片需求會推升先進封裝產能利用率。",
    evidence: [{ sourceId: "company:2330:annual", publisher: "TSMC", title: "Annual Report", url: "https://example.com/annual", claim: "CoWoS service offered" }],
    lastVerified: "2026-05-30",
    confidence: "high",
  }],
};

const topicRoles = {
  schemaVersion: 1,
  companyCode: "2330",
  companyName: "台積電",
  updatedAt: "2026-06-01",
  roles: [{
    topicId: "advanced-packaging",
    topicName: "先進封裝",
    topicType: "technology",
    directness: "core",
    supplyChainStage: "manufacturing",
    roleType: "核心製造者",
    roleSummary: "提供 CoWoS 等先進封裝服務，是 AI 加速器供應鏈核心節點。",
    products: ["CoWoS"],
    risks: ["產能開出不如預期"],
    evidence: [{ sourceId: "role:2330:advanced-packaging", publisher: "TSMC", title: "Packaging", url: "https://example.com/packaging", claim: "advanced packaging" }],
    confidence: "high",
    lastVerified: "2026-05-30",
    status: "verified",
  }],
};

const swot = {
  schemaVersion: 1,
  companyCode: "2330",
  companyName: "台積電",
  updatedAt: "2026-06-01",
  items: [{
    id: "2330-threat-capex",
    category: "threat",
    statement: "先進製程與封裝資本支出壓力高。",
    rationale: "高資本支出在需求放緩時會壓縮自由現金流彈性。",
    timeHorizon: "medium_term",
    relatedTopicIds: ["advanced-packaging"],
    evidence: [{ sourceId: "swot:2330:capex", publisher: "TSMC", title: "Annual Report", url: "https://example.com/annual", claim: "capex risk" }],
    confidence: "medium",
    lastVerified: "2026-05-30",
    status: "verified",
  }],
};

const researchSignals = [{
  id: "trendforce-advanced-packaging",
  sourceName: "TrendForce",
  sourceType: "industry_research",
  publishedAt: "2026-06-05",
  retrievedAt: "2026-06-06",
  title: "Advanced packaging demand",
  url: "https://example.com/research",
  access: "public",
  scope: "topic",
  relatedTopics: ["advanced-packaging"],
  relatedCompanies: ["2330"],
  thesis: "AI accelerator demand supports advanced packaging direction.",
  confidence: "medium",
  analystNotes: [],
  reviewTriggers: [],
}];

const rules = [{
  schemaVersion: 1,
  category: "risk",
  updatedAt: "2026-06-01",
  source: { title: "stock knowledge", url: "https://stock-knowledge-site.local/risk" },
  rules: [{
    id: "risk.insufficient-evidence",
    category: "risk",
    title: "資料不足不升級推薦",
    principle: "缺核心證據時只能觀察，不能用題材熱度補足。",
    positiveSignals: ["資料完整"],
    negativeSignals: ["缺產品或題材角色證據"],
    scoringImpact: { positive: 0, negative: -10 },
    riskControls: ["hard gate on insufficient evidence"],
    source: { title: "stock knowledge", url: "https://stock-knowledge-site.local/risk" },
  }],
}];

test("company analysis context merges products, topic roles, SWOT, research, and knowledge rules", () => {
  const context = buildCompanyAnalysisContext({
    companyCode: "2330",
    companyName: "台積電",
    productKnowledge,
    topicRoles,
    swot,
    researchSignals,
    stockKnowledgeRules: rules,
  });

  assert.equal(context.companyCode, "2330");
  assert.equal(context.productContext[0].productName, "CoWoS");
  assert.equal(context.topicRoleContext[0].directness, "direct");
  assert.equal(context.topicRoleContext[0].confidence, "high");
  assert.equal(context.swotContext[0].category, "threat");
  assert.equal(context.researchContext[0].researchSignalId, "trendforce-advanced-packaging");
  assert.equal(context.knowledgeRulesApplied.length, 1);
  assert.equal(context.sourceStatus.status, "verified");
});

test("company analysis context degrades missing products, roles, and SWOT without crashing", () => {
  const context = buildCompanyAnalysisContext({ companyCode: "9999", companyName: "缺資料公司" });

  assert.deepEqual(context.productContext, []);
  assert.deepEqual(context.topicRoleContext, []);
  assert.deepEqual(context.swotContext, []);
  assert.equal(context.sourceStatus.status, "insufficient");
  assert.match(context.sourceStatus.warnings.join(" "), /product|topic role|SWOT/i);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTopicAnalysisContext } from "./topicAnalysisContext";

const canonicalTopics = {
  schemaVersion: 1,
  updatedAt: "2026-06-01",
  topicDefinition: { rule: "canonical", notTopic: [] },
  topics: [{
    id: "advanced-packaging",
    name: "先進封裝",
    type: "technology",
    status: "active",
    definition: "先進封裝整合運算晶片與高頻寬記憶體。",
    whyItMatters: "AI/HPC 需求推升封裝瓶頸價值。",
    aliases: ["CoWoS"],
    parentId: "semiconductor",
    childIds: ["cowos"],
    legacyTopicIds: ["先進封裝"],
    include: [],
    exclude: [],
    activationSignals: ["CoWoS capacity"],
    evidence: [{ sourceId: "topic:advanced-packaging", claim: "advanced packaging definition" }],
    confidence: "high",
    lastVerified: "2026-05-30",
  }, {
    id: "cowos",
    name: "CoWoS",
    type: "process",
    status: "active",
    definition: "台積電先進封裝服務。",
    whyItMatters: "AI 加速器常用封裝能力。",
    aliases: [],
    parentId: "advanced-packaging",
    childIds: [],
    legacyTopicIds: [],
    include: [],
    exclude: [],
    activationSignals: [],
    evidence: [{ sourceId: "topic:cowos", claim: "CoWoS definition" }],
    confidence: "high",
    lastVerified: "2026-05-30",
  }],
};

const topicRoles = [{
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
    roleSummary: "提供 CoWoS 等先進封裝服務。",
    products: ["CoWoS"],
    risks: [],
    evidence: [{ sourceId: "role:2330:advanced-packaging", publisher: "TSMC", title: "Packaging", url: "https://example.com", claim: "packaging" }],
    confidence: "high",
    lastVerified: "2026-05-30",
    status: "verified",
  }],
}, {
  schemaVersion: 1,
  companyCode: "9999",
  companyName: "周邊供應商",
  updatedAt: "2026-06-01",
  roles: [{
    topicId: "advanced-packaging",
    topicName: "先進封裝",
    topicType: "technology",
    directness: "indirect",
    supplyChainStage: "downstream",
    roleType: "間接受惠",
    roleSummary: "僅具間接需求連動。",
    products: [],
    risks: [],
    evidence: [],
    confidence: "low",
    lastVerified: null,
    status: "candidate",
  }],
}];

const swots = [{
  schemaVersion: 1,
  companyCode: "2330",
  companyName: "台積電",
  updatedAt: "2026-06-01",
  items: [{
    id: "2330-threat-capex",
    category: "threat",
    statement: "產能開出延遲會壓抑題材實現速度。",
    rationale: "先進封裝需要長時間資本投入。",
    timeHorizon: "medium_term",
    relatedTopicIds: ["advanced-packaging"],
    evidence: [{ sourceId: "swot:2330:capex", publisher: "TSMC", title: "Annual", url: "https://example.com", claim: "risk" }],
    confidence: "medium",
    lastVerified: "2026-05-30",
    status: "verified",
  }],
}];

const eventFocus = {
  schemaVersion: 1,
  generatedAt: "2026-06-08",
  status: "verified",
  source: { name: "TWSE OpenAPI t187ap04_L", url: "https://openapi.twse.com.tw/v1/opendata/t187ap04_L", scope: "listed-company-major-news", semantics: "official subject preserved; topic mapping is derived, not official" },
  itemCount: 1,
  items: [{
    id: "event-1",
    date: "2026-06-08",
    announcedAt: "2026-06-08 15:00:00",
    companyCode: "2330",
    companyName: "台積電",
    officialSubject: "公告先進封裝產能相關資訊",
    derivedTopics: [{ topicId: "advanced-packaging", topicName: "先進封裝" }],
    mappingMethod: "derived_from_company_topic_roles",
    verificationNote: "topic mapping is derived",
    source: "TWSE OpenAPI t187ap04_L",
  }],
};

test("topic analysis context returns direct/peripheral companies, research direction, events, child topics, and common risks", () => {
  const context = buildTopicAnalysisContext({
    topicId: "advanced-packaging",
    canonicalTopics,
    companyTopicRoles: topicRoles,
    companySwots: swots,
    eventFocus,
    researchSignals: [{
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
      relatedCompanies: [],
      thesis: "AI demand supports advanced packaging.",
      confidence: "medium",
      analystNotes: [],
      reviewTriggers: [],
    }],
  });

  assert.equal(context.topicId, "advanced-packaging");
  assert.deepEqual(context.childTopicIds, ["cowos"]);
  assert.deepEqual(context.verifiedDirectCompanies.map((item) => item.companyCode), ["2330"]);
  assert.deepEqual(context.peripheralCompanies.map((item) => item.companyCode), ["9999"]);
  assert.equal(context.events[0].mappingLabel, "derived topic mapping");
  assert.equal(context.researchDirection[0].researchSignalId, "trendforce-advanced-packaging");
  assert.equal(context.commonSwotRisks[0].companyCode, "2330");
});

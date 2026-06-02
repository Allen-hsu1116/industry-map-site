import test from "node:test";
import assert from "node:assert/strict";

import type { CompanyProductKnowledge } from "./productKnowledge";
import type { CompanyTopicRolesKnowledge } from "./companyTopicRoles";
import type { CompanySwotKnowledge } from "./companySwot";
import { buildCompanyIndustryInsights } from "./companyIndustryInsights";

const productKnowledge: CompanyProductKnowledge = {
  schemaVersion: 1,
  code: "2330",
  name: "台積電",
  updatedAt: "2026-05-27",
  products: [
    {
      name: "CoWoS-S",
      aliases: ["CoWoS", "CoWoS-S + HBM3E"],
      category: "advanced_packaging",
      plainLanguage: "以矽中介層連接 AI 加速器與 HBM 的 2.5D 先進封裝技術。",
      whyItMatters: "AI 晶片效能常受記憶體頻寬與封裝整合限制，CoWoS-S 可改善加速器與 HBM 間的資料搬移瓶頸。",
      topicFit: { "cowos-advanced-packaging": "直接產品平台：用於高階 AI 加速器封裝。" },
      businessImpact: "先進封裝產能與良率會影響 AI/HPC 客戶出貨節奏。",
      evidence: [
        { sourceId: "tsmc-cowos", publisher: "TSMC", title: "CoWoS technology platform", url: "https://example.com/cowos", claim: "TSMC presents CoWoS as an advanced packaging technology platform." },
      ],
      lastVerified: "2026-05-27",
      confidence: "high",
    },
    {
      name: "N3 製程",
      aliases: ["3nm", "N3"],
      category: "wafer_fabrication",
      plainLanguage: "先進邏輯晶圓代工製程，用於高效能運算與行動 SoC。",
      whyItMatters: "先進製程節點影響客戶晶片效能、功耗與量產節奏。",
      topicFit: { "wafer-foundry": "核心晶圓代工產品。" },
      businessImpact: "先進製程量產與稼動率支撐台積電營收與毛利率。",
      evidence: [
        { sourceId: "tsmc-n3", publisher: "TSMC", title: "N3 technology", url: "https://example.com/n3", claim: "TSMC discloses N3 process technology." },
      ],
      lastVerified: "2026-05-27",
      confidence: "high",
    },
  ],
};

const topicRoles: CompanyTopicRolesKnowledge = {
  schemaVersion: 1,
  companyCode: "2330",
  companyName: "台積電",
  updatedAt: "2026-05-31",
  roles: [
    {
      topicId: "cowos-advanced-packaging",
      topicName: "半導體製造｜CoWoS 先進封裝",
      topicType: "process",
      directness: "core",
      supplyChainStage: "advanced_packaging",
      roleType: "foundry_packaging_platform",
      roleSummary: "台積電提供 CoWoS 先進封裝平台，是 AI 加速器與 HBM 整合的重要供應鏈節點。",
      products: ["CoWoS-S + HBM3E"],
      customers: ["NVIDIA", "AMD"],
      risks: ["先進封裝產能擴充速度可能成為供給瓶頸"],
      evidence: [
        { sourceId: "tsmc-cowos", publisher: "TSMC", title: "CoWoS technology platform", url: "https://example.com/cowos", claim: "TSMC presents CoWoS as an advanced packaging technology platform." },
      ],
      confidence: "high",
      lastVerified: "2026-05-31",
      status: "verified",
    },
    {
      topicId: "ai-server",
      topicName: "AI 伺服器",
      topicType: "end_market",
      directness: "indirect",
      supplyChainStage: "end_market",
      roleType: "upstream_enabler",
      roleSummary: "台積電並非伺服器整機廠，但先進製程與封裝使 AI 加速器可量產。",
      products: [],
      evidence: [],
      confidence: "low",
      lastVerified: null,
      status: "candidate",
    },
    {
      topicId: "meme-topic",
      topicName: "錯誤題材",
      topicType: "theme",
      directness: "rejected",
      supplyChainStage: "none",
      roleType: "none",
      roleSummary: "不應顯示。",
      products: [],
      evidence: [],
      confidence: "insufficient",
      lastVerified: null,
      status: "rejected",
    },
  ],
};

const swot: CompanySwotKnowledge = {
  schemaVersion: 1,
  companyCode: "2330",
  companyName: "台積電",
  updatedAt: "2026-05-28",
  items: [
    {
      id: "strength-packaging-platform",
      category: "strength",
      statement: "台積電具備先進製程與 CoWoS 先進封裝平台整合能力。",
      rationale: "題材角色與產品知識皆指向其在 AI/HPC 供應鏈中的核心製造平台定位。",
      timeHorizon: "structural",
      relatedTopicIds: ["cowos-advanced-packaging"],
      evidence: [{ sourceId: "tsmc-cowos", publisher: "TSMC", title: "CoWoS technology platform", url: "https://example.com/cowos", claim: "TSMC presents CoWoS as an advanced packaging technology platform." }],
      confidence: "high",
      lastVerified: "2026-05-28",
      status: "verified",
    },
    {
      id: "weakness-capex-cycle",
      category: "weakness",
      statement: "先進製程與封裝擴產需要高額資本支出。",
      rationale: "產能擴張與海外建廠成本會影響自由現金流與毛利率彈性。",
      timeHorizon: "medium_term",
      relatedTopicIds: [],
      evidence: [{ sourceId: "annual-report", publisher: "TWSE", title: "Annual report", url: "https://example.com/report", claim: "Annual report discloses capex and expansion plans." }],
      confidence: "medium",
      lastVerified: "2026-05-28",
      status: "verified",
    },
  ],
};

test("buildCompanyIndustryInsights creates first-class product, role, SWOT panels with source status", () => {
  const insights = buildCompanyIndustryInsights({
    companyCode: "2330",
    companyName: "台積電",
    productKnowledge,
    topicRoles,
    swot,
  });

  assert.equal(insights.companyCode, "2330");
  assert.equal(insights.status, "partial");
  assert.equal(insights.panels.products.status, "verified");
  assert.equal(insights.panels.products.items.length, 2);
  assert.equal(insights.panels.products.items[0].name, "CoWoS-S");
  assert.equal(insights.panels.products.items[0].confidence, "high");
  assert.deepEqual(insights.panels.products.items[0].sourceLabels, ["TSMC：CoWoS technology platform"]);

  assert.equal(insights.panels.topicRoles.status, "partial");
  assert.deepEqual(insights.panels.topicRoles.counts, { verified: 1, candidate: 1, rejected: 1 });
  assert.equal(insights.panels.topicRoles.items.length, 2, "rejected roles are counted but hidden from primary role list");
  assert.equal(insights.panels.topicRoles.items[0].directnessLabel, "核心產品/平台");
  assert.equal(insights.panels.topicRoles.items[0].sourceLabels[0], "TSMC：CoWoS technology platform");

  assert.equal(insights.panels.swot.status, "partial");
  assert.equal(insights.panels.swot.groups.strengths.length, 1);
  assert.equal(insights.panels.swot.groups.weaknesses.length, 1);
  assert.equal(insights.panels.swot.groups.opportunities.length, 0);
  assert.equal(insights.panels.swot.warning, "SWOT 尚未涵蓋完整 S/W/O/T；不可視為完整投資結論");

  assert.deepEqual(insights.sourceStatus.map((item) => item.module), ["products", "topicRoles", "swot"]);
  assert.equal(insights.sourceStatus[0].latestVerifiedAt, "2026-05-27");
  assert.equal(insights.sourceStatus[1].latestVerifiedAt, "2026-05-31");
  assert.equal(insights.sourceStatus[2].latestVerifiedAt, "2026-05-28");
});

test("buildCompanyIndustryInsights returns honest empty and insufficient states", () => {
  const insights = buildCompanyIndustryInsights({ companyCode: "9999", companyName: "空資料公司" });

  assert.equal(insights.status, "empty");
  assert.equal(insights.panels.products.status, "empty");
  assert.equal(insights.panels.products.emptyReason, "尚未建立產品知識檔；不可用 AI 補成既定事實");
  assert.equal(insights.panels.topicRoles.status, "empty");
  assert.equal(insights.panels.swot.status, "empty");
  assert.ok(insights.sourceStatus.every((item) => item.status === "empty"));
});

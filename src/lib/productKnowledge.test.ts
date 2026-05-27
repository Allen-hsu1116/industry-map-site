import test from "node:test";
import assert from "node:assert/strict";
import { findProductKnowledgeItem, productKnowledgeToNarrative, type CompanyProductKnowledge } from "./productKnowledge";

const sampleKnowledge: CompanyProductKnowledge = {
  schemaVersion: 1,
  code: "2330",
  name: "台積電",
  updatedAt: "2026-05-27",
  products: [
    {
      name: "CoWoS-S",
      aliases: ["CoWoS-S + HBM3E", "CoWoS"],
      category: "advanced_packaging",
      plainLanguage: "以矽中介層連接 AI 加速器與 HBM 的 2.5D 先進封裝技術。",
      whyItMatters: "改善運算晶片與高頻寬記憶體之間的資料搬移瓶頸。",
      topicFit: {
        "cowos-advanced-packaging": "直接產品平台",
      },
      businessImpact: "CoWoS 產能是 AI GPU 出貨瓶頸之一。",
      evidence: [
        {
          sourceId: "tsmc-cowos",
          publisher: "TSMC",
          title: "CoWoS technology platform",
          url: "https://www.tsmc.com/english/dedicatedFoundry/technology/cowos",
          claim: "TSMC presents CoWoS as an advanced packaging technology platform.",
        },
      ],
      lastVerified: "2026-05-27",
      confidence: "high",
    },
  ],
};

test("findProductKnowledgeItem matches aliases inside existing product strings", () => {
  const item = findProductKnowledgeItem("CoWoS-S + HBM3E: 當前主力AI加速器封裝方案", sampleKnowledge, "cowos-advanced-packaging");

  assert.equal(item?.name, "CoWoS-S");
});

test("findProductKnowledgeItem respects topic-specific fit when provided", () => {
  const item = findProductKnowledgeItem("CoWoS", sampleKnowledge, "wafer-foundry");

  assert.equal(item, undefined);
});

test("productKnowledgeToNarrative exposes source and freshness metadata", () => {
  const item = sampleKnowledge.products[0];
  const narrative = productKnowledgeToNarrative(item, "cowos-advanced-packaging");

  assert.equal(narrative.name, "CoWoS-S");
  assert.equal(narrative.topicFit, "直接產品平台");
  assert.equal(narrative.lastVerified, "2026-05-27");
  assert.deepEqual(narrative.sourceLabels, ["TSMC：CoWoS technology platform"]);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCanonicalTopicMap } from "./canonicalTopicMap";

const canonicalTopicsFixture = {
  schemaVersion: 1,
  updatedAt: "2026-05-29",
  topicDefinition: { rule: "fixture", notTopic: [] },
  topics: [
    {
      id: "advanced-packaging",
      name: "先進封裝與 CoWoS",
      type: "process",
      status: "active",
      definition: "涵蓋 CoWoS 與先進封裝。",
      whyItMatters: "AI accelerator 需求會透過封裝產能傳導。",
      aliases: ["CoWoS"],
      childIds: [],
      legacyTopicIds: ["cowos-advanced-packaging"],
      include: ["直接產品或服務"],
      exclude: ["只有股價同漲"],
      activationSignals: [],
      evidence: [{ sourceId: "source", claim: "claim" }],
      confidence: "medium",
      lastVerified: "2026-05-29",
    },
  ],
};

const roleFixture = {
  schemaVersion: 1,
  companyCode: "2330",
  companyName: "台積電",
  updatedAt: "2026-05-29",
  roles: [
    {
      topicId: "cowos-advanced-packaging",
      topicName: "先進封測｜AI 先進封裝 CoWoS",
      topicType: "process",
      directness: "core",
      supplyChainStage: "advanced_packaging",
      roleType: "cowos_advanced_packaging_provider",
      roleSummary: "台積電提供 CoWoS 與先進封裝平台，直接對應 AI GPU/HBM 整合需求。",
      products: ["CoWoS", "SoIC"],
      evidence: [{ sourceId: "tsmc", publisher: "TSMC", title: "CoWoS", url: "https://example.com", claim: "TSMC provides CoWoS." }],
      confidence: "high",
      lastVerified: "2026-05-29",
      status: "verified",
    },
  ],
};

test("buildCanonicalTopicMap maps legacy topic role ids to canonical UI topic map", () => {
  const map = buildCanonicalTopicMap(canonicalTopicsFixture, [{ raw: roleFixture }], "2026-05-29T00:00:00.000Z");

  assert.equal(map.source, "canonical-topics+company-topic-roles");
  assert.equal(map.stats.total_topics, 1);
  assert.equal(map.stats.unique_companies, 1);
  assert.equal(map.topics[0].slug, "advanced-packaging");
  assert.equal(map.topics[0].name, "製程與封測｜先進封裝與 CoWoS");
  assert.equal(map.topics[0].total, 1);
  assert.equal(map.topics[0].groups[0].name, "先進封裝與封測");
  assert.equal(map.topics[0].groups[0].level, "midstream");
  assert.equal(map.topics[0].groups[0].companies[0].code, "2330");
  assert.equal(map.topics[0].groups[0].companies[0].relevance, "高");
  assert.deepEqual(map.companies[0].topics, ["advanced-packaging"]);
});

test("homepage no longer imports legacy industries.json", async () => {
  const fs = await import("node:fs/promises");
  const page = await fs.readFile("src/app/page.tsx", "utf8");

  assert.doesNotMatch(page, /industries\.json/);
  assert.match(page, /canonical-topic-map\.json/);
});

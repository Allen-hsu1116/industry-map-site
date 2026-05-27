import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalRoleCatalog, mapDirectness, mapSupplyChainStage, mapTopicType } from "./canonicalRoles";
import type { LegacyRoleCandidate } from "./legacyKnowledgeInventory";

function role(overrides: Partial<LegacyRoleCandidate> = {}): LegacyRoleCandidate {
  return {
    source: "legacy_industries_json",
    status: "candidate",
    needsVerification: true,
    confidence: "unverified",
    topicId: "cowos-advanced-packaging",
    topicName: "AI 先進封裝 CoWoS",
    groupName: "先進封裝",
    companyCode: "2330",
    companyName: "台積電",
    role: "CoWoS 核心供應者",
    relevance: "高",
    products: ["CoWoS 先進封裝"],
    customers: ["NVIDIA"],
    techFocus: ["SoIC"],
    swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
    ...overrides,
  };
}

test("mapTopicType classifies topic ontology conservatively", () => {
  assert.equal(mapTopicType("cowos-advanced-packaging", "AI 先進封裝 CoWoS"), "technology");
  assert.equal(mapTopicType("ai-server", "AI 伺服器"), "theme");
  assert.equal(mapTopicType("wafer-foundry", "半導體製造｜晶圓代工"), "supply_chain_segment");
  assert.equal(mapTopicType("hbm-memory", "HBM 高頻寬記憶體"), "product");
  assert.equal(mapTopicType("ev", "電動車"), "end_market");
});

test("mapSupplyChainStage maps group and role text to v2 stage ontology", () => {
  assert.equal(mapSupplyChainStage("晶圓代工", "先進製程龍頭", []), "wafer_foundry");
  assert.equal(mapSupplyChainStage("封裝測試", "CoWoS 封裝核心供應者", []), "packaging");
  assert.equal(mapSupplyChainStage("散熱模組", "水冷板供應商", []), "thermal");
  assert.equal(mapSupplyChainStage("PCB", "PCB龍頭", ["ABF載板"]), "substrate");
  assert.equal(mapSupplyChainStage("未知", "", []), "unknown");
});

test("mapDirectness keeps legacy relevance conservative and rejects weak boilerplate", () => {
  assert.equal(mapDirectness(role({ relevance: "高", role: "核心供應者" })), "core");
  assert.equal(mapDirectness(role({ relevance: "高", role: "關鍵材料供應商" })), "supplier");
  assert.equal(mapDirectness(role({ relevance: "中", role: "受惠需求拉動" })), "direct_enabler");
  assert.equal(mapDirectness(role({ relevance: "低", role: "間接受惠" })), "indirect");
  assert.equal(mapDirectness(role({ products: ["得經營法令非禁止或限制之業務"], role: "" })), "rejected");
});

test("buildCanonicalRoleCatalog emits traceable role candidates with v2 ontology fields", () => {
  const catalog = buildCanonicalRoleCatalog([role()], "2026-05-27T00:00:00.000Z");

  assert.equal(catalog.generatedAt, "2026-05-27T00:00:00.000Z");
  assert.equal(catalog.summary.roles, 1);
  assert.equal(catalog.summary.byTopicType.technology, 1);
  assert.equal(catalog.summary.bySupplyChainStage.packaging, 1);
  assert.equal(catalog.summary.byDirectness.core, 1);
  assert.deepEqual(catalog.roles[0], {
    schemaVersion: 1,
    companyCode: "2330",
    companyName: "台積電",
    topicId: "cowos-advanced-packaging",
    topicName: "AI 先進封裝 CoWoS",
    topicType: "technology",
    directness: "core",
    supplyChainStage: "packaging",
    roleType: "packaging_provider",
    roleSummary: "CoWoS 核心供應者",
    products: ["CoWoS 先進封裝"],
    customers: ["NVIDIA"],
    techFocus: ["SoIC"],
    legacy: {
      topicSlug: "cowos-advanced-packaging",
      groupName: "先進封裝",
      relevance: "高",
      source: "legacy_industries_json",
    },
    evidence: [],
    confidence: "unverified",
    lastVerified: null,
    status: "candidate",
    needsVerification: true,
  });
});

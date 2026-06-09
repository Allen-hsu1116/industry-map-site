import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIndustryChainMap } from "./industryChainMap";

const roles = [{
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
  }, {
    topicId: "advanced-packaging",
    topicName: "先進封裝",
    topicType: "technology",
    directness: "core",
    supplyChainStage: "manufacturing",
    roleType: "重複角色",
    roleSummary: "同公司重複綁定不應重複計數。",
    products: ["SoIC"],
    risks: [],
    evidence: [{ sourceId: "role:2330:advanced-packaging:2", publisher: "TSMC", title: "Packaging", url: "https://example.com/2", claim: "packaging" }],
    confidence: "high",
    lastVerified: "2026-05-30",
    status: "verified",
  }],
}];

test("industry chain map orders stages, binds companies, and de-duplicates company counts", () => {
  const map = buildIndustryChainMap({
    topicId: "advanced-packaging",
    topicName: "先進封裝",
    companyTopicRoles: roles,
  });

  assert.deepEqual(map.stages.map((stage) => stage.stageId), ["manufacturing", "downstream-demand"]);
  assert.equal(map.stages[0].companies.length, 1);
  assert.equal(map.companyCount, 1);
  assert.equal(map.stages[0].companies[0].companyCode, "2330");
});

test("industry chain map labels narrative-only stages without inventing stock bindings", () => {
  const map = buildIndustryChainMap({ topicId: "advanced-packaging", topicName: "先進封裝", companyTopicRoles: [] });

  assert.equal(map.stages.length, 1);
  assert.equal(map.stages[0].stageKind, "narrative_only");
  assert.deepEqual(map.stages[0].companies, []);
  assert.equal(map.sourceStatus.status, "insufficient");
});
